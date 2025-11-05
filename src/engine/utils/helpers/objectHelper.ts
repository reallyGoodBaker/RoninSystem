import { EventInstigator } from "@ronin/core/architect/event"
import { Constructor } from "@ronin/core/types"

type ObjectHelperEvents = {
    construct: [ Function, unknown, unknown[] ]
}

class ObjectHelperClass extends EventInstigator<ObjectHelperEvents> {
    /**
     * 深度优先，忽略根节点，
     * 无法确定是否后序，v8引擎通常是后序
     */
    traverse(object: object, callback: (obj: any, key: string, parent: Record<string, unknown>, path: string[]) => void, path: string[] = []) {
        Object.entries(object).forEach(([ k, v ]) => {
            const _path = [ ...path, k ]

            if (this.isObject(v)) {
                ObjectHelper.traverse(v, callback, _path)
            }

            callback(v, k, object as any, _path)
        })
    }

    isObject(obj: any) {
        return obj !== null && typeof obj === 'object'
    }

    newObject<T>(ctor: Constructor<T>, args: any[] = []) {
        const object = Reflect.construct(ctor, args)
        this.trigger('construct', ctor, object, args)
        return object
    }
}

export const ObjectHelper = new ObjectHelperClass()