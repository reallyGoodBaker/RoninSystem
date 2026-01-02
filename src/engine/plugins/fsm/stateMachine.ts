import { Actor } from "@ronin/core/architect/actor"
import { AttributeChangeTransition, IStateDef, IStateTransition, StateEvent, StateEventTransition, TagChangeTransition, TransitionTriggerType, StateTransition } from "./state"
import { profiler } from "@ronin/core/profiler"
import type { Application } from "@ronin/core/architect/application"
import { Tag } from "@ronin/core/tag"
import { getStateMachineDef } from "./setup"

export interface IStateMachineDefination {
    id: string
    inherits?: string[]
    rootState: string
    states: Record<string, IStateDef>
}

export function mixinStates(target: IStateMachineDefination, inheritFrom: IStateMachineDefination) {
    // Merge inheritFrom.states into target.states.
    // Keep inherited states first, then let target override fields.
    target.states = target.states ?? {}
    const result: Record<string, IStateDef> = {}

    // copy inherited states
    for (const [name, state] of Object.entries(inheritFrom.states ?? {})) {
        result[name] = {
            ...state,
            transitions: (state.transitions ?? []).slice(),
        }
    }

    // merge/override with target states: inherit transitions first, then target transitions
    for (const [name, tstate] of Object.entries(target.states ?? {})) {
        const inherited = result[name]
        if (inherited) {
            result[name] = {
                ...inherited,
                ...tstate,
                transitions: [
                    ...(inherited.transitions ?? []),
                    ...(tstate.transitions ?? []),
                ],
            }
        } else {
            result[name] = {
                ...tstate,
                transitions: (tstate.transitions ?? []).slice(),
            }
        }
    }

    target.states = result
    return target.states
}

const defaultOnError = (error: any) => { profiler.info(error) }


export class StateMachine {
    // Use a hybrid registry so we can iterate active state machines while
    // allowing actors to be GC'd without leaking StateMachine instances.
    // - _idToSM: iterable map from id -> { sm, actorRef }
    // - _actorToId: weak map from actor -> id
    // - _finalizer: if available, cleanup id when actor is GC'd
    private static readonly _idToSM = new Map<symbol, { sm: StateMachine, actorRef?: any }>()
    private static readonly _actorToId = new WeakMap<Actor, symbol>()
    private static readonly _finalizer: any = (typeof (globalThis as any).FinalizationRegistry !== 'undefined')
        ? new (globalThis as any).FinalizationRegistry((id: symbol) => {
            StateMachine._idToSM.delete(id)
        })
        : null

    static forEach(fn: (sm: StateMachine) => void) {
        for (const entry of StateMachine._idToSM.values()) {
            if (entry.sm) fn(entry.sm)
        }
    }

    static clearUnused(app: Application) {
        for (const [id, entry] of StateMachine._idToSM.entries()) {
            const actor = entry.actorRef?.deref?.() ?? undefined
            if (!actor) {
                StateMachine._idToSM.delete(id)
                continue
            }

            if (!app.isValidActor(actor)) {
                StateMachine._idToSM.delete(id)
            }
        }
    }

    private _curState: string = 'unknown'
    private _stateMachineDef: IStateMachineDefination | null = null
    // precomputed transitions buckets per state: stateName -> { trigger -> transitions[] }
    private _stateBuckets: Map<string, Partial<Record<TransitionTriggerType, StateTransition[]>>> = new Map()

    constructor(
        public readonly owner: Actor,
        private readonly onerror: (error: any) => void = defaultOnError
    ) {
        // register in hybrid registry
        try {
            const id = Symbol()
            StateMachine._actorToId.set(owner, id)
            const actorRef = (typeof (globalThis as any).WeakRef !== 'undefined') ? new (globalThis as any).WeakRef(owner) : undefined
            StateMachine._idToSM.set(id, { sm: this, actorRef })
            if (StateMachine._finalizer) {
                StateMachine._finalizer.register(owner, id)
            }
        } catch (e) {
            // fallback: if WeakRef/FinalizationRegistry not available, keep a strong Map using actor as key
            ;(StateMachine as any).stateMachines?.set?.(owner, this)
        }
    }

