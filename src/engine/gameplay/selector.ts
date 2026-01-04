import { world, Entity, EntityQueryOptions } from '@minecraft/server'
import { Actor } from '@ronin/core/architect/actor'
import { Application } from '@ronin/core/architect/application'

export enum SelectorTargetType {
    Entity,
    Block,
    Player,
}

export interface GameplaySelector<T> {
    query(): T | undefined
    queryAll(): T[]
    queryActor(): Actor | undefined
    queryActors(): Actor[]
}


export class EntitySelectorFactory implements GameplaySelector<Entity> {
    dim = 'overworld'
    queryOptions: EntityQueryOptions  = {}
    filters = new Map<string, (en: Entity) => boolean>()

    dimension(dim: string) {
        this.dim = dim
        return this
    }

    queryAll() {
        const firstFound = world.getDimension(this.dim).getEntities(this.queryOptions)
        return firstFound.filter(en => this.filters.values().every(filter => filter(en)))
    }

    query() {
        const firstFound = world.getDimension(this.dim).getEntities(this.queryOptions)
        return firstFound.find(en => this.filters.values().every(filter => filter(en)))
    }

    queryActor() {
        const en = this.query()
        if (en) {
            return Application.getInst().getActor(en.id)
        }
    }

    queryActors() {
        return this.queryAll().map(en => Application.getInst().getActor(en.id)).filter(actor => actor !== undefined)
    }

}

export class BlockSelectorFactory {}


export function selector(type: SelectorTargetType = SelectorTargetType.Entity) {
    switch (type) {
        case SelectorTargetType.Entity:
            return new EntitySelectorFactory()

        case SelectorTargetType.Block:
            return new BlockSelectorFactory()
    }
}