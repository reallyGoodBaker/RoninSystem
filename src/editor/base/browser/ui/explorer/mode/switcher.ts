import { ExplorerMode } from "@editor/config/explorerMode"
import { replicable } from "../../../replicator"
import { html } from "../../view"
import { Bookmark, IBookmark } from "./bookmark"

const [ mode, setMode ] = replicable<ExplorerMode>('explorer.mode', ExplorerMode.BEHAVIOR)

const compactConf: IBookmark = {
    icon: '\ue574',
    label: '紧凑视图',
    id: ExplorerMode.COMPACT,
}

const behaviorConf: IBookmark = {
    icon: '\uf3b6',
    label: '行为视图',
    id: ExplorerMode.BEHAVIOR,
}

const resourceConf: IBookmark = {
    icon: '\ue421',
    label: '资源视图',
    id: ExplorerMode.RESOURCE,
}

export function Switcher() {
    function createBookmark(conf: IBookmark) {
        return Bookmark(conf, mode, setMode)
    }

    return html`
        <div class="box-border bg-slate-900 px-2 h-10 flex items-center justify-between text-gray-400 border-b border-gray-500">
            <div class="flex h-full flex-1 gap-0.5">
                ${createBookmark(behaviorConf)}
                ${createBookmark(resourceConf)}
            </div>
            <div class="flex h-full justify-end">
                ${createBookmark(compactConf)}
            </div>
        </div>
    `
}

export class ExplorerModeHelper {
    static getMode() {
        return mode()
    }

    static setMode(mode: ExplorerMode) {
        setMode(mode)
    }
}