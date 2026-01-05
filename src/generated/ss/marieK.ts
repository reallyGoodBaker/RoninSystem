import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import dataAsset from './marieK.json'
import { PlayAnimationOptions } from '@minecraft/server'
import { BattleAttributes } from '@/controller'
import { Tag } from '@ronin/core/tag'
import { tags } from '@ronin/config/tags'
import { input } from '@ronin/input/inputComponent'

@AnimationSequence
export class MarieKSequence extends AnimSequence {
    static readonly animation = 'animation.ss.marie.k'
    readonly animation = 'animation.ss.marie.k'
    readonly duration = 15
    readonly playingType: AnimPlayingType = AnimPlayingType.Once
    readonly override = true
    readonly animNotifEvents: AnimSeqEvent[] = dataAsset.events
    readonly notifies: Record<string, number> = dataAsset.notifies
    readonly states: Record<string, number[]> = dataAsset.states
    readonly options: PlayAnimationOptions = dataAsset.options


    protected notifyDamage() {

    }

    protected stateBlockingStart() {
        const attrs = this.getOwner()?.getComponent(BattleAttributes)
        if (attrs) {
            attrs.set('blocking', true)
        }
    }

    protected stateBlockingEnd() {
        const attrs = this.getOwner()?.getComponent(BattleAttributes)
        if (attrs) {
            attrs.set('blocking', false)
        }
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
}
