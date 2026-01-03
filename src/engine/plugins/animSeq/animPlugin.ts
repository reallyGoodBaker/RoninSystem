import './autoImport'
import { Application, IApplication } from "@ronin/core/architect/application"
import { IPlugin } from "@ronin/core/architect/plugin"
import { registerPlayerComponent } from '../../core/architect/config'
import { AnimationSequenceComponent } from "./anim"
import { profiler } from "@ronin/core/profiler"
import { Entity } from "@minecraft/server"
import { CustomCommand, Param } from '@ronin/utils/command'
import { Actor } from '@ronin/core/architect/actor'
import { Component } from '@ronin/core/architect/component'
import { ActionBarComponent } from '@ronin/hud/screenDisplay'
import { MessageBlock } from '@ronin/hud/messageBlock'
import { AnimSequence } from './sequence'


function getAnimSeqComp(en: Entity) {
    return Application.getInst().getActor(en.id)?.getComponent(AnimationSequenceComponent)
}

export class AnimationSequenceDisplayComponent extends Component {
    animMessage?: MessageBlock
    allowTicking: boolean = true

    constructor(
        readonly actionBar: ActionBarComponent,
        readonly animComp: AnimationSequenceComponent,
    ) {
        super()
    }

    start(): void {
        const actionBar = this.actor.getComponent(ActionBarComponent)
        const animComp = this.actor.getComponent(AnimationSequenceComponent)
        if (!actionBar || !animComp) {
            this.remove()
            return
        }

        this.animMessage = actionBar.message.createBlock('ActionBar.AnimSeq', '')
    }

    detach(): void {
        this.actionBar.message.removeContentById('ActionBar.AnimSeq')
    }

    update(): void {
        if (this.animMessage) {
            const anim = this.animComp.animLayers.getPlayingAnimation()
            this.animMessage.text = '\nAnim: ' + (anim ? AnimSequence.formatAnimSeq(anim) : 'None')
        }
    }
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
        @Param.Required('entity') entities: Entity[],
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
        @Param.Required('entity') entities: Entity[],
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
        @Param.Required('entity') entities: Entity[],
    ) {
        entities.forEach(entity => {
            const animComp = getAnimSeqComp(entity)
            if (animComp) {
                profiler.info(animComp.getAnimationNames())
            }
        })
    }

    @CustomCommand('添加 Animation Sequence 监控视图到 Action Bar')
    hud_anim_seq(
        @Param.Required('actor') actors: Actor[],
        @Param.Required('bool') enable = true,
        @Param.Origin origin: Param.Origin,
        @Param.App app: IApplication,
    ) {
        const actor = actors[0]
        const instigator = app.getActor(origin.sourceEntity!.id)
        if (!instigator) {
            return profiler.error(`操作者没有绑定 Actor`)
        }

        if (!enable) {
            return instigator.removeComponent(AnimationSequenceDisplayComponent)
        }

        const actionBar = instigator.getComponent(ActionBarComponent)
        const animComp = actor.getComponent(AnimationSequenceComponent)
        if (!actionBar || !animComp) {
            return profiler.error(`操作者没有绑定 ActionBar 或被检测对象没有 AnimationSequenceComponent 组件`)
        }

        instigator.addComponent(new AnimationSequenceDisplayComponent(actionBar, animComp))
    }
}

export namespace anim {
    export function playSequence(actor: Actor, name: string, base = true) {
        return AnimationSequencePlugin.getAnimSeqComp(actor.id)?.playAnimation(name, base)
    }

    export function stopSequence(actor: Actor, name: string) {
        return AnimationSequencePlugin.getAnimSeqComp(actor.id)?.stopAnimation(name)
    }
}