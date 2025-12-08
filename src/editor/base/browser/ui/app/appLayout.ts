import { ExplorerLayout } from "../explorer/explorerLayout"
import { html } from "../view"
import { Alert } from "./alert"
import { createDraggingView, DragDirection } from "../gesture/dragging"
// import { ContentView } from "../content/contentView"

export function AppLayout() {
    const [ explorerDraggingView, expSize ] = createDraggingView(DragDirection.East, 256, 256, 600)
    const [ propertiesDraggingView, propSize ] = createDraggingView(DragDirection.West, 256, 256, 600)
    const [ timelineDraggingView, timelineSize ] = createDraggingView(DragDirection.North, 156, 156, 400)

    return html`
        <div id='explorer' class='relative flex bg-zinc-900 h-full border-r border-r-zinc-700 w-(--width)' style="--width: ${expSize}px">
            <div class="flex w-full">${ExplorerLayout()}</div>
            ${explorerDraggingView}
        </div>
        <div class='flex flex-1 flex-col'>
            <div id='content' class='w-full flex-1'>

            </div>
            <div id='bottom' class='relative bg-zinc-900 w-full border-t border-t-zinc-700 h-(--height)' style="--height: ${timelineSize}px">
                ${timelineDraggingView}
            </div>
        </div>
        <div id='properties' class='relative bg-zinc-900 h-full border-l border-l-zinc-700 w-(--width)' style="--width: ${propSize}px">
            ${propertiesDraggingView}
        </div>
        ${Alert.view()}
    `
}