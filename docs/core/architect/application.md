**Application — API 文档**

- **源文件**: `src/engine/core/architect/application.ts`
- **职责**: 全局应用入口。管理 Actor 集合、插件、配置注册、Entity→Actor 的绑定（spawn/despawn）、启动流程以及与 Minecraft world 的集成。

签名速览（重要方法）
- `static getInst(): Application`
- `spawnActor<T extends Actor = Actor>(id: string, spawnClass: ConstructorOf<T>, ...components: Component[]): T`
- `despawnActor(id: string): void`
- `despawnEntityActor(entity: Entity): void`
- `spawnEntityActor(entity: Entity, ...components: Component[]): Actor`
- `spawnEntityActor<T extends Actor>(entity: Entity, actorClass: ConstructorOf<T>, ...components: Component[]): Actor`
- `spawnEntityActor<T extends Actor>(type: string, location: WorldLocation, actorClass: ConstructorOf<T>, ...components: Component[]): Actor`
- `enter(): void`
- `exit(): void`
- `loadPlugin(...ctor: ConstructorOf<IPlugin>[]): IPluginLoader`
- `unloadPlugin(...name: string[]): IPluginLoader`
- `getPlugin(name: string): IPlugin | undefined`
- `getConfig<T>(name: string, defaultVal?: T): T`
- `setConfig(name: string, value: any): void`

详细说明 — 关键方法与行为
- `static getInst()`
  - 返回: `Application` 单例（由 `Resources` 管理）。

- `spawnActor(id, spawnClass, ...components)`
  - 参数:
    - `id` (string): Actor 唯一 id。
    - `spawnClass` (ConstructorOf<T>): Actor 构造函数。
    - `components` (Component[]): 附加给新 Actor 的组件实例。
  - 返回: 新创建的 Actor 实例。
  - 其他: 会将 Actor 注册到 `this.actors` 并触发 `actorSpawned` 事件（监听者可在事件回调中进行附加逻辑）。

- `spawnEntityActor(...)` — 重载详细
  - 用途: 将游戏中的 `Entity` 绑定成 Actor 或在指定位置 spawn 一个新 Entity 并创建对应 Actor。
  - 重载一: `spawnEntityActor(entity: Entity, ...components: Component[])`
    - 若已有 actor 绑定（基于 `entity.id`），会触发 `actorSpawned` 并返回已有实例。
  - 重载二: `spawnEntityActor(entity: Entity, actorClass: ConstructorOf<T>, ...components)`
    - 使用指定 `actorClass` 构造 Actor 实例。
  - 重载三: `spawnEntityActor(type: string, location: WorldLocation, actorClass: ConstructorOf<T>, ...components)`
    - 在世界中 spawn 原生实体（通过 `world.getDimension(location.dimension).spawnEntity(type, location)`），然后按第二种方式绑定 Actor。

- `despawnActor(id)`
  - 行为: 触发 `actorDespawn` 事件，并从 `this.actors` 中删除，调用 `Actor.despawn()`。

- `despawnEntityActor(entity)`
  - 行为: 同 `despawnActor`，但若 actor 为 `Pawn` 并且包含原生实体，会尝试移除该实体（`entity.remove()`）。

- `enter()` — 启动流程
  - 注册 Minecraft 系统事件：
    - `system.beforeEvents.startup` — 启动时解析 spawn 配置、启动 Module（`Application.modApp?.start`）、命令注册，并建立 player/entity spawn 与 despawn 的自动流程。
    - `world.afterEvents.playerSpawn` — 自动为玩家创建 Pawn、PlayerController 并完成绑定。
    - `world.afterEvents.entitySpawn` / `world.beforeEvents.entityRemove` — 自动创建/取消绑定非玩家实体的 Actor。
    - 启动后调用 `ticking.repeat(() => ticking.tick('actor'))` 开启 actor ticking。

- `loadPlugin(...ctor)`
  - 行为: 实例化每个传入的插件构造器，调用插件的 `startModule(this)`，并将其实例放入 `this.plugins` map。

- `unloadPlugin(...name)`
  - 行为: 找到对应插件实例，调用其 `stopModule(this)` 并从 map 中移除。

- 配置管理
  - `getConfig(name, defaultVal?)` 与 `setConfig(name, value)` 提供简单键值存取，Application 存储用于运行时配置（例如 SpawnConfig 实例）。

事件
- `actorSpawned`: 参数 `[actor, actorClass, components]`。
- `actorDespawn`: 参数 `[actor | undefined, id]`。

示例 — 常见操作
```ts
const app = Application.getInst()
// 创建逻辑 Actor
const npc = app.spawnActor('npc_1', ZombieActor, new LootComponent())

// 将已有实体绑定为 Actor
const actorForEntity = app.spawnEntityActor(entity, MyPawnClass, new HealthComponent())

// 卸载
app.despawnEntityActor(entity)

// 插件
app.loadPlugin(MyPlugin)
app.unloadPlugin('my-plugin-name')
```

注意与建议
- 在 `system.beforeEvents.startup` 事件被触发之前，不要尝试对 Application 发起 spawn/despawn 操作（`Application.initialized` 会在 startup resolve 后置为 true）。
- `SpawnConfig` 与 Application 协作实现自动 spawn 策略：如果需要自定义 spawn 行为，优先在 `SpawnConfig` 中注册 `spawnClass` 或指定组件列表。
**Application — API 文档**

- **源文件**: `src/engine/core/architect/application.ts`
- **职责**: 全局应用入口。管理 Actor 集合、插件、配置与与 Minecraft world 的事件绑定。负责在服务器生命周期中创建/销毁 Actor 并协调自动 spawn 策略。

概览
- 单例获取: `Application.getInst()`（通过 `Resources` 管理）。
- 监控事件: `actorSpawned`, `actorDespawn`。

主要方法
- spawnActor<T extends Actor>(id: string, spawnClass: ConstructorOf<T>, ...components: Component[]): T
  - 参数: `id`：Actor id；`spawnClass`：Actor 构造函数；`components`：Component 实例数组。
  - 返回: 新创建的 Actor（并触发 `actorSpawned` 事件）。

- despawnActor(id: string)
  - 参数: `id`：Actor id。
  - 说明: 触发 `actorDespawn` 并从集合中删除 Actor，调用其 `despawn()`。

- spawnEntityActor(entity, actorClass?, ...components)
  - 重载: 支持直接传入 `Entity`，也支持传入 `type` + `WorldLocation` + `actorClass` 来在世界中 spawn 一个实体并为其创建 Actor。
  - 说明: 若已有绑定 actor，会直接触发 `actorSpawned` 并返回已存在实例。

- despawnEntityActor(entity)
  - 说明: 对绑定的 Pawn 做销毁和移除原生实体（如果存在）。

- enter()
  - 说明: 注册 Minecraft 系统事件（startup、playerSpawn、entitySpawn、entityRemove、shutdown），在 startup 时完成插件启动、命令注册与自动 Actor/Pawn 创建逻辑，并启动 ticking。

- loadPlugin(...ctor) / unloadPlugin(...name)
  - 插件管理接口：动态加载插件类（实例化并调用 `startModule`）或卸载并调用 `stopModule`。

- getConfig(name) / setConfig(name, value)
  - 简单配置存取。

示例
```ts
const app = Application.getInst()
app.spawnActor('npc_1', ZombieActor, new AiComponent(), new LootComponent())
app.loadPlugin(MyPlugin)
```

备注
- `Application` 与 `SpawnConfig` 协作，能按 entity type 自动选择 Actor/Controller class 并加载预注册的组件。
