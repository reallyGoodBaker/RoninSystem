import { BreadcrumbUtils } from "../breadcrumbs/breadcrumbsView"
import { Icon } from "../../icon"
import { html } from "../../view"

export interface FileDesc {
    name: string,
    isDir: boolean
}

const jsonFiles = [
    'json',
    'jsonc',
]

const codeFiles = [
    'js',
    'ts',
]

const imageFiles = [
    'png',
    'jpg',
    'tga',
]

const soundFiles = [
    'wav',
    'ogg',
]

export enum FileType {
    UNKOWN = -1,
    DIR = 0,
    JSON,
    CODE,
    IMAGE,
    SOUND,
}

export function getFileType(desc: FileDesc): FileType {
    if (desc.isDir) {
        return FileType.DIR
    }

    const suffix = desc.name.split('.').pop() ?? ''
    if (jsonFiles.includes(suffix)) {
        return FileType.JSON
    }

    if (codeFiles.includes(suffix)) {
        return FileType.CODE
    }

    if (imageFiles.includes(suffix)) {
        return FileType.IMAGE
    }

    if (soundFiles.includes(suffix)) {
        return FileType.SOUND
    }

    return FileType.UNKOWN
}

export const FileTypeIcons = new Map<FileType, string>([
    [ FileType.JSON, '\uf3bb' ],
    [ FileType.CODE, '\ue86f' ],
    [ FileType.IMAGE, '\ue3f4' ],
    [ FileType.UNKOWN, '\uea7d' ],
    [ FileType.DIR, '\ue2c7' ],
    [ FileType.SOUND, '\ueb82' ],
])

export class FileViewUtils {
    static registerType(category: FileType, ...suffix: string[]) {
        const target = category === FileType.CODE ? codeFiles
            : category === FileType.JSON ? jsonFiles
            : category === FileType.IMAGE ? imageFiles
            : category === FileType.SOUND ? soundFiles
            : []

        target.push(...suffix)
    }

    private static readonly _specificTypes = new Map<RegExp, Node>()

    static registerSpecificType(matcher: RegExp, icon: Node) {
        this._specificTypes.set(matcher, icon)
    }

    static createIcon(desc: FileDesc) {
        const fileType = getFileType(desc)
        const iconStyles = [ 'scale-120' ]

        if (fileType !== FileType.JSON) {
            return Icon(FileTypeIcons.get(fileType)!, iconStyles)
        }

        for (const [ matcher, iconNode ] of this._specificTypes) {
            if (matcher.test(desc.name)) {
                return iconNode
            }
        }

        return Icon(FileTypeIcons.get(FileType.JSON)!, iconStyles)
    }
}

export function FileView(desc: FileDesc) {
    return html`
        <div
            class="
            p-1 w-20 h-fit rounded
            text-gray-400 flex flex-col
            justify-start items-center
            hover:bg-gray-700 active:bg-gray-800"
            @click="${() => BreadcrumbUtils.push(desc.name)}"
            >
            <div class="w-16 h-16 rounded outline-1 outline-gray-500 flex justify-center items-center ${desc.isDir ? '' : 'bg-gray-800'}">
                ${FileViewUtils.createIcon(desc)}
            </div>
            <div class="h-fit w-16 pt-1 text-xs select-none text-center text-wrap wrap-break-word">${desc.name}</div>
        </div>
    `
}