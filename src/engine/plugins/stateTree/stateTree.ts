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
    static readonly Root = new RootState()
    protected _curState?: State

    readonly tasks: Record<string, Task> = {}

    addTask(name: string, task: Task) {
        this.tasks[name] = task
    }

    removeTask(name: string) {
        delete this.tasks[name]
    }


    async executeTasks() {
        const state = this._curState
        if (!state || state.taskNames.length === 0) {
            return
        }

        /**
         * 执行任务
         */
        for (const task of state.taskNames) {
            await this.tasks[task]?.(state, this)
        }

        return true
    }

    /**
     * 标记状态完成开始尝试进行状态过度（并不是终止当前 Task 执行）
     */
    finishTasks() {

    }

    tick() {

    }
}