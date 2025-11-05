import { ServerPort } from "../../config/replicables.config"
import { EncodeDecoder, jsonEncodeDecoder, replicableEncodeDecoder } from "../common/encodeDecoder"
import { createEffect, createSignal, Getter, Setter, tryCallEffectsOnCapturer } from "../common/responsive"
import { WebSocketServer, WebSocket } from 'ws'
import fs from 'fs'
import path from "path"
import http from 'http'

const template = fs.readFileSync(path.join(__dirname, '../../src/engine/tools/editor/template.html'))
    .toString()
    .replace('{% script %}', '<script type="module" src="./browser.js"></script>')

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        return res.end(template)
    }

    if (req.url === '/browser.js') {
        res.setHeader('Content-Type', 'application/javascript')
        return res.end(fs.readFileSync(path.join(__dirname, './browser.js')))
    }

    if (req.url === '/style.css') {
        return res.end(fs.readFileSync(path.join(__dirname, './style.css')))
    }

    return res.end()
})

const replicableSetters = new Map<string, (value: any) => void>()

class ReplicableChannel {
    static wss: WebSocketServer
    static messageCache: unknown[] = []
    static conns: WebSocket[] = []

    static {
        this.wss = new WebSocketServer({ server, path: '/ws' })
        this.wss.on('connection', (ws) => {
            this.conns.push(ws)
            ws.on('message', (recev: Buffer) => {
                const { uri, data } = replicableEncodeDecoder.decode(new Uint8Array(recev))
                replicableSetters.get(uri)?.(data)
            })
            ws.on('close', () => {
                this.conns = this.conns.filter(conn => conn !== ws)
            })
        })
        server.listen(ServerPort, () => {
            console.log(`Editor serving on: http://localhost:${ServerPort}`)
        })
    }

    static write(m: any) {
        const encoded = replicableEncodeDecoder.encode(m)
        this.conns.forEach(conn => {
            if (conn.readyState === WebSocket.OPEN) {
                conn.send(encoded)
            }
        })
    }
}

export function replicable<T>(
    uri: string,
    value: T,
    updater: (value: T, old: T) => T = v => v,
    encodeDecoder: EncodeDecoder<T> = jsonEncodeDecoder
): [ Getter<T>, Setter<T> ] {
    const [ getter, setter ] = createSignal(value, updater)

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

    function newSetter(v: T) {
        actionIsFromRemotes.push(false)
        return setter(v)
    }

    return [ getter, newSetter ]
}
