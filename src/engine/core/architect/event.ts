import { EventLinked } from "@ronin/utils/eventLinked"
import { Actor } from "./actor"
import { Component } from "./component"

/**
 * 一个 发布-订阅 模式的事件触发器类，相比于 EventSignal, EventInstigator 可以为``特定事件``添加多个回调函数
 * 
 * 相较于 EventSignal, EventInstigator 的删除事件性能较好，用于需要频繁删除监听器的情况，否则请使用 EventSignal
 */
export class EventInstigator<M extends { [key in keyof M]: unknown[] } = {}> {
    private readonly events: Record<any, EventLinked> = {}

    addListener<T extends keyof M>(eventName: T, callback: (...args: M[T]) => void) {
        let eventLinked = this.events[eventName]

        if (!eventLinked) {
            eventLinked = (this.events[eventName] = new EventLinked())
        }

        eventLinked.append(callback)
    }

    trigger<T extends keyof M>(eventName: T, ...args: M[T]) {
        const eventLinked = this.events[eventName]
        if (eventLinked) {
            for (const cb of eventLinked) {
                cb.listener?.(...args)
            }   
        }
    }

    removeListener<T extends keyof M>(eventName: T, callback: Function) {
        const eventLinked = this.events[eventName]
        if (eventLinked) {
            eventLinked.delete(callback as any)
        }
    }

    on = EventInstigator.prototype.addListener
    off = EventInstigator.prototype.removeListener
}

/**
 * 一个 发布-订阅 模式的事件触发器类，是 {@link EventInstigator} 的 {@link Component} 实现
 */
export abstract class EventComponent<M extends { [ K in keyof M]: M[K] } = {}, A extends Actor = Actor> extends Component<A> {
    private readonly events: Record<any, EventLinked> = {}

    addListener<T extends keyof M>(eventName: T, callback: (...args: M[T]) => void) {
        let eventLinked = this.events[eventName]

        if (!eventLinked) {
            eventLinked = (this.events[eventName] = new EventLinked())
        }

        eventLinked.append(callback)
    }

    trigger<T extends keyof M>(eventName: T, ...args: M[T]) {
        const eventLinked = this.events[eventName]
        if (eventLinked) {
            for (const cb of eventLinked) {
                cb.listener?.(...args as any[])
            }   
        }
    }

    removeListener<T extends keyof M>(eventName: T, callback: Function) {
        const eventLinked = this.events[eventName]
        if (eventLinked) {
            eventLinked.delete(callback as any)
        }
    }

    on = EventComponent.prototype.addListener
    off = EventComponent.prototype.removeListener
}

/**
 * 一个事件 Observable，可以绑定多个回调函数，当事件触发时，所有绑定的回调函数都会被调用
 */
export class EventSignal<A extends unknown[] = unknown[]> {
    private _observers: Array<(...args: A) => void> = []

    addListener = (callback: (...args: A) => void) => {
        this._observers.push(callback)
    }

    /**
     * 尽可能不使用 off，因为 off 性能较差
     * @param callback 
     */
    removeListener = (callback: (...args: A) => void) => {
        this._observers.splice(this._observers.indexOf(callback), 1)
    }

    trigger = (...args: A) => {
        this._observers.forEach(callback => callback.apply(undefined, args))
    }

    on = EventSignal.prototype.addListener
    off = EventSignal.prototype.removeListener
}


/**
 * 一个事件委托，只能绑定一个回调函数
 */
export class EventDelegate<A extends unknown[] = unknown[]> {
    private onNotify_?: (...args: A) => void

    bind = (callback: (...args: A) => void, thisArg?: any) => {
        if (thisArg) {
            this.onNotify_ = callback.bind(thisArg)
            return
        }

        this.onNotify_ = callback
    }

    call = (...args: A) => {
        this.onNotify_?.apply(undefined, args)
    }

    unbind = () => {
        this.onNotify_ = undefined
    }
}