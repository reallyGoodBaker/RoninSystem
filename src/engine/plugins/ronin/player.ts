import { clampNumber } from "@minecraft/math"
import { EntityHealthComponent } from "@minecraft/server"
import { Pawn } from "@ronin/core/architect/pawn"

export enum DeterminationState {
    Sane = 0,
    Neutral = 1,
    Insane = 2
}

/**
 * ### 关于 `Sane` `Insane` `Neutral`:
 * - Sane: 决心 > 0，理智状态，可以正常使用所有战技（天，地，人，武器战技），10%伤害加成
 * - Neutral: 决心大于一定值，中立状态，可以正常使用所有战技，无伤害加成
 * - Insane: 决心小于一定值，无法使用部分战技（地，人），25%伤害加成，理智值开始恢复，受伤伤害提升10%
 * 
 * ### 决心的获得:
 * - 每次使用战技，根据战技损失一定决心
 * - 格挡成功损失一定决心
 * - 被击中损失一定决心
 * - 完美格挡获得一定决心
 * - 进入疯狂状态后，决心开始逐渐恢复
 * - 某些战技有特殊的决心恢复效果
 * - 某些战技有特殊的决心损失效果
 * - 闪避不消耗也不会获得决心
 * 
 * ### 关于决心的容量:
 * - 决心的容量取决于玩家的决心等级，当决心不够时使用战技有可能直接陷入疯狂状态
 * - 提升决心等级可以提升决心的容量
 * 
 * ### 关于理智:
 * - 理智值影响玩家的决心状态，理智值越高，越不容易陷入疯狂状态（即使决心等级很低）
 * - 理智最高 10 级，每提升一级，玩家进入疯狂的概率减少10%
 * - 理智达到最高等级时，玩家将难以进入疯狂状态
 */
export class RoninModPlayer extends Pawn {
    /**
     * ### 玩家血量
     */
    #health: number = 20

    get health(): number {
        return this.#health
    }

    set health(value: number) {
        const player = this.entity
        if (player) {
            const health = player.getComponent(EntityHealthComponent.componentId)!
            if (health.isValid) {
                const old = health.currentValue
                if (old === value) {
                    return
                }

                health.setCurrentValue(clampNumber(value, 0, 20))
            }
        }
    }

    /**
     * ### 玩家决心
     */
    #determination: number = 0
    #determLevel: number = 2
    
    get determLevel(): number {
        return this.#determLevel
    }

    set determLevel(value: number) {
        this.#determLevel = clampNumber(value, 2, 20)
    }

    upgradeDetermination() {
        this.determLevel += 1
    }

    downgradeDetermination() {
        this.determLevel -= 1
    }

    get determination(): number {
        return this.#determination
    }

    set determination(value: number) {
        this.#determination = clampNumber(value, -this.#determLevel, this.#determLevel)
    }

    resetDetermination() {
        this.#determination = 0
    }

    #mental = 1

    get mental(): number {
        return this.#mental
    }

    set mental(value: number) {
        this.#mental = clampNumber(value, 1, 10)
    }

    upgradeMental() {
        this.mental += 1
    }

    downgradeMental() {
        this.mental -= 1
    }

    isSane(): boolean {
        return this.#determination > 0
    }

    isNeutral(): boolean {
        return !this.isSane() && Math.abs(this.#determination) / this.#determLevel <= this.mental / 10
    }

    isInsane(): boolean {
        return !this.isSane() && !this.isNeutral()
    }

    get determinationState(): DeterminationState {
        if (this.isSane()) {
            return DeterminationState.Sane
        } else if (this.isNeutral()) {
            return DeterminationState.Neutral
        } else {
            return DeterminationState.Insane
        }
    }

    get damageMultiplier(): number {
        return this.isSane() ? 1.1
            : this.isNeutral() ? 1
                : 1.25
    }

    get hurtMultiplier(): number {
        return this.isInsane() ? 1.1 : 1
    }
}