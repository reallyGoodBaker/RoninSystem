import { PlayerController } from "@ronin/core/architect/controller"
import { InputComponent } from "@ronin/input/inputComponent"
import { RoninModPlayer } from "./player"
import { ControlKitComponent } from "@ronin/plugins/ronin/control"
import { EventSignal } from "@ronin/core/architect/event"

/**
 * 若要拓展此类，请继承 RoninModPlayer
 * 并复写 setupInput() 方法，但一定要调用 super.setupInput()
 */
export class RoninPlayerController extends PlayerController {
    readonly inputComponent = new InputComponent()

    readonly OnAttack   = new EventSignal<[boolean]>()
    readonly OnInteract = new EventSignal<[boolean]>()
    readonly OnSneak    = new EventSignal<[boolean]>()
    readonly OnSprint   = new EventSignal<[boolean]>()
    readonly OnJump     = new EventSignal<[boolean]>()

    setupInput(): void {
        this.addComponent(
            this.inputComponent,
        )

        this.getPawn<RoninModPlayer>()?.addComponent(
            new ControlKitComponent()
        )

        this.inputComponent.addListener('Attack', this.OnAttack.trigger)
        this.inputComponent.addListener('Interact', this.OnInteract.trigger)
        this.inputComponent.addListener('Sprint', this.OnSprint.trigger)
        this.inputComponent.addListener('Sneak', this.OnSneak.trigger)
        this.inputComponent.addListener('Jump', this.OnJump.trigger)
    }
}