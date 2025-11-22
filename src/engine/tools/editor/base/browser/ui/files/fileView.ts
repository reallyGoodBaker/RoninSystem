import { BreadcrumbUtils } from "../breadcrumbs/breadcrumbsView"
import { Icon } from "../icon"
import { html } from "../view"

export interface FileDesc {
    name: string,
    isDir: boolean
}

export enum FileTypeIcons {
    JSON = '\uf3bb',
    CODE = '\ue86f',
    IMAGE = '\ue3f4',
    OTHER = '\uea7d',
}

const codeFiles = [
    'js',
    'ts',
]

const imageFiles = [
    'png',
    'jpg',
    'tga',
]

function findIcon(fileName: string) {
    const suffix = fileName.split('.').pop()
    if (suffix === 'json') {
        return FileTypeIcons.JSON
    }

    if (codeFiles.includes(suffix as string)) {
        return FileTypeIcons.CODE
    }

    if (imageFiles.includes(suffix as string)) {
        return FileTypeIcons.IMAGE
    }

    return FileTypeIcons.OTHER
}

export function FileView({ name, isDir }: FileDesc) {
    return html`
        <div
            class="p-1 w-20 h-fit rounded text-gray-400 flex flex-col justify-start items-center hover:bg-gray-700 active:bg-gray-800"
            @click="${() => BreadcrumbUtils.push(name)}"
            >
            <div class="w-16 h-16 rounded outline-1 outline-gray-500 flex justify-center items-center">
                ${Icon(isDir ? '\ue2c7' : findIcon(name), [ 'scale-120' ])}
            </div>
            <div class="h-fit w-16 pt-1 text-xs select-none text-center text-wrap wrap-break-word">${name}</div>
        </div>
    `
}