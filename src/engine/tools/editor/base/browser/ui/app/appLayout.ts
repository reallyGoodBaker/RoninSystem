import { IView, html } from "../view"

export class AppLayout implements IView {
    readonly appLayoutElement = html`
        <div class='flex w-full h-full'>
            <div id='explorer' class='w-64 bg-zinc-900 h-full border-r border-r-zinc-700'></div>
            <div class='flex flex-1 flex-col'>
                <div id='content' class='w-full flex-1'></div>
                <div id='bottom' class='bg-zinc-900 w-full border-t border-t-zinc-700 h-56'></div>
            </div>
            <div id='properties' class='w-64 bg-zinc-900 h-full border-l border-l-zinc-700'></div>
        </div>
    `

    explorerView: HTMLElement | null = null
    contentView: HTMLElement | null = null
    propertiesView: HTMLElement | null = null

    constructor() {
        this.explorerView = this.appLayoutElement.querySelector('#explorer')
    }

    render(el: HTMLElement): void {
        el.appendChild(this.appLayoutElement)
    }
}

