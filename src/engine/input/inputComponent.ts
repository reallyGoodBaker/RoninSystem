import { world, InputButton, ButtonState, Vector2, system, Player, EquipmentSlot, HeldItemOption } from '@minecraft/server'
import { PlayerController } from '@ronin/core/architect/controller'
import { EventComponent } from '@ronin/core/architect/event'
import { Pawn } from '@ronin/core/architect/pawn'

export interface InputMapping {
    Jump: boolean
    Sneak: boolean
    Sprint: boolean
    Attack: boolean
    Interact: boolean
    Movement: Vector2
}

export interface InputState<V> {
    value: V
    lastUpdate: number
}

function inputState<T>(defaultValue: T): InputState<T> {
    return {
        value: defaultValue,
        lastUpdate: system.currentTick,
    }
}


export interface InputElement<T extends keyof InputMapping = keyof InputMapping> {
    button: T
    value: InputMapping[T]
    ticks: number
}

export enum ChargingState {
    None,
    Started,
    Triggered,
    Compeleted,
}

export enum ChargeEventState {
    None,
    Cancel,
    Finish,
    Compelete,
}

export enum PredefinedInput {
    Jump,
    Sneak,
    Sprint,
    Attack,
    Interact,
    Movement,
}

export interface InputEventMapping {
    Jump: [ boolean, number ]
    Sneak: [ boolean, number ]
    Sprint: [ boolean, number ]
    Attack: [ boolean, number ]
    Interact: [ boolean, number ]
    Movement: [ Vector2, number ]
}

export class InputComponent extends EventComponent<InputEventMapping, PlayerController> {
    static readonly canUsePlayerSwing = Boolean(world.afterEvents.playerSwingStart)

    private static readonly inputStacks = new Map<string, InputElement[]>()

    allowTicking: boolean = true

    static {
        // 原生玩家按键输入 (跳跃/潜行)
        world.afterEvents.playerButtonInput.subscribe(ev => {
            if (ev.button === InputButton.Jump) {
                return InputComponent.inputStacks.get(ev.player.id)?.push({
                    button: 'Jump',
                    value: ev.newButtonState === ButtonState.Pressed,
                    ticks: system.currentTick,
                })
            }

            if (ev.button === InputButton.Sneak) {
                return InputComponent.inputStacks.get(ev.player.id)?.push({
                    button: 'Sneak',
                    value: ev.newButtonState === ButtonState.Pressed,
                    ticks: system.currentTick,
                })
            }
        })

        system.beforeEvents.startup.subscribe(ev => {
            ev.itemComponentRegistry.registerCustomComponent('ss:chargeable', {})
        })

        // 原生玩家右键按下输入
        world.afterEvents.itemUse.subscribe(ev => {
            // 只在使用可长按物品时触发
            if (ev.itemStack.hasComponent('ss:chargeable')) {
                InputComponent.inputStacks.get(ev.source.id)?.push({
                    button: 'Interact',
                    value: true,
                    ticks: system.currentTick,
                })   
            }
        })

        function quickRestoreInteract(id: string) {
            InputComponent.inputStacks.get(id)?.push({
                button: 'Interact',
                value: true,
                ticks: system.currentTick,
            })

            system.runTimeout(() => {
                InputComponent.inputStacks.get(id)?.push({
                    button: 'Interact',
                    value: false,
                    ticks: system.currentTick,
                })
            }, 2)
        }

        function quickRestoreAttack(id: string) {
            InputComponent.inputStacks.get(id)?.push({
                button: 'Attack',
                value: true,
                ticks: system.currentTick,
            })

            system.runTimeout(() => {
                InputComponent.inputStacks.get(id)?.push({
                    button: 'Attack',
                    value: false,
                    ticks: system.currentTick,
                })
            }, 2)
        }

        world.afterEvents.playerPlaceBlock.subscribe(ev => quickRestoreInteract(ev.player.id))
        world.afterEvents.playerInteractWithBlock.subscribe(ev => quickRestoreInteract(ev.player.id))
        world.afterEvents.playerInteractWithEntity.subscribe(ev => quickRestoreInteract(ev.player.id))

        // 原生玩家右键松开输入 (需要chargable)
        world.afterEvents.itemReleaseUse.subscribe(ev => {
            return InputComponent.inputStacks.get(ev.source.id)?.push({
                button: 'Interact',
                value: false,
                ticks: system.currentTick,
            })
        })

        // 模拟玩家按键输入 (冲刺)
        system.afterEvents.scriptEventReceive.subscribe(({ sourceEntity, id }) => {
            if (!sourceEntity) {
                return
            }

            switch (id) {
                case 'ss:sprintEnd':
                    return InputComponent.inputStacks.get(sourceEntity.id)?.push({
                        button: 'Sprint',
                        value: false,
                        ticks: system.currentTick,
                    })

                case 'ss:sprintStart':
                    return InputComponent.inputStacks.get(sourceEntity.id)?.push({
                        button: 'Sprint',
                        value: true,
                        ticks: system.currentTick,
                    })
            }
        })

        if (this.canUsePlayerSwing) {
            world.afterEvents.playerSwingStart.subscribe(ev => quickRestoreAttack(ev.player.id), { heldItemOption: HeldItemOption.AnyItem })
            world.afterEvents.playerSwingStart.subscribe(ev => quickRestoreAttack(ev.player.id), { heldItemOption: HeldItemOption.NoItem })
        }

        // 原生玩家攻击输入
        world.beforeEvents.playerBreakBlock.subscribe(ev => quickRestoreAttack(ev.player.id))
    }

