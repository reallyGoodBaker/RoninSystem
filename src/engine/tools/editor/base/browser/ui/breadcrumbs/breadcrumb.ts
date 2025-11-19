import { Getter } from "../../../common/responsive"
import { html } from "../view"

export function Breadcrumb(text: string | Getter<string>, onClick: () => void=Function.prototype as any) {
    return html`
        <div
            @click="${onClick}"
            class="
            not-last:after:content-['>']
            text-gray-500
            hover:text-gray-300
            active:text-gray-400
            select-none
            cursor-pointer
        ">${text}</div>
    `
}