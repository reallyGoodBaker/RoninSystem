import { EntityHealthComponent } from "@minecraft/server"
import { Pawn } from "./architect/pawn"
import { clampNumber } from "@minecraft/math"
import { PlayerController } from "./architect/controller"
import { InputComponent } from "@ronin/input/inputComponent"

export class BasePlayer extends Pawn {
    /**
     * ### 玩家血量
     */
    #health: number = 20

    get health(): number {
        return this.#health
    }

    set health(value: number) {
        const player = this.entity
        if (player) {
            const health = player.getComponent(EntityHealthComponent.componentId)!
            if (health.isValid) {
                const old = health.currentValue
                if (old === value) {
                    return
                }

                health.setCurrentValue(clampNumber(value, 0, 20))
            }
        }
    }
}

export class BasePlayerController extends PlayerController {
    readonly inputComponent = new InputComponent()

    setupInput() {
        this.addComponent(
            this.inputComponent
        )
    }
}