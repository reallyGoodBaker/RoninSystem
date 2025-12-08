import { createComputed, Getter, Setter } from "@editor/base/common/responsive"
import { html } from "../../view"
import { Icon } from "../../icon"
import { ExplorerMode } from "@editor/config/explorerMode"

export interface IBookmark {
    icon: string
    label: string
    id: ExplorerMode
}

export function Bookmark(conf: IBookmark, selected: Getter<ExplorerMode>, select: Setter<ExplorerMode>) {
    return html`
        <div class="h-full box-border pt-1" title="${conf.label}" @click=${() => select(conf.id)}>
            <div class="
                relative min-w-10 p-1 h-full flex justify-center items-center
                rounded-tl-md rounded-tr-md border border-b-0
                after:content-[''] after:absolute after:-bottom-1 after:h-1 after:w-full after:bg-transparent
                before:content-[''] before:absolute before:w-full before:h-full before:rounded-tl-md before:rounded-tr-md
                ${createComputed(() => selected() === conf.id ? 'border-gray-500 bg-zinc-900 z-10 after:bg-zinc-900' : 'border-transparent bg-transparent hover:before:bg-white hover:before:opacity-10 active:before:opacity-5')}"
            >
                ${Icon(conf.icon, [ 'scale-80' ])}
            </div>
        </div>
    `
}