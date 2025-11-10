import { TaggableObject } from "../tag"
import { Tickable, ticking } from "../ticking"
import { Component } from "./component"
import { ReflectConfig } from "@ronin/core/architect/reflect"
import { ConstructorOf } from "../types"

const isActor = Symbol('isActor')

export class Actor extends TaggableObject implements Tickable {
    constructor(
        public readonly id: string
    ) {
        super()
        ticking.addTickingObject(this)
    }

    [isActor]: true = true

    static isActor(obj: any): obj is Actor {
        return obj && obj[isActor] === true
    }

    private readonly components = new Map<string, Component>()
    private readonly beforeNextTickCbs = new Set<CallableFunction>()

    readonly tickingGroup: string = 'actor'
    readonly tags: string[] = []

    allowTicking: boolean = true

    getTags(): string[] {
        return this.tags
    }

    addTag(tag: string): void {
        this.tags.push(tag)
    }

    removeTag(tag: string): void {
        this.tags.splice(this.tags.indexOf(tag), 1)
    }

    addComponent(component: Component): Actor
    addComponent(...component: Component[]): Actor
    addComponent(name: string, component: Component): Actor
    addComponent(arg1: string | Component, component?: Component): Actor {
        if (Array.isArray(arg1)) {
            for (const comp of arg1) {
                this.addComponent(comp)
            }
            return this
        }

        const [ key, comp ] = typeof arg1 === 'string'
            ? [ arg1, component as Component ]
            : [ arg1.constructor.name, arg1 ]

        if (!comp) {
            throw new Error('Component must be provided when adding a component.')
        }

        this.components.set(key, comp)
        comp.attach?.()
        this._componentsReady.add(key)

        // component周期已到达started，不再需要执行tryStart
        // 此时可以直接执行start
        if (this._componentsStarted) {
            ReflectConfig.contextActor = this
            comp.start?.()
        }
    
        return this
    }

    removeComponent(name: string): Actor
    removeComponent(component: Component): Actor
    removeComponent(arg: any): Actor {
        const key = typeof arg === 'string' ? arg : arg.constructor.name
        const component = this.components.get(key)
        if (component) {
            component.detach?.()
        }
        this.components.delete(key)

        return this
    }

    getComponent<T extends Component>(cls: ConstructorOf<T>): T
    getComponent<T extends Component>(name: string): T
    getComponent<T extends Component>(arg: any): T {
        return this.components.get(
            typeof arg === 'string' ? arg : arg.name
        ) as T
    }

    getComponents(): Component[] {
        return Array.from(this.components.values())
    }

    clear(): void {
        for (const component of this.components.values()) {
            component.detach?.()
        }
        this.components.clear()
        this._componentsStarted = false
        this._componentsReady.clear()
    }

    beforeNextUpdate(cb: (actor: Actor) => void) {
        this.beforeNextTickCbs.add(cb)
    }

    tick = (dt: number, dms: number) => {
        // 如果组件未准备好，则不更新
        if (!this._componentsStarted) {
            return
        }

        // 执行 beforeNextUpdate 回调
        this.beforeNextTickCbs.forEach(cb => cb(this))
        this.beforeNextTickCbs.clear()

        ReflectConfig.contextActor = this
        for (const component of this.components.values()) {
            if (component.allowTicking) {
                component.update?.(dt, dms)
            }
        }
    }

    start() {
        if (this._componentsStarted) {
            return
        }

        ReflectConfig.contextActor = this
        for (const component of this.components.values()) {
            component.start?.()
        }
    }

    despawn() {}

    private _componentsReady = new Set<string>()
    private _componentsStarted = false

    tryStart() {
        // 如果组件已经开始，则不再尝试
        if (this._componentsStarted) return

        // 所有组件都已准备好时，调用 start 方法
        if (this._componentsReady.size === this.components.size) {
            this.start()
        }

        // 标记组件已开始
        this._componentsStarted = true
    }

}