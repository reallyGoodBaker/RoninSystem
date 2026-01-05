import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import { PlayAnimationOptions } from "@minecraft/server"
import dataAsset from './mariePpk.json'
import { input } from '@ronin/input/inputComponent'

@AnimationSequence
export class MariePpkSequence extends AnimSequence {
    static readonly animation = 'animation.ss.marie.ppk'
    readonly animation = 'animation.ss.marie.ppk'
    readonly duration = 16
    readonly playingType: AnimPlayingType = AnimPlayingType.Once
    readonly override = true
    readonly animNotifEvents: AnimSeqEvent[] = dataAsset.events
    readonly notifies: Record<string, number> = dataAsset.notifies
    readonly states: Record<string, number[]> = dataAsset.states
    readonly options: PlayAnimationOptions = dataAsset.options


    protected notifyDamage() {

    }

    onStart(): void {
        input.movement(this.getOwner()!, false)
    }

    onEnd(): void {
        input.movement(this.getOwner()!, true)
    }
}
