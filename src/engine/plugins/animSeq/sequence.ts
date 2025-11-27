import { Pawn } from "@ronin/core/architect/pawn"
import type { AnimLayers } from "./anim"
import { EventDelegate } from "@ronin/core/architect/event"

export enum AnimPlayingType {
    Once = 0,
    Loop = 1,
    HoldOnLastFrame = 2,
}

export interface AnimSeqEvent {
    tick: number
    name: string
}

export interface AnimSequenceCtor {
    new(): AnimSequence
    animation: string
}

export abstract class AnimSequence {
    abstract readonly animation: string
    abstract readonly duration: number
    abstract readonly playingType: AnimPlayingType
    abstract readonly override: boolean
    abstract readonly animNotifEvents: AnimSeqEvent[]
    abstract readonly notifies: Record<string, number>
    abstract readonly states: Record<string, number[]>

    readonly Onfinished = new EventDelegate<[boolean]>()

    ticksPlayed: number = 0
    isPlaying: boolean = false
    finished: boolean = false

    protected resetState() {
        this.ticksPlayed = 0
        this.isPlaying = false
    }

    restore() {
        this.resetState()
        this.finished = false
    }

    restart(layers: AnimLayers) {
        this.restore()
        this.start(layers)
    }

    start(layers: AnimLayers) {
        if (this.isPlaying) {
            return
        }

        this.ticksPlayed = 0
        this.isPlaying = true

        const actor = <Pawn> layers.animComp.actor
        actor.entity?.playAnimation(this.animation, {
            nextState: 'default',
            blendOutTime: 0.1,
        })

        this.onStart(layers)
    }

    stop() {
        this.resetState()
        this.onStopped(true)
        this.Onfinished.call(true)
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
                this.Onfinished.call(false)
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
        return this.animNotifEvents.find(e => e.tick === tick)
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