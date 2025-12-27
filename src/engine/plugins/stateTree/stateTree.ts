import { Actor } from "@ronin/core/architect/actor"
import { EventInstigator } from "@ronin/core/architect/event"
import { Tag } from "@ronin/core/tag"
import { State, Task } from "./state"
import type { StateTreeComponent } from "./stateTreeComponent"
import { ReflectConfig } from "@ronin/core/architect/reflect"

export interface StateTreeEvent {
    readonly tag: Tag
    /**
     * 当你的事件从 Controller 上下文发送时（例如玩家输入）, `getOwner` 或 `.actor` 会错误返回 Controller 实例。
     * 所以，请传递 targetActor 以便在事件监听器中获取实际发送事件的 Actor 实例
     */
    readonly targetActor: Actor
}

class RootState extends State {
    constructor() {
        super('root')
    }

    canEnter(_: StateTree): boolean {
        return true
    }
}

export class StateTree extends EventInstigator<any> {
    protected readonly root = new RootState()
    protected readonly tasks: Record<string, Task> = {}

    protected _curState: State
    protected _taskFinished = true
    protected _shouldTransition = true

    readonly component: StateTreeComponent

    constructor(component: StateTreeComponent) {
        super()
        this.component = component
        this._curState = this.root
        this.onStart()
    }

    sendStateEvent(event: StateTreeEvent) {
        this.getCurrentState().OnStateTreeEvent.call(event, this)
    }

    /**
     * 返回执行上下文中调用 StateTree 方法的 Actor 实例，
     * 可能是 Controller 或 Pawn, 请不要依赖这个方法获得 Actor 实例
     * @returns 
     */
    getOwner(): Actor {
        return ReflectConfig.unsafeCtxActor() as any
    }

    getCurrentState() {
        return this._curState
    }

    getExecutingTasks() {
        return this._curState.taskNames
    }

    addTask(name: string, task: Task) {
        this.tasks[name] = task
    }

    removeTask(name: string) {
        delete this.tasks[name]
    }

    getTaskNames() {
        return Object.keys(this.tasks)
    }

    protected async executeTasks() {
        const state = this._curState
        if (!state || state.taskNames.length === 0) {
            return true
        }

        this._taskFinished = false

        /**
         * 执行任务
         */
        try {
            for (const task of state.taskNames) {
                await this.tasks[task]?.(this, state)
            }
            this._taskFinished = true

            return true
        } catch (error) {
            return false
        }
    }

    /**
     * 标记状态完成，立刻执行状态过渡（并不是终止当前 Task 执行）
     * 
     * Task 将会继续执行，耗时任务请在 onExit 进行资源释放
     */
    finishTasks() {
        this._taskFinished = true
        this._shouldTransition = true
    }

    private _cachedStates: Record<string, State> = {}
    protected searchState(name: string | State) {
        if (typeof name === 'object' && name) {
            this._cachedStates[name.name] = name
            return name
        }

        if (this._cachedStates[name]) {
            return this._cachedStates[name]
        }

        let curLevel: State[] = [ this.root ]
        let children: State[] = []
        while (children = curLevel.map(state => state.children).flat()) {
            for (const state of curLevel) {
                const stateName = state.name
                this._cachedStates[stateName] = state
                if (stateName === name) {
                    return state
                }
            }

            curLevel = children
        }
    }

    async tryTransitionTo(nextState: string | State, finishTasks = true) {
        const state = this.searchState(nextState)
        if (!state) {
            return false
        }

        if (finishTasks) {
            this.finishTasks()
        }

        return this.transitionTo(state)
    }

    protected async transitionTo(state: State) {
        const prevState = this._curState
        const { promise, resolve } = Promise.withResolvers<boolean>()

        this._preupdates.add(() => {
            if (!state.canEnter(this)) {
                return resolve(false)
            }

            try {
                prevState.onExit?.(this, state)
                this._curState = state
                this._curState.onEnter?.(this, prevState)
                resolve(true)
            } catch {
                resolve(false)
            }
        })

        return promise
    }

    resetStateTree() {
        this._curState = this.root
        this._taskFinished = true
        this._shouldTransition = true
    }

    protected async tryTransition() {
        this._shouldTransition = false

        if (this._curState.tryTransitionEveryTick) {
            const nextDefinedState = this._curState.canTransitionTo?.(this)
            if (nextDefinedState) {
                if (await this.tryTransitionTo(nextDefinedState)) {
                    return
                }
            }
        }

        if (this._curState.keepCurrentState) {
            return
        }

        const found = this.searchStateCanEnter(this._curState)
        if (!found) {
            this.resetStateTree()
            return
        }

        if (!(await this.transitionTo(found))) {
            this.resetStateTree()
        }
    }

    private findLeaf(state: State): State | null {
        if (state.children.length === 0) {
            return state
        }

        for (const child of state.children) {
            if (child.canEnter(this)) {
                const leaf = this.findLeaf(child)
                if (leaf) {
                    return leaf
                }
            }
        }

        return null
    }

    protected searchStateCanEnter(startState: State): State | null {
        for (const child of startState.children) {
            if (child.canEnter(this)) {
                const leaf = this.findLeaf(child)
                if (leaf) {
                    return leaf
                }
            }
        }

        let curr = startState
        while (curr.parent) {
            const parent = curr.parent
            for (const sibling of parent.children) {
                if (sibling === curr) {
                    continue
                }

                if (sibling.canEnter(this)) {
                    const leaf = this.findLeaf(sibling)
                    if (leaf) {
                        return leaf
                    }
                }
            }
            curr = parent
        }

        return null
    }

    protected _preupdates = new Set<() => void>()

    async update() {
        this._preupdates.forEach(preupdate => preupdate())
        this._preupdates.clear()

        if (this._taskFinished) {
            if (await this.executeTasks() == false)
                this._taskFinished = false
        }

        if (
            // 强制触发状态过渡
            this._shouldTransition ||
            // State 设置每帧尝试过渡
            this._curState.tryTransitionEveryTick ||
            // 正常情况下，任务执行完毕后尝试过渡
            this._curState.transitionOnFinished && this._taskFinished && !this._curState.keepCurrentState
        ) {
            this.tryTransition()
        }
    }

    onStart() { }
}