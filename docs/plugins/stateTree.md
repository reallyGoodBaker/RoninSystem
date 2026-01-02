**State Tree (stateTree)**
- **Description:**: 提供一个以树状结构组织的状态/任务系统，适合动作类游戏中把复杂行为拆分为可组合的状态与任务。
- **Source:**: `src/engine/plugins/stateTree/`

- **主要类型与 API 签名:**
  - `class StateTreePlugin implements IPlugin` (`index.ts`)
    - `name: string`
    - `description: string`
    - `startModule(app: IApplication): void` — 为配置的 actor 注册 `StateTreeComponent`

  - `class StateTree` (`stateTree.ts`)
    - `constructor(component: StateTreeComponent)`
    - `getOwner(): Actor` — 返回调用上下文中的 Actor（注意：可能是 Controller）
    - `getCurrentState(): State`
    - `getExecutingTasks(): string[]`
    - `addTask(name: string, task: Task): void`
    - `removeTask(name: string): void`
    - `getTaskNames(): string[]`
    - `tryTransitionTo(nextState: string | State, finishTasks?: boolean): Promise<boolean>`
    - `transitionTo(state: State): Promise<boolean>`
    - `finishTasks(): void` — 标记当前状态任务已完成以触发过渡
    - `resetStateTree(): void`
    - `update(): Promise<void>` — 调度任务执行与过渡逻辑

  - `type Task = (stateTree: StateTree, state: State) => void | Promise<void>` (`state.ts`)

  - `class State` (`state.ts`)
    - `constructor(name: string, payload?: any)`
    - 属性：`keepCurrentState: boolean`, `tryTransitionEveryTick: boolean`, `transitionOnFinished: boolean`, `taskNames: string[]`, `parent?: State`, `children: State[]`
    - `appendChild(child: State): this`
    - `removeChild(child: State | string): void`
    - `canEnter(stateTree: StateTree): boolean` — 默认 true，可被重写
    - `onEnter(stateTree: StateTree, prevState: State): void`
    - `onExit(stateTree: StateTree, nextState: State): void`
    - `canTransitionTo?(stateTree: StateTree): string | undefined` — 用于 `tryTransitionEveryTick`

- **工作流程与设计要点:**
  - `StateTree` 维护一个根节点 `root`，并在运行时以当前状态的 `taskNames` 去执行对应的任务（通过 `tasks` 注册表）。
  - 任务可以是异步的，`executeTasks()` 会按顺序 await 每个任务，异常会导致状态树设置为未完成。
  - `tryTransition()` 会在任务完成或满足条件时尝试搜索一个可进入的叶子状态并进行过渡。
  - 使用 `finishTasks()` 可在任务中标记状态完成，立即允许过渡尝试（不会中断当前正在执行的任务）。

- **示例:**
  - 注册与使用任务
    ```ts
    // 在组件初始化后
    const tree = new StateTree(component)

    // 注册任务
    tree.addTask('approach', async (t, s) => {
      // 移动到目标，耗时逻辑
    })

    // 在状态中引用
    const chase = new State('chase')
    chase.taskNames = ['approach']
    ```

**参考文件:** `index.ts`, `stateTree.ts`, `state.ts`, `stateTreeComponent.ts`
