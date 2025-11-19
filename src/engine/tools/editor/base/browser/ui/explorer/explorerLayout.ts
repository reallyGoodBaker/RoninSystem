import { BreadcrumbsView } from "../breadcrumbs/breadcrumbsView"
import { html} from "../view"

export function ExplorerLayout() {
    return html`
        ${BreadcrumbsView()}
    `
}