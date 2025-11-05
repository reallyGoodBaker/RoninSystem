import { Actor } from "@ronin/core/architect/actor"
import { Tag } from "@ronin/core/tag"
import { Spline2D } from "@ronin/utils/spline"

export enum EffectModifyOperator {
    Add = 'add',
    Subtract = 'subtract',
    Scale = 'scale',
    Set = 'set',
}

export enum SkillEffectType {
    None,
    Instant,
    Infinite,
    Duration,
}

export interface TaggedObjectOptions {
    /**
     * 在object被应用时添加的tag
     * 在object被废除时移除
     */
    ownedTags?: Tag[]

    /**
     * 应用object时需要满足的tag
     */
    requireTags?: Tag[]

    /**
     * 应用object期间无法添加的tag
     */
    blockedTags?: Tag[]
}

export interface SkillEffect extends TaggedObjectOptions {
    id: string
    type: SkillEffectType
    /**
     * 技能的持续时间
     * `type` 为 `Duration` 时有效
     * 单位为刻
     */
    duration?: number
    /**
     * 数据修改的值
     * 当 `type` 不为 `Duration` 时，会直接使用这个值
     */
    constValue?: number
    /**
     * 持续时间中的数据修改曲线
     * `type` 为 `Duration` 时有效
     */
    spline?: Spline2D
    /**
     * 数据修改操作符
     */
    operator?: EffectModifyOperator
    /**
     * 数据修改的属性
     */
    attribute?: string

    /**
     * 在 `SkillEffect` 生效时每刻调用一次
     * @param actor 
     * @param attributeSet 
     */
    executeEffect?(actor: Actor, attributeSet: unknown): void
}