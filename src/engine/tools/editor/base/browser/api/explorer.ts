import { BreadcrumbUtils } from "../ui/explorer/breadcrumbs/breadcrumbsView"
import { FileDescUtils } from "../ui/explorer/files/filesLayout"

export namespace explorer {
    export function open(name: string) {
        if (FileDescUtils.isDir(name)) {
            BreadcrumbUtils.push(name)
        }
    }

    export function back() {
        BreadcrumbUtils.pop()
    }

    export function isAssetsRoot() {
        return BreadcrumbUtils.isRootPath()
    }

    export function currentPath() {
        return BreadcrumbUtils._breadcrumbs
    }

    export function isDir(name: string) {
        return FileDescUtils.isDir(name)
    }

}