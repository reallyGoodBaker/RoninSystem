import { createComputed, createEffect } from "../../../../common/responsive"
import { html } from "../../view"
import { Breadcrumb } from "./breadcrumb"
import { replicable } from '../../../replicator'
import { FileDescUtils } from "../files/filesLayout"

const [ breadcrumbs, setBreadcrumbs ] = replicable('explorer.cwd', 'assets')
const [ _, setContentPath ] = replicable('explorer.content', '')

export class BreadcrumbUtils {
    static _breadcrumbs = breadcrumbs()

    static {
        createEffect(() => {
            BreadcrumbUtils._breadcrumbs = breadcrumbs()
        })
    }

    static push(name: string) {
        if (FileDescUtils.isDir(name))
            setBreadcrumbs(this._breadcrumbs + '/' + name)
        else
            setContentPath(this._breadcrumbs + '/' + name)
    }

    static pop() {
        const _breadcrumbs = this._breadcrumbs.split('/')
        if (_breadcrumbs.length > 1) {
            _breadcrumbs.pop()
            setBreadcrumbs(_breadcrumbs.join('/'))
        }
    }

    static navigateTo(index: number) {
        const _breadcrumbs = this._breadcrumbs.split('/')
        setBreadcrumbs(
            _breadcrumbs
                .slice(0, index + 1)
                .join('/')
        )
    }

    static isRootPath() {
        return this._breadcrumbs === 'assets'
    }
}

export function BreadcrumbsView() {
    return html`
        <div class="flex w-full p-1 overflow-x-auto">
            ${createComputed(() => 
                breadcrumbs().split('/')
                    .map((breadcrumb, i) =>
                        Breadcrumb(breadcrumb, () => BreadcrumbUtils.navigateTo(i))
                    )
            )}
        </div>
    `
}