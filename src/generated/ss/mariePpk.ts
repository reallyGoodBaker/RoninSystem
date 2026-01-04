import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import { PlayAnimationOptions } from "@minecraft/server"
import dataAsset from './mariePpk.json'

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
}
