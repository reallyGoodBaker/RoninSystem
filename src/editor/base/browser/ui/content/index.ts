import { ContentUtils } from "./api"
import * as monaco from "monaco-editor"

const monacoEditor = monaco.editor.create(document.getElementById('code-editor') as HTMLElement, {
    language: 'ts',
    theme: 'vs-dark',
})

monacoEditor.setValue(`const monacoEditor = monaco.editor.create(document.getElementById('code-editor') as HTMLElement, {
    language: 'ts',
    theme: 'vs-dark',
})`)

ContentUtils.textContents.registerHandler('js', content => {
    monacoEditor.setValue(content)
    monacoEditor.focus()
})

ContentUtils.textContents.registerHandler('ts', content => {
    monacoEditor.setValue(content)
    monacoEditor.focus()
})