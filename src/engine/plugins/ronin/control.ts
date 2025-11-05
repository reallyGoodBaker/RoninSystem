import { EquipmentSlot } from "@minecraft/server"
import { RoninModPlayer } from "@ronin/plugins/ronin/player"
import { Component } from "@ronin/core/architect/component"
import { Pawn } from "@ronin/core/architect/pawn"
import { InputComponent } from "@ronin/input/inputComponent"
import { RoninPlayerController } from "@ronin/plugins/ronin/roninController"
import { ReflectConfig } from "@ronin/core/architect/reflect"

export class ControlKitComponent extends Component {
    start(): void {
        const input = (this.actor as Pawn)?.getController<RoninPlayerController>()?.getComponent(InputComponent)
        if (!input) {
            this.remove()
            return
        }

        const actor = ReflectConfig.contextActorRef().deref() as RoninModPlayer

        input.addListener('Interact', pressing => {
            if (!pressing) {
                return
            }

            const item = actor.getEquipment(EquipmentSlot.Mainhand)?.typeId
            if (item === 'ss:control.det_up') {
                return actor.determination += 1
            }

            if (item === 'ss:control.det_down') {
                return actor.determination -= 1
            }

            if (item === 'ss:control.detlvl_up') {
                return actor.determLevel += 1
            }

            if (item === 'ss:control.detlvl_down') {
                return actor.determLevel -= 1
            }

            if (item === 'ss:control.mental_up') {
                return actor.mental += 1
            }

            if (item === 'ss:control.mental_down') {
                return actor.mental -= 1
            }
        })
    }
}