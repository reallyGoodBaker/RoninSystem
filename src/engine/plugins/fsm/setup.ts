import { Actor } from "@ronin/core/architect/actor"
import type { IStateMachineDefination } from "./stateMachine"

const stateMachineDefs = new Map<Function, IStateMachineDefination>()
const stateMachineMapping = new Map<string, IStateMachineDefination>()

function getOrCreate(cls: Function) {
    let def = stateMachineDefs.get(cls)
    if (def) {
        return def
    }

    def = {} as IStateMachineDefination
    stateMachineDefs.set(cls, def)
    return def
}

export function getStateMachineDef(id: string) {
    return stateMachineMapping.get(id)
}

export function StateMachineTemplate(
    stateMachineId: string,
    rootState: string,
    inherits: string[] = []
): ClassDecorator {
    return (target: any) => {
        const def = getOrCreate(target)
        def.id = stateMachineId
        def.rootState = rootState
        def.inherits = inherits
        def.states = {}
        stateMachineMapping.set(stateMachineId, def)
    }
}

let contextStateMachineDef: IStateMachineDefination | null = null
let contextStateName: string | null = null

export function StateDef(duration: number=0) {
    return (t: any, p: string) => {
        const stateMachine = getOrCreate(t.constructor)

        contextStateMachineDef = stateMachine
        contextStateName = p
        contextStateMachineDef.states[p] = {
            name: p,
            duration,
        } as any

        const setupHandler = t[p as keyof typeof t] as Function
        const transitions = setupHandler.call(undefined)

        contextStateMachineDef.states[p].transitions = transitions
    }
}

export function onEnter(fn: (actor: Actor) => void) {
    if (!contextStateMachineDef || !contextStateName) {
        return
    }

    contextStateMachineDef.states[contextStateName].enter = fn
}

export function onExit(fn: (actor: Actor) => void) {
    if (!contextStateMachineDef || !contextStateName) {
        return
    }

    contextStateMachineDef.states[contextStateName].exit = fn
}

export function onUpdate(fn: (actor: Actor) => void) {
    if (!contextStateMachineDef || !contextStateName) {
        return
    }

    contextStateMachineDef.states[contextStateName].update = fn
}

export function canEnter(fn: (actor: Actor) => boolean) {
    if (!contextStateMachineDef || !contextStateName) {
        return
    }

    contextStateMachineDef.states[contextStateName].canEnter = fn
}