    setStateMachineDef(def: IStateMachineDefination) {
        // Build merged states first (transactional). Do not modify original def.states until validated.
        const mergedStates: Record<string, IStateDef> = {}

        // Merge inherits in order
        def.inherits?.forEach(id => {
            const inheritDef = getStateMachineDef(id)
            if (!inheritDef) return
            for (const [name, istate] of Object.entries(inheritDef.states ?? {})) {
                const existing = mergedStates[name]
                if (!existing) {
                    mergedStates[name] = {
                        ...istate,
                        transitions: (istate.transitions ?? []).slice(),
                    }
                } else {
                    mergedStates[name] = {
                        ...existing,
                        ...istate,
                        transitions: [
                            ...(existing.transitions ?? []),
                            ...(istate.transitions ?? []),
                        ],
                    }
                }
            }
        })

        // Overlay def.states
        for (const [name, tstate] of Object.entries(def.states ?? {})) {
            const inherited = mergedStates[name]
            if (inherited) {
                mergedStates[name] = {
                    ...inherited,
                    ...tstate,
                    transitions: [
                        ...(inherited.transitions ?? []),
                        ...(tstate.transitions ?? []),
                    ],
                }
            } else {
                mergedStates[name] = {
                    ...tstate,
                    transitions: (tstate.transitions ?? []).slice(),
                }
            }
        }

        const newDef: IStateMachineDefination = {
            ...def,
            states: mergedStates,
        }

        if (!newDef.rootState || !newDef.states[newDef.rootState]) {
            // invalid definition; report and abort
            this.onerror(new Error(`Invalid state machine def: rootState '${newDef.rootState}' not found`))
            return
        }

        // Exit current state, then install new def and enter root state
        this.callExit()
        this._stateMachineDef = newDef
        // build buckets for fast lookup
        this._stateBuckets.clear()
        for (const [name, s] of Object.entries(newDef.states)) {
            const buckets: Partial<Record<TransitionTriggerType, StateTransition[]>> = {}
            for (const tr of s.transitions ?? []) {
                const key = tr.trigger as TransitionTriggerType
                let arr = buckets[key]
                if (!arr) {
                    arr = []
                    buckets[key] = arr
                }
                arr.push(tr as StateTransition)
            }
            this._stateBuckets.set(name, buckets)
        }

        this._curState = newDef.rootState ?? 'unknown'
        this.currentStateTicks = 0
        this.callEnter()
    }

    protected currentStateTicks = 0

    resetStateMachine() {
        this.callExit()
        this._curState = 'unknown'
        this._stateMachineDef = null
        this.currentStateTicks = 0
        this._stateBuckets.clear()
    }

    getState(state: string) {
        return this._stateMachineDef?.states[state]
    }

    currentState() {
        return this._stateMachineDef?.states[this._curState]
    }

    protected callExit() {
        this.currentStateTicks = 0
        try {
            this.currentState()?.exit?.(this.owner)
        } catch (error) {
            try {
                this.onerror(error)
            } catch (error) {
                defaultOnError(error)
            } finally {
                this.resetStateMachine()
            }
        }
    }

    protected callEnter() {
        try {
            this.currentState()?.enter?.(this.owner)
        } catch (error) {
            try {
                this.onerror(error)
            } catch (error) {
                defaultOnError(error)
            } finally {
                this.resetStateMachine()
            }
        }
    }

    update() {
        this.currentStateTicks++
        try {
            const curState = this.currentState()
            if (!curState) {
                return
            }

            curState?.update?.(this.owner)
            if (!curState.duration || this.currentStateTicks >= curState.duration) {
                this.triggerCustom(true)
            }
        } catch (error) {
            try {
                this.onerror(error)
            } catch (error) {
                defaultOnError(error)
            } finally {
                this.resetStateMachine()
            }
        }
    }

