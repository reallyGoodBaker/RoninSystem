import { Getter } from "../../../common/responsive"
import { Icon } from "../icon"
import { html } from "../view"

export function Breadcrumb(text: string | Getter<string>, onClick: () => void=Function.prototype as any) {
    return html`
        <div
            @click="${onClick}"
            class="
            h-8
            flex
            text-sm
            text-gray-500
            hover:text-gray-300
            active:text-gray-400
            select-none
            cursor-pointer
            text-nowrap
            not-last:after:font-symbols
            not-last:after:flex
            not-last:after:items-center
            not-last:after:content-['']
            not-last:after:text-lg
            not-last:after:h-6
        ">${text === 'assets' ? Icon('\ue88a', [ 'scale-80' ]) : text}</div>
    `
}