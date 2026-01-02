import { profiler } from "@ronin/core/profiler"
import { RoninPlayerController } from "@ronin/plugins/ronin/roninController"
import { RoninModPlayer } from "@ronin/plugins/ronin/player"
import { AnimationSequenceComponent } from "@ronin/plugins/animSeq/anim"
import { MarieKSequence } from "./generated/ss/marieK"
import { tags } from "@ronin/config/tags"
import { StateTreeComponent } from "@ronin/plugins/stateTree/stateTreeComponent"
import { Tag } from "@ronin/core/tag"

export class MyController extends RoninPlayerController {
    setupInput(): void {
        super.setupInput()

        const player = <RoninModPlayer> this.getPawn()
        const animComp = player.getComponent(AnimationSequenceComponent)
        const stateTreeComp = player.getComponent(StateTreeComponent)

        Tag.addTag(player, tags.perm.input.attack)

        this.OnAttack.on(async press => {
            if (!press) {
                return
            }

            if (Tag.hasTag(player, tags.perm.input.attack, true) && stateTreeComp && stateTreeComp.stateTree) {
                stateTreeComp.stateTree.sendStateEvent({
                    tag: tags.skill.slot.attack,
                    targetActor: player,
                })
            }
        })

        this.OnInteract.on(async press => {
            if (!press) {
                return
            }

            profiler.info('start kick')
            if (animComp) {
                animComp.playAnimSeq(MarieKSequence.animation)
                profiler.info(animComp.getPlayingAnimation())
            }
        })
    }
}