    get bindActor() {
        return this.actor.getPawn<Pawn>()
    }

    start(): void {
        if (this.bindActor?.entity) {
            InputComponent.inputStacks.set(this.bindActor.entity.id, [])
        }
    }

    public readonly inputMapping = {
        Jump: inputState(false),
        Sneak: inputState(false),
        Sprint: inputState(false),
        Attack: inputState(false),
        Interact: inputState(false),
        Movement: inputState({ x: 0, y: 0 }),
    }

    getInput<T extends keyof InputMapping>(key: T): InputMapping[T] {
        return this.inputMapping[key].value as InputMapping[T]
    }

    getChargeEventStateFromMainhand(dt: number): ChargeEventState {
        const mainhand = this.bindActor?.getEquipment(EquipmentSlot.Mainhand)
        if (!mainhand) {
            return ChargeEventState.None
        }

        const { triggerThreshold, holdThreshold } = <any> mainhand.getComponent('ss:chargeable')?.customComponentParameters.params || {}
        return this.getChargeEventState(dt, triggerThreshold ?? 0, holdThreshold ?? Number.MAX_SAFE_INTEGER)
    }

    getChargingStateFromMainhand(dt: number): ChargingState {
        const mainhand = this.bindActor?.getEquipment(EquipmentSlot.Mainhand)
        if (!mainhand) {
            return ChargingState.None
        }

        const { triggerThreshold, holdThreshold } = <any> mainhand.getComponent('ss:chargeable')?.customComponentParameters.params || {}
        return this.getChargingState(dt, triggerThreshold ?? 0, holdThreshold ?? Number.MAX_SAFE_INTEGER)
    }

    getChargingState(dt: number, triggerThreshold: number, holdThreshold: number): ChargingState {
        const duration = triggerThreshold + holdThreshold

        if (dt < 0) {
            return ChargingState.None
        }

        if (dt < triggerThreshold) {
            return ChargingState.Started
        }

        if (dt < duration) {
            return ChargingState.Triggered
        }

        return ChargingState.Compeleted
    }

    getChargeEventState(dt: number, triggerThreshold: number, holdThreshold: number): ChargeEventState {
        const duration = triggerThreshold + holdThreshold

        if (dt < 0) {
            return ChargeEventState.None
        }

        if (dt < triggerThreshold) {
            return ChargeEventState.Cancel
        }

        if (dt < duration) {
            return ChargeEventState.Finish
        }

        return ChargeEventState.Compelete
    }

    stop(): void {
        if (this.bindActor?.entity) {
            InputComponent.inputStacks.delete(this.bindActor.entity.id)
        }
    }

    destroy(): void {
        if (this.bindActor?.entity) {
            InputComponent.inputStacks.clear()
        }
    }

    update(): void {
        if (!this.bindActor?.entity) {
            return
        }

        const actorId = this.bindActor.entity.id
        const stack = InputComponent.inputStacks.get(actorId)
        if (!stack) {
            return
        }

        for (const { button, value, ticks } of stack) {
            // 更新输入状态
            const localInput = this.inputMapping[button]
            if (localInput.value !== value) {
                const dt = ticks - localInput.lastUpdate
                localInput.value = value
                localInput.lastUpdate = ticks
                this.trigger(button, value, dt)
            }
        }

        stack.length = 0
    }

    getInputVector() {
        return this.useSimulatedVector
            ? this.inputMapping.Movement.value as Vector2
            : (this.bindActor?.entity as Player)?.inputInfo.getMovementVector()
    }

    public useSimulatedVector = false

    static performPressing(id: string, key: Exclude<keyof InputMapping, 'Movement'>, value: boolean) {
        InputComponent.inputStacks.get(id)?.push({
            button: key,
            value: value,
            ticks: system.currentTick,
        })
    }

    static performVector(id: string, x: number, y: number) {
        InputComponent.inputStacks.get(id)?.push({
            button: 'Movement',
            value: { x, y },
            ticks: system.currentTick,
        })
    }

    isMovingForward() {
        return this.getInputVector().y > 0.5
    }
}