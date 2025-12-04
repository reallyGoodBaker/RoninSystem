import { Pawn } from "@ronin/core/architect/pawn"
import type { AnimLayers } from "./anim"
import { EventSignal } from "@ronin/core/architect/event"
import { profiler } from "@ronin/core/profiler"
import { PROFIER_CONFIG } from '@ronin/config/profiler'
import { ConstructorOf } from "@ronin/core/types"
import { ReflectConfig } from "@ronin/core/architect/reflect"

const { ANIM: { TRACK_STYLE, TRACK_WIDTH, STATE, NOTIFY, TRACK_COLOR }, TOKENS } = PROFIER_CONFIG

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
    new(layers: AnimLayers): AnimSequence
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

    readonly Onfinished = new EventSignal<[boolean]>()
    private _animOwner?: Pawn

    constructor(
        readonly layers: AnimLayers,
    ) {}

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

        const pawn = <Pawn >this.layers.animComp.actor
        this._animOwner = pawn
        profiler.info(this.animation, pawn.entity)
        pawn.entity?.playAnimation(this.animation)

        this.onStart(layers)
    }

    stop() {
        this.resetState()
        this.onStopped(true)
        this.Onfinished.trigger(true)
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
                this.Onfinished.trigger(false)
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

    getOwner() {
        return this._animOwner
    }

    onUpdate(layers: AnimLayers) {}
    onStart(layers: AnimLayers) {}
    onEnd() {}
    onStopped(canceled: boolean) {}

    static {
        profiler.registerCustomTypePrinter(AnimSequence as ConstructorOf<AnimSequence>, animSeq => {
            const { animation, duration, playingType, notifies, states } = animSeq
            const scale = TRACK_WIDTH / duration
            const text = `${TOKENS.STR}${animation} ${TOKENS.ID}${AnimPlayingType[playingType]} ${TOKENS.NUM}${duration}${TOKENS.R} Ticks\n` +
                `Playing: ${TOKENS.BOOL}${animSeq.isPlaying}${TOKENS.R} Finished: ${TOKENS.BOOL}${animSeq.finished}\n` +
                Object.entries(notifies).map(([ name, t ]) => {
                    const tick = t * 20
                    const place = Math.floor(tick * scale)
                    return `${TRACK_COLOR}${TRACK_STYLE.repeat(place)}${NOTIFY.COLOR}${NOTIFY.POINT_STYLE}${TRACK_COLOR}${TRACK_STYLE.repeat(Math.max(0, TRACK_WIDTH - place - 1))} ${TOKENS.R}${name}`
                }).join('\n') + '\n' +
                Object.entries(states).map(([ name, [ start, end ] ]) => {
                    const startTick = start * 20
                    const endTick = end * 20
                    const place = Math.floor(startTick * scale)
                    const stateLength = Math.floor((endTick - startTick) * scale)
                    return `${TRACK_COLOR}${TRACK_STYLE.repeat(place)}${STATE.BAR_COLOR}${STATE.BAR_STYLE_START}${STATE.BAR_STYLE.repeat(stateLength)}${STATE.BAR_STYLE_END}${TRACK_COLOR}${TRACK_STYLE.repeat(Math.max(0, TRACK_WIDTH - place - stateLength - 2))} ${TOKENS.R}${name}`
                }).join('\n')

            return text
        })
    }
}