import { SplineType } from "@ronin/utils/spline"
import { tags } from "../../config/tags"
import { SkillOptions } from "@ronin/gameplay/skill"
import { EffectModifyOperator, SkillEffect, SkillEffectType } from "@ronin/gameplay/effect"

export const DefaultSkillOptions: SkillOptions = {
    description: '',
    blockedTags: undefined,
    requireTags: undefined,
    ownedTags: undefined,
}

type SkillEffectConf = {
    operator: EffectModifyOperator,
    constValue: number,
    duration: number,
}

export const DefaultSkillEffect: SkillEffectConf = {
    operator: EffectModifyOperator.Set,
    constValue: 0,
    duration: 0,
}

export namespace SkillHelper {
    export function Until(id: string, duration: number, operator: EffectModifyOperator, value: number, attribute: string): SkillEffect {
        return {
            type: SkillEffectType.Duration,
            id,
            operator,
            duration,
            attribute,
            spline: {
                type: SplineType.Linear,
                points: [
                    { x: 0, y: 0 },
                    // 使曲线在duration处突变
                    { x: duration - Number.EPSILON, y: 0 },
                    { x: duration, y: value },
                    { x: Infinity, y: value },
                ]
            }
        }
    }

    /**
     * 延迟攻击 Effect，目的是允许玩家播放预先行动的动画，
     * 比如招架前的抬手动作，这样可以保证动画播放的流畅性，
     * 招架必须提前2tick播放，否则招架会抽帧
     */
    export function HealthDamage(value: number) {
        return Until(
            tags.damage.health.tag,
            2,
            EffectModifyOperator.Subtract,
            value,
            'health'
        )
    }

    export function DeterminationDamage(value: number): SkillEffect {
        return {
            id: tags.damage.determination.tag,
            type: SkillEffectType.Instant,
            constValue: value,
            operator: EffectModifyOperator.Subtract,
            attribute: 'determination',
        }
    }
}