import { system } from "@minecraft/server"
import { ReflectConfig } from "@ronin/core/architect/reflect"
import { DefaultSkillOptions } from "@ronin/utils/helpers/skillHelper"
import { Tag } from "@ronin/core/tag"
import { SplineHelper } from '@ronin/utils/spline'
import { DefaultSkillEffect } from "@ronin/utils/helpers/skillHelper"
import { EffectModifyOperator, SkillEffect, SkillEffectType, TaggedObjectOptions } from "./effect"
import { Actor } from "@ronin/core/architect/actor"
import { Component } from "@ronin/core/architect/component"
import { ConstructorOf } from '../core/types'

export abstract class Skill {
    constructor(
        readonly options: SkillOptions = {}
    ) {}

    getOption<K extends keyof SkillOptions>(key: K): Exclude<SkillOptions[K], undefined> {
        return (this.options[key] ?? DefaultSkillOptions[key]) as any
    }

    /**
     * 不要在 `Component.start()`, `Component.update()` 生命周期以外使用这个变量
     * 这个变量只在以上两个生命周期内有效
     * 若需要长期持有当前 `contextActor`, 请使用 `Reflect.contextActorRef()`
     */
    get actor() {
        return ReflectConfig.unsafeCtxActor()
    }

    /**
     * @override
     * 
     * 技能被选中时调用，使用这个方法来检查技能能否执行等。
     * `canActivateSkill` 若存在，则其返回值会决定 `commitSkill` 是否被调用
     */
    canActivateSkill?(skillSystem: SkillSystemComponent): boolean

    /**
     * @override
     * 
     * 技能效果的实现。
     */
    commitSkill?(skillSystem: SkillSystemComponent): void

    /**
     * @override
     * 
     * 技能被意外终止时调用。
     */
    cancelSkill?(skillSystem: SkillSystemComponent): void

    /**
     * @override
     * 
     * 技能结束时调用。
     */
    endSkill?(skillSystem: SkillSystemComponent, canceled: boolean): void
}

export abstract class SkillWithEvent extends Skill {
    abstract getTag(): Tag
    /**
     * @override
     * 由 `activateSkillWithEvent` 触发
     */
    activateFromEvent?<S extends Actor, T, E extends SkillEvent<S, T>>(ev: E): void
}

export interface SkillOptions extends TaggedObjectOptions {
    description?: string
}

export interface SkillEvent<S = Actor, T = unknown> {
    source: S
    target: T
}

enum SkillState {
    Ready,
    Active,
    Ended,
}

interface SkillRuntime {
    state: SkillState
    event?: SkillEvent
    canceled: boolean
}

interface SkillEffectData {
    startTick: number
    remains: number
    update?(): void
}

export interface SkillSpec {
    lifeTime?: 'active' | 'actor' | 'global'
    skill: ConstructorOf<Skill | SkillWithEvent, []>
    variant?: number
    grantedTags?: Tag[]
}

export class SkillSystemComponent extends Component {
    protected readonly skills = new Set<SkillSpec>()
    protected readonly instancedSkills = new WeakMap<SkillSpec, Skill>()
    protected readonly skillRuntimes = new WeakMap<SkillSpec, SkillRuntime>()
    protected readonly taggedSkills = new Map<Tag, SkillSpec>()
    protected readonly appliedEffects = new Map<SkillEffect, SkillEffectData>()

    giveSkill(skill: SkillSpec) {
        if (this.skills.has(skill)) {
            return
        }

        this.skills.add(skill)
        this.skillRuntimes.set(skill, {
            state: SkillState.Ready,
            canceled: false,
        })

        if (Array.isArray(skill.grantedTags)) {
            this.actor.addTags(skill.grantedTags)   
        }
    }

    removeSkill<T extends SkillSpec>(skill: T) {
        this.skills.delete(skill)
        this.skillRuntimes.delete(skill)
        this.actor.removeTags(skill?.grantedTags ?? [])
        const skillInst = this.instancedSkills.get(skill)
        if (skillInst && (skillInst as SkillWithEvent).getTag) {
            const tag = (skillInst as SkillWithEvent).getTag()
            this.taggedSkills.delete(tag)
        }
    }

    private _resetSkill(skill: SkillSpec) {
        const runtime = this._getSkillRuntime(skill)
        runtime.state = SkillState.Ready
        runtime.event = undefined
        runtime.canceled = false
    }

