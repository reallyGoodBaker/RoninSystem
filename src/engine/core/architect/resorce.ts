import { Constructor } from "../types"

export interface Resource {
    enter?(): void
    exit?(): void
}

export type Result<V, E> = [ V, E ]

export class Resources {
    static with<T>(res: Resource, fn: () => T) {
        let ret = null

        res?.enter?.()
        try {
            ret = [ fn(), null ]
        } catch (error) {
            ret = [ null, error ]
        }
        res?.exit?.()

        return ret as Result<T, Error>
    }

    static async withAsync<T>(res: Resource, afn: () => Promise<T>) {
        let ret = null

        res?.enter?.()
        try {
            ret = [ await afn(), null ]
        } catch (error) {
            ret = [ null, error ]
        }
        res?.exit?.()

        return ret as Result<T, Error>
    }

    private static readonly resouceMapping = new Map<Constructor<Resource>, Resource>()

    static load<T extends readonly Constructor<Resource>[]>(...res: T): { -readonly [K in keyof T]: InstanceType<T[K]> } {
        return res.map(r => {
            const res = Reflect.construct(r, [])
            this.resouceMapping.set(r, res)
            res?.enter?.()
            return res
        }) as any
    }

    static getResouce(ctor: Constructor<Resource>) {
        return this.resouceMapping.get(ctor)
    }

    static unload(...res: Constructor<Resource>[]) {
        for (const r of res) {
            const res = this.resouceMapping.get(r)
            res?.exit?.()
            this.resouceMapping.delete(r)
        }
    }
}