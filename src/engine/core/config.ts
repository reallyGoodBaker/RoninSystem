import { ConstructorOf } from "@ronin/core/types"
import { Component } from "@ronin/core/architect/component"
import { Actor } from "@ronin/core/architect/actor"
import { Controller, IController, PlayerController as IPlayerController } from "@ronin/core/architect/controller"
import { ActorComponents, AiControllerClasses, PlayerComponents, PlayerControllerClass, SpawnClasses } from "@ronin/config/spawn"
import { BasePlayerController } from "./predefined"
import { Pawn } from "./architect/pawn"

export function registerPlayerComponent(...ctor: ConstructorOf<Component>[]) {
    PlayerComponents.push(...ctor)
}

export function registerActorComponent(...ctor: ConstructorOf<Component>[]) {
    ActorComponents.push(...ctor)
}

export function registerAiControllerClass(entityType: string, ctor: ConstructorOf<IController>) {
    AiControllerClasses[entityType] = ctor
}

let overridePlayerControllerClass: ConstructorOf<IPlayerController> | null = null
export function registerPlayerController(ctor: ConstructorOf<IPlayerController>) {
    overridePlayerControllerClass = ctor
}

export function registerSpawnClass(entityType: string, ctor: ConstructorOf<Actor>) {
    SpawnClasses[entityType] = ctor
}

export function registerPlayerSpawnClass(ctor: ConstructorOf<Pawn>) {
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
    private spawnClass: Record<string, ConstructorOf<Actor>> = SpawnClasses

    defaultPlayerControllerClass = BasePlayerController
    private aiClass: Record<string, ConstructorOf<IController>> = AiControllerClasses

    registerSpawnClass(entityType: string, ctor: ConstructorOf<Actor>) {
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

    findPlayerControllerClass(): ConstructorOf<IPlayerController> {
        return overridePlayerControllerClass ?? PlayerControllerClass ?? this.defaultPlayerControllerClass
    }

    findAiControllerClass(entityType: string) {
        return this.aiClass[entityType] as ConstructorOf<Controller>
    }
}

export function SpawnClass(entityType: string) {
    return function (target: Function) {
        const conf = SpawnConfig.getInst()
        conf.registerSpawnClass(entityType, target as ConstructorOf<Actor>)
    }
}

export function PlayerSpawnClass(target: Function) {
    const conf = SpawnConfig.getInst()
    conf.registerSpawnClass('minecraft:player', target as ConstructorOf<Actor>)
}

export function PlayerComponent(target: Function) {
    registerPlayerComponent(target as ConstructorOf<Component>)
}

export function ActorComponent(target: Function) {
    registerActorComponent(target as ConstructorOf<Component>)
}

export function AiControllerClass(entityType: string) {
    return function (target: Function) {
        registerAiControllerClass(entityType, target as ConstructorOf<IController>)
    }
}

export function PlayerController(target: Function) {
    registerPlayerController(target as ConstructorOf<IPlayerController>)
}