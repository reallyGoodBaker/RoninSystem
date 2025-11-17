const parser = new DOMParser()

export function html(str: any): HTMLElement {
    return parser.parseFromString(str, 'text/html').body.firstElementChild! as HTMLElement
}

export function template(str: any): HTMLTemplateElement {
    return parser.parseFromString(`<template>${str}</template>`, 'text/html').head.firstElementChild! as HTMLTemplateElement
}

export interface IView {
    render(el: HTMLElement): void
}