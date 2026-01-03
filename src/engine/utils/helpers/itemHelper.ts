import { clampNumber } from "@minecraft/math"
import { EnchantmentTypes, EquipmentSlot, ItemEnchantableComponent, ItemLockMode, ItemStack, ItemType, Player, system } from "@minecraft/server"
import { Application } from "@ronin/core/architect/application"
import { CustomCommand, Param } from '../command'
import { ticking } from "@ronin/core/ticking"
import { Pawn } from "@ronin/core/architect/pawn"

export interface ItemProperties {
    amount?: number
    lore?: string[]
    nameTag?: string
    keepOnDeath?: boolean
    lockMode?: ItemLockMode
    canDestroy?: string[]
    canPlaceOn?: string[]
}

export enum EnchantTypes {
    protection = 'protection',                          // 保护
    fire_protection = 'fire_protection',                // 火焰保护
    feather_falling = 'feather_falling',                // 摔落保护
    blast_protection = 'blast_protection',              // 爆炸保护
    projectile_protection = 'projectile_protection',    // 弹射物保护
    thorns = 'thorns',                                  // 荆棘
    respiration = 'respiration',                        // 水下呼吸
    depth_strider = 'depth_strider',                    // 深海探索者
    aqua_affinity = 'aqua_affinity',                    // 水下速掘
    sharpness = 'sharpness',                            // 锋利
    smite = 'smite',                                    // 亡灵杀手
    bane_of_arthropods = 'bane_of_arthropods',          // 节肢杀手
    knockback = 'knockback',                            // 击退
    fire_aspect = 'fire_aspect',                        // 火焰附加
    looting = 'looting',                                // 抢夺
    efficiency = 'efficiency',                          // 效率
    silk_touch = 'silk_touch',                          // 精准采集
    unbreaking = 'unbreaking',                          // 耐久
    fortune = 'fortune',                                // 时运
    power = 'power',                                    // 力量
    punch = 'punch',                                    // 冲击
    flame = 'flame',                                    // 火矢
    infinity = 'infinity',                              // 无限
    luck_of_the_sea = 'luck_of_the_sea',                // 海之眷顾
    lure = 'lure',                                      // 饵钓
    frost_walker = 'frost_walker',                      // 冰霜行者
    mending = 'mending',                                // 经验修补
    binding = 'binding',                                // 绑定诅咒
    vanishing = 'vanishing',                            // 消失诅咒
    impaling = 'impaling',                              // 穿刺
    riptide = 'riptide',                                // 激流
    loyalty = 'loyalty',                                // 忠诚
    channeling = 'channeling',                          // 引雷
    multishot = 'multishot',                            // 多重射击
    piercing = 'piercing',                              // 穿透
    quick_charge = 'quick_charge',                      // 快速装填
    soul_speed = 'soul_speed',                          // 灵魂疾行
    swift_sneak = 'swift_sneak',                        // 迅捷潜行
    wind_burst = 'wind_burst',                          // 风爆
    density = 'density',                                // 密度
    breach = 'breach'                                   // 破甲
}

export type EnchantDescriptions = Partial<Record<EnchantTypes, number>> & { onlyApply?: boolean }

export class ItemHelper {
    static createItem(itemDesc: string | ItemStack, {
        amount, lockMode, lore, nameTag, keepOnDeath, canDestroy, canPlaceOn
    }: ItemProperties = {}) {
        const item = typeof itemDesc === 'string' ? new ItemStack(itemDesc.toLocaleLowerCase(), amount) : itemDesc

        if (lockMode) item.lockMode = lockMode
        if (lore) item.setLore(lore)
        if (nameTag) item.nameTag = nameTag
        if (keepOnDeath) item.keepOnDeath = keepOnDeath
        if (canDestroy) item.setCanDestroy(canDestroy)
        if (canPlaceOn) item.setCanPlaceOn(canPlaceOn)

        return item
    }

    static enchantItem(item: ItemStack, desc: EnchantDescriptions) {
        const enchantable = item.getComponent(ItemEnchantableComponent.componentId)
        if (!enchantable?.isValid) {
            return
        }

        if (!desc.onlyApply) {
            const applied = new Set(enchantable.getEnchantments().map(ench => ench.type.id))
            const willApply = new Set(Object.keys(desc))

            const shouldRemove = applied.difference(willApply)
            for (const name of shouldRemove) {
                enchantable.removeEnchantment(name)
            }
        }

        for (const [ name, level ] of Object.entries(desc)) {
            if (name === 'onlyApply') {
                continue
            }

            if (enchantable.hasEnchantment(name)) {
                const ench = enchantable.getEnchantment(name)
                if (ench && ench.level !== level) {
                    ench.level = clampNumber(level as number, 0, ench.type.maxLevel)
                }
                continue
            }

            const enchantType = EnchantmentTypes.get(name)!
            enchantable.addEnchantment({
                type: enchantType,
                level: clampNumber(level as number, 0, enchantType.maxLevel)
            })
        }
    }

    static giveItem(pawn: Pawn, itemDesc: string | ItemStack, properties: ItemProperties, ench?: EnchantDescriptions) {
        const item = this.createItem(itemDesc, properties)
        const container = pawn.inventory?.container
        if (!container || !container.isValid) {
            return
        }

        if (ench) {
            ItemHelper.enchantItem(item, ench)
        }

        container.addItem(item)
        return item
    }

    static enchantEquipment(pawn: Pawn, slot: EquipmentSlot, desc: EnchantDescriptions) {
        const item = pawn.getEquipment(slot)
        if (!item) {
            return
        }

        this.enchantItem(item, desc)
    }

    static equipItem(pawn: Pawn, slot: EquipmentSlot, itemDesc: string | ItemStack, properties: ItemStack) {
        const item = this.createItem(itemDesc, properties)
        pawn.setEquipment(slot, item)
    }

    @CustomCommand('Give item')
    static give_item(
        @Param.Required('player', 'player') players: Player[],
        @Param.Required('item', 'item') itemStack: ItemType,
        @Param.Optional('int', 'count') amount: number = 1,
        @Param.OptionalEnum('inventory', 'none', 'slot') itemLockMode: string = 'none',
        @Param.Optional('bool', 'keep_on_death') keepOnDeath: boolean = false,
        @Param.Optional('string', 'json_config') jsonConf: string = '{}',
        @Param.App application: Application,
    ) {
        players.forEach(player => {
            const { lore, nameTag, canDestroy, canPlaceOn } = JSON.parse(jsonConf)
            const actor = application.getActor(player.id)
            if (!actor) {
                return
            }

            ticking.queue(() =>
                ItemHelper.giveItem(
                    application.getActor(player.id)!,
                    itemStack.id,
                    {
                        amount,
                        lockMode: itemLockMode as any,
                        lore,
                        nameTag,
                        keepOnDeath,
                        canDestroy,
                        canPlaceOn
                    }
                )
            )

            player.sendMessage(`给予玩家 ${player.name}: ${nameTag ?? itemStack.id} * ${amount}`)
        })
    }
}
