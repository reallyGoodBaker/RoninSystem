import { IPlugin } from "@ronin/core/architect/plugin"
import { Application, IApplication } from "@ronin/core/architect/application"
import { ConstructorOf } from "@ronin/core/types"
import { StateTreeComponent, StateTreeConfKey } from "./stateTreeComponent"
import { CustomCommand, Param } from "@ronin/utils/command"
import { profiler } from "@ronin/core/profiler"
import { StateTree } from "./stateTree"
import { State } from "./state"
import { PROFIER_CONFIG } from "@ronin/config/profiler"

import type { SpawnConfig } from "@ronin/core/architect/config"
import type { Entity } from "@minecraft/server"
import type { Pawn } from "@ronin/core/architect/pawn"

const { TOKENS } = PROFIER_CONFIG

function getStateTree(app: IApplication, entity: Entity) {
    return app.getActor<Pawn>(entity.id)?.getComponent(StateTreeComponent)?.stateTree
}

export class StateTreePlugin implements IPlugin {
    name: string = 'StateTree'
    description: string = '状态树插件 (提供状态树相关功能，用于动作类型的游戏设计)'

    @CustomCommand('查看 Pawn 状态树')
    show_state_tree(
        @Param.Required('actor') pawn: Entity[]
    ) {
        const app = Application.getInst()
        pawn.forEach(entity => {
            profiler.info(getStateTree(app, entity))
        })
    }

    @CustomCommand('查看状态树当前状态')
    state_tree_current_state(
        @Param.Required('actor') pawn: Entity[]
    ) {
        const app = Application.getInst()
        pawn.forEach(entity => {
            const stateTree = getStateTree(app, entity)
            profiler.info(
                stateTree?.getCurrentState()
            )
        })
    }

    @CustomCommand('查看状态树当前运行的任务')
    state_tree_current_tasks(
        @Param.Required('actor') pawn: Entity[]
    ) {
        const app = Application.getInst()
        pawn.forEach(entity => {
            const stateTree = getStateTree(app, entity)
            profiler.info(
                stateTree?.getExecutingTasks()
            )
        })
    }

    @CustomCommand('查看注册到状态树的所有任务')
    state_tree_tasks(
        @Param.Required('actor') pawn: Entity[]
    ) {
        const app = Application.getInst()
        pawn.forEach(entity => {
            const stateTree = getStateTree(app, entity)
            profiler.info(
                stateTree?.getTaskNames()
            )
        })
    }

    startModule(app: IApplication): void {
        const conf = app.getConfig(StateTreeConfKey, {}) as Record<string, ConstructorOf<StateTree>>
        const spawn = app.getConfig('SpawnConfig') as SpawnConfig
        for (const k of Object.keys(conf)) {
            spawn.registerSpecifiedActorComponent(k, StateTreeComponent)
        }

        profiler.registerCustomTypePrinter(StateTree, stateTree =>
            '状态树' +
                `\n当前状态: ${profiler.format(stateTree.getCurrentState())}` +
                `\n当前任务: ${profiler.format(stateTree.getExecutingTasks())}`
        )

        profiler.registerCustomTypePrinter(State, state => {
            const {
                name, payload, keepCurrentState, children,
                tryTransitionEveryTick, transitionOnFinished, taskNames,
            } = state

            return `${TOKENS.ID + name + TOKENS.R}\n` + profiler.format({
                name, payload, keepCurrentState,
                tryTransitionEveryTick, transitionOnFinished, taskNames,
            }) + profiler.format(children)
        })
    }
}