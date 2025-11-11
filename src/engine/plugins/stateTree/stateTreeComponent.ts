import { Component } from "@ronin/core/architect/component"
import { StateTree } from "./stateTree"
import { Application } from "@ronin/core/architect/application"
import { ConstructorOf } from "@ronin/core/types"

import type { Pawn } from "@ronin/core/architect/pawn"


export const StateTreeConfKey = 'Ronin.StateTreeConfig'

export class StateTreeComponent extends Component {
    allowTicking: boolean = true
    stateTree?: StateTree

    update(): void {
        this.stateTree?.update()
    }

    start(): void {
        const conf = Application.getInst().getConfig(StateTreeConfKey, {}) as Record<string, ConstructorOf<StateTree>>
        const entity = (this.actor as Pawn).entity
        if (!entity) {
            return
        }

        const stateTreeCtor = conf[entity.typeId]
        if (stateTreeCtor) {
            this.stateTree = new stateTreeCtor(this.actor)
        }
    }
}