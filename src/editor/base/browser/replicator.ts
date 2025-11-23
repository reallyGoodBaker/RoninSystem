import { ServerPort } from "../../config/replicables.config"
import { EncodeDecoder, jsonEncodeDecoder, replicableEncodeDecoder } from "../common/encodeDecoder"
import { createEffect, createSignal, Getter, Setter } from "../common/responsive"

const replicableSetters = new Map<string, (value: unknown) => void>()

class ReplicableChannel {
    static ws: WebSocket | null = null
    static messageCache: ArrayBuffer[] = []

    static getWebSocket() {
        if (!this.ws) {
            const clear = () => this.ws = null
            const ws = (this.ws = new WebSocket(`ws://localhost:${ServerPort}/ws`))
            ws.binaryType = 'arraybuffer'
            ws.addEventListener('message', ev => {
                const recev = ev.data
                const { uri, data } = replicableEncodeDecoder.decode(recev)
                const setter = replicableSetters.get(uri)

                if (setter) {
                    setter(data)
                }
            })
            ws.addEventListener('error', clear)
            ws.addEventListener('close', clear)
            ws.addEventListener('open', () => this.init())
        }

        return this.ws
    }

    static init() {
        this.messageCache.forEach((m: ArrayBuffer) => this.ws?.send(m))
        this.messageCache.length = 0
    }

    static write(m: ArrayBuffer) {
        const ws = this.getWebSocket()
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(m)
            return true
        } else {
            this.messageCache.push(m)
            return false
        }
    }
}

export function replicable<T>(
    uri: string,
    value: T,
    encodeDecoder: EncodeDecoder<T> = jsonEncodeDecoder
): [ Getter<T>, Setter<T> ] {
    const [ getter, setter ] = createSignal(value)

    let actionIsFromRemotes: boolean[] = []
    
    // 由 websocket 接受数据
    replicableSetters.set(uri, v => {
        actionIsFromRemotes.push(true)
        setter(encodeDecoder.decode(v as any))
    })

    createEffect(() => {
        if (actionIsFromRemotes.find(v => v)) {
            return actionIsFromRemotes.pop()
        }

        actionIsFromRemotes.pop()
        ReplicableChannel.write(replicableEncodeDecoder.encode({
            uri,
            data: encodeDecoder.encode(getter())
        }))
    })

    function newSetter(v: T | ((v: T) => T)) {
        actionIsFromRemotes.push(false)
        return setter(v as any)
    }

    return [ getter, newSetter ]
}
