import { Component } from "@ronin/core/architect/component"
import { Constructor } from "@ronin/core/types"
import { Controller, IController, PlayerController } from "@ronin/core/architect/controller"
import { BasePlayer, BasePlayerController } from "@ronin/core/predefined"

import type { Application } from "@ronin/core/architect/application"
import type { Actor } from "@ronin/core/architect/actor"

/**
 * 允许自动绑定 `Actor` 的生物类型
 */
export const AutoSpawns: string[] = [
    'minecraft:player',
]

/**
 * 生物初始化时加载的组件
 * 若需要对特定生物进行自定义 {@link Actor} 绑定，请使用 {@link Application.spawnActor}
 */
export const ActorComponents: Constructor<Component>[] = [

]

/**
 * 玩家初始化时加载的组件
 */
export const PlayerComponents: Constructor<Component>[] = [

]

/**
 * 生物初始化时加载的 {@link Actor} 类
 */
export const SpawnClasses: Record<string, Constructor<Actor>> = {
    'minecraft:player': BasePlayer,
}

/**
 * 玩家初始化时加载的 {@link Controller} 类
 */
export const PlayerControllerClass: Constructor<PlayerController> = BasePlayerController

/**
 * 生物初始化时加载的 {@link Controller} 类
 */
export const AiControllerClasses: Record<string, Constructor<IController>> = {

}