    protected checkTaggedObject({ requireTags, blockedTags }: TaggedObjectOptions) {
        if (requireTags && !this.actor.hasTagAll(requireTags)) {
            return false
        }

        if (blockedTags && this.actor.hasTagAny(blockedTags)) {
            return false
        }

        return true
    }

    protected applyTaggedObject({ ownedTags }: TaggedObjectOptions) {
        if (ownedTags) {
            this.actor.addTags(ownedTags)
        }
    }

    protected revokeTaggedObject({ ownedTags }: TaggedObjectOptions) {
        if (ownedTags) {
            this.actor.removeTags(ownedTags)
        }
    }

    private _canSkillActivate(skill: SkillSpec) {
        const skillInst = this.instancedSkills.get(skill)
        if (!skillInst) {
            return
        }

        const { options, canActivateSkill } = skillInst
        const executeState = this._getSkillRuntime(skill).state

        // 生命周期检查
        if (executeState !== SkillState.Ready) {
            if (executeState === SkillState.Ended) {
                this._resetSkill(skill)
                return true
            }

            return false
        }

        // 标签检查
        if (!this.checkTaggedObject(options)) {
            return false
        }

        // 自定义检查
        if (canActivateSkill) {
            return canActivateSkill.call(skill, this)
        }

        return true
    }

    private _getSkillRuntime(skill: SkillSpec) {
        const rt = this.skillRuntimes.get(skill)
        if (!rt) {
            throw new Error(`Skill ${skill} is not registered`)
        }

        return rt
    }

    private _getOrCreateInstancedSkill(skill: SkillSpec): Skill | SkillWithEvent {
        let skillInst = this.instancedSkills.get(skill)
        if (!skillInst) {
            skillInst = Reflect.construct(skill.skill, [])
            this.instancedSkills.set(skill, skillInst)
        }

        return skillInst
    }

    private _tryDeinstantiate(skill: SkillSpec) {
        this.instancedSkills.delete(skill)
        if (skill.lifeTime === 'active' && Array.isArray(skill.grantedTags)) {
            this.actor.removeTags(skill.grantedTags)
        }
    }

    tryActivateSkill(skill: SkillSpec) {
        const skillInst = this._getOrCreateInstancedSkill(skill)

        if (this.skills.has(skill) && this._canSkillActivate(skill)) {
            try {
                skillInst.commitSkill?.call(skillInst, this)
                const runtime = this._getSkillRuntime(skill)
                runtime.state = SkillState.Active
            } catch {
                this.endSkill(skill)
            }
        }
    }

    activateSkillWithEvent<E extends SkillEvent>(tag: Tag, ev: E) {
        const skillSpec = this.taggedSkills.get(tag)
        if (!skillSpec) {
            return
        }

        const skill = this._getOrCreateInstancedSkill(skillSpec) as SkillWithEvent
        if (skill && this._canSkillActivate(skillSpec)) {
            try {
                skill.commitSkill?.call(skill, this)
                skill.activateFromEvent?.call(skill, ev)
                const runtime = this._getSkillRuntime(skillSpec)
                runtime.state = SkillState.Active
            } catch {
                this.endSkill(skillSpec)
            }
        }
    }

    registerTaggedEvent(tag: Tag, skill: SkillSpec) {
        if (this.skills.has(skill)) {
            this.taggedSkills.set(tag, skill)
        }
    }

    unregisterTaggedEvent(tag: Tag) {
        this.taggedSkills.delete(tag)
    }

    cancelSkill(skillSpec: SkillSpec) {
        if (this.skills.has(skillSpec)) {
            const skill = this._getOrCreateInstancedSkill(skillSpec)
            skill.cancelSkill?.call(skill, this)
            skill.endSkill?.call(skill, this, true)
            this.revokeTaggedObject(skill.options)
            const runtime = this._getSkillRuntime(skillSpec)
            runtime.state = SkillState.Ended
            runtime.canceled = true
            this._tryDeinstantiate(skillSpec)
        }
    }

    endSkill(skillSpec: SkillSpec) {
        if (this.skills.has(skillSpec)) {
            const skill = this._getOrCreateInstancedSkill(skillSpec)
            skill.endSkill?.call(skill, this, false)
            this.revokeTaggedObject(skill.options)
            const runtime = this._getSkillRuntime(skillSpec)
            runtime.state = SkillState.Ended
            this._tryDeinstantiate(skillSpec)
        }
    }

    getAppliedEffect(effectId: string) {
        return this.appliedEffects.keys().find(e => e.id === effectId)
    }

