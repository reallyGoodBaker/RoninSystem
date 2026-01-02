import { AnimSequence, AnimPlayingType, AnimSeqEvent } from '@ronin/plugins/animSeq/sequence'
import { AnimationSequence } from '@ronin/plugins/animSeq/anim'
import dataAsset from './marieK.json'
import { PlayAnimationOptions } from '@minecraft/server'

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

    }

    protected stateBlockingEnd() {

    }
}
