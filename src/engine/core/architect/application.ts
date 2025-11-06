import 'reflect-metadata'
import { Entity, Player, StartupEvent, system, world } from '@minecraft/server'
import { Component } from './component'
import { CommandRegistry } from '../command'
import { CustomCommand, Param, registerAllFromAnnotations } from '@ronin/utils/command'
import { ticking } from '../ticking'
import { Constructor } from '../types';
import { Actor } from './actor'
import { Mod, ModBase } from './mod'
import { IWorld, WorldLocation } from './world'
import { Resource, Resources } from './resorce'
import { EventInstigator } from './event'
import { Pawn } from './pawn'
import { IController, PlayerController } from './controller'
import { profiler } from '../profiler'
import { SpawnConfig } from '../config'
import { AutoSpawns } from '@ronin/config/spawn'
import { IPlugin, IPluginLoader } from './plugin'
import { PROFIER_CONFIG } from '@ronin/config/profiler'

const { TOKENS } = PROFIER_CONFIG

export interface IApplication extends IWorld, Resource, IPluginLoader {}

export interface ApplicationEvents {
    actorSpawned: [ Actor, Constructor<Actor>, Component[] ]
    actorDespawn: [ Actor | undefined, string ]
}

export class Application extends EventInstigator<ApplicationEvents> implements IApplication {
    readonly actors = new Map<string, Actor>()
    readonly spawnConfig = SpawnConfig.getInst()

    static getInst(): Application {
        return Resources.getResouce(Application) as Application
    }

    static modApp: Mod | null = null

    initialized = false

    spawnActor<T extends Actor = Actor>(id: string, spawnClass: Constructor<T>, ...components: Component[]): T {
        const actor = Reflect.construct(spawnClass, [ id ])
        components.forEach(component => actor.addComponent(component))
        this.actors.set(id, actor)
        try {
            this.trigger('actorSpawned', actor, spawnClass, components)
        } catch (error) {
            profiler.error(error)
        }

        return actor as T
    }

    despawnActor(id: string): void {
        if (!this.initialized) {
            throw new Error('Application must be initialized before despawning actors.')
        }

        const actor = this.actors.get(id)

        try {
            this.trigger('actorDespawn', actor, id)
        } catch (error) {
            profiler.error(error)
        }

        if (actor) {
            actor.despawn()
        }

        this.actors.delete(id)
    }

    despawnEntityActor(entity: Entity): void {
        if (!this.initialized) {
            throw new Error('Application must be initialized before despawning actors.')
        }

        const id = entity.id
        const actor = this.actors.get(id) as Pawn

        try {
            this.trigger('actorDespawn', actor, id)
        } catch (error) {
            profiler.error(error)
        }

        if (actor) {
            actor.despawn()
            if (actor.entity) {
                actor.entity.remove()
            }
        }

        this.actors.delete(id)
    }

    getActor<T extends Actor = Actor>(id: string): T | undefined {
        return this.actors.get(id) as T
    }

    spawnEntityActor(entity: Entity, ...components: Component[]): Actor
    spawnEntityActor<T extends Actor>(entity: Entity, actorClass: Constructor<T>, ...components: Component[]): Actor
    spawnEntityActor<T extends Actor>(type: string, location: WorldLocation, actorClass: Constructor<T>, ...components: Component[]): Actor
    spawnEntityActor(entity: Entity | string, arg1: unknown, ...components: any[]): Actor {
        if (typeof entity === 'string') {
            const type = entity
            const loc = arg1 as WorldLocation
            const actorClass = components.shift() as unknown as Constructor<Actor>
            const entity_ = world.getDimension(loc.dimension).spawnEntity(type as any, loc)
            return this.spawnEntityActor(entity_, actorClass, ...components)
        }

        if (Array.isArray(arg1)) {
            return this.spawnEntityActor(
                entity,
                this.spawnConfig
                    .findSpawnClass(entity.typeId),
                ...arg1
            )
        }

        const actorClass = arg1 as Constructor<Actor>
        const existingActor = this.actors.get(entity.id)
        if (existingActor) {
            try {
                this.trigger('actorSpawned', existingActor, actorClass, components)
            } catch (error) {
                profiler.error(error)
            }
            return existingActor
        }

        const actor = Reflect.construct(actorClass, [ entity ])
        components.forEach(component => actor.addComponent(component))
        this.actors.set(entity.id, actor)

        try {
            this.trigger('actorSpawned', actor, actorClass, components)
        } catch (error) {
            profiler.error(error)
        }
    
        return actor
    }

    readonly serverStarted = Promise.withResolvers<StartupEvent>()
    readonly playerControllers: PlayerController[] = []

    getControllerByActorId<T extends IController>(id: string): T | undefined {
        const pawn = this.getActor<Pawn>(id)
        if (!pawn) {
            return
        }

        return pawn.getController() as T
    }

