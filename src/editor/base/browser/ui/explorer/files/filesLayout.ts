import { html } from "../../view"
import { replicable } from '../../../replicator'
import { createComputed } from "../../../../common/responsive"
import { FileView, FileDesc } from "./fileView"
import { BreadcrumbUtils } from "../breadcrumbs/breadcrumbsView"
import { ParentFolder } from "./parentFolder"

const [ files ] = replicable<FileDesc[]>('explorer.files', [])

export class FileDescUtils {
    static findDesc(name: string) {
        return files().find(file => file.name === name)
    }

    static isDir(name: string) {
        const result = this.findDesc(name)
        if (!result) {
            throw new Error(`File ${name} not found`)
        }

        return result.isDir
    }
}

export function FilesView() {
    return html`
        <div class="flex w-full flex-wrap overflow-y-auto">
            ${createComputed(() => {
                const fileViews = files().map(file => FileView(file))
                return BreadcrumbUtils.isRootPath()
                    ? fileViews
                    : [ ParentFolder(), ...fileViews ]
            })}
        </div>
    `
}