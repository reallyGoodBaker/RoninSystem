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

    return Icon('\uf3b6', FileViewUtils.defaultIconStyles)
})

// 客户端生物
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('entity'))
        return

    return Icon('\uf25b', FileViewUtils.defaultIconStyles)
})

// UI
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('ui'))
        return

    return Icon('\uf10a', FileViewUtils.defaultIconStyles)
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

// 材质
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('textures'))
        return

    return Icon('\ue421', FileViewUtils.defaultIconStyles)
})

// 文本
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('texts'))
        return

    return Icon('\ue894', FileViewUtils.defaultIconStyles)
})

// 音频
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('sounds'))
        return

    return Icon('\ue050', FileViewUtils.defaultIconStyles)
})

// 模型
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('models'))
        return

    return Icon('\uf3aa', FileViewUtils.defaultIconStyles)
})

// 粒子效果
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('particles'))
        return

    return Icon('\uf585', FileViewUtils.defaultIconStyles)
})

// 动画通知
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('anim_notifies'))
        return

    return Icon('\ue922', FileViewUtils.defaultIconStyles)
})

// 动画
FileViewUtils.registerReplacer(info => {
    if (!info.getParts().includes('animations'))
        return

    return Icon('\ue71c', FileViewUtils.defaultIconStyles)
})

// 各种控制器
FileViewUtils.registerReplacer(info => {
    if (!info.name.includes('_controllers'))
        return

    return Icon('\ue83d', FileViewUtils.defaultIconStyles)
})