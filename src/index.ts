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
import { profiler } from "@ronin/core/profiler"

class MyController extends RoninPlayerController {
    setupInput(): void {
        super.setupInput()
        this.OnAttack.bind(press => {
            profiler.debug("Attack Pressed")
            const player = <RoninModPlayer> this.getPawn()
            const animComp = player.getComponent(AnimationSequenceComponent)
            animComp.playAnimation(MarieKSequence.animation)
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