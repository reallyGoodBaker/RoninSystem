import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import { PlayAnimationOptions } from "@minecraft/server"
import dataAsset from './marieKk.json'
import { Tag } from '@ronin/core/tag'
import { tags } from '@ronin/config/tags'
import { input } from '@ronin/input/inputComponent'

@AnimationSequence
export class MarieKkSequence extends AnimSequence {
    static readonly animation = 'animation.ss.marie.kk'
    readonly animation = 'animation.ss.marie.kk'
    readonly duration = 16
    readonly playingType: AnimPlayingType = AnimPlayingType.Once
    readonly override = true
    readonly animNotifEvents: AnimSeqEvent[] = dataAsset.events
    readonly notifies: Record<string, number> = dataAsset.animMeta.notifies
    readonly states: Record<string, number[]> = dataAsset.animMeta.states
    readonly options: PlayAnimationOptions = dataAsset.options


    protected notifyDamage() {

    }

    protected notifyInput_buffer() {
        
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
        Tag.addTag(this.getOwner()!, tags.perm.input.attack.special)
        input.movement(this.getOwner()!, true)
    }

    // AUTO APPEND, DO NOT REMOVE THIS LINE
}
