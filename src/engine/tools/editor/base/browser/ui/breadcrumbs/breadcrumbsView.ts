import { createEffect, createSignal } from "../../../common/responsive"
import { Icon } from "../icon"
import { html } from "../view"
import { Breadcrumb } from "./breadcrumb"
import { replicable } from '../../replicator'

const [ breadcrumbs, setBreadcrumbs ] = replicable('editor.cwd', 'assets')

export class BreadcrumbUtils {
    static push(name: string) {
        setBreadcrumbs(breadcrumbs() + '/' + name)
    }

    static pop() {
        const _breadcrumbs = breadcrumbs().split('/')
        _breadcrumbs.pop()
        setBreadcrumbs(_breadcrumbs.join('/'))
    }

    static navigateTo(index: number) {
        const _breadcrumbs = breadcrumbs().split('/')
        setBreadcrumbs(
            _breadcrumbs
                .slice(0, index + 1)
                .join('/')
        )
    }
}

export function BreadcrumbsView() {
    const [ breadcrumbViews, setBreadcrumbViews ] = createSignal<DocumentFragment[]>([])

    createEffect(() => {
        const _breadcrumbs = breadcrumbs().split('/')
        setBreadcrumbViews(
            _breadcrumbs.map((breadcrumb, i) => {
                const el = Breadcrumb(breadcrumb, () => {
                    if (i !== _breadcrumbs.length - 1) {
                        setBreadcrumbs(_breadcrumbs.slice(0, i + 1).join('/'))   
                    }
                })

                if (i < _breadcrumbs.length - 1) {
                    el.appendChild(Icon('\ue5cc', [ 'text-gray-500' ]))
                }

                return el
            })
        )
    })

    return html`
        <div class="flex w-full p-1 overflow-x-auto">
            ${breadcrumbViews}
        </div>
    `
}