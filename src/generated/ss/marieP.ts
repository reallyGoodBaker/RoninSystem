import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence, AnimLayers } from '@ronin/plugins/animSeq/anim'
import dataAsset from './marieP.json'
import { tags } from '@ronin/config/tags'
import { Tag } from '@ronin/core/tag'
import { PlayAnimationOptions } from '@minecraft/server'

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
    readonly options: PlayAnimationOptions = dataAsset.options


    protected notifyDamage() {

    }

    onStart(): void {
        Tag.removeTag(this.getOwner()!, tags.perm.input.attack)
    }
    
    protected stateComboStart() {
        Tag.addTag(this.getOwner()!, tags.perm.input.attack)
    }
    
    protected stateComboEnd() {
        Tag.removeTag(this.getOwner()!, tags.perm.input.attack)
    }

    onStopped(): void {
        this.stateComboEnd()
        Tag.addTag(this.getOwner()!, tags.perm.input.attack)
    }
}
