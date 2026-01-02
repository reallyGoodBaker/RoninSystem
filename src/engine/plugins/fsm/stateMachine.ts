import { Actor } from "@ronin/core/architect/actor"
import { AttributeChangeTransition, IStateDef, IStateTransition, StateEvent, StateEventTransition, TagChangeTransition, TransitionTriggerType } from "./state"
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
    return Object.assign(target.states, inheritFrom.states)
}

const defaultOnError = (error: any) => { profiler.info(error) }


export class StateMachine {
    static readonly stateMachines = new Map<Actor, StateMachine>()

    static clearUnused(app: Application) {
        for (const actor of StateMachine.stateMachines.keys()) {
            if (!app.isValidActor(actor)) {
                StateMachine.stateMachines.delete(actor)
            }
        }   
    }

    private _curState: string = 'unknown'
    private _stateMachineDef: IStateMachineDefination | null = null

    constructor(
        public readonly owner: Actor,
        private readonly onerror: (error: any) => void = defaultOnError
    ) {
        StateMachine.stateMachines.set(owner, this)
    }

    setStateMachineDef(def: IStateMachineDefination) {
        this.resetStateMachine()
        def.inherits?.forEach(id => {
            const stateMachine = getStateMachineDef(id)
            if (stateMachine) {
                mixinStates(def, stateMachine)
            }
        })
        this._stateMachineDef = def
    }

    protected currentStateTicks = 0

    resetStateMachine() {
        this.callExit()
        this._curState = this._stateMachineDef?.rootState ?? 'unknown'
        this._stateMachineDef = null
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
        const customConds = cur.transitions.filter(t => t.trigger === trigger) as IStateTransition[]
        for (const customCond of customConds) {
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

        const eventConds = cur.transitions.filter(t => t.trigger === TransitionTriggerType.OnEvent) as StateEventTransition[]
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

        const attrConds = cur.transitions.filter(t => t.trigger === TransitionTriggerType.OnAttributeChange) as AttributeChangeTransition[]
        for (const attrCond of attrConds) {
            const { nextState, attribute: _attr, value: _valueMatcher } = attrCond
            if (attribute !== _attr) {
                continue
            }

            if ('call' in _valueMatcher && _valueMatcher.call(undefined, value, old)) {
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

        const tagConds = cur.transitions.filter(t => t.trigger === TransitionTriggerType.OnTagAdd) as TagChangeTransition[]
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

        const tagConds = cur.transitions.filter(t => t.trigger === TransitionTriggerType.OnTagRemove) as TagChangeTransition[]
        for (const tagCond of tagConds) {
            if (tagCond && tagCond.tag.matchTag(tag, exact) && this.canTransition(tagCond)) {
                return this.changeState(tagCond.nextState)
            }
        }
    }
}