import { EntityEquippableComponent, EquipmentSlot, ItemStack, Player, world } from '@minecraft/server'
import { Application } from '@ronin/core/architect/application'
import { Component } from '@ronin/core/architect/component'
import { PlayerController } from '@ronin/core/architect/controller'
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

export class HotbarComponent extends Component {
    static {
        world.afterEvents.playerHotbarSelectedSlotChange.subscribe(({
            player,
            previousSlotSelected,
            newSlotSelected,
            itemStack
        }) => {
            const controller = Application.getInst().getControllerByActorId<PlayerController>(player.id)
            if (!controller) {
                return
            }

            const hotbarSkill = controller.getComponent(HotbarComponent)
            if (!hotbarSkill) {
                return
            }

            hotbarSkill._tryActivateSkill(player, itemStack, newSlotSelected, previousSlotSelected)
        })
    }

    private _tryActivateSkill(player: Player, itemStack: ItemStack | undefined, newSlotSelected: number, previousSlotSelected: number) {
        if (!itemStack) {
            const handler = this._skillMapping.get('empty')
            handler?.(player, itemStack as any, newSlotSelected, previousSlotSelected)
            return
        }

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

    Builder = class HotbarComponentBuilder {
        private readonly skills: [string, HotbarHandler, HotbarSkillOptions?][] = []

        addSkill(itemId: string, skill: HotbarHandler, options: HotbarSkillOptions = {}) {
            this.skills.push([itemId, skill, options])
            return this
        }

        build(): HotbarComponent {
            const component = new HotbarComponent()
            for (const [itemId, skill, options] of this.skills) {
                component.bindSkill(itemId, skill, options)
            }
            return component
        }
    }
}