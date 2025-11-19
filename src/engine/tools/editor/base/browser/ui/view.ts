import { createEffect, Getter, isGetter } from '../../common/responsive'

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

function getAfterNode(mappedContent: ESTempArgType) {
    if (mappedContent === null || mappedContent === undefined) {
        return t(String(mappedContent))
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
        const getter = mappedContent as Getter<any>
        const evalContentVal = getter()
        if (evalContentVal.nodeType) {
            let placeholder = document.createElement('div') as ChildNode
            createEffect(() => {
                const newPlaceholder = getter()
                placeholder.replaceWith(getter())
                placeholder = newPlaceholder
            })
            return placeholder
        }

        if (Array.isArray(evalContentVal)) {
            const container = document.createElement('div')
            container.style.display = 'contents'

            createEffect(() => {
                container.childNodes.forEach((item: Node) => container.removeChild(item))
                getter().forEach((item: Node) => {
                    container.appendChild(getAfterNode(item))
                })
            })

            return container
        }

        const textNode = t('')
        createEffect(() => {
            textNode.textContent = String((mappedContent as Getter<any>)())
        })
        return textNode
    }

    return t(String(mappedContent))
}

export function html(temp: TemplateStringsArray, ...args: ESTempArgType[]) {
    const mapping: Record<string, ESTempArgType> = {}
    const _key = Date.now().toString(16)
    const key = (index: number) => `{%=${_key}-${index}%}` as const
    args.forEach((arg, index) => mapping[key(index)] = arg)

    const len = temp.length
    const tempStr = temp.map((str, index) => str + (index < len - 1 ? key(index) : '')).join('')
    const compiledDom = parser.parseFromString(tempStr, 'text/html')
    const matcher = /\{%=.*?%\}/g

    traverse(compiledDom.body, node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            // 处理事件
            const el = <HTMLElement> node
            const attrs = el.attributes
            for (const attr of attrs) {
                const eventName = attr.nodeName
                if (!eventName.startsWith('@')) {
                    continue
                }

                const handlerKey = attr.value
                attr.ownerElement?.addEventListener(attr.nodeName.replace('@', ''), mapping[handlerKey] as EventListener)
                attrs.removeNamedItem(attr.nodeName)
            }
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