import { ExplorerLayout } from "../explorer/explorerLayout"
import { html } from "../view"
import { Alert } from "./alert"
import { createDraggingView, DragDirection } from "../gesture/dragging"
import { createComputed } from "@editor/base/common/responsive"

export function AppLayout() {
    const [ explorerDraggingView, expSize ] = createDraggingView(DragDirection.East)
    const [ propertiesDraggingView, propSize ] = createDraggingView(DragDirection.West)
    const [ timelineDraggingView, timelineSize ] = createDraggingView(DragDirection.North, 156)

    return html`
        <div id='explorer' class='flex bg-zinc-900 h-full border-r border-r-zinc-700 w-(--width)' style="--width: ${createComputed(() => Math.max(expSize(), 256))}px">
            <div class="flex" style="width: calc(100% - 4px);">${ExplorerLayout()}</div>
            ${explorerDraggingView}
        </div>
        <div class='flex flex-1 flex-col'>
            <div id='content' class='w-full flex-1'>
                <button
                    class='bg-teal-700 rounded p-8'
                    @click="${() => Alert.visible(true)}">
                        OPEN ALERT
                </button>
            </div>
            <div id='bottom' class='bg-zinc-900 w-full border-t border-t-zinc-700 h-(--height)' style="--height: ${createComputed(() => Math.max(timelineSize(), 156))}px">
                ${timelineDraggingView}
            </div>
        </div>
        <div id='properties' class='bg-zinc-900 h-full border-l border-l-zinc-700 w-(--width)' style="--width: ${createComputed(() => Math.max(propSize(), 256))}px">
            ${propertiesDraggingView}
        </div>
        ${Alert.view()}
    `
}