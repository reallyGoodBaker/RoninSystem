import { createSignal } from "../../../common/responsive"
import { ExplorerLayout } from "../explorer/explorerLayout"
import { html } from "../view"

export function AppLayout() {
    const [ count, setCount ] = createSignal(0)

    return html`
        <div id='explorer' class='w-64 bg-zinc-900 h-full border-r border-r-zinc-700'>
            ${ExplorerLayout()}
        </div>
        <div class='flex flex-1 flex-col'>
            <div id='content' class='w-full flex-1'>
                <button
                    class='bg-teal-700 rounded p-8'
                    @click="${() => setCount(count() + 1)}">
                        ADD 1 to ${count}
                </button>
            </div>
            <div id='bottom' class='bg-zinc-900 w-full border-t border-t-zinc-700 h-56'></div>
        </div>
        <div id='properties' class='w-64 bg-zinc-900 h-full border-l border-l-zinc-700'></div>
    `
}