    getAppliedEffects() {
        return this.appliedEffects.keys()
    }

    applySkillEffect<A>(effect: SkillEffect, attributeSet: A) {
        // 标签检查
        if (!this.checkTaggedObject(effect)) {
            return
        }

        // 为非即时效果添加运行时数据
        if (effect.type !== SkillEffectType.Instant) {
            this.appliedEffects.set(effect, {
                startTick: system.currentTick,
                remains: effect.duration ?? DefaultSkillEffect.duration,
            })
        }

        // 当技能效果不涉及数据时，直接执行 `executeEffect`
        if (effect.type === SkillEffectType.None) {
            this.applyTaggedObject(effect)
            effect?.executeEffect?.call(effect, this.actor, attributeSet)
            this.revokeTaggedObject(effect)
            return
        }

        // 检查属性是否存在
        if (!effect.attribute) {
            throw new Error(`Effect ${effect} does not have an attribute`)
        }

        this.applyTaggedObject(effect)

        switch (effect.type) {
            case SkillEffectType.Instant:
                this._applyInstantEffect(effect, attributeSet)
                break

            case SkillEffectType.Infinite:
                this._applyInfiniteEffect(effect, attributeSet)
                break

            case SkillEffectType.Duration:
                this._applyDurationEffect(effect, attributeSet)
                break
        }
    }

    removeSkillEffect(effect: SkillEffect) {
        const data = this.appliedEffects.get(effect)
        if (data) {
            this.appliedEffects.delete(effect)
            this.revokeTaggedObject(effect)
            delete data.update
        }
    }

    static readonly Modifiers = {
        [EffectModifyOperator.Add]: (a: number, b: number) => a + b,
        [EffectModifyOperator.Subtract]: (a: number, b: number) => a - b,
        [EffectModifyOperator.Scale]: (a: number, b: number) => a * b,
        [EffectModifyOperator.Set]: (_: unknown, b: number) => b,
    }

    protected getAttrValue(old: number, val?: number, op?: EffectModifyOperator) {
        return SkillSystemComponent.Modifiers[op ?? DefaultSkillEffect.operator](old, (val ?? DefaultSkillEffect.constValue) as number) as number
    }

    private _applyInstantEffect(effect: SkillEffect, attributeSet: any) {
        const { constValue, attribute, operator, executeEffect } = effect
        attributeSet[attribute!] = this.getAttrValue(
            attributeSet[attribute!],
            constValue ?? DefaultSkillEffect.constValue,
            operator
        )
        executeEffect?.call(effect, this.actor, attributeSet)

        // 及时效果不会通过 `removeSkillEffect` 移除，因此需要手动移除
        this.revokeTaggedObject(effect)
    }

    private _applyInfiniteEffect(effect: SkillEffect, attributeSet: any) {
        const { constValue, attribute, operator, executeEffect } = effect
        const effectData = this.appliedEffects.get(effect)
        if (!effectData) {
            throw new Error(`Effect ${effect} is not registered`)
        }

        const update = () => {
            attributeSet[attribute!] = this.getAttrValue(
                attributeSet[attribute!],
                constValue ?? DefaultSkillEffect.constValue,
                operator
            )
            executeEffect?.call(effect, this.actor, attributeSet)
        }

        effectData.startTick = system.currentTick
        effectData.remains = Infinity
        effectData.update = update

        update()
    }

    private _applyDurationEffect(effect: SkillEffect, attributeSet: any) {
        const { duration, attribute, operator, executeEffect, spline } = effect
        const effectData = this.appliedEffects.get(effect)
        if (!effectData) {
            throw new Error(`Effect ${effect} is not registered`)
        }

        if (!spline || !duration) {
            throw new Error(`Effect ${effect} is missing spline or duration`)
        }

        const attr = attributeSet.getAttribute(attribute!)
        const benchmark = attr.value as number
        const update = () => {
            if (system.currentTick > effectData.startTick + duration) {
                this.removeSkillEffect(effect)
                return
            }

            const dv = SplineHelper.interpolate2(spline, (system.currentTick - effectData.startTick) / duration)
            attributeSet[attribute!] = this.getAttrValue(
                benchmark,
                dv.y,
                operator,
            )
            executeEffect?.call(effect, this.actor, attributeSet)
        }

        effectData.startTick = system.currentTick
        effectData.remains = duration ?? DefaultSkillEffect.duration
        effectData.update = update

        update()
    }
}