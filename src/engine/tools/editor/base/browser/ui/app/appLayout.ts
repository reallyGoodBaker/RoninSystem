import { ExplorerLayout } from "../explorer/explorerLayout"
import { html } from "../view"
import { Alert } from "./alert"

export function AppLayout() {
    return html`
        <div id='explorer' class='w-64 bg-zinc-900 h-full border-r border-r-zinc-700'>
            ${ExplorerLayout()}
        </div>
        <div class='flex flex-1 flex-col'>
            <div id='content' class='w-full flex-1'>
                <button
                    class='bg-teal-700 rounded p-8'
                    @click="${() => Alert.visible(true)}">
                        OPEN ALERT
                </button>
            </div>
            <div id='bottom' class='bg-zinc-900 w-full border-t border-t-zinc-700 h-56'></div>
        </div>
        <div id='properties' class='w-64 bg-zinc-900 h-full border-l border-l-zinc-700'></div>
        ${Alert.view()}
    `
}