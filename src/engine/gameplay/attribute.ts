import { EventComponent, EventDelegate } from "@ronin/core/architect/event"

export class Attribute<T=any> {
    private _value: T
    private _oldValue: T

    constructor(
        public readonly defaultValue: T
    ) {
        this._value = defaultValue
        this._oldValue = defaultValue
    }

    readonly OnChange = new EventDelegate<[ T, T ]>()
    readonly OnCalculated = new EventDelegate<[ T, T ]>()

    get oldValue() {
        return this._oldValue
    }

    get value() {
        return this._value
    }

    set value(newValue: T) {
        if (newValue !== this._value) {
            this.OnChange.call(this._value, this._oldValue)
            this._oldValue = this._value
            this._value = newValue
            if (this.modifier) {
                const newVal = this.modifier(this._value, this._oldValue)
                if (newVal !== this._value) {
                    this._value = newVal
                    this.OnCalculated.call(this._value, this._oldValue)
                }
            }
        }
    }

    modifier?: (value: T, oldValue: T) => T

    readonly Modifiers = {
        Add(constVal: number) {
            return (value: number, oldValue: number) => value + constVal
        },
        Multiply(constVal: number) {
            return (value: number, oldValue: number) => value * constVal
        },
        Replace(constVal: number) {
            return (value: number, oldValue: number) => constVal
        },
        Subtract(constVal: number) {
            return (value: number, oldValue: number) => value - constVal
        },
        Divide(constVal: number) {
            return (value: number, oldValue: number) => value / constVal
        },
        Mod(constVal: number) {
            return (value: number, oldValue: number) => value % constVal
        },
        Clamp(min: number, max: number) {
            return (value: number, oldValue: number) => Math.min(Math.max(value, min), max)
        },
    }
}

export interface AttributeEventMapping {
    onChange: [ string, any, any ]
    onCalculated: [ string, any, any ]
}

export class AttributesComponent<M extends Record<string, any> = Record<string, any>> extends EventComponent<AttributeEventMapping> {
    readonly attributes = new Map<keyof M, Attribute>()

    constructor(
        readonly init: M = {} as any
    ) {
        super()
        for (const [ key, value ] of Object.entries(init)) {
            const attr = new Attribute(value)
            this.attributes.set(key, attr)
            attr.OnChange.bind((v, old) => this.trigger('onChange', key, v, old))
            attr.OnCalculated.bind((v, old) => this.trigger('onCalculated', key, v, old))
        }
    }

    get<K extends keyof M>(key: K) {
        return this.attributes.get(key)?.value as Attribute<M[K]>
    }

    set<K extends keyof M>(key: K, value: M[K]) {
        const attr = this.attributes.get(key)
        if (attr) {
            attr.value = value
        }
    }
}