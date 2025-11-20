import { Getter } from "../../common/responsive"
import { html } from "./view"

export function Icon(code: string | Getter<string>, classList: string[]=[]) {
    return html`
        <span class="material-symbols-rounded select-none ${classList.join(' ')}">${code}</span>
    `
}