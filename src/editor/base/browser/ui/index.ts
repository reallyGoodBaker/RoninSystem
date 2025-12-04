import { AppLayout } from "./app/appLayout"
import { FileViewUtils } from "./explorer/files/fileView"
import { Icon } from "./icon"
// import './content'

export function getAppRoot() {
    return document.getElementById('app') as HTMLElement
}

export function startEditor() {
    getAppRoot().appendChild(AppLayout())
}

// 生物
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('entities'))
        return

    return Icon('\ue91d', FileViewUtils.defaultIconStyles)
})

// 物品
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('items'))
        return

    return Icon('\uf889', FileViewUtils.defaultIconStyles)
})

// 函数
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('functions'))
        return

    return Icon('\uf866', FileViewUtils.defaultIconStyles)
})

// 物品分组
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('item_catalog'))
        return

    return Icon('\ue091', FileViewUtils.defaultIconStyles)
})

// 掉落物
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('loot_tables'))
        return

    return Icon('\uf191', FileViewUtils.defaultIconStyles)
})

// 相机预设
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('cameras'))
        return

    return Icon('\ue412', FileViewUtils.defaultIconStyles)
})
