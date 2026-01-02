**Actor — API 文档**

- **源文件**: `src/engine/core/architect/actor.ts`
- **职责**: Actor 是引擎的逻辑实体，可绑定到原生游戏实体或作为纯逻辑对象。负责组件集合管理、组件生命周期（attach/start/update/detach）以及在 ticking 系统中的每帧更新。

API 概览（方法签名）
- constructor(id: string)
- addComponent(component: Component): Actor
- addComponent(...component: Component[]): Actor
- addComponent(name: string, component: Component): Actor
- removeComponent(name: string): Actor
- removeComponent(component: Component): Actor
- getComponent<T extends Component>(cls: ConstructorOf<T>): T | undefined
- getComponent<T extends Component>(name: string): T | undefined
- getComponents(): Component[]
- clear(): void
- beforeNextUpdate(cb: (actor: Actor) => void): void
- tick(dt: number, dms: number): void
- start(): void
- tryStart(): void

详细说明
- constructor(id: string)
  - 参数: `id` — 唯一标识字符串。
  - 说明: 创建 Actor 实例并将其注册到 ticking 系统（使其可被每帧更新）。

- addComponent(...) — 多个重载
  - 用途: 向 Actor 添加组件。
  - 重载说明:
    - `addComponent(component)` — 添加单个组件实例（使用构造函数名作为 key）。
    - `addComponent(...components)` — 一次添加多个组件实例。
    - `addComponent(name, component)` — 使用自定义字符串 key 添加组件。
  - 行为:
    - 将组件存入内部 Map。
    - 调用 `component.attach()`（如果实现）。
    - 将组件标记为 ready（用于 tryStart 判定）。
    - 若 Actor 已处于组件已启动状态（_componentsStarted），则会立即在组件上下文中调用 `component.start()`。
  - 返回: 当前 Actor（链式调用支持）。

- removeComponent(nameOrComponent)
  - 参数: 组件名称字符串或组件实例。
  - 行为: 若找到组件则调用其 `detach()`（如果实现），并从 Map 中删除。
  - 返回: 当前 Actor。

- getComponent(clsOrName)
  - 参数: 构造函数或名称字符串。
  - 返回: 指定的组件实例或 `undefined`。

- getComponents()
  - 返回: 当前 Actor 所有组件数组副本。

- clear()
  - 行为: 对每个组件调用 `detach()`，清空组件集合，并将内部启动与准备标记重置为初始状态。

- beforeNextUpdate(cb)
  - 参数: `cb` — 在下一次 tick 前调用的回调函数，回调签名为 `(actor: Actor) => void`。
  - 用途: 安全地在下一帧执行对 actor 的结构修改（例如添加/移除组件）。

- tick(dt, dms)
  - 参数: `dt` — 逻辑帧增量（通常为 1/n）；`dms` — 自上次 tick 的毫秒差。
  - 行为: 如果组件已经启动，先执行 beforeNextUpdate 队列中的回调，然后以 `ReflectConfig.contextActor` 为上下文，遍历所有组件并对允许 ticking 的组件调用 `update(dt, dms)`。

- start()
  - 行为: 若尚未开始，则以当前 Actor 作为上下文调用所有组件的 `start()`。

- tryStart()
  - 行为: 当所有已添加组件标记为 ready（即 attach 已被调用）且尚未开始时，调用 `start()` 并设置内部 `_componentsStarted = true`。

实现细节与注意事项
- 组件的 attach/start/detach/update 生命周期由 Actor 管理，组件应在 attach 中准备资源并在 detach 中释放资源。
- 在组件的 start/update 期间，可以通过 `ReflectConfig.contextActor` 或 Component.actor getter 安全地访问当前 actor。
- 若需在组件内部对组件集合做结构修改，请使用 `component.addComponent(...)` 或使用 `actor.beforeNextUpdate(...)` 保证操作在下一帧安全执行，避免并发问题。

示例 — 常见使用场景
```ts
// 创建 actor 并在下一帧安全添加组件
const a = new Actor('npc_1')
await a.addComponent(new HealthComponent()) // 支持批量及 Promise 的 addComponent
a.addComponent(new AiComponent())
a.tryStart()

// 在 tick 中调用 actor.tick
// ticking 系统会在内部循环调用 actor.tick(dt, dms)
```

