**Finite State Machine (fsm)**
- **Description:**: 提供面向 Actor 的有限状态机实现，支持状态继承、事件/属性/标签驱动的 transition 以及防重入的切换队列。
- **Source:**: `src/engine/plugins/fsm/`

- **主要类型与函数与 API 签名:**
  - `class FinateStateMachinePlugin implements IPlugin` (`plugin.ts`)
    - `name: string`
    - `description: string`
    - `startModule(app: IApplication): void`

  - `class FinateStateMachineComponent extends Component` (`plugin.ts`)
    - `stateMachine: StateMachine | null`
    - `allowTicking: boolean`
    - `start(): void` — 创建并挂载 StateMachine；监听 Tag/Attribute 变化
    - `update(): void` — 调用 stateMachine.update()
    - `stop(): void` — 清理 stateMachine

  - `function registerEntityStateMachine(typeStr: string, stateMachineId: string): void` (`plugin.ts`)

  - `class StateMachine` (`stateMachine.ts`)
    - 构造: `constructor(owner: Actor, onerror?: (error:any)=>void)`
    - `setStateMachineDef(def: IStateMachineDefination): void` — 合并继承并安装定义
    - `update(): void` — 每帧驱动当前 state 的 update，并检测 duration 触发 OnEndOfState
    - `resetStateMachine(): void`
    - `currentState(): IStateDef | undefined`
    - `getState(state: string): IStateDef | undefined`
    - `rebuildBuckets(): void` / `rebuildBucketsFor(stateName: string): void`
    - `changeState(state: string): void` — 未经检查的状态切换（内部使用）
    - `OnStateChanged: EventDelegate<[string, string]>`

  - `function mixinStates(target: IStateMachineDefination, inheritFrom: IStateMachineDefination): Record<string, IStateDef>` — 合并父子 state 定义

- **类型定义:**
  - `interface IStateMachineDefination { id: string; inherits?: string[]; rootState: string; states: Record<string, IStateDef> }`
  - `interface IStateDef { name: string; duration?: number; transitions: StateTransition[]; enter?: (actor: Actor)=>void; exit?: (actor: Actor)=>void; update?: (actor: Actor)=>void; canEnter?: (actor: Actor)=>boolean }`
  - `enum TransitionTriggerType { OnEndOfState, OnEvent, OnAttributeChange, OnTagAdd, OnTagRemove, Custom }`
  - `type StateTransition = StateEventTransition | AttributeChangeTransition<any> | IStateTransition | TagChangeTransition`

- **设计要点与用法建议:**
  - 继承合并按照 DFS 顺序合并 states，子 state 会覆盖父字段但 transitions 会追加（父在前，子在后）。
  - StateMachine 使用 hybrid registry（WeakRef + FinalizationRegistry）避免因 actor 生命周期导致内存泄漏；在不支持这些 API 的环境回退到强引用。
  - 为避免递归/重入，状态切换通过 `_changing` 标志与队列序列化。
  - 把状态机定义集中放在 `setup.ts` / `getStateMachineDef` 的管理位置，然后通过 `registerEntityStateMachine` 绑定具体实体类型。

- **示例（伪代码）:**
  ```ts
  // state machine 定义（示意）
  const fsmDef = {
    id: 'soldier',
    rootState: 'idle',
    states: {
      idle: {
        name: 'idle',
        transitions: [
          { trigger: TransitionTriggerType.OnEvent, event: 'seeEnemy', nextState: 'attack' }
        ]
      },
      attack: { name: 'attack', duration: 40 }
    }
  }

  registerEntityStateMachine('namespace:soldier', 'soldier')
  ```

**参考文件:** `plugin.ts`, `stateMachine.ts`, `state.ts`, `setup.ts`
