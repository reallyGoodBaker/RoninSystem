import { Component } from '@ronin/core/architect/component'
import { AnimSequence, AnimSequenceCtor } from '@ronin/plugins/animSeq/sequence'


/**
 * 动画层
 * 
 * 工作方式：优先级从高到低，找到可播放的动画层，播放该层的动画。
 * 如果一个动画层内有多个动画，则同时混合播放所有该层内动画（动画的 override 不生效）。
 * 当更高优先级的动画层有动画播放时，低优先级动画层的动画会被中断。
 */
export class AnimLayers {
    private baseLayer = new Set<AnimSequence>()
    private overrideLayer = new Set<AnimSequence>()
    private readonly layers = [ this.overrideLayer, this.baseLayer ]
    private _playingAnims = new Set<AnimSequence>()

    constructor(
        readonly animComp: AnimationSequenceComponent
    ) {}

    getLayer(base=true) {
        return base ? this.baseLayer : this.overrideLayer
    }

    /**
     * animSeq 的 `override` 属性将会决定之前该层级播放的动画是否会被中断
     */
    playAnimSeq(animSeq: AnimSequence, base=true) {
        if (animSeq.override) {
            this.clearLayer(base)
        }

        this.getLayer(base).add(animSeq)
        const { promise, resolve } = Promise.withResolvers()
        const cb = (v: boolean) => {
            resolve(v)
            animSeq.Onfinished.off(cb)
        }
        animSeq.Onfinished.on(cb)
        this._playingAnims.add(animSeq)
        return promise
    }

    playAnimSeqList(layer=true, ...animSeqList: AnimSequence[]) {
        for (const animSeq of animSeqList) {
            this.playAnimSeq(animSeq, layer)
        }
    }

    stopAnimSeq(animSeq: AnimSequence) {
        animSeq.stop()
        this.getLayer(true).delete(animSeq)
        this.getLayer(false).delete(animSeq)
    }

    clearLayer(base=true) {
        const animLayer = this.getLayer(base)
        for (const animSeq of animLayer) {
            animSeq.stop()
        }

        animLayer.clear()
    }

    clearAll() {
        this.clearLayer(true)
        this.clearLayer(false)
    }

    update() {
        // 从高优先级到低优先级直到找到可播放的动画层
        const index = this.layers.findIndex(layer => this.proccedAnimLayer(layer))
        // TODO: 应该修改为暂停
        // 如果找到可播放的动画层，则停止该层之后的动画层
        const overridedAnimLayers = this.layers.slice(index + 1)
        overridedAnimLayers.forEach(layer => layer.forEach(seq => seq.stop()))
    }

    protected proccedAnimLayer(layer: Set<AnimSequence>) {
        if (!layer.size) {
            return false
        }

        for (const animSeq of layer) {
            if (animSeq.finished) {
                layer.delete(animSeq)
                animSeq.restore()
                continue
            }

            if (!animSeq.isPlaying) {
                animSeq.start(this)
                continue
            }

            animSeq.update(this)
        }

        return true
    }

    getPlayingAnimation() {
        return this._playingAnims.values().next().value
    }
}

export class AnimationSequenceComponent extends Component {
    readonly allowTicking: boolean = true
    readonly animLayers: AnimLayers = new AnimLayers(this)
    readonly animSeqs = new Map<AnimSequenceCtor, AnimSequence>()

    static readonly animSeqRegistry = new Map<string, AnimSequenceCtor>()

    update() {
        this.animLayers.update()
    }

    protected getOrCreateAnimSeq(cls: AnimSequenceCtor) {
        const animSeq = this.animSeqs.get(cls)
        if (!animSeq) {
            const seq = Reflect.construct(cls, []) as AnimSequence
            this.animSeqs.set(cls, seq)
            return seq
        }

        return animSeq
    }

    async playAnimSeq(animName: string, base=true) {
        const animSeq = AnimationSequenceComponent.animSeqRegistry.get(animName)
        if (animSeq) {
            await this.animLayers.playAnimSeq(this.getOrCreateAnimSeq(animSeq), base)
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