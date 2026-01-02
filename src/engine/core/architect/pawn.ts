import { Entity, EntityComponentReturnType, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack } from '@minecraft/server'
import { Actor } from './actor'
import { Controller, IController, Possessable } from './controller'

export class Pawn extends Actor implements Possessable {
    constructor(
        private entityRef: Entity,
    ) {
        super(entityRef.id)
    }

    static isPawn(actor: Actor) {
        return actor instanceof Pawn
    }

    controller: Controller | null = null

    onPossess(controller: Controller): void {
        this.controller = controller
    }

    onUnPossess(): void {
        this.controller = null
    }

    getController<T extends IController = IController>(): T {
        return this.controller as any
    }

    get entity() {
        if (this.entityRef && this.entityRef.isValid) {
            return this.entityRef
        }

        this.entityRef = null as any
        return null
    }

    getNativeComponent<T extends string>(componentId: T): EntityComponentReturnType<T> | undefined {
        const comp = this.entity?.getComponent(componentId)
        if (!comp || !comp.isValid) {
            return
        }

        return comp
    }

    /**
     * 快捷方式，设置生物装备
     * @param slot 
     * @returns 
     */
    setEquipment(slot: EquipmentSlot, equipment: ItemStack) {
        const equippable = this.getNativeComponent(EntityEquippableComponent.componentId)

        return Boolean(equippable?.setEquipment(slot, equipment))
    }

    /**
     * 快捷方式，获取生物装备
     * @param slot 
     * @returns 
     */
    getEquipment(slot: EquipmentSlot) {
        const equippable = this.getNativeComponent(EntityEquippableComponent.componentId)
        if (!equippable?.isValid) {
            return
        }

        return equippable.getEquipment(slot)
    }

    private _inv?: EntityInventoryComponent 
    /**
     * 快捷方式，获取生物背包
     * @returns 
     */
    get inventory() {
        if (this._inv?.isValid) {
            return this._inv
        }

        return (this._inv = this.getNativeComponent(EntityInventoryComponent.componentId))
    }


}