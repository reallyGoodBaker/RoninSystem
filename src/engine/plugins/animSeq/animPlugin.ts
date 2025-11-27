import './autoImport'
import { Application, IApplication } from "@ronin/core/architect/application"
import { IPlugin } from "@ronin/core/architect/plugin"
import { registerPlayerComponent } from '../../core/architect/config'
import { AnimationSequenceComponent } from "./anim"
import { profiler } from "@ronin/core/profiler"
import { Entity } from "@minecraft/server"
import { CustomCommand, Param } from '@ronin/utils/command'
import { PROFIER_CONFIG } from '@ronin/config/profiler'
import { AnimPlayingType } from './sequence'

const { TOKENS } = PROFIER_CONFIG

function getAnimSeqComp(en: Entity) {
    return Application.getInst().getActor(en.id)?.getComponent(AnimationSequenceComponent)
}

export class AnimationSequencePlugin implements IPlugin {
    readonly name: string = 'animSeq'
    readonly description: string = '动画序列插件，用于管理动画'

    startModule(app: IApplication): void {
        registerPlayerComponent(
            AnimationSequenceComponent,
        )
    }

    @CustomCommand('查看动画层')
    anim_seq_layer(
        @Param.Required('actor') entities: Entity[],
        @Param.Optional('int') layer = 0,
    ) {
        entities.forEach(entity => {
            const animComp = getAnimSeqComp(entity)
            if (animComp) {
                profiler.info(...animComp.animLayers.getLayer(layer as any))
            }
        })
    }

    @CustomCommand('查看当前动画')
    anim_seq_playing(
        @Param.Required('actor') entities: Entity[],
        @Param.Optional('int') size = 20,
    ) {
        entities.forEach(entity => {
            const animComp = getAnimSeqComp(entity)
            if (animComp) {
                const animSeq = animComp.getPlayingAnimation()
                if (!animSeq) {
                    return
                }

                const { animation, duration, playingType, notifies, states } = animSeq
                const scale = size / duration
                const text = `${TOKENS.STR}${animation} ${TOKENS.ID}${AnimPlayingType[playingType]} ${TOKENS.NUM}${duration}${TOKENS.R} Ticks\n` +
                    `Playing: ${TOKENS.BOOL}${animSeq.isPlaying}${TOKENS.R} Finished: ${TOKENS.BOOL}${animSeq.finished}\n` +
                    Object.entries(notifies).map(([ name, t ]) => {
                        const tick = t * 20
                        const place = Math.floor(tick * scale)
                        return `${TOKENS.NUM}${'-'.repeat(place)}${TOKENS.CLASS}◆${TOKENS.NUM}${'-'.repeat(Math.max(0, size - place - 1))} ${TOKENS.R}${name}`
                    }).join('\n') + '\n' +
                    Object.entries(states).map(([ name, [ start, end ] ]) => {
                        const startTick = start * 20
                        const endTick = end * 20
                        const place = Math.floor(startTick * scale)
                        const stateLength = Math.floor((endTick - startTick) * scale)
                        return `${TOKENS.NUM}${'-'.repeat(place)}${TOKENS.CLASS}+${'-'.repeat(stateLength)}+${TOKENS.NUM}${'-'.repeat(Math.max(0, size - place - stateLength - 2))} ${TOKENS.R}${name}`
                    }).join('\n')
                profiler.info(text)
            }
        })
    }

    @CustomCommand('查看动画名称')
    anim_seq_defined(
        @Param.Required('actor') entities: Entity[],
    ) {
        entities.forEach(entity => {
            const animComp = getAnimSeqComp(entity)
            if (animComp) {
                profiler.info(animComp.getAnimationNames())
            }
        })
    }
}