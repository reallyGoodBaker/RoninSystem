import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import dataAsset from './marieP.json'

@AnimationSequence
export class MariePSequence extends AnimSequence {
    static readonly animation = 'animation.ss.marie.p'
    readonly animation = 'animation.ss.marie.p'
    readonly duration = 15
    readonly playingType: AnimPlayingType = AnimPlayingType.Once
    readonly override = true
    readonly animNotifEvents: AnimSeqEvent[] = dataAsset.events
    readonly notifies: Record<string, number> = dataAsset.notifies
    readonly states: Record<string, number[]> = dataAsset.states


    protected notifyDamage() {

    }
}
