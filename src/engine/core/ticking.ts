import { system } from "@minecraft/server"
import { ObjectHelper } from "@ronin/utils/helpers/objectHelper"

export interface Tickable {
    /**
     * 是否允许执行tick
     */
    allowTicking: boolean

    /**
     * 所属的ticking组
     * 使用自定义ticking组时可以自行从ticking调度
     */
    readonly tickingGroup: string

    /**
     * 每次tick时调用
     * @param dt 
     * @param dms 
     */
    tick?(dt: number, dms: number): void

    /**
     * tick 的别名，当tick函数存在时此函数不会执行
     * @param dt 
     * @param dms 
     */
    update?(dt: number, dms: number): void
}

const tickableClasses = new Set<Function>()

/**
 * 使用这个装饰器可以自动将对象添加到 ticking 调度中
 * @param ctor 
 * @returns 
 */
export const TickableObject = (ctor: Function) => {
    tickableClasses.add(ctor)
    return ctor
}

export namespace ticking {
    export function queue(task: () => void) {
        system.run(task)
    }

    export function timeout(fn: () => void, delay?: number) {
        system.runTimeout(fn, delay)
    }

    export function repeat(fn: () => void, interval?: number) {
        system.runInterval(fn, interval)
    }

    export function tickable(group: string, fn: CallableFunction) {
        const ticking = getTickingGroup(group)
        const _tickable: Tickable = {
            allowTicking: true,
            tickingGroup: group,
            tick: fn as (dt: number, dms: number) => void,
        }

        ticking.add(fn as any)

        return _tickable
    }

    const tickingGroups = new Map<string, Ticking>()

    export class Ticking {
        private lastTick: number = 0
        private lastDate: number = 0
        readonly tickables = new Set<Tickable>()

        constructor(
            readonly group: string,
            public dilation: number,
        ) {}

        add(tickable: Tickable) {
            this.tickables.add(tickable)
        }

        remove(tickable: Tickable) {
            this.tickables.delete(tickable)
        }

        tick() {
            const currTick = system.currentTick
            const currDate = Date.now()
            const dt = (currTick - this.lastTick) * this.dilation
            const dms = (currDate - this.lastDate) * this.dilation

            for (const { tick, update, allowTicking } of this.tickables) {
                if (allowTicking) {
                    (tick ?? update)?.(dt, dms)
                }
            }

            this.lastTick = currTick
            this.lastDate = currDate
        }
    }

    export function getTickingGroup(group: string) {
        let ticking = tickingGroups.get(group)
        if (!ticking) {
            ticking = new Ticking(group, 1)
            tickingGroups.set(group, ticking)
        }

        return ticking
    }

    export function tick(group: string) {
        tickingGroups.get(group)?.tick()
    }

    export function clear(group: string) {
        tickingGroups.delete(group)
    }

    export function clearAll() {
        tickingGroups.clear()
    }

    export function addTickingObject(tickable: Tickable) {
        getTickingGroup(tickable.tickingGroup).add(tickable)
    }

    export function removeTickingObject(tickable: Tickable) {
        getTickingGroup(tickable.tickingGroup).remove(tickable)
    }

    /**
     * 自动将所有Tickable对象添加到ticking调度中
     */
    ObjectHelper.addListener('construct', (ctor, inst) => {
        const instance = <Tickable> inst
        if (tickableClasses.has(ctor)) {
            ticking.addTickingObject(instance)
        }
    })
}