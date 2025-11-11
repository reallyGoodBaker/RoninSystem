import { system, world } from "@minecraft/server"
import { PROFIER_CONFIG } from "@ronin/config/profiler"
import { ConstructorOf } from "./types"

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

interface DebugTrack {
    name: string
    start: number
    end: number
    color: string
}

interface DebugTreeNode {
    accessor: string
    name: string
    color: string
}

class Profile {
    static profiles = new Map<string, Profile>()
    static getProfile(name: string) {
        return this.profiles.get(name) ?? this.profiles.set(name, new Profile(name)).get(name)
    }

    static removeProfile(name: string) {
        return this.profiles.delete(name)
    }

    constructor(public name: string) {}

    textContent = ''
    private _tracks: DebugTrack[] = []
    private _treeNodes: DebugTreeNode[] = []

    addTrack(name: string, start: number, end: number, color=MEDIUM_COLOR) {
        this._tracks.push({ name, start, end, color })
    }

    addTreeNode(accessor: string, color=MEDIUM_COLOR) {
        const name = accessor.split('.').at(-1)!
        this._treeNodes.push({ name, color, accessor })
    }

    

}

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
const customPrinters = new Map<(inst: any) => boolean, (inst: any) => string>()

export function registerCustomPrinter(matcher: (inst: any) => boolean, printer: (inst: any) => string) {
    customPrinters.set(matcher, printer)
}

export function registerCustomTypePrinter<T extends ConstructorOf<any>>(type: T, printer: (inst: InstanceType<T>) => string) {
    customPrinters.set(inst => inst instanceof (type as any), printer)
}

export function format(...message: any[]) {
    return message.map(m => {
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

        if (customPrinters.size) {
            for (const [ matcher, printer ] of customPrinters) {
                if (matcher(m)) {
                    return printer(m)
                }
            }
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
    }).join(' ')
}

export function print(level: 'debug' | 'info' | 'warn' | 'error', ...message: any[]) {
    out(level, format(...message))
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