    /**
     * 未经检查的状态切换
     * @param state 
     */
    protected changeState(state: string) {
        this.callExit()
        this._curState = state
        this.currentStateTicks = 0
        this.callEnter()
    }

    /**
     * 会同时检查 canTransition 和 canEnter
     * @param cond 
     * @returns 
     */
    protected canTransition(cond: IStateTransition) {
        if (!cond.canTransition || cond.canTransition(this.owner)) {
            const state = this.getState(cond.nextState)
            if (!state) {
                return false
            }

            return !state.canEnter || state.canEnter(this.owner)
        }

        return false
    }

    /**
     * `Custom` 和 `OnEnd` 的触发函数
     * 
     * 区别在于，Custom 是由外部主动触发的，而 OnEnd 是在当前状态结束时自动触发
     * @returns 
     */
    triggerCustom(onEnd: boolean = false) {
        const cur = this.currentState()
        if (!cur) {
            return
        }

        const trigger = onEnd ? TransitionTriggerType.OnEndOfState : TransitionTriggerType.Custom
        const buckets = this._stateBuckets.get(cur.name) ?? {}
        const customConds = buckets[trigger] ?? []
        for (const customCond of customConds as IStateTransition[]) {
            if (customCond && this.canTransition(customCond)) {
                return this.changeState(customCond.nextState)
            }
        }
    }

    /**
     * `OnEvent` 的触发函数, 和 `Custom` 的区别是可以传递一个自定义事件对象
     * @param type 
     * @param event 
     * @returns 
     */
    triggerEvent(type: string, event: StateEvent) {
        const cur = this.currentState()
        if (!cur) {
            return
        }

        const buckets = this._stateBuckets.get(cur.name) ?? {}
        const eventConds = (buckets[TransitionTriggerType.OnEvent] ?? []) as StateEventTransition[]
        for (const eventCond of eventConds) {
            const { event: _ev, nextState, filter } = eventCond
            if (_ev === type && (!filter || filter(this.owner, event)) && this.canTransition(eventCond)) {
                return this.changeState(nextState)
            }
        }
    }

    /**
     * 为属性变化特化的触发函数
     * @param attribute 
     * @param value 
     * @param old 
     * @returns 
     */
    triggerAttrChange(attribute: string, value: any, old: any) {
        const cur = this.currentState()
        if (!cur) {
            return
        }

        const buckets = this._stateBuckets.get(cur.name) ?? {}
        const attrConds = (buckets[TransitionTriggerType.OnAttributeChange] ?? []) as AttributeChangeTransition[]
        for (const attrCond of attrConds) {
            const { nextState, attribute: _attr, value: _valueMatcher } = attrCond
            if (attribute !== _attr) {
                continue
            }

            if (typeof _valueMatcher === 'function' && _valueMatcher(value, old)) {
                return this.changeState(nextState)
            }

            if (value === _valueMatcher) {
                return this.changeState(nextState)
            }
        }
    }

    triggerTagAdd(tag: Tag, exact=false) {
        const cur = this.currentState()
        if (!cur) {
            return
        }

        const buckets = this._stateBuckets.get(cur.name) ?? {}
        const tagConds = (buckets[TransitionTriggerType.OnTagAdd] ?? []) as TagChangeTransition[]
        for (const tagCond of tagConds) {
            if (tagCond && tagCond.tag.matchTag(tag, exact) && this.canTransition(tagCond)) {
                return this.changeState(tagCond.nextState)
            }
        }
    }

    triggerTagRemove(tag: Tag, exact=false) {
        const cur = this.currentState()
        if (!cur) {
            return
        }

        const buckets = this._stateBuckets.get(cur.name) ?? {}
        const tagConds = (buckets[TransitionTriggerType.OnTagRemove] ?? []) as TagChangeTransition[]
        for (const tagCond of tagConds) {
            if (tagCond && tagCond.tag.matchTag(tag, exact) && this.canTransition(tagCond)) {
                return this.changeState(tagCond.nextState)
            }
        }
    }
}