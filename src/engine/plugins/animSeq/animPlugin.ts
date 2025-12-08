import './autoImport'
import { Application, IApplication } from "@ronin/core/architect/application"
import { IPlugin } from "@ronin/core/architect/plugin"
import { registerPlayerComponent } from '../../core/architect/config'
import { AnimationSequenceComponent } from "./anim"
import { profiler } from "@ronin/core/profiler"
import { Entity } from "@minecraft/server"
import { CustomCommand, Param } from '@ronin/utils/command'


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

    static getAnimSeqComp(id: string) {
        return Application.getInst().getActor(id)?.getComponent(AnimationSequenceComponent)
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
                profiler.info(animSeq)
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