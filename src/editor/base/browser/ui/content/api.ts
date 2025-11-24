import { createSignal } from "solid-js/types/server/reactive.js"
import { replicable } from "../../replicator"
import { createEffect } from "@editor/base/common/responsive"
import { EncodeDecoder } from "@editor/base/common/encodeDecoder"

export interface IContent<T> {
    type: string
    content: T
}

export type ContentType = 'text' | 'buffer'

const rawBufferEncodeDecoder: EncodeDecoder<ArrayBuffer> = {
    encode: (content: ArrayBuffer) => content,
    decode: (content: ArrayBuffer) => content
}

const [ contentType, setType ] = replicable<ContentType>('content.type', 'text')
const [ textContent, setText ] = replicable('content.text', '')
const [ bufferContent, setBuffer ] = replicable('content.buffer', new ArrayBuffer(0), rawBufferEncodeDecoder)

export {
    contentType,
    textContent,
    bufferContent
}

export class ContentHandlers {
    private _handlers = new Map<string, (content: any, view: HTMLElement) => void>()

    registerHandler(type: string, handler: (content: any, view: HTMLElement) => void): void {
        this._handlers.set(type, handler)
    }

    unregisterHandler(type: string): void {
        this._handlers.delete(type)
    }

    getHandler(type: string) {
        return this._handlers.get(type)
    }
}

const [ fileName, setFileName ] = createSignal('')

export class ContentUtils {

    static isTextContent(): boolean {
        return contentType() === 'text'
    }

    static setContent(type: ContentType, fileName: string, content: unknown): void {
        setType(type)
        setFileName(fileName)
        if (type === 'text') {
            setText(content as string)
        }

        if (type === 'buffer') {
            setBuffer(content as ArrayBuffer)
        }
    }

    static getContent(): string | ArrayBuffer | null {
        if (contentType() === 'text') {
            return textContent()
        }

        if (contentType() === 'buffer') {
            return bufferContent()
        }

        return null
    }

    static getTextContent(): string | null{
        if (contentType() === 'text') {
            return textContent()
        }

        return null
    }

    static getBufferContent(): ArrayBuffer | null {
        if (contentType() === 'buffer') {
            return bufferContent()
        }

        return null
    }

    static readonly textContents = new ContentHandlers()
    static readonly bufferContents = new ContentHandlers()

    static _contentView: HTMLElement | null = null
    static getContentView(): HTMLElement {
        if (!this._contentView) {
            this._contentView = document.getElementById('content')!
        }

        return this._contentView
    }

    static handleTextContent(content: IContent<unknown>): void {
        const suffix = fileName().split('.').pop()!
        this.textContents.getHandler(suffix)?.(content, this.getContentView())
    }

    static handleBufferContent(content: IContent<unknown>): void {
        const suffix = fileName().split('.').pop()!
        this.bufferContents.getHandler(suffix)?.(content, this.getContentView())
    }

    static isType(a: string, ...b: string[]): boolean {
        return b.includes(a)
    }

    static {
        let _contentType = 'text'
        createEffect(() => _contentType = contentType())
        createEffect(() => this.handleTextContent({ type: _contentType, content: textContent() }))
        createEffect(() => this.handleBufferContent({ type: _contentType, content: bufferContent() }))
    }
}