import { createEffect, effectTicker, Getter, isGetter } from '../../common/responsive'

const parser = new DOMParser()

type ESTempArgSingle = string | number | boolean | null | undefined | Function | Node
type ESTempArgArray = ESTempArgSingle[]
type ESTempArgType = ESTempArgSingle | ESTempArgArray

function traverse(root: HTMLElement, visit: (node: Node) => void) {
    visit(root)
    root.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            traverse(node as HTMLElement, visit)
            return
        }

        visit(node)
    })
}

function t(content: string) {
    return document.createTextNode(content)
}

const complexType = [
    'object', 'function'
]

function getReflexibleAfterNode(getter: Getter<ESTempArgType>) {
    const evalContentVal = getter()
    const typeEvaled = typeof evalContentVal
    if (typeEvaled !== 'object' || typeEvaled === 'object' && evalContentVal === null) {
        const text = t('')
        createEffect(() => {
            text.textContent = String((getter() as any))
        })
        return text
    }

    if ((evalContentVal as Node).nodeType !== undefined) {
        let placeholder = document.createElement('div') as ChildNode
        createEffect(() => {
            const newPlaceholder = getter() as Node
            if (newPlaceholder.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                placeholder.replaceWith(...newPlaceholder.childNodes)
            } else if (newPlaceholder.nodeType === Node.ELEMENT_NODE) {
                placeholder.replaceWith(newPlaceholder as Node)
            }

            placeholder = newPlaceholder as ChildNode
        })

        return placeholder
    }

    if (Array.isArray(evalContentVal)) {
        let container = document.createElement('div') as HTMLElement

        createEffect(() => {
            const newContainer = document.createElement('div')
            newContainer.style.display = 'contents'
            container.before(newContainer)
            container.remove()
            container = newContainer
            const newContents = getter() as Node[]
            newContents.forEach((item: Node) => {
                container.appendChild(getAfterNode(item))
            })
        })

        return container
    }

    return t(String(evalContentVal))
}

function getAfterNode(mappedContent: ESTempArgType) {
    if (mappedContent === undefined) {
        return t('')
    }

    if (mappedContent === null) {
        return t('null')
    }

    const contentType = typeof mappedContent
    if (!complexType.includes(contentType)) {
        return t(String(mappedContent as any))
    }

    if (contentType === 'object') {
        if ('nodeType' in (mappedContent as Node)) {
            return mappedContent as Node
        }

        return t(JSON.stringify(mappedContent, null, 2))
    }

    if (isGetter(mappedContent as Getter<any>)) {
        return getReflexibleAfterNode(mappedContent as Getter<any>)
    }

    return t(String(mappedContent))
}

function createMatcher() {
    return /\{%=.*?%\}/g
}

function createQuickMatcher() {
    return {
        test: (str: string) => str.startsWith('{%=') && str.endsWith('%}'),
    }
}

function _wrapListener(fn: CallableFunction, owner: Element, evName: string, modifiers: string[]) {
    const handler = (ev: Event) => {
        if (modifiers.includes('prevent')) {
            ev.preventDefault()
        }
        if (modifiers.includes('stop')) {
            ev.stopPropagation()
        }
        if (modifiers.includes('once')) {
            owner.removeEventListener(evName, handler)
        }

        return fn(ev)
    }

    return handler
}

