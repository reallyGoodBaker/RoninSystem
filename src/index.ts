import { Entry, IApplication } from "@ronin/core/architect/application"
import { ModBase } from "@ronin/core/architect/mod"
import { RoninPlugin } from "@ronin/plugins/ronin"
import { StateTreePlugin } from "@ronin/plugins/stateTree"
import { StateTree } from "@ronin/plugins/stateTree/stateTree"
import { StateTreeConfKey } from "@ronin/plugins/stateTree/stateTreeComponent"
import { AnimationSequencePlugin } from "@ronin/plugins/animSeq/animPlugin"
import { RoninPlayerController } from "@ronin/plugins/ronin/roninController"
import { RoninModPlayer } from "@ronin/plugins/ronin/player"
import { AnimationSequenceComponent } from "@ronin/plugins/animSeq/anim"
import { MarieKSequence } from "./generated/ss/marieK"
import { registerPlayerController } from "@ronin/core/architect/config"
import { MariePSequence } from "./generated/ss/marieP"
import { MariePpSequence } from "./generated/ss/mariePp"

class MyController extends RoninPlayerController {
    setupInput(): void {
        super.setupInput()

        const player = <RoninModPlayer> this.getPawn()
        const animComp = player.getComponent(AnimationSequenceComponent)

        let attackCount = 0

        this.OnAttack.bind(async press => {
            if (!press) {
                return
            }

            const current = ++attackCount

            switch (current) {
                case 1:
                    animComp.playAnimSeq(MariePSequence.animation)
                    break

                case 2:
                    await animComp.playAnimSeq(MariePpSequence.animation)
                    attackCount = 0
                    break
            
                default:
                    break
            }
        })

        this.OnInteract.bind(press => {
            if (!press) {
                return
            }
            animComp.playAnimSeq(MarieKSequence.animation)
        })
    }
}

@Entry
export class MyMod extends ModBase {
    start(app: IApplication) {
        app.setConfig(StateTreeConfKey, {
            'minecraft:player': StateTree
        })

        app.loadPlugin(
            RoninPlugin,
            StateTreePlugin,
            AnimationSequencePlugin,
        )

        registerPlayerController(
            MyController
        )
    }

}