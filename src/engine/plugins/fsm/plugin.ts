import { IApplication } from "@ronin/core/architect/application"
import { Component } from "@ronin/core/architect/component"
import { registerPlayerComponent, SpawnConfig } from "@ronin/core/architect/config"
import { IPlugin } from "@ronin/core/architect/plugin"
import { StateMachine } from "./stateMachine"
import { Pawn } from "@ronin/core/architect/pawn"
import { getStateMachineDef } from "./setup"
import { TagEventType } from "@ronin/core/tag"
import { AttributesComponent } from "@ronin/gameplay/attribute"

const entityStateMachineMap = new Map<string, string>()

export function registerEntityStateMachine(typeStr: string, stateMachineId: string) {
    entityStateMachineMap.set(typeStr, stateMachineId)
    SpawnConfig.getInst().registerSpecifiedActorComponent(
        typeStr,
        FinateStateMachineComponent
    )
}

export class FinateStateMachineComponent extends Component {
    stateMachine: StateMachine | null = null
    allowTicking: boolean = true

    start(): void {
        const stateMachine = new StateMachine(this.actor)
        this.stateMachine = stateMachine
        const owner = this.actor as Pawn
        if (Pawn.isPawn(owner)) {
            const stateMachineId = entityStateMachineMap.get(owner.entity?.typeId as string)
            if (!stateMachineId) {
                return
            }

            const fsmDef = getStateMachineDef(stateMachineId)
            if (fsmDef) {
                stateMachine.setStateMachineDef(fsmDef)
            }
        }

        owner.OnTagChange.addListener((type, tag) => {
            if (type === TagEventType.Add) {
                stateMachine.triggerTagAdd(tag)
            } else {
                stateMachine.triggerTagRemove(tag)
            }
        })

        const attributesComp = owner.getComponent(AttributesComponent)
        if (attributesComp) {
            attributesComp.addListener('onCalculated', (name, v, old) => stateMachine.triggerAttrChange(name, v, old))
        }

        
    }

    update(): void {
        this.stateMachine?.update()
    }

    stop(): void {
        // 组件停止时确保注销状态机，避免在不支持 FinalizationRegistry 的环境中泄漏
        this.stateMachine?.dispose()
        this.stateMachine = null
    }
}

export class FinateStateMachinePlugin implements IPlugin {
    name: string = 'fsm'
    description: string = '有限状态机插件'

    startModule(app: IApplication): void {
        registerPlayerComponent(FinateStateMachineComponent)
    }
}