import { Actor } from "@ronin/core/architect/actor"
import { AttributeChangeTransition, IStateDef, IStateTransition, StateEvent, StateEventTransition, TagChangeTransition, TransitionTriggerType, StateTransition } from "./state"
import { EventDelegate } from "@ronin/core/architect/event"
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
    // 合并规则说明：
    // - 遍历 inherits 链（按 DFS 收集，父在前），按顺序合并 states；
    // - 对于同名 state，先保留父的字段与 transitions，再用子 state 覆盖字段；
    // - transitions 会被追加（父 transitions 在前，子 transitions 在后）。
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

const defaultOnError = (error: any) => { profiler.error(error) }


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
    // fallback map 当环境不支持 WeakRef/FinalizationRegistry 时使用（强引用）
    private static readonly _fallbackMap = new Map<Actor, StateMachine>()

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
    // 重入保护：当正在执行 state 切换时，后续的切换请求会被排入队列，避免递归调用 enter/exit
    private _changing: boolean = false
    private _pendingStateQueue: string[] = []

    // 使用 EventDelegate 实现的状态变化事件（只能绑定一个回调）
    // 触发签名：[oldState: string, newState: string]
    readonly OnStateChanged = new EventDelegate<[string, string]>()

    constructor(
        public readonly owner: Actor,
        private readonly onerror: (error: any) => void = defaultOnError
    ) {
        // register in hybrid registry
        try {
            const id = Symbol()
            this._registerId = id
            StateMachine._actorToId.set(owner, id)
            const actorRef = (typeof (globalThis as any).WeakRef !== 'undefined') ? new (globalThis as any).WeakRef(owner) : undefined
            StateMachine._idToSM.set(id, { sm: this, actorRef })
            if (StateMachine._finalizer) {
                // 使用 id 作为 holdings（不使用 unregister token），FinalizationRegistry 回调会删除 id
                StateMachine._finalizer.register(owner, id)
            }
        } catch (e) {
            // fallback: if WeakRef/FinalizationRegistry not available, keep a strong Map using actor as key
            StateMachine._fallbackMap.set(owner, this)
        }
    }

    // 存储注册 id（若使用 hybrid registry）以便 dispose 时清理
    private _registerId?: symbol

    setStateMachineDef(def: IStateMachineDefination) {
        // 合并继承定义并检测继承环（transactional）。合并顺序按照 inherits 列表的 DFS 顺序，
        // 若检测到循环则中止安装并通过 onerror 报告。
        const mergedStates: Record<string, IStateDef> = {}

        const visited = new Set<string>()
        const inStack = new Set<string>()
        const inheritOrder: IStateMachineDefination[] = []

        // DFS 收集继承链，检测环
        const dfs = (id: string): boolean => {
            if (inStack.has(id)) {
                // 发现循环
                this.onerror(new Error(`Inheritance cycle detected for state machine '${id}'`))
                return false
            }
            if (visited.has(id)) return true
            visited.add(id)
            inStack.add(id)

            const defn = getStateMachineDef(id)
            if (!defn) {
                // 如果找不到定义，记录并继续（不认为这是环）
                inStack.delete(id)
                return true
            }

            // 递归处理父继承
            for (const pid of defn.inherits ?? []) {
                if (!dfs(pid)) return false
            }

            inheritOrder.push(defn)
            inStack.delete(id)
            return true
        }

        // 启动 DFS：对当前 def.inherits 中的每个 id 执行
        if (def.inherits) {
            for (const id of def.inherits) {
                if (!dfs(id)) {
                    // 若检测到循环或 dfs 报错，abort
                    return
                }
            }
        }

        // 按收集到的 inheritOrder 顺序合并 state（父在前）
        for (const inheritDef of inheritOrder) {
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
        }

        // 最后 overlay 当前 def 的 states（子覆盖父，transitions 追加到父之后）
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

        // Exit current state, 然后安装新的定义并进入 root state
        this.callExit()
        this._stateMachineDef = newDef
        // 构建并排序 buckets（通过方法实现，便于后续重建）
        this.rebuildBuckets()

        this._curState = newDef.rootState ?? 'unknown'
        this.currentStateTicks = 0
        this.callEnter()
    }

    getStateNames() {
        return Object.keys(this._stateMachineDef?.states ?? {})
    }

    protected currentStateTicks = 0
    get stateTicks() {
        return this.currentStateTicks
    }

    /**
     * 重建所有 state 的 transition buckets（按 trigger 分桶并按 priority 排序）
     */
    rebuildBuckets() {
        this._stateBuckets.clear()
        const def = this._stateMachineDef
        if (!def) return

        for (const [name, s] of Object.entries(def.states)) {
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

            // 不对 bucket 做优先级排序（优先级特性未启用）

            this._stateBuckets.set(name, buckets)
        }
    }

    /**
     * 重建单个 state 的 buckets（如果需要在运行时局部刷新）
     */
    rebuildBucketsFor(stateName: string) {
        const def = this._stateMachineDef
        if (!def) return
        const s = def.states[stateName]
        if (!s) return

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

        // 不对 bucket 做优先级排序（优先级特性未启用）

        this._stateBuckets.set(stateName, buckets)
    }

    resetStateMachine() {
        // 注意：reset 不再调用 callExit()，以避免在 exit 抛错时出现递归调用
        this._curState = 'unknown'
        this._stateMachineDef = null
        this.currentStateTicks = 0
        this._stateBuckets.clear()
        this._pendingStateQueue.length = 0
        this._changing = false
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
                // 在错误中包含当前 state 名称以便定位
                this.onerror({ error, state: this._curState, phase: 'exit' })
            } catch (error) {
                defaultOnError(error)
            }
            // 不在此处 resetStateMachine，以避免 exit 抛错导致递归调用
        }
    }

    protected callEnter() {
        try {
            this.currentState()?.enter?.(this.owner)
        } catch (error) {
            try {
                // 在错误中包含当前 state 名称以便定位
                this.onerror({ error, state: this._curState, phase: 'enter' })
            } catch (error) {
                defaultOnError(error)
            }
            // 同上，不在此处 resetStateMachine
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
            if (this.currentStateTicks >= (curState.duration ?? Infinity)) {
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
        // 保护：确保目标 state 存在，避免切换到不存在的状态
        if (!this.getState(state)) {
            profiler.info(`Attempt to change to unknown state '${state}'`) 
            return
        }
        // 如果已经在切换中，则把请求加入队列，等待当前切换完成后再处理
        if (this._changing) {
            this._pendingStateQueue.push(state)
            return
        }

        // 开始切换流程，使用队列序列化所有切换请求，防止 reentrant
        this._changing = true
        let oldState = this._curState
        try {
            this.callExit()
            this._curState = state
            this.currentStateTicks = 0
            this.callEnter()

            // 成功切换后触发 EventDelegate（如果已绑定）
            try {
                this.OnStateChanged.call(oldState, this._curState)
            } catch (cbErr) {
                // 回调错误不应中断 FSM
                profiler.info(cbErr)
            }
        } finally {
            // 结束本次切换并处理队列中的下一个请求（如果有）
            this._changing = false
            if (this._pendingStateQueue.length > 0) {
                const next = this._pendingStateQueue.shift() as string
                // 通过递归调用 changeState 触发下一个（但此时 _changing 为 false）
                this.changeState(next)
            }
        }
    }

    /**
     * 销毁/注销当前 StateMachine 的注册，避免内存泄漏。
     * 仅负责清理注册与内部状态，不会触发 state 回调。
     */
    dispose() {
        try {
            if (this._registerId) {
                StateMachine._idToSM.delete(this._registerId)
                StateMachine._actorToId.delete(this.owner)
                this._registerId = undefined
            }
        } catch (e) {
            // ignore
        }

        // fallback map 清理
        StateMachine._fallbackMap.delete(this.owner)

        // 清理内部状态
        this._stateMachineDef = null
        this._curState = 'unknown'
        this.currentStateTicks = 0
        this._stateBuckets.clear()
        this._pendingStateQueue.length = 0
        this._changing = false
    }

    /**
     * 会同时检查 canTransition 和 canEnter
     * @param cond 
     * @returns 
     */
    protected canTransition(cond: IStateTransition) {
        try {
            if (cond.canTransition && !cond.canTransition(this.owner)) {
                return false
            }
        } catch (err) {
            try {
                this.onerror({ error: err, cond, phase: 'canTransition' })
            } catch (e) {
                defaultOnError(e)
            }
            return false
        }

        const state = this.getState(cond.nextState)
        if (!state) {
            return false
        }

        try {
            if (state.canEnter && !state.canEnter(this.owner)) {
                return false
            }
        } catch (err) {
            try {
                this.onerror({ error: err, state: cond.nextState, phase: 'canEnter' })
            } catch (e) {
                defaultOnError(e)
            }
            return false
        }

        return true
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
    triggerEvent(type: string, event?: StateEvent) {
        const cur = this.currentState()
        if (!cur) {
            return
        }

        const buckets = this._stateBuckets.get(cur.name) ?? {}
        const eventConds = (buckets[TransitionTriggerType.OnEvent] ?? []) as StateEventTransition[]
        for (const eventCond of eventConds) {
            const { event: _ev, nextState, filter } = eventCond
            if (_ev === type && (!filter || !event || filter(this.owner, event)) && this.canTransition(eventCond)) {
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
    triggerAttrChange<T = any>(attribute: string, value: T, old: T) {
        const cur = this.currentState()
        if (!cur) {
            return
        }

        const buckets = this._stateBuckets.get(cur.name) ?? {}
        const attrConds = (buckets[TransitionTriggerType.OnAttributeChange] ?? []) as AttributeChangeTransition<T>[]
        for (const attrCond of attrConds) {
            const { nextState, attribute: _attr, value: _valueMatcher } = attrCond
            if (attribute !== _attr) {
                continue
            }

            if (typeof _valueMatcher === 'function') {
                // 类型断言，因为当 T 是函数类型时，ValueMatcher<T> 可能是 T 本身，也可能是匹配函数
                // 我们假设如果是函数，则它符合 (value: T, old: T) => boolean 签名
                const matcherFn = _valueMatcher as (value: T, old: T) => boolean
                if (matcherFn(value, old)) {
                    return this.changeState(nextState)
                }
            } else if (value === _valueMatcher) {
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
