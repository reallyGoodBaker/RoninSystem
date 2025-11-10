import { Entity } from '@minecraft/server'
import { Actor } from './actor'
import { Component } from './component'
import { ConstructorOf } from '../types'
import { IController } from './controller'

export interface WorldLocation {
    x: number
    y: number
    z: number
    dimension: string
}

export interface ActorManager {
    /**
     * 创建一个 Actor，这个 Actor 不会自动绑定到任何游戏实体，只能用作逻辑处理
     * @param id 
     * @param components 
     */
    spawnActor<T extends Actor = Actor>(id: string, spawnClass: ConstructorOf<T>, ...components: Component[]): T

    /**
     * 销毁一个 Actor
     * @param id 
     * @param components 
     */
    despawnActor(id: string): void

    /**
     * 从已创建的 Actor 中获取
     * @param id 
     */
    getActor<T extends Actor = Actor>(id: string): T | undefined

    /**
     * 从已有的实体绑定一个Actor
     * @param entity 
     * @param components 
     */
    spawnEntityActor(entity: Entity, ...components: Component[]): Actor

    /**
     * 从给定的类为已有实体绑定一个Actor
     * @param entity 
     * @param actorClass 
     * @param components 
     */
    spawnEntityActor<T extends Actor>(entity: Entity, actorClass: ConstructorOf<T>, ...components: Component[]): Actor

    /**
     * 从给定的 Entity 类型和位置绑定一个Actor
     * @param type 
     * @param dim 
     * @param actorClass 
     * @param components 
     */
    spawnEntityActor<T extends Actor>(type: string, dim: WorldLocation, actorClass: ConstructorOf<T>, ...components: Component[]): Actor

    /**
     * 取消绑定一个 Entity 的 Actor
     * @param entity 
     * @param clearEntity 
     */
    despawnEntityActor(entity: Entity, clearEntity?: boolean): void
}

export interface IWorld extends ActorManager {
    getControllerByActorId<T extends IController>(id: string): T | undefined
}