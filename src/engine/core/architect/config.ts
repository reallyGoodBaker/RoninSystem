import { ConstructorOf } from "@ronin/core/types"
import { Component } from "@ronin/core/architect/component"
import { Actor } from "@ronin/core/architect/actor"
import { Controller, IController, PlayerController as IPlayerController } from "@ronin/core/architect/controller"
import { ActorComponents, AiControllerClasses, AutoSpawns, PlayerComponents, PlayerControllerClass, SpawnClasses } from "@ronin/config/spawn"
import { BasePlayerController } from "../predefined"
import { Pawn } from "./pawn"

export interface IConfigurator {
    getConfig<T>(name: string, defaultVal?: T): T
    setConfig(name: string, value: any): void
}

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

    readonly specifiedActorComponents: Record<string, ConstructorOf<Component>[]> = {}

    actorComponentsLoader = (entityType?: string) => [
        ...ActorComponents.map(c => new c()),
        ...((entityType ? this.specifiedActorComponents[entityType] : []) ?? []).map(c => new c())
    ]

    playerComponentsLoader = () => {
        return [
            ...this.actorComponentsLoader('minecraft:player'),
            ...PlayerComponents.map(c => new c())
        ]
    }

    private defaultSpawnClass = Actor
    private spawnClass: Record<string, ConstructorOf<Actor>> = SpawnClasses
    private defaultPlayerControllerClass: ConstructorOf<IPlayerController> = BasePlayerController
    private aiClass: Record<string, ConstructorOf<IController>> = AiControllerClasses

    registerPlayerComponent(ctor: ConstructorOf<Component>) {
        PlayerComponents.push(ctor)
    }

    registerSpecifiedActorComponent(entityType: string, ...ctors: ConstructorOf<Component>[]) {
        let ctorList = this.specifiedActorComponents[entityType] ?? []
        this.specifiedActorComponents[entityType] = ctorList.concat(ctors)
    }

    registerActorComponent(ctor: ConstructorOf<Component>) {
        ActorComponents.push(ctor)
    }

    registerSpawnClass(entityType: string, ctor: ConstructorOf<Actor>) {
        this.spawnClass[entityType] = ctor
    }

    registerPlayerControllerClass(ctor: ConstructorOf<IPlayerController>) {
        this.defaultPlayerControllerClass = ctor
    }

    registerAiControllerClass(entityType: string, ctor: ConstructorOf<IController>) {
        this.aiClass[entityType] = ctor
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

    canAutoSpawn(entityType: string) {
        return AutoSpawns.includes(entityType)
    }

    registerAutoSpawn(entityType: string) {
        AutoSpawns.push(entityType)
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