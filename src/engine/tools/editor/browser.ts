import { createEffect } from "./base/common/responsive"
import { replicable } from "./base/browser/replicator"
import { getAppRoot } from "./base/browser/ui"

const [ ver, setVer ] = replicable(
    'editor.version',
    '0.0.1'
)

const counter = document.createElement('button')
counter.classList.add(
    'bg-teal-500',
    'rounded',
    'p-4',
    'left-1/2',
    'top-1/2',
    '-translate-x-1/2',
    '-translate-y-1/2',
    'absolute',
    'cursor-pointer',
)

createEffect(() => {
    counter.innerText = `Upgrade version: ` + ver()
})

counter.addEventListener('click', ev => {
    const [ major, minor, patch ] = ver().split('.')
    setVer(`${major}.${minor}.${+patch + 1}`)
})

getAppRoot().appendChild(counter)