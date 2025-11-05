import { ReflectConfig } from '@ronin/core/architect/reflect'
import { Constructor } from '../types'
import { Actor } from './actor'

/**
 * 组件
 * 若需要 `Component.update()`, allowTicking 必须为 `true`
 */
export abstract class Component<A extends Actor = Actor> {

    /**
     * 不要在 `Component.start()`, `Component.update()` 生命周期以外使用这个变量
     * 这个变量只在以上两个生命周期内有效
     * 若需要长期持有当前 `contextActor`, 请使用 {@link ReflectConfig.contextActorRef}
     */
    get actor(): A {
        return ReflectConfig.unsafeCtxActor() as A
    }

    /**
     * 组件是否启用
     * 若组件未启用，则不会调用 `Component.update()`
     */
    allowTicking = false

    /**
     * Called every update
     */
    update?(dTick: number, dMs: number): void

    /**
     * Called when the component is first added to an entity.
     */
    attach?(): void

    /**
     * Called when all components is added to an entity.
     */
    start?(): void

    /**
     * Called when the component is removed from an entity.
     */
    detach?(): void

    /**
     * 下一次更新前移除组件本身
     */
    remove() {
        return this.removeComponent(this)
    }

    getComponent<T extends Component>(cls: Constructor<T>): T
    getComponent<T extends Component>(name: string): T
    getComponent<T extends Component>(arg: any): T {
        return this.actor.getComponent(arg)
    }

    /**
     * Actor.addComponent() 的 Commander 版本
     * 避免在调用过程中插入其他组件
     */
    addComponent(component: Component): Promise<void>
    addComponent(...component: Component[]): Promise<void>
    addComponent(name: string, component: Component): Promise<void>
    addComponent(arg1: any, component?: any): Promise<void> {
        const { promise, resolve } = Promise.withResolvers<void>()
        this.actor.beforeNextUpdate(actor => {
            actor.addComponent(arg1, component)
            resolve()
        })

        return promise
    }

    /**
     * Actor.removeComponent() 的 Commander 版本
     * 避免在调用过程中删除其他组件
     */
    removeComponent(name: string): Promise<void>
    removeComponent(component: Component): Promise<void>
    removeComponent(arg: any): Promise<void> {
        const { promise, resolve } = Promise.withResolvers<void>()
        this.actor.beforeNextUpdate(actor => {
            actor.removeComponent(arg)
            resolve()
        })

        return promise
    }

}