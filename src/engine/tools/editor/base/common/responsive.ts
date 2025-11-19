export interface Getter<T> {
    (): T
}

export interface Setter<T> {
    (value: T): T
}

const isCapturer: unique symbol = Symbol('isCapturer')

export interface Capturer<T> extends Getter<T>{
    [isCapturer]: true
    effects: (() => void)[]
}

let currentCapturer = new Set<Capturer<unknown>>()
let effectScopeDepth = 0

/**
 * 响应式 getter 和 setter
 * @param value 
 * @param updater 
 * @returns 
 */
export function createSignal<T>(
    value: T,
    updater: (value: T, old: T) => T = v => v,
): [ Getter<T>, Setter<T> ] {
    const scopeCapturer: Capturer<T> = () => {
        if (effectScopeDepth <= 0) {
            currentCapturer.add(scopeCapturer)
        }

        return value
    }

    scopeCapturer[isCapturer] = true
    scopeCapturer.effects = []

    const setter = (newValue: T) => {
        const old = value
        value = updater(newValue, old)
        scopeCapturer.effects.forEach(fn => fn())
        return value
    }

    return [scopeCapturer, setter] as const
}


export function tryCallEffectsOnCapturer(capturer: Capturer<unknown>) {
    capturer.effects.forEach(fn => fn())
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
            effects.push(() => {
                effectScopeDepth++
                fn()
                effectScopeDepth--
            })
        })
        currentCapturer.clear()
    }
}