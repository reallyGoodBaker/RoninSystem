import { BreadcrumbUtils } from "../breadcrumbs/breadcrumbsView"
import { Icon } from "../icon"
import { html } from "../view"

export function ParentFolder() {
    return html`
        <div
            class="p-1 w-20 h-fit rounded text-gray-400 flex flex-col justify-start items-center hover:bg-gray-700 active:bg-gray-800"
            @click="${() => BreadcrumbUtils.pop()}"
            >
            <div class="w-16 h-16 rounded flex justify-center items-center">
                ${Icon('\ue5c4', [ 'scale-120' ])}
            </div>
            <div class="h-fit w-16 pt-1 text-xs select-none text-center text-wrap wrap-break-word">..</div>
        </div>
    `
}