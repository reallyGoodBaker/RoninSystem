import { createComputed, createEffect } from "../../../../common/responsive"
import { html } from "../../view"
import { Breadcrumb } from "./breadcrumb"
import { replicable } from '../../../replicator'
import { FileDescUtils } from "../files/filesLayout"
import { ExplorerModeHelper } from "../mode/switcher"

const [ breadcrumbs, setBreadcrumbs ] = replicable('explorer.cwd', [ '', '', '' ])
const [ _, setContentPath ] = replicable('explorer.content', '')

export class BreadcrumbUtils {
    static _breadcrumbs = breadcrumbs()

    static currentCrumb(value?: string) {
        const mode = ExplorerModeHelper.getMode()

        if (value === undefined) {
            return this._breadcrumbs[mode]
        }

        this._breadcrumbs[mode] = value
    }

    static {
        createEffect(() => {
            BreadcrumbUtils._breadcrumbs = breadcrumbs()
        })
    }

    static push(name: string) {
        const filePath = this.currentCrumb()

        if (FileDescUtils.isDir(name)) {
            this.currentCrumb(filePath + '/' + name)
            setBreadcrumbs(this._breadcrumbs)
        } else {
            setContentPath(filePath + '/' + name)
        }
    }

    static pop() {
        const _breadcrumbs = this.currentCrumb()!.split('/')

        if (_breadcrumbs.length > 1) {
            _breadcrumbs.pop()
            this.currentCrumb(_breadcrumbs.join('/'))
            setBreadcrumbs(this._breadcrumbs)
        }
    }

    static navigateTo(index: number) {
        const _breadcrumbs = this.currentCrumb()!.split('/')
        this.currentCrumb(_breadcrumbs.slice(0, index + 1).join('/'))

        setBreadcrumbs(this._breadcrumbs)
    }

    static isRootPath() {
        return this.currentCrumb() === ''
    }
}

export function BreadcrumbsView() {
    return html`
        <div class="flex w-full p-1 overflow-x-auto">
            ${createComputed(() => 
                breadcrumbs()[ExplorerModeHelper.getMode()].split('/')
                    .map((breadcrumb, i) =>
                        Breadcrumb(breadcrumb, () => BreadcrumbUtils.navigateTo(i))
                    )
            )}
        </div>
    `
}