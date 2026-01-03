import { Styles } from "@ronin/utils/styles"

export class MessageBlock {
    constructor(
        readonly id: string,
        text: string = '',
        styles: Styles[] = []
    ) {
        this.text = text
        this.styles = styles
    }

    #text = ''
    get text() {
        return this.#text
    }
    set text(text: string) {
        this.#text = text
        this.changed = true
    }

    #styles: Styles[] = []
    get styles() {
        return this.#styles
    }
    set styles(styles: Styles[]) {
        this.#styles = styles
        this.changed = true
    }

    readonly content: MessageBlock[] = []

    private changed = true
    private cache: string = ''

    #selfMessageStr() {
        if (!this.changed) {
            return this.cache
        }

        this.changed = false
        this.cache = this.styles.join('') + this.text + Styles.Reset
        return this.cache
    }

    toString(): string {
        return this.#selfMessageStr() +
            this.content.map(content => content.toString()).join('')
    }

    addContent(content: MessageBlock) {
        this.content.push(content)
        return this
    }

    removeContent(message: MessageBlock): void
    removeContent(id: string): void
    removeContent(index: number): void
    removeContent(arg: any) {
        if (typeof arg === 'number') {
            this.content.splice(arg, 1)
        } else if (typeof arg === 'string') {
            this.removeContentById(arg)
        } else {
            this.removeContentById(arg.id)
        }
    }

    removeContentById(id: string) {
        const index = this.content.findIndex(content => {
            if (typeof content === 'string') {
                return false
            } else {
                return content.id === id
            }
        })
        if (index !== -1) {
            this.removeContent(index)
        }
    }

    findById(id: string) {
        return this.content.find(content => {
            if (typeof content === 'string') {
                return false
            } else {
                return content.id === id
            }
        })
    }

    createInline(id: string, text: string, styles: Styles[] = []): MessageBlock {
        const existed = this.findById(id)
        if (existed) {
            return existed
        }

        const msg = new MessageBlock(id, text.trim(), styles)
        this.addContent(msg)
        return msg
    }

    createBlock(id: string, text: string, styles: Styles[] = []): MessageBlock {
        const existed = this.findById(id)
        if (existed) {
            return existed
        }

        const msg = new MessageBlock(id, '\n' + text.trim(), styles)
        this.addContent(msg)
        return msg
    }
}