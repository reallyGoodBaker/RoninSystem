import { system, world } from "@minecraft/server"
import { PROFIER_CONFIG } from "@ronin/config/profiler"

const {
    TOKENS,
    FAST,
    SLOW,
    FAST_COLOR,
    SLOW_COLOR,
    MEDIUM_COLOR,
    NUM_FIXED
} = PROFIER_CONFIG

export namespace profiler {

function _write(level: 'debug' | 'info' | 'warn' | 'error', message: string) {
    function _writeToDebuggers(message: string) {
        system.run(() => world.sendMessage(message))
    }

    switch (level) {
        case 'debug':
        case 'info':
            _writeToDebuggers(`§b[INFO]§r\n${message}`)
            break
        case 'warn':
            _writeToDebuggers(`§e[WARN]§r\n${message}`)
            break
        case 'error':
            _writeToDebuggers(`§c[ERR]§r\n${message}`)
            break
    }
}

function out(level: 'debug' | 'info' | 'warn' | 'error', message: string) {
    _write(level, message)
}

const rawTypes = [ 'string', 'number', 'boolean', 'bigint', 'undefined', 'symbol' ]
const objField = (type: string, k: string, v: any) => `  ${TOKENS.ID}${k}§r: ${type}${type === TOKENS.STR ? `'${v}'` : v}§r`
const fnField = (name?: string, isGetter=false) => `  ${isGetter ? TOKENS.GET : TOKENS.FN}${isGetter ? 'get ' : ''}${name ?? '[anonymous]'}§r()`
const rawTypeMapping: any = {
    string: TOKENS.STR,
    number: TOKENS.NUM,
    boolean: TOKENS.BOOL,
    bigint: TOKENS.NUM,
    undefined: '§7',
    symbol: TOKENS.STR
}
const ignoredRawTypes = [
    Object.prototype,
    Array.prototype,
    Function.prototype,
    String.prototype,
    Number.prototype,
    Boolean.prototype,
    BigInt.prototype,
    Symbol.prototype,
    Error.prototype,
]
export function print(level: 'debug' | 'info' | 'warn' | 'error', ...message: any[]) {
    const msg = message.map(m => {
        const typeOf = typeof m

        if (rawTypes.includes(typeOf)) {
            return String(m)
        }

        if (typeOf === 'function') {
            return m.name || 'anonymous()'
        }

        if ('nameTag' in m) {
            return m.nameTag
        }

        if ('typeId' in m) {
            return m.typeId
        }

        let current = m
        const objectInfo = []
        do {
            Object.entries(Object.getOwnPropertyDescriptors(current)).map(([ k, v_ ]) => {
                if (k === 'constructor') {
                    return
                }

                if (v_.get) {
                    return objectInfo.push(fnField(k, true))
                }
                
                const v = v_.value
                const rawType = typeof v

                if (rawTypes.includes(rawType)) {
                    return objectInfo.push(objField(rawTypeMapping[rawType] as any, k, v))
                }

                if (rawType === 'function') {
                    return objectInfo.push(fnField(v.name))
                }

                if ('nameTag' in v) {
                    return objectInfo.push(objField(TOKENS.ENT, k, `${v.typeId.replace('minecraft:', '')}{name=${v.nameTag}}`))
                }

                if ('typeId' in v) {
                    return objectInfo.push(objField(TOKENS.ENT, k, v.typeId.replace('minecraft:', '')))
                }

                return objectInfo.push(objField(TOKENS.CLASS, k, v?.constructor?.name || '{}'))
            })

        } while (!ignoredRawTypes.includes(current = Reflect.getPrototypeOf(current) as any))

        objectInfo.unshift(`${m?.constructor?.name || ''} {}:`)
        objectInfo.push('')
        return objectInfo.join('\n')
    })

    out(level, msg.join(' '))
}

export function debug(...message: unknown[]) {
    print('debug', ...message)
}

export function info(...message: unknown[]) {
    print('info', ...message)
}

export function warn(...message: unknown[]) {
    print('warn', ...message)
}

export function error(...message: unknown[]) {
    print('error', ...message)
}

export function prof(name: string, fn: CallableFunction, ...args: unknown[]) {
    const start = Date.now()
    const result = fn(...args)
    const end = Date.now()
    const duration = end - start

    info(`Task ${TOKENS.FN}${name}§r executed in ${
        duration < FAST ? FAST_COLOR
            : duration < SLOW ? MEDIUM_COLOR
            : SLOW_COLOR
    }${duration.toFixed(NUM_FIXED)}ms`)
    return result
}

}