export function html(temp: TemplateStringsArray, ...args: ESTempArgType[]) {
    const mapping: Record<string, ESTempArgType> = {}
    const _key = Date.now().toString(16) + 'x'.repeat(4).replace(/x/g, () => Math.floor(Math.random() * 16).toString(16))
    const key = (index: number) => `{%=${_key}-${index}%}` as const
    args.forEach((arg, index) => mapping[key(index)] = arg)

    const len = temp.length
    const tempStr = temp.map((str, index) => str + (index < len - 1 ? key(index) : '')).join('')
    const compiledDom = parser.parseFromString(tempStr, 'text/html')
    const matcher = createMatcher()

    traverse(compiledDom.body, node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = <HTMLElement> node
            const attrs = el.attributes
            const shouldRemoveAttrs: string[] = []

            for (const attr of attrs) {
                const nodeName = attr.nodeName

                // 处理事件
                if (nodeName.startsWith('@')) {
                    const handlerKey = attr.value.trim()
                    const [ eventName, ...modifiers ] = attr.nodeName.replace('@', '').split('|')
                    const handler = _wrapListener(
                        mapping[handlerKey] as CallableFunction,
                        el, eventName, modifiers
                    )
                    el.addEventListener(eventName, handler)
                    shouldRemoveAttrs.push(nodeName)
                    continue
                }

                // 处理class
                if (nodeName === 'class') {
                    const matcher = createMatcher()
                    const staticClasses = attr.value.split(matcher)
                    const mappedClasses: (string | Getter<string>)[] = []

                    let matchedMapping: RegExpExecArray | null = null
                    while (matchedMapping = matcher.exec(attr.value)) {
                        mappedClasses.push(mapping[matchedMapping[0]] as string)
                    }

                    if (!mappedClasses.find(v => isGetter(v as Getter<unknown>))) {
                        el.className = staticClasses.map((staticClass, index) => staticClass + (mappedClasses[index] ?? '')).join('')                        
                        continue
                    }

                    createEffect(() => {
                        el.className = staticClasses.map((staticClass, index) => {
                            const mappedClass = mappedClasses[index] ?? ''
                            if (isGetter(mappedClass as Getter<unknown>)) {
                                return staticClass + (mappedClass as Getter<unknown>)()
                            }

                            return staticClass + mappedClass
                        }).join('')
                    })

                    continue
                }

                if (nodeName === 'style') {
                    const el = <HTMLElement> node
                    const stylesText = attr.value
                    const matcher = createMatcher()
                    const staticTexts = stylesText.split(createMatcher())
                    const mappedStyles: (string | Getter<string>)[] = []

                    let matchedMapping: RegExpExecArray | null = null
                    while (matchedMapping = matcher.exec(stylesText)) {
                        mappedStyles.push(mapping[matchedMapping[0]] as string)
                    }

                    if (!mappedStyles.find(v => isGetter(v as Getter<unknown>))) {
                        el.style.cssText = staticTexts.map((staticText, index) => staticText + (mappedStyles[index] ?? '')).join('')                        
                        continue
                    }

                    createEffect(() => {
                        el.style.cssText = staticTexts.map((staticText, index) => {
                            const mappedStyle = mappedStyles[index] ?? ''
                            if (isGetter(mappedStyle as Getter<unknown>)) {
                                return staticText + (mappedStyle as Getter<unknown>)()
                            }

                            return staticText + mappedStyle
                        }).join('')
                    })


                    continue
                }

            }

            shouldRemoveAttrs.forEach(attrName => el.removeAttribute(attrName))

            return
        }

        const rawContent = node.textContent ?? ''
        const matchedParts: [number, number][] = []
        let result: RegExpExecArray | null = null
        while (result = matcher.exec(rawContent)) {
            matchedParts.push([matcher.lastIndex - result[0].length, matcher.lastIndex])
        }

        // 被分割开的静态内容
        const templateContentArray: string[] = []
        // 动态内容模板名称
        const dynamicContentNames: string[] = []
        const splittedContentIndexes = [0, ...matchedParts.flat(), rawContent.length]
        for (let i = 0; i < splittedContentIndexes.length - 1; i++) {
            const start = splittedContentIndexes[i]
            const end = splittedContentIndexes[i + 1]
            const content = rawContent.slice(start, end)
            if (i % 2 === 0) {
                templateContentArray.push(content)
            } else {
                dynamicContentNames.push(content)
            }
        }

        // console.log(templateContentArray, dynamicContentNames)
        const tempNodes = templateContentArray.map(content => t(content))
        const parentElement = node.parentElement!
        tempNodes.forEach(newNode => parentElement.insertBefore(newNode, node))
        parentElement.removeChild(node)

        tempNodes.forEach((node, i) => {
            if (i === templateContentArray.length - 1) {
                return
            }

            const mappedContent = mapping[dynamicContentNames[i]]
            
            if (Array.isArray(mappedContent)) {
                mappedContent.forEach(item => {
                    node.after(getAfterNode(item))
                })
                return
            }

            node.after(getAfterNode(mappedContent))
        })
        
    })

    const frag = document.createDocumentFragment()
    frag.replaceChildren(...compiledDom.body.childNodes)
    return frag
}

export interface IView {
    readonly element: HTMLElement
    renderTo(el: HTMLElement): void
}