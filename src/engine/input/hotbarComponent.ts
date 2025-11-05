import { EntityEquippableComponent, EquipmentSlot, ItemStack, Player, world } from '@minecraft/server'
import { Application } from '@ronin/core/architect/application'
import { Component } from '@ronin/core/architect/component'
import { Pawn } from '@ronin/core/architect/pawn'

export interface HotbarSkillOptions {
    readonly itemOffhand?: string
    readonly slot?: number
    /**
     * 取消当前选择（回到上一个选择的位置），会导致循环触发，需要自行处理
     * 当 `selectSlot` 存在时，`undoSelect` 会被忽略
     */
    readonly undoSelect?: boolean
    /**
     * 物品栏技能选择后跳转到的槽位
     * 当 `selectSlot` 存在时，`undoSelect` 会被忽略
     */
    readonly selectSlot?: number
}

export type HotbarHandler = (player: Player, item: ItemStack, slot: number, previousSlot: number) => void

export class HotbarSkillComponent extends Component {
    static {
        world.afterEvents.playerHotbarSelectedSlotChange.subscribe(({
            player,
            previousSlotSelected,
            newSlotSelected,
            itemStack
        }) => {
            if (!itemStack) {
                return
            }

            const actor = Application.getInst().getActor(player.id)
            if (!actor) {
                return
            }

            const hotbarSkill = actor.getComponent(HotbarSkillComponent)
            if (!hotbarSkill) {
                return
            }

            hotbarSkill._tryActivateSkill(player, itemStack, newSlotSelected, previousSlotSelected)
        })
    }

    private _tryActivateSkill(player: Player, itemStack: ItemStack, newSlotSelected: number, previousSlotSelected: number) {
        const {
            itemOffhand,
            slot,
            undoSelect,
            selectSlot,
        } = this._skillOptions.get(itemStack.typeId) ?? {}

        if (typeof slot === 'number' && newSlotSelected !== slot) {
            return
        }

        if (itemOffhand) {
            const equippable = (this.actor as Pawn).entity?.getComponent(EntityEquippableComponent.componentId)
            if (!equippable || !equippable.isValid) {
                return
            }

            // 大写会被转换成小写
            if (equippable.getEquipment(EquipmentSlot.Offhand)?.typeId !== itemOffhand.toLowerCase()) {
                return
            }
        }

        const skill = this._skillMapping.get(itemStack.typeId)
        if (!skill) {
            return
        }

        skill(player, itemStack, newSlotSelected, previousSlotSelected)

        if (selectSlot !== undefined && selectSlot !== null) {
            player.selectedSlotIndex = selectSlot
            return
        }

        if (undoSelect) {
            player.selectedSlotIndex = previousSlotSelected
        }
    }

    private readonly _skillOptions = new Map<string, HotbarSkillOptions>()
    private readonly _skillMapping = new Map<string, HotbarHandler>()

    bindSkill(itemId: string, skill: HotbarHandler, options: HotbarSkillOptions = {}) {
        this._skillMapping.set(itemId, skill)
        this._skillOptions.set(itemId, options)
    }

    unbindSkill(itemId: string) {
        this._skillMapping.delete(itemId)
        this._skillOptions.delete(itemId)
    }
}