import { ServerPort } from "../../config/replicables.config"
import { EncodeDecoder, jsonEncodeDecoder, replicableEncodeDecoder } from "../common/encodeDecoder"
import { createEffect, createSignal, Getter, Setter } from "../common/responsive"
import { WebSocketServer, WebSocket } from 'ws'
import fs from 'fs'
import path from "path"
import http from 'http'

class BaseServer {
    readonly _template = fs.readFileSync(path.join(__dirname, '../../src/editor/template.html'))
        .toString()
        .replace('{% script %}', '<script type="module" src="./browser.js"></script>')

    readonly _server = http.createServer((req, res) => {
        if (!req.url) {
            return res.end()
        }

        if (req.url === '/') {
            return res.end(this._template)
        }

        if (req.url === '/browser.js') {
            res.setHeader('Content-Type', 'application/javascript')
            return res.end(fs.readFileSync(path.join(__dirname, req.url)))
        }

        if (req.url === '/favicon.ico') {
            return res.end(fs.readFileSync(path.join(__dirname, '../../src/editor/favicon.png')))
        }

        try {
            return res.end(fs.readFileSync(path.join(__dirname, req.url)))
        } catch (error) {
            this._errHandlers.forEach(errHandler => errHandler(error))
        }
    })

    readonly _replicableSetters = new Map<string, (value: any) => void>()
    readonly _errHandlers: CallableFunction[] = []

    addErrorHandler(handler: (err: Error) => void) {
        this._errHandlers.push(handler)
    }

    static readonly instance: BaseServer = new BaseServer()
}

export function getServer() {
    return BaseServer.instance
}

class ReplicableChannel {
    wss: WebSocketServer
    messageCache: unknown[] = []
    conns: WebSocket[] = []

    constructor() {
        const baseServer = BaseServer.instance
        this.wss = new WebSocketServer({ server: baseServer._server, path: '/ws' })
        this.wss.on('connection', (ws) => {
            this.conns.push(ws)
            ws.on('message', (recev: Buffer) => {
                const { uri, data } = replicableEncodeDecoder.decode(new Uint8Array(recev).buffer)
                console.log(uri)
                baseServer._replicableSetters.get(uri)?.(data)
            })
            ws.on('close', () => {
                this.conns = this.conns.filter(conn => conn !== ws)
            })
        })
        baseServer._server.listen(ServerPort, () => {
            console.log(`Editor serving on: http://localhost:${ServerPort}`)
        })
    }

    write(m: any) {
        const encoded = replicableEncodeDecoder.encode(m)
        this.conns.forEach(conn => {
            if (conn.readyState === WebSocket.OPEN) {
                conn.send(encoded)
            }
        })
    }

    static readonly instance: ReplicableChannel = new ReplicableChannel()
}

export function getChannel() {
    return ReplicableChannel.instance
}

export function replicable<T>(
    uri: string,
    value: T,
    encodeDecoder: EncodeDecoder<T> = jsonEncodeDecoder
): [ Getter<T>, Setter<T> ] {
    const [ getter, setter ] = createSignal(value)

    let actionIsFromRemotes: boolean[] = []
    
    // 由 websocket 接受数据
    getServer()._replicableSetters.set(uri, v => {
        actionIsFromRemotes.push(true)
        setter(encodeDecoder.decode(v as any))
    })

    createEffect(() => {
        if (actionIsFromRemotes.find(v => v)) {
            return actionIsFromRemotes.pop()
        }

        actionIsFromRemotes.pop()
        getChannel().write({
            uri,
            data: encodeDecoder.encode(getter())
        })
    })

    function newSetter(v: T | ((v: T) => T)) {
        actionIsFromRemotes.push(false)
        return setter(v as any)
    }

    return [ getter, newSetter ]
}
