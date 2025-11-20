import { html } from "../view"
import { replicable } from '../../replicator'
import { createEffect, createSignal } from "../../../common/responsive"
import { FileView, FileDesc } from "./fileView"

export function FilesView() {
    const [ files ] = replicable<FileDesc[]>('editor.files', [])
    const [ fileViews, setFileViews ] = createSignal<Node[]>([])

    createEffect(() =>
        setFileViews(
            files().map(file => FileView(file))
        )
    )

    return html`
        <div class="flex flex-wrap overflow-y-auto">
            ${fileViews}
        </div>
    `
}