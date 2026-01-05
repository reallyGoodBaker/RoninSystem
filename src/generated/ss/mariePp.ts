import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import dataAsset from './mariePp.json'
import { Tag } from '@ronin/core/tag'
import { tags } from '@ronin/config/tags'
import { PlayAnimationOptions } from '@minecraft/server'
import { input } from '@ronin/input/inputComponent'

@AnimationSequence
export class MariePpSequence extends AnimSequence {
    static readonly animation = 'animation.ss.marie.pp'
    readonly animation = 'animation.ss.marie.pp'
    readonly duration = 15
    readonly playingType: AnimPlayingType = AnimPlayingType.Once
    readonly override = true
    readonly animNotifEvents: AnimSeqEvent[] = dataAsset.events
    readonly notifies: Record<string, number> = dataAsset.notifies
    readonly states: Record<string, number[]> = dataAsset.states
    readonly options: PlayAnimationOptions = dataAsset.options


    protected notifyDamage() {

    }

    protected stateComboStart() {
        Tag.addTag(this.getOwner()!, tags.perm.input.attack.special)
    }
    
    protected stateComboEnd() {
        Tag.removeTag(this.getOwner()!, tags.perm.input.attack.special)
    }

    onStart(): void {
        Tag.removeTag(this.getOwner()!, tags.perm.input.attack.special)
        input.movement(this.getOwner()!, false)
    }

    onEnd(): void {
        this.stateComboEnd()
        Tag.addTag(this.getOwner()!, tags.perm.input.attack.special)
        input.movement(this.getOwner()!, true)
    }
}
