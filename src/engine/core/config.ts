import { Constructor } from "@ronin/core/types"
import { Component } from "@ronin/core/architect/component"
import { Actor } from "@ronin/core/architect/actor"
import { Controller, IController, PlayerController as IPlayerController } from "@ronin/core/architect/controller"
import { ActorComponents, AiControllerClasses, PlayerComponents, PlayerControllerClass, SpawnClasses } from "@ronin/config/spawn"
import { BasePlayerController } from "./predefined"
import { Pawn } from "./architect/pawn"

export function registerPlayerComponent(...ctor: Constructor<Component>[]) {
    PlayerComponents.push(...ctor)
}

export function registerActorComponent(...ctor: Constructor<Component>[]) {
    ActorComponents.push(...ctor)
}

export function registerAiControllerClass(entityType: string, ctor: Constructor<IController>) {
    AiControllerClasses[entityType] = ctor
}

let overridePlayerControllerClass: Constructor<IPlayerController> | null = null
export function registerPlayerController(ctor: Constructor<IPlayerController>) {
    overridePlayerControllerClass = ctor
}

export function registerSpawnClass(entityType: string, ctor: Constructor<Actor>) {
    SpawnClasses[entityType] = ctor
}

export function registerPlayerSpawnClass(ctor: Constructor<Pawn>) {
    SpawnClasses['minecraft:player'] = ctor
}

export class SpawnConfig {
    private static instance: SpawnConfig

    static getInst() {
        if (!this.instance) {
            this.instance = new SpawnConfig()
        }

        return this.instance
    }

    playerComponentsLoader = () => {
        return [
            ...ActorComponents.map(c => new c()),
            ...PlayerComponents.map(c => new c())
        ]
    }

    actorComponentsLoader = () => [
        ...ActorComponents.map(c => new c())
    ]

    defaultSpawnClass = Actor
    private spawnClass: Record<string, Constructor<Actor>> = SpawnClasses

    defaultPlayerControllerClass = BasePlayerController
    private aiClass: Record<string, Constructor<IController>> = AiControllerClasses

    registerSpawnClass(entityType: string, ctor: Constructor<Actor>) {
        this.spawnClass[entityType] = ctor
    }

    findSpawnClass(entityType: string, strict = false) {
        if (!strict) {
            return this.spawnClass[entityType]
                ?? this.defaultSpawnClass
                ?? Actor
        }

        return this.spawnClass[entityType]
    }

    findPlayerControllerClass(): Constructor<IPlayerController> {
        return overridePlayerControllerClass ?? PlayerControllerClass ?? this.defaultPlayerControllerClass
    }

    findAiControllerClass(entityType: string) {
        return this.aiClass[entityType] as Constructor<Controller>
    }
}

export function SpawnClass(entityType: string) {
    return function (target: Function) {
        const conf = SpawnConfig.getInst()
        conf.registerSpawnClass(entityType, target as Constructor<Actor>)
    }
}

export function PlayerSpawnClass(target: Function) {
    const conf = SpawnConfig.getInst()
    conf.registerSpawnClass('minecraft:player', target as Constructor<Actor>)
}

export function PlayerComponent(target: Function) {
    registerPlayerComponent(target as Constructor<Component>)
}

export function ActorComponent(target: Function) {
    registerActorComponent(target as Constructor<Component>)
}

export function AiControllerClass(entityType: string) {
    return function (target: Function) {
        registerAiControllerClass(entityType, target as Constructor<IController>)
    }
}

export function PlayerController(target: Function) {
    registerPlayerController(target as Constructor<IPlayerController>)
}