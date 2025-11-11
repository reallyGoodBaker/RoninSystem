import { Actor } from "@ronin/core/architect/actor"
import { EventInstigator } from "@ronin/core/architect/event"
import { Tag } from "@ronin/core/tag"
import { State, Task } from "./state"

export interface StateTreeEvent {
    readonly tag: Tag
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

export class StateTree extends EventInstigator {
    private readonly Root = new RootState()
    private readonly tasks: Record<string, Task> = {}

    protected _curState: State = this.Root
    protected _taskFinished = true
    protected _shouldTransition = true

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
                await this.tasks[task]?.(state, this)
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

        let curLevel: State[] = [ this.Root ]
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

    tryTransitionTo(nextState: string | State) {
        const state = this.searchState(nextState)
        if (!state || !state.canEnter(this)) {
            return false
        }

        return this.transitionTo(state)
    }

    protected transitionTo(state: State) {
        const prevState = this._curState
        try {
            prevState.onExit?.(this, state)
            this._curState = state
            this._curState.onEnter?.(this, prevState)
            return true
        } catch {
            return false   
        }
    }

    resetStateTree() {
        this._curState = this.Root
        this._taskFinished = true
        this._shouldTransition = true
    }

    protected tryTransition() {
        this._shouldTransition = false

        const nextDefinedState = this._curState.canTransitionTo?.(this)
        if (nextDefinedState) {
            if (this.tryTransitionTo(nextDefinedState)) {
                return
            }
        }

        if (this._curState.keepCurrentState) {
            
        }

        const found = this.searchStateCanEnter(this._curState)
        if (!found) {
            this.resetStateTree()
            return
        }

        if (!this.transitionTo(found)) {
            this.resetStateTree()
        }
    }

    private _isLeafNode(state: State) {
        return state.children.length === 0
    }

    protected searchStateCanEnter(root: State, pruning: State[] = [], curState = root): State | null {
        if (!curState) {
            return null
        }

        if (this._isLeafNode(curState)) {
            return curState.canEnter(this) ? curState : null
        }

        for (const child of curState.children) {
            if (pruning.includes(child)) {
                continue
            }

            const result = this.searchStateCanEnter(root, pruning, child)
            if (result) {
                return result
            }
        }

        pruning.push(curState)
        return this.searchStateCanEnter(root, pruning, curState.parent)
    }

    update() {
        if (this._taskFinished) {
            this.executeTasks()
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
}