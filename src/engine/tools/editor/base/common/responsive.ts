export interface Getter<T> {
    (): T
}

export interface Setter<T> {
    (value: T): void
    (updater: (oldValue: T) => T): void
}

const isCapturer: unique symbol = Symbol('isCapturer')

interface Effect {
    raw: CallableFunction
    fn: CallableFunction
}

export interface Capturer<T> extends Getter<T>{
    [isCapturer]: true
    effects: Effect[]
}

let currentCapturer = new Set<Capturer<unknown>>()
let effectScopeDepth = 0

class EffectTicker {
    private _queued = false
    private _queue = new Set<CallableFunction>()
    private _raws = new Set<CallableFunction>()

    tick(eff: Effect) {
        if (!this._queued) {
            this._queued = true
            queueMicrotask(() => {
                this._queued = false
                this._queue.forEach(fn => fn())
                this._queue.clear()
                this._raws.clear()
            })
        }

        const { raw, fn } = eff
        if (!this._raws.has(raw)) {
            this._raws.add(raw)
            this._queue.add(fn)
        }
    }
}

const effectTicker = new EffectTicker()

/**
 * 响应式 getter 和 setter
 * @param value 
 * @param updater 
 * @returns 
 */
export function createSignal<T>(
    value: T,
): [ Getter<T>, Setter<T> ] {
    const scopeCapturer: Capturer<T> = () => {
        if (effectScopeDepth <= 0) {
            currentCapturer.add(scopeCapturer)
        }

        return value
    }

    scopeCapturer[isCapturer] = true
    scopeCapturer.effects = []

    const setter = (newValue: T | CallableFunction) => {
        const old = value
        if ((newValue as CallableFunction).call) {
            value = (newValue as any).call(undefined, old)
        }
        value = newValue as T
        scopeCapturer.effects.forEach(eff => effectTicker.tick(eff))
        return value
    }

    return [scopeCapturer, setter] as const
}


export function tryCallEffectsOnCapturer(capturer: Capturer<unknown>) {
    capturer.effects.forEach(effect => effect.fn())
}

export function isGetter(getter: Getter<any>) {
    return (getter as any)[isCapturer] === true
}

/**
 * @param fn 当 `fn` 中的响应式变量发生变化时，会调用 `fn`
 */
export function createEffect(fn: () => void) {
    // 初始化执行一次，是因为需要进行依赖捕获
    fn()

    if (currentCapturer) {
        currentCapturer.forEach(({ effects }) => {
            const _fn = () => {
                effectScopeDepth++
                fn()
                effectScopeDepth--
            }

            effects.push({ raw: fn, fn: _fn })
        })
        currentCapturer.clear()
    }
}

export function createComputed<T>(init: () => T): Getter<T> {
    const [ getter, setter ] = createSignal<T>(null as any)
    createEffect(() => setter(init()))
    return getter
}

export interface KVStore<T> {
    get(key: string, defaultValue?: T): T
    set(key: string, value: T): void
}

export function createStore<T extends object>(
    value: T,
    updater: (value: T, old: T) => T = v => v,
) {
    const [ getter, setter ] = createSignal<T>(value)

}