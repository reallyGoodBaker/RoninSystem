import { PlayerController } from "@ronin/core/architect/controller"
import { InputComponent } from "@ronin/input/inputComponent"
import { RoninModPlayer } from "./player"
import { ControlKitComponent } from "@ronin/plugins/ronin/control"
import { EventDelegate } from "@ronin/core/architect/event"

/**
 * 若要拓展此类，请继承 RoninModPlayer
 * 并复写 setupInput() 方法，但一定要调用 super.setupInput()
 */
export class RoninPlayerController extends PlayerController {
    readonly inputComponent = new InputComponent()

    readonly OnAttack   = new EventDelegate<[boolean]>()
    readonly OnInteract = new EventDelegate<[boolean]>()
    readonly OnSneak    = new EventDelegate<[boolean]>()
    readonly OnSprint   = new EventDelegate<[boolean]>()
    readonly OnJump     = new EventDelegate<[boolean]>()

    setupInput(): void {
        this.addComponent(
            this.inputComponent,
        )

        this.getPawn<RoninModPlayer>()?.addComponent(
            new ControlKitComponent()
        )

        this.inputComponent.addListener('Attack', this.OnAttack.call)
        this.inputComponent.addListener('Interact', this.OnInteract.call)
        this.inputComponent.addListener('Sprint', this.OnSprint.call)
        this.inputComponent.addListener('Sneak', this.OnSneak.call)
        this.inputComponent.addListener('Jump', this.OnJump.call)
    }
}