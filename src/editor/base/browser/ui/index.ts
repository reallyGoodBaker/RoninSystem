import { AppLayout } from "./app/appLayout"

export function getAppRoot() {
    return document.getElementById('app') as HTMLElement
}

export function startEditor() {
    getAppRoot().appendChild(AppLayout())
}