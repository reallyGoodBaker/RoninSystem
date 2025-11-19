import { createEffect, createSignal } from "../../../common/responsive"
import { html } from "../view"
import { Breadcrumb } from "./breadcrumb"

export function BreadcrumbsView() {
    const [ breadcrumbs, setBreadcrumbs ] = createSignal([ 'assets', 'resources', 'textures' ])
    const [ breadcrumbViews, setBreadcrumbViews ] = createSignal<DocumentFragment[]>([])

    createEffect(() => {
        setBreadcrumbViews(
            breadcrumbs().map(breadcrumb => Breadcrumb(breadcrumb))
        )
    })

    return html`
        <div class="flex w-full p-1 gap-1">
            ${breadcrumbViews}
        </div>
    `
}