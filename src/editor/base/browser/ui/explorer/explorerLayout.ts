import { BreadcrumbsView } from "./breadcrumbs/breadcrumbsView"
import { FilesView } from "./files/filesLayout"
import { html} from "../view"

export function ExplorerLayout() {
    return html`
        <div class="flex flex-col h-full w-full">
            ${BreadcrumbsView()}
            ${FilesView()}
        </div>
    `
}