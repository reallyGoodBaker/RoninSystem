import { Application, IApplication } from "@ronin/core/architect/application"
import { Component } from "@ronin/core/architect/component"
import { registerPlayerComponent, SpawnConfig } from "@ronin/core/architect/config"
import { IPlugin } from "@ronin/core/architect/plugin"
import { StateMachine } from "./stateMachine"
import { Pawn } from "@ronin/core/architect/pawn"
import { getStateMachineDef } from "./setup"
import { TagEventType } from "@ronin/core/tag"
import { AttributesComponent } from "@ronin/gameplay/attribute"
import { CustomCommand, Param } from "@ronin/utils/command"
import { Actor } from "@ronin/core/architect/actor"
import { profiler } from "@ronin/core/profiler"
import { PROFIER_CONFIG } from '@ronin/config/profiler'
import { ActionBarComponent } from "@ronin/hud/screenDisplay"
import { MessageBlock } from "@ronin/hud/messageBlock"

const { TOKENS: T } = PROFIER_CONFIG

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
        this.bindFSMDef(stateMachine)

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

    /**
     * 从配置中获取状态机定义并绑定，不适用于玩家
     * 
     * @param stateMachine 
     * @returns 
     */
    protected bindFSMDef(stateMachine: StateMachine): void {
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

const TriggerNamesMapping = [
    'OnEndOfState',
    'OnEvent',
    'OnAttributeChange',
    'OnTagAdd',
    'OnTagRemove',
    'Custom',
]

function getStateTransStr(fsm: StateMachine, name: string) {
    const curState = fsm.getState(name)
    if (!curState) {
        return `  None`
    }

    return curState.transitions.map(trans => {
        const triggerStr = TriggerNamesMapping[trans.trigger]
        return `  ${triggerStr} -> ${trans.nextState}`
    }).join('\n')
}

export class FinateStateMachineDisplayComponent extends Component {
    fsmMessage?: MessageBlock
    allowTicking: boolean = true

    constructor(
        readonly actionBar: ActionBarComponent,
        readonly fsm: StateMachine
    ) {
        super()
    }

    start(): void {
        this.fsmMessage = this.actionBar.message.createBlock('ActionBar.FSM', '')
    }

    update(): void {
        if (!this.fsmMessage) {
            return
        }

        const curState = this.fsm?.currentState()
        if (curState) {
            this.fsmMessage.text = `\nState: ${curState.name}  ${T.NUM}${this.fsm?.stateTicks}${T.R} / ${T.ID}${String(curState.duration ?? Infinity)}${T.R}`
        } else {
            this.fsmMessage.text = '\nState: None'
        }
    }

    detach(): void {
        if (this.fsmMessage) {
            this.actionBar?.message.removeContent(this.fsmMessage)
        }
    }
}

export class FinateStateMachinePlugin implements IPlugin {
    name: string = 'fsm'
    description: string = '有限状态机插件'

    startModule(app: IApplication): void {
        registerPlayerComponent(FinateStateMachineComponent)
        this.registerFSMTypePrinter()
    }

    registerFSMTypePrinter() {
        profiler.registerCustomTypePrinter(FinateStateMachineComponent, inst => {
            const fsm = inst.stateMachine
            if (!fsm) {
                return `FSM<None>`
            }

            const header = `FSM<${T.CLASS}${fsm.constructor.name}${T.R}>`
            const stateNames = `  States: ${fsm.getStateNames().join(', ') || 'Empty'}\n`
            const curState = fsm.currentState()
            if (!curState) {
                return [
                    header,
                    stateNames,
                    `  Current State: ${T.CLASS}None`
                ].join('\n')
            }

            const curStateClass = `  Current State: ${T.CLASS}${curState.constructor.name}${T.R}`
            const curStateDesc = `  Name: ${T.STR}${curState.name}${T.R}  Duration: ${T.NUM}${(curState.duration ?? Infinity).toFixed(2)}${T.R}`
            
            return [
                header,
                stateNames,
                curStateClass,
                curStateDesc,
            ].join('\n')
        })
    }

    @CustomCommand('查看 Actor 状态机')
    show_fsm(
        @Param.Required('actor') actors: Actor[]
    ) {
        for (const actor of actors) {
            const fsmComp = actor.getComponent(FinateStateMachineComponent)
            if (fsmComp) {
                profiler.info(fsmComp)
            }
        }
    }

    @CustomCommand('查看当前状态过渡')
    show_fsm_transitions(
        @Param.Required('actor') actors: Actor[],
        @Param.Required('string') stateName: string,
    ) {
        for (const actor of actors) {
            const fsmComp = actor.getComponent(FinateStateMachineComponent)
            if (!fsmComp || !fsmComp.stateMachine) {
                continue
            }

            profiler.info(`State ${stateName} transitions: \n${getStateTransStr(fsmComp.stateMachine!, stateName)}`)
        }
    }

    @CustomCommand('将第一个目标的状态机信息在 Actionbar 上显示/隐藏')
    hud_fsm(
        @Param.Required('actor') actors: Actor[],
        @Param.Required('bool') enabled: boolean,
        @Param.Origin origin: Param.Origin,
        @Param.App app: Application,
    ) {
        const actor = actors[0]
        const instigator = app.getActor(origin.sourceEntity?.id as string)
        if (!instigator) {
            return profiler.error(`操作者没有绑定 Pawn`)
        }

        if (!enabled) {
            instigator.removeComponent(FinateStateMachineDisplayComponent)
        }

        const fsmComp = actor.getComponent(FinateStateMachineComponent)
        const hud = instigator.getComponent(ActionBarComponent)

        if (!fsmComp || !fsmComp.stateMachine || !hud) {
            return profiler.error(`Actor 缺少 FinateStateMachineComponent 或 ActionBarComponent 组件`)
        }

        instigator.addComponent(new FinateStateMachineDisplayComponent(hud, fsmComp.stateMachine))
    }

    @CustomCommand('通过 ID 将状态机预设应用到目标')
    fsm_apply(
        @Param.Required('actor') actors: Actor[],
        @Param.Required('string') id: string,
    ) {
        for (const actor of actors) {
            const fsmComp = actor.getComponent(FinateStateMachineComponent)
            if (!fsmComp) {
                return profiler.error(`Actor 缺少 FinateStateMachineComponent 组件`)
            }

            const fsmDef = getStateMachineDef(id)
            if (!fsmDef) {
                return profiler.error(`没有找到 ID 为 ${id} 的状态机预设`)
            }

            fsmComp.stateMachine?.setStateMachineDef(fsmDef)
            profiler.info(`已将状态机预设 ${id} 应用到目标`)
        }
    }
}