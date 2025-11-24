import { createComputed, createEffect, createSignal } from "@editor/base/common/responsive"
import { html } from "../view"
import { contentType, ContentUtils } from "./api"

export function ContentView() {
    const [ showCodeEditor, setShowCodeEditor] = createSignal(false)

    createEffect(() => {
        setShowCodeEditor(ContentUtils.isType(contentType(), 'js', 'ts'))
    })

    return html`
        <div id="code-editor" class="h-full ${createComputed(() => showCodeEditor() ? 'block' : 'hidden')}"></div>
    `
}