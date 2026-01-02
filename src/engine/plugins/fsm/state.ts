import { Actor } from "@ronin/core/architect/actor"
import { Tag } from "@ronin/core/tag"

export enum TransitionTriggerType {
    OnEndOfState,
    OnEvent,
    OnAttributeChange,
    OnTagAdd,
    OnTagRemove,
    Custom,
}

export interface IStateTransition {
    readonly trigger: TransitionTriggerType
    readonly nextState: string
    canTransition?(actor: Actor): boolean
}

export interface StateEvent<O = any> {
    readonly instigator: Actor
    readonly data?: O
    readonly tag?: Tag
}

export interface StateEventTransition extends IStateTransition {
    readonly event: string
    readonly filter?: (owner: Actor, event: StateEvent) => boolean
}

export interface AttributeChangeTransition extends IStateTransition {
    readonly attribute: string
    readonly value: ValueMatcher<object>
}

export interface TagChangeTransition extends IStateTransition {
    readonly tag: Tag
}

export type StateTransition = StateEventTransition | AttributeChangeTransition | IStateTransition | TagChangeTransition
export type ValueMatcher<T> = T | ((value: T, old: T) => boolean)

export interface IStateDef {
    readonly name: string
    readonly duration?: number
    transitions: StateTransition[]

    enter?: (actor: Actor) => void
    exit?: (actor: Actor) => void
    update?: (actor: Actor) => void
    canEnter?: (actor: Actor) => boolean
}