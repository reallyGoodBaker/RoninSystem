import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import animNotifies from './marieK.json'

@AnimationSequence
export class MarieKSequence extends AnimSequence {
    static animation = 'animation.ss.marie.k'
    readonly animation = 'animation.ss.marie.k'
    readonly duration = 15
    readonly playingType: AnimPlayingType = 2
    readonly override = true
    readonly animNotifies = animNotifies as AnimSeqEvent[]


    protected notifyDamage() {

    }

    protected stateBlockingStart() {

    }

    protected stateBlockingEnd() {

    }
}
