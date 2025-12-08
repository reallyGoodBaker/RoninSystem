import { EventDelegate } from "@ronin/core/architect/event"
import type { StateTree, StateTreeEvent } from "./stateTree"

export interface Task {
    (stateTree: StateTree, state: State): void | Promise<void>
}

export class State {
    constructor(
        readonly name: string,
        /**
         * state 的静态负载，将会合并到 `context` 中,
         * 可通过 `stateTree.getContext` 访问
         */
        readonly payload?: any
    ) {}

    /**
     * 当 `keepCurrentState` 为 true 时，当前状态将会被持续，不会自动退出，
     * 直到手动调用 `StateTree.finishTasks` 方法
     */
    keepCurrentState: boolean = false

    /**
     * 每一刻都会调用 `canTransitionTo` 方法，如果返回值不为空，则尝试进入返回的状态。
     * 若返回的状态无法进入，则尝试从父节点重新开始搜索
     */
    tryTransitionEveryTick: boolean = false

    /**
     * 当任务执行完毕后，是否自动退出当前状态 (无需手动调用 `StateTree.finishTasks` 方法)
     */
    transitionOnFinished: boolean = true

    /**
     * 进入状态后需要要执行的任务
     */
    taskNames: string[] = []

    parent?: State
    children: State[] = []

    appendChild(child: State) {
        child.parent = this
        this.children.push(child)
        return this
    }

    private _removeChildByState(child: State) {
        const index = this.children.indexOf(child)
        if (index > -1) {
            this.children.splice(index, 1)
            child.parent = undefined
        }
        return this
    }

    private _removeChildByName(name: string) {
        const state = this.children.find(child => child.name === name)
        if (state) {
            return this._removeChildByState(state)
        }
    }

    removeChild(child: State | string) {
        if (typeof child === 'string') {
            return this._removeChildByName(child)
        } else {
            return this._removeChildByState(child)
        }
    }

    readonly OnStateTreeEvent = new EventDelegate<[StateTreeEvent, StateTree]>()

    /**
     * 判断当前状态是否可以进入
     * @param stateTree 
     */
    canEnter(stateTree: StateTree): boolean { return true }

    /**
     * 进入状态时调用
     * @param stateTree 
     * @param prevState 
     */
    onEnter(stateTree: StateTree, prevState: State): void {}

    /**
     * 下一个可进入的状态被搜索出来后，这个方法会被调用
     * @override
     * @param stateTree 
     */
    onExit(stateTree: StateTree, nextState: State): void {}

    /**
     * 当 `tryTransitionEveryTick` 为 true 时，每刻都会调用。
     * 默认直接返回根节点，若需要进入其他状态，请重写此方法。
     * 
     * 返回 undefined 表示无法进入其他状态
     * @param stateTree 
     * @returns 
     */
    canTransitionTo?(stateTree: StateTree): string | undefined { return 'root' }
}