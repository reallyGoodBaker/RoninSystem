import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import dataAsset from './mariePp.json'
import { Tag } from '@ronin/core/tag'
import { tags } from '@ronin/config/tags'

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


    protected notifyDamage() {

    }

    onStart(): void {
        this.getOwner()!.addTags('skill.slot.attack')
        Tag.removeTag(this.getOwner()!, tags.perm.input.attack)
    }

    onStopped(): void {
        this.getOwner()!.removeTags('skill.slot.attack')
        Tag.addTag(this.getOwner()!, tags.perm.input.attack)
    }
}
