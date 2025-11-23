import { createEffect } from "../common/responsive"
import { replicable } from "./replicator"

const [ visible, setVisible ] = replicable('app.alert.visible', false)
const [ message, setMessage ] = replicable('app.alert.message', 'Message')
const [ title, setTitle ] = replicable('app.alert.title', 'TITLE')
const [ result, setResult ] = replicable('app.alert.result', false)
const [ buttons, setButtons ] = replicable('app.alert.buttons', [ '确定', '取消' ])

export class alert {
    static title(text?: string) {
        if (text === undefined) {
            return title()
        }

        setTitle(text)
    }

    static message(text?: string) {
        if (text === undefined) {
            return message()
        }

        setMessage(text)
    }

    static buttons(buttonLabels?: string[]) {
        if (buttonLabels === undefined) {
            return buttons()
        }

        setButtons(buttonLabels)
    }

    static visible(bool?: boolean) {
        if (bool === undefined) {
            return visible()
        }

        setVisible(bool)
    }

    private static _handlers = new Set<CallableFunction>()

    static {
        createEffect(() => {
            const _result = result()
            this._handlers.forEach((handler) => handler(_result))
        })
    }

    static open(title: string, message: string, ensure?: CallableFunction, dismiss?: CallableFunction) {
        setTitle(title)
        setMessage(message)
        setVisible(true)

        if (ensure) {
            this._handlers.add(() => {
                ensure()
                this._handlers.delete(ensure)
            })
        }

        if (dismiss) {
            this._handlers.add(() => {
                dismiss()
                this._handlers.delete(dismiss)
            })
        }
    }
}