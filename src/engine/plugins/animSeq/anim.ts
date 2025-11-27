import { Component } from '@ronin/core/architect/component'
import { AnimSequence, AnimSequenceCtor } from '@ronin/plugins/animSeq/sequence'
import { profiler } from '@ronin/core/profiler'


/**
 * 动画层
 * 
 * 工作方式：优先级从高到低，找到可播放的动画层，播放该层的动画。
 * 如果一个动画层内有多个动画，则同时混合播放所有该层内动画（动画的 override 不生效）。
 * 当更高优先级的动画层有动画播放时，低优先级动画层的动画会被中断。
 */
export class AnimLayers {
    private _layer0 = new Set<AnimSequence>()
    private _layer1 = new Set<AnimSequence>()
    private _layer2 = new Set<AnimSequence>()
    private readonly layers = [this._layer2, this._layer1, this._layer0]
    private _playingAnims: AnimSequence[] = []

    constructor(
        readonly animComp: AnimationSequenceComponent
    ) {}

    getLayer(index: 0 | 1 | 2) {
        return this[`_layer${index}`]
    }

    /**
     * animSeq 的 `override` 属性将会决定之前该层级播放的动画是否会被中断
     * @param animSeq 
     * @param layer 
     */
    playAnimSeq(animSeq: AnimSequence, layer: 0 | 1 | 2 = 0) {
        if (animSeq.override) {
            this.clearLayer(layer)
        }
        this[`_layer${layer}`].add(animSeq)
        const { promise, resolve } = Promise.withResolvers()
        animSeq.Onfinished.bind(resolve)
        this._playingAnims.push(animSeq)
        return promise
    }

    playAnimSeqList(layer: 0 | 1 | 2 = 0, ...animSeqList: AnimSequence[]) {
        for (const animSeq of animSeqList) {
            this.playAnimSeq(animSeq, layer)
        }
    }

    stopAnimSeq(animSeq: AnimSequence) {
        animSeq.stop()
        this._layer0.delete(animSeq)
        this._layer1.delete(animSeq)
        this._layer2.delete(animSeq)
    }

    clearLayer(layer: 0 | 1 | 2 = 0) {
        const animLayer = this[`_layer${layer}`]
        for (const animSeq of animLayer) {
            animSeq.stop()
        }

        animLayer.clear()
    }

    clearAll() {
        this.clearLayer(0)
        this.clearLayer(1)
        this.clearLayer(2)
    }

    update() {
        // 从高优先级到低优先级直到找到可播放的动画层
        const index = this.layers.findIndex(layer => this.proccedAnimLayer(layer))
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
        return this._layer0.values().next().value
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

    async playAnimation(animName: string, layer: 0 | 1 | 2 = 0) {
        const animSeq = AnimationSequenceComponent.animSeqRegistry.get(animName)
        if (animSeq) {
            await this.animLayers.playAnimSeq(this.getOrCreateAnimSeq(animSeq), layer)
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