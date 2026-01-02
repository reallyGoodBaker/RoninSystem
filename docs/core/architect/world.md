**World / Types — API 文档**

- **源文件**: `src/engine/core/architect/world.ts`
- **职责**: 导出 `WorldLocation`、`ActorManager`、`IWorld` 等接口类型，作为 `Application` 与外部系统交互的契约。

类型速览
- `WorldLocation`:
  - `x: number`, `y: number`, `z: number`, `dimension: string` — 表示世界坐标与目标维度。

- `ActorManager` (接口):
  - `spawnActor(id: string, spawnClass: ConstructorOf<Actor>, ...components: Component[]): Actor` — 在逻辑层创建 Actor（不创建原生实体）。
  - `despawnActor(id: string): void` — 销毁 Actor（触发事件并调用 Actor.despawn）。
  - `getActor<T extends Actor = Actor>(id: string): T | undefined` — 按 id 获取 Actor。
  - `spawnEntityActor(entity: Entity, ...components: Component[]): Actor` — 为已有原生实体绑定 Actor。
  - `spawnEntityActor<T extends Actor>(entity: Entity, actorClass: ConstructorOf<T>, ...components: Component[]): Actor` — 使用给定 Actor 类绑定现有实体。
  - `spawnEntityActor<T extends Actor>(type: string, dim: WorldLocation, actorClass: ConstructorOf<T>, ...components: Component[]): Actor` — 在世界中 spawn 原生实体并为其创建 Actor。
  - `despawnEntityActor(entity: Entity, clearEntity?: boolean): void` — 取消绑定并可选移除原生实体。

- `IWorld extends ActorManager`:
  - `getControllerByActorId<T extends IController>(id: string): T | undefined` — 按 Actor id 获取控制器（Pawn 的 controller）。

详细说明 — 方法语义与使用场景

- `spawnActor(id, spawnClass, ...components)`
  - 用途: 创建纯逻辑 Actor（例如 AI 管理、定时器、纯服务对象），不会在游戏世界生成原生实体。
  - 行为: 将 Actor 注册到管理容器（`Application.actors`），并触发 `actorSpawned` 事件。

- `spawnEntityActor` 重载说明
  - 现有实体绑定：`spawnEntityActor(entity: Entity, ...components)`
    - 若该 entity 已经有绑定 Actor（通过 id 查找），会直接触发 `actorSpawned` 并返回已存在 Actor。
    - 否则创建指定或默认的 Actor 实例并绑定到该 entity 的 id。
  - 指定 Actor 类：`spawnEntityActor(entity, actorClass, ...components)`
    - 使用传入的 `actorClass` 构造 Actor（常用于覆盖 spawnClass 的默认映射）。
  - spawn + 绑定：`spawnEntityActor(type, location, actorClass, ...components)`
    - 在指定维度与坐标使用原生 API spawn 实体，然后为其创建 Actor 并返回。

- `despawnEntityActor(entity, clearEntity = true)`
  - 行为: 查找并触发 `actorDespawn`，调用 Actor.despawn(); 若 `clearEntity` 为 true 并且绑定的 Actor 为 `Pawn`，还会尝试调用原生实体的 `remove()`。

示例
```ts
// 创建纯逻辑 Actor
const helper = Application.getInst().spawnActor('helper_1', HelperActor, new AIComponent())

// 将已有实体绑定为 Pawn（自动使用 SpawnConfig 中的 spawnClass）
const pawnActor = Application.getInst().spawnEntityActor(someEntity, new HealthComponent())

// 在世界中 spawn 一个僵尸并为其绑定自定义 Actor
const zActor = Application.getInst().spawnEntityActor(
  'minecraft:zombie',
  { x: 10, y: 64, z: -5, dimension: 'overworld' },
  ZombieActor,
  new LootComponent()
)

// 移除绑定并删除原生实体
Application.getInst().despawnEntityActor(someEntity, true)
```

备注
- `Application` 实现了 `IWorld`，因此所有这些方法可直接通过 `Application.getInst()` 调用。
- 在实现自动 spawn 时（例如在 `Application.enter()` 绑定的 world events），`SpawnConfig` 会被用于选择默认的 Actor/Controller 类和组件列表。
**World / Types — API 文档**

- **源文件**: `src/engine/core/architect/world.ts`
- **职责**: 导出 ActorManager、IWorld 与 WorldLocation 等类型，作为 Application 与外部系统交互的契约。

类型
- WorldLocation
  - x: number, y: number, z: number, dimension: string
  - 说明: 用于表示在特定维度中的世界坐标。

- ActorManager
  - spawnActor(id: string, spawnClass: ConstructorOf<Actor>, ...components: Component[]): Actor
  - despawnActor(id: string): void
  - getActor<T extends Actor = Actor>(id: string): T | undefined
  - spawnEntityActor(entity: Entity, ...components: Component[]): Actor
  - spawnEntityActor<T extends Actor>(entity: Entity, actorClass: ConstructorOf<T>, ...components: Component[]): Actor
  - spawnEntityActor<T extends Actor>(type: string, dim: WorldLocation, actorClass: ConstructorOf<T>, ...components: Component[]): Actor
  - despawnEntityActor(entity: Entity, clearEntity?: boolean): void

- IWorld extends ActorManager
  - getControllerByActorId<T extends IController>(id: string): T | undefined

说明
- `Application` 实现了 `IWorld`，因此所有方法都可由 `Application.getInst()` 调用。
