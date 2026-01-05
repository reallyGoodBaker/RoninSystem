import { Component } from '@ronin/core/architect/component'
import { AnimSequence, AnimSequenceCtor } from '@ronin/plugins/animSeq/sequence'


/**
 * 简化的动画层管理器
 * 优先级：overrideLayer > baseLayer
 */
export class AnimLayers {
    private readonly layers = {
        override: new Set<AnimSequence>(),
        base: new Set<AnimSequence>()
    }

    constructor(readonly animComp: AnimationSequenceComponent) {}

    /**
     * 播放动画序列
     */
    async playAnimation(animSeq: AnimSequence, base = true) {
        if (!base) {
            this.layers.base.forEach(seq => seq.stop())
        }

        const layer = base ? this.layers.base : this.layers.override
        layer.add(animSeq)

        const { promise, resolve } = Promise.withResolvers<boolean>()
        const onFinish = (canceled: boolean) => {
            resolve(canceled)
            animSeq.Onfinished.off(onFinish)
        }
        animSeq.Onfinished.on(onFinish)
        
        return promise
    }

    getLayer(base=true) {
        return base ? this.layers.base : this.layers.override
    }

    /**
     * 播放多个动画序列
     */
    playAnimSeqList(base = true, ...animSeqList: AnimSequence[]) {
        return Promise.all(animSeqList.map(seq => this.playAnimation(seq, base)))
    }

    /**
     * 停止指定动画序列
     */
    stopAnimSeq(animSeq: AnimSequence) {
        animSeq.stop()
        this.layers.base.delete(animSeq)
        this.layers.override.delete(animSeq)
    }

    /**
     * 清空指定层
     */
    clearLayer(base = true) {
        const layer = base ? this.layers.base : this.layers.override
        layer.forEach(seq => seq.stop())
        layer.clear()
    }

    /**
     * 清空所有层
     */
    clearAll() {
        this.clearLayer(true)
        this.clearLayer(false)
    }


    update() {
        // 按优先级处理图层
        // 当 override 存在时，base不处理
        if (this.processLayer(this.layers.override)) return
        this.processLayer(this.layers.base)
    }

    /**
     * 处理单个动画层
     */
    private processLayer(layer: Set<AnimSequence>): boolean {
        if (layer.size === 0) return false

        const toDelete = new Set<AnimSequence>()
        for (const animSeq of layer) {
            if (animSeq.finished) {
                toDelete.add(animSeq)
                animSeq.restore()
                continue
            }

            if (!animSeq.isPlaying) {
                animSeq.start(this)
            } else {
                animSeq.update(this)
            }
        }

        for (const animSeq of toDelete) {
            layer.delete(animSeq)
        }

        return true
    }

    /**
     * 获取当前播放的动画（最高优先级）
     */
    getPlayingAnimation() {
        return this.layers.override.values().next().value || 
               this.layers.base.values().next().value
    }
}

export class AnimationSequenceComponent extends Component {
    readonly allowTicking: boolean = true
    readonly animLayers: AnimLayers = new AnimLayers(this)
    readonly animSeqs = new Map<AnimSequenceCtor, AnimSequence>()

    static readonly animSeqRegistry = new Map<string, AnimSequenceCtor>()

    static hasAnimation(animName: string) {
        return AnimationSequenceComponent.animSeqRegistry.has(animName)
    }

    update() {
        this.animLayers.update()
    }

    protected getOrCreateAnimSeq(cls: AnimSequenceCtor) {
        const animSeq = this.animSeqs.get(cls)
        if (!animSeq) {
            const seq = Reflect.construct(cls, [ this.animLayers ]) as AnimSequence
            this.animSeqs.set(cls, seq)
            return seq
        }

        return animSeq
    }

    async playAnimation(animName: string, base=true) {
        const animSeq = AnimationSequenceComponent.animSeqRegistry.get(animName)
        if (animSeq) {
            await this.animLayers.playAnimation(this.getOrCreateAnimSeq(animSeq), base)
        }
    }

    stopAnimation(animName: string) {
        const animSeq = AnimationSequenceComponent.animSeqRegistry.get(animName)
        if (animSeq) {
            this.animLayers.stopAnimSeq(this.getOrCreateAnimSeq(animSeq))
        }
    }

    getAnimation(animName: string) {
        const ctor = AnimationSequenceComponent.animSeqRegistry.get(animName)
        return ctor ? this.getOrCreateAnimSeq(ctor) : null
    }

    getAnimationNames() {
        return Array.from(AnimationSequenceComponent.animSeqRegistry.keys())
    }

    clearAnimation() {
        this.animLayers.clearAll()
    }

    getPlayingAnimation() {
        return this.animLayers.getPlayingAnimation()
    }

}

export function AnimationSequence(cls: AnimSequenceCtor) {
    AnimationSequenceComponent.animSeqRegistry.set(cls.animation, cls)
}
