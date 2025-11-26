import { Pawn } from "@ronin/core/architect/pawn"
import type { AnimLayers } from "./anim"

export enum AnimPlayingType {
    Once = 0,
    Loop = 1,
    HoldOnLastFrame = 2,
}

export interface AnimSeqEvent {
    tick: number
    name: string
}

export abstract class AnimSequence {
    abstract readonly animation: string
    abstract readonly duration: number
    abstract readonly playingType: AnimPlayingType
    abstract readonly override: boolean
    abstract readonly animNotifies: AnimSeqEvent[]

    ticksPlayed: number = 0
    isPlaying: boolean = false
    finished: boolean = false

    protected resetState() {
        this.ticksPlayed = 0
        this.isPlaying = false
    }

    start(layers: AnimLayers) {
        if (this.isPlaying) {
            return
        }

        this.ticksPlayed = 0
        this.isPlaying = true

        const actor = <Pawn> layers.animComp.actor
        actor.entity?.playAnimation(this.animation, {
            nextState: 'unknown',
        })

        this.onStart(layers)
    }

    stop() {
        this.resetState()
        this.onStopped(true)
    }

    update(layers: AnimLayers) {
        if (!this.isPlaying) {
            return
        }

        this.onUpdate(layers)

        const offsetTick = this.ticksPlayed++
        if (offsetTick == this.duration) {
            if (this.playingType === AnimPlayingType.Once) {
                this.finished = true
                this.resetState()
                this.onEnd()
                this.onStopped(false)
                return
            }

            if (this.playingType === AnimPlayingType.HoldOnLastFrame) {
                this.resetState()
                this.onEnd()
                return
            }

            this.ticksPlayed = 0
        }

        this.callNotify(offsetTick)
    }

    findNotify(tick: number): AnimSeqEvent | undefined {
        return this.animNotifies.find(e => e.tick === tick)
    }

    callNotify(tick: number) {
        const methodName = this.findNotify(tick)?.name as keyof this
        if (methodName in this) {
            (this as any)[methodName]()
        }
    }

    onUpdate(layers: AnimLayers) {}
    onStart(layers: AnimLayers) {}
    onEnd() {}
    onStopped(canceled: boolean) {}
}