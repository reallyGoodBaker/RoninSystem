import { BreadcrumbsView } from "./breadcrumbs/breadcrumbsView"
import { FilesView } from "./files/filesLayout"
import { html } from "../view"
import { Switcher } from "./mode/switcher"

export function ExplorerLayout() {
    return html`
        <div class="flex flex-col h-full w-full">
            ${Switcher()}
            ${BreadcrumbsView()}
            ${FilesView()}
        </div>
    `
}