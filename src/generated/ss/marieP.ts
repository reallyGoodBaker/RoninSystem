import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence, AnimLayers } from '@ronin/plugins/animSeq/anim'
import dataAsset from './marieP.json'
import { tags } from '@ronin/config/tags'
import { StateTreeComponent } from '@ronin/plugins/stateTree/stateTreeComponent'
import type { MyController } from '@/controller'

@AnimationSequence
export class MariePSequence extends AnimSequence {
    static readonly animation = 'animation.ss.marie.p'
    readonly animation = 'animation.ss.marie.p'
    readonly duration = 12
    readonly playingType: AnimPlayingType = AnimPlayingType.Once
    readonly override = true
    readonly animNotifEvents: AnimSeqEvent[] = dataAsset.events
    readonly notifies: Record<string, number> = dataAsset.notifies
    readonly states: Record<string, number[]> = dataAsset.states


    protected notifyDamage() {

    }

    onStart(): void {
        this.getOwner()!.addTags('skill.slot.attack')
    }

    onStopped(): void {
        this.getOwner()!.removeTags('skill.slot.attack')
    }

    inputAttack() {
        const owner = this.getOwner()!
        const tree = owner.getComponent(StateTreeComponent).stateTree!
        tree.getCurrentState().OnStateTreeEvent.call({
            tag: tags.skill.slot.attack,
            targetActor: owner,
        }, tree)
    }

    protected stateComboStart() {
        const controller = this.getOwner()!.getController() as MyController
        controller.OnAttack.addListener(this.inputAttack)
    }

    protected stateComboEnd() {
        const controller = this.getOwner()!.getController() as MyController
        controller.OnAttack.removeListener(this.inputAttack)
    }
}
