import { createComputed } from "../../../common/responsive"
import { replicable } from "../../replicator"
import { html } from "../view"

const [ visible, setVisible ] = replicable('app.alert.visible', false)
const [ message, setMessage ] = replicable('app.alert.message', 'Message')
const [ title, setTitle ] = replicable('app.alert.title', 'TITLE')
const [ result, setResult ] = replicable('app.alert.result', false)
const [ buttons, setButtons ] = replicable('app.alert.buttons', [ '确定', '取消' ])


export class Alert {
    private static readonly _view = createComputed(() => {
        const [ ensure, dismiss ] = buttons()
        return html`
            <div @click=${(e: MouseEvent) => e.stopPropagation()} class="text-white pop-layer fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50" style="display: ${createComputed(() => visible() ? 'flex' : 'none')}">
                <div class="outline-1 outline-gray-500 flex flex-col absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-700 rounded min-h-1/2 min-w-1/2 overflow-clip shadow">
                    <div class="flex items-center text-xl h-12 w-full align-middle px-3 font-medium">${title}</div>
                    <p class="flex-1 w-full bg-zinc-900 font-light px-3 py-4">${message}</p>
                    <div class="flex flex-row-reverse gap-2 p-2 bg-zinc-800">
                        <button class="min-w-16 bg-blue-500 rounded px-2 py-1 hover:bg-blue-400 active:bg-blue-500" @click=${() => {
                            setResult(true)
                            setVisible(false)
                        }}
                        >${ensure}</button>
                        <button class="min-w-16 bg-zinc-600 rounded px-2 py-1 hover:bg-zinc-500 active:bg-zinc-600" @click=${() => {
                            setResult(false)
                            setVisible(false)
                        }}
                        >${dismiss}</button>
                    </div>
                </div>
            </div>
        `
    })

    static view() {
        return this._view
    }

    static visible(setVal?: boolean) {
        if (setVal === undefined) {
            return visible()
        }

        setVisible(setVal)
    }

    static message(setVal?: string) {
        if (setVal === undefined) {
            return message()
        }

        setMessage(setVal)
    }

    static title(setVal?: string) {
        if (setVal === undefined) {
            return title()
        }

        setTitle(setVal)
    }

    static buttons(setVal?: string[]) {
        if (setVal === undefined) {
            return buttons()
        }

        setButtons(setVal)
    }

    static result(setVal?: boolean) {
        if (setVal === undefined) {
            return result()
        }

        setResult(setVal)
    }
}