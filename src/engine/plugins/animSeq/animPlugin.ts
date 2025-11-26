import { IApplication } from "@ronin/core/architect/application"
import { IPlugin } from "@ronin/core/architect/plugin"
import { registerPlayerComponent } from '../../core/architect/config'
import { AnimationSequenceComponent } from "./anim"

export class AnimationSequencePlugin implements IPlugin {
    readonly name: string = 'animSeq'
    readonly description: string = '动画序列插件，用于管理动画'

    startModule(app: IApplication): void {
        registerPlayerComponent(
            AnimationSequenceComponent,
        )
    }
}

// AUTO APPEND, DO NOT REMOVE THIS LINE
import '@/generated/ss/marieK'