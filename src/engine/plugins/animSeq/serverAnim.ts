/**
 * 动画序列系统 - 解决 Minecraft Bedrock 动画 JSON 无法动态修改的问题
 * 
 * 通过动画控制器和序列管理，实现动态动画播放控制
 */

import { world, system } from '@minecraft/server'

// 动画序列状态
export enum AnimSeqState {
    IDLE = 'idle',
    PLAYING = 'playing',
    PAUSED = 'paused',
    COMPLETED = 'completed'
}

// 动画序列配置
export interface AnimSequence {
    id: string
    animations: string[]
    loop: boolean
    transitionTime?: number
    onComplete?: () => void
    onStart?: () => void
}

// 动画序列实例
export class AnimationSequence {
    private currentIndex: number = 0
    private state: AnimSeqState = AnimSeqState.IDLE
    private player: any
    private sequence: AnimSequence
    private currentAnim: string | null = null

    constructor(player: any, sequence: AnimSequence) {
        this.player = player
        this.sequence = sequence
    }

    // 开始播放序列
    start(): void {
        if (this.state !== AnimSeqState.IDLE) return

        this.state = AnimSeqState.PLAYING
        this.currentIndex = 0
        this.sequence.onStart?.()
        this.playCurrentAnimation()
    }

    // 停止序列
    stop(): void {
        if (this.currentAnim) {
            this.stopAnimation(this.currentAnim)
        }
        this.state = AnimSeqState.IDLE
        this.currentAnim = null
    }

    // 暂停序列
    pause(): void {
        if (this.state === AnimSeqState.PLAYING) {
            this.state = AnimSeqState.PAUSED
            if (this.currentAnim) {
                this.stopAnimation(this.currentAnim)
            }
        }
    }

    // 恢复序列
    resume(): void {
        if (this.state === AnimSeqState.PAUSED) {
            this.state = AnimSeqState.PLAYING
            this.playCurrentAnimation()
        }
    }

    // 播放当前动画
    private playCurrentAnimation(): void {
        if (this.currentIndex >= this.sequence.animations.length) {
            this.completeSequence()
            return
        }

        const animName = this.sequence.animations[this.currentIndex]
        this.currentAnim = animName

        // 播放 Minecraft 动画
        try {
            this.player.playAnimation(animName)

            // 监听动画完成
            this.setupAnimationCompleteListener(animName)
        } catch (error) {
            console.warn(`无法播放动画: ${animName}`, error)
            this.nextAnimation()
        }
    }

    // 设置动画完成监听器
    private setupAnimationCompleteListener(animName: string): void {
        // 在 Minecraft Bedrock 中，我们需要通过其他方式检测动画完成
        // 这里使用定时器模拟，实际实现可能需要根据动画长度计算
        const animConfig = this.getAnimationConfig(animName)
        const duration = animConfig?.animation_length || 1.0

        system.runTimeout(() => {
            if (this.currentAnim === animName && this.state === AnimSeqState.PLAYING) {
                this.nextAnimation()
            }
        }, duration * 20) // 转换为 ticks (1秒 = 20 ticks)
    }

    // 获取动画配置
    private getAnimationConfig(animName: string): any {
        // 这里可以根据 animName 返回动画的配置信息
        // 例如从预定义的动画数据中获取时长等信息
        const animationConfigs: Record<string, any> = {
            'animation.general.stand': { animation_length: 1.0 },
            'animation.general.hit.vertical': { animation_length: 1.0 },
            'animation.general.parried.right': { animation_length: 2.0 },
            'animation.general.fell': { animation_length: 1.75 },
            // 添加更多动画配置...
        }

        return animationConfigs[animName]
    }

    // 播放下一个动画
    private nextAnimation(): void {
        this.currentIndex++

        if (this.currentIndex >= this.sequence.animations.length) {
            if (this.sequence.loop) {
                this.currentIndex = 0
                this.playCurrentAnimation()
            } else {
                this.completeSequence()
            }
        } else {
            this.playCurrentAnimation()
        }
    }

    // 停止动画
    private stopAnimation(animName: string): void {
        try {
            this.player.stopAnimation(animName)
        } catch (error) {
            // 忽略停止动画时的错误
        }
    }

    // 完成序列
    private completeSequence(): void {
        this.state = AnimSeqState.COMPLETED
        this.sequence.onComplete?.()
        this.currentAnim = null
    }

    // 获取当前状态
    getState(): AnimSeqState {
        return this.state
    }

    // 获取当前动画
    getCurrentAnimation(): string | null {
        return this.currentAnim
    }

    // 获取进度
    getProgress(): number {
        return this.currentIndex / this.sequence.animations.length
    }
}

// 动画序列管理器
export class AnimSeqManager {
    private sequences: Map<string, AnimationSequence> = new Map()
    private playerSequences: Map<string, string[]> = new Map()

    // 为玩家创建动画序列
    createSequence(player: any, sequence: AnimSequence): string {
        const animSeq = new AnimationSequence(player, sequence)
        const sequenceId = `${player.id}_${sequence.id}_${Date.now()}`

        this.sequences.set(sequenceId, animSeq)

        // 记录玩家的序列
        const playerId = player.id
        if (!this.playerSequences.has(playerId)) {
            this.playerSequences.set(playerId, [])
        }
        this.playerSequences.get(playerId)!.push(sequenceId)

        return sequenceId
    }

    // 开始播放序列
    startSequence(sequenceId: string): boolean {
        const sequence = this.sequences.get(sequenceId)
        if (sequence && sequence.getState() === AnimSeqState.IDLE) {
            sequence.start()
            return true
        }
        return false
    }

    // 停止序列
    stopSequence(sequenceId: string): boolean {
        const sequence = this.sequences.get(sequenceId)
        if (sequence) {
            sequence.stop()
            return true
        }
        return false
    }

    // 暂停序列
    pauseSequence(sequenceId: string): boolean {
        const sequence = this.sequences.get(sequenceId)
        if (sequence && sequence.getState() === AnimSeqState.PLAYING) {
            sequence.pause()
            return true
        }
        return false
    }

    // 恢复序列
    resumeSequence(sequenceId: string): boolean {
        const sequence = this.sequences.get(sequenceId)
        if (sequence && sequence.getState() === AnimSeqState.PAUSED) {
            sequence.resume()
            return true
        }
        return false
    }

    // 获取序列状态
    getSequenceState(sequenceId: string): AnimSeqState | null {
        const sequence = this.sequences.get(sequenceId)
        return sequence ? sequence.getState() : null
    }

    // 清理玩家的所有序列
    cleanupPlayerSequences(playerId: string): void {
        const sequenceIds = this.playerSequences.get(playerId) || []
        sequenceIds.forEach(sequenceId => {
            this.sequences.get(sequenceId)?.stop()
            this.sequences.delete(sequenceId)
        })
        this.playerSequences.delete(playerId)
    }

    // 获取所有活跃序列
    getActiveSequences(): string[] {
        return Array.from(this.sequences.keys())
    }
}

// 全局动画序列管理器实例
export const animSeqManager = new AnimSeqManager()

// 预定义动画序列
export const PredefinedSequences = {
    // 攻击连招序列
    COMBO_ATTACK: (player: any): AnimSequence => ({
        id: 'combo_attack',
        animations: [
            'animation.general.hit.right',
            'animation.general.hit.left',
            'animation.general.hit.middle'
        ],
        loop: false,
        transitionTime: 0.1,
        onComplete: () => {
            console.log(`玩家 ${player.name} 完成连招攻击`)
        },
        onStart: () => {
            console.log(`玩家 ${player.name} 开始连招攻击`)
        }
    }),

    // 防御序列
    DEFENSE_SEQUENCE: (player: any): AnimSequence => ({
        id: 'defense_sequence',
        animations: [
            'animation.general.blocked.right',
            'animation.general.parried.right'
        ],
        loop: false,
        onComplete: () => {
            console.log(`玩家 ${player.name} 完成防御动作`)
        }
    }),

    // 倒地序列
    FALL_SEQUENCE: (player: any): AnimSequence => ({
        id: 'fall_sequence',
        animations: [
            'animation.general.fell',
            'animation.general.fell.onGround'
        ],
        loop: false,
        onComplete: () => {
            console.log(`玩家 ${player.name} 完成倒地动作`)
        }
    })
}

// 工具函数
export class AnimSeqUtils {
    // 检查动画是否存在
    static async checkAnimationExists(animName: string): Promise<boolean> {
        // 这里可以添加实际的动画存在性检查逻辑
        // 目前返回 true 假设动画存在
        return true
    }

    // 获取动画时长
    static getAnimationDuration(animName: string): number {
        const configs: Record<string, number> = {
            'animation.general.stand': 1.0,
            'animation.general.hit.vertical': 1.0,
            'animation.general.parried.right': 2.0,
            'animation.general.fell': 1.75,
            'animation.general.hit.right': 0.75,
            'animation.general.hit.left': 0.75,
            'animation.general.hit.middle': 0.75,
            'animation.general.blocked.right': 1.0,
            'animation.general.blocked.left': 1.0
        }

        return configs[animName] || 1.0
    }

    // 创建自定义序列
    static createCustomSequence(
        player: any,
        animNames: string[],
        options: Partial<AnimSequence> = {}
    ): string {
        const sequence: AnimSequence = {
            id: options.id || `custom_${Date.now()}`,
            animations: animNames,
            loop: options.loop || false,
            transitionTime: options.transitionTime,
            onComplete: options.onComplete,
            onStart: options.onStart
        }

        return animSeqManager.createSequence(player, sequence)
    }
}

// 导出默认实例
export default animSeqManager