    enter = () => {
        if (this.initialized) return

        const spawnConfig = this.spawnConfig

        system.beforeEvents.startup.subscribe(ev => {
            this.serverStarted.resolve(ev)

            this.initialized = true
            Application.modApp?.start?.(this, ev)
            // 从装饰器中注册所有指令
            registerAllFromAnnotations()
            // start 进行指令注册
            CommandRegistry.registerAll(ev.customCommandRegistry)

            const tryCreatePawnForPlayer = (player: Player) => {
                if (AutoSpawns.includes('minecraft:player')) {
                    const id = `pc_${this.playerControllers.length}`
                    const pc = this.spawnActor(id, spawnConfig.findPlayerControllerClass())
                    this.playerControllers.push(pc)

                    const playerPawn = this.spawnEntityActor(
                        player,
                        spawnConfig.findSpawnClass(player.typeId),
                        ...spawnConfig.playerComponentsLoader()
                    ) as Pawn

                    pc.possess(playerPawn)
                    // PlayerController 特有的初始化
                    pc.setupInput()
                    pc.tryStart()
                    // 保证Actor Components 在 Controller Components 之后初始化
                    playerPawn.tryStart()
                }
            }

            world.afterEvents.playerSpawn.subscribe(ev =>
                tryCreatePawnForPlayer(ev.player)
            )

            const tryCreatePawnForEntity = (entity: Entity) => {
                const spawnClass = spawnConfig.findSpawnClass(entity.typeId, true)
                const enId = entity.id
                if (
                    enId !== 'minecraft:player' &&
                    AutoSpawns.includes(enId) &&
                    spawnClass
                ) {
                    const actor = this.spawnEntityActor(
                        entity,
                        spawnClass,
                        ...spawnConfig.actorComponentsLoader()
                    )

                    const aiControllerClass = spawnConfig.findAiControllerClass(enId)
                    if (aiControllerClass) {
                        const conKey = `ac_${aiControllerClass.name}_${enId}`
                        const aiController = this.spawnActor(conKey, aiControllerClass)
                        aiController.possess(actor as Pawn)
                        aiController.tryStart()
                    }

                    actor.tryStart()
                }
            }

            world.afterEvents.entitySpawn.subscribe(ev =>
                tryCreatePawnForEntity(ev.entity)
            )

            world.beforeEvents.entityRemove.subscribe(ev =>
                this.despawnActor(ev.removedEntity.id)
            )

            system.run(() => {
                for (const actor of this.actors.values()) {
                    actor.tryStart()
                }

                Application.modApp?.initialized?.(this)
            })
        })

        system.beforeEvents.shutdown.subscribe(() => {
            Application.modApp?.exit?.()
        })

        ticking.init()
        //start loop
        ticking.repeat(() => ticking.tick('actor'))
    }

    exit(): void {
        ticking.clearAll()
    }

    getPlayerController(index: number = 0) {
        return this.playerControllers.at(index)
    }

    readonly plugins = new Map<string, IPlugin>()
    loadPlugin(...ctor: Constructor<IPlugin>[]): IPluginLoader {
        ctor.forEach(ctor => {
            const plugin = Reflect.construct(ctor, [])
            plugin.startModule(this)
            this.plugins.set(plugin.name, plugin)
        })

        return this
    }

    unloadPlugin(...name: string[]): IPluginLoader {
        name.forEach(name => {
            const plugin = this.plugins.get(name)
            if (plugin) {
                plugin?.stopModule?.(this)
                this.plugins.delete(name)
            }
        })

        return this
    }

    getPlugin(name: string): IPlugin | undefined {
        return this.plugins.get(name)
    }
}

/**
 * 不要实例化这个类，这里 export 是为了防止 tree-shaking
 */
export class ApplicationCommands {
    @CustomCommand('查看 Actor')
    show_actor(
        @Param.Required('actor', 'actors') entities: Entity[],
    ) {
        entities.map(entity => {
            const actor = Application.getInst().getActor(entity.id)
            profiler.info(actor)
        })
    }

    @CustomCommand('查看所有 Actors')
    show_actors() {
        profiler.info([ ...Application.getInst().actors.keys() ])
    }

    @CustomCommand('查看 Player Controller / AI Controller')
    show_controller(
        @Param.Required('actor', 'actors') entities: Entity[]
    ) {
        entities.forEach(entity => {
            const actor = Application.getInst().getActor(entity.id) as Pawn
            if (!actor) {
                return profiler.error(`Actor ${entity.id} not found`)
            }

            profiler.info(actor.getController())
        })
    }

    @CustomCommand('查看 Actor Components')
    show_components(
        @Param.Required('actor', 'pawn') entities: Entity[]
    ) {
        entities.forEach(entity => {
            const actor = Application.getInst().getActor(entity.id) as Pawn
            if (!actor) {
                return profiler.error(`Actor ${entity.id} not found`)
            }

            profiler.info(actor.getComponents())
        })
    }

    @CustomCommand('查看 Controller Components')
    show_controller_components(
        @Param.Required('actor', 'pawn') entities: Entity[]
    ) {
        entities.forEach(entity => {
            const actor = Application.getInst().getActor(entity.id) as Pawn
            if (!actor) {
                return profiler.error(`Actor ${entity.id} not found`)
            }

            const controller = actor.getController()
            if (!Actor.isActor(controller)) {
                return profiler.error(`Actor ${entity.id} is not a pawn`)
            }

            profiler.info(controller.getComponents())
        })
    }

    @CustomCommand('查看 Application Plugins')
    show_plugins() {
        profiler.info(
            ...Array.from(Application.getInst().plugins.values())
                .map(({ name, description }) => `${TOKENS.ID}${name}§r: ${TOKENS.STR}${description}`)
        )
    }
}

export function Entry(fn: Constructor<ModBase>) {
    Resources.load(
        fn,
        Application,
    )
}