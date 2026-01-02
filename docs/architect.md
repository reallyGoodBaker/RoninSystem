**Architect 概览**

- **位置**: `src/engine/core/architect`
- **目的**: 提供基于 Actor-Component 的运行时构件：Actor、Component、Controller、Pawn、Application 等，用于管理实体、控制器、插件与生命周期。

本文档以中文说明 `architect` 目录下的主要模块职责、关键类/接口与简单示例，便于快速上手与扩展。

**Actor**: `actor.ts`
- **职责**: Actor 是系统中的逻辑实体（可以绑定到游戏实体或作为纯逻辑对象），管理若干 `Component` 并负责组件的生命周期（attach/start/update/detach）。
- **关键 API**:
  - `new Actor(id: string)` — 创建 Actor，并自动加入 ticking 系统。
  - `addComponent(component)` / `removeComponent(nameOrInstance)` — 管理组件集合。
  - `getComponent<T>(clsOrName)` — 获取组件。
  - `tryStart()` / `start()` — 启动组件生命周期（在所有组件准备好后调用 start）。
  - `tick(dt, dms)` — 每帧调用，转发到允许 ticking 的组件。

**Application**: `application.ts`
- **职责**: 全局应用入口，管理所有 Actor、插件、配置注册、Entity→Actor 的绑定（spawn/despawn）、启动流程以及与 Minecraft world 事件的集成。
- **关键 API**:
  - `Application.getInst()` — 单例资源获取。
  - `spawnActor(id, spawnClass, ...components)` — 创建逻辑 Actor。
  - `spawnEntityActor(entity, actorClass?, ...components)` — 将游戏实体绑定为 Actor。
  - `despawnActor(id)` / `despawnEntityActor(entity)` — 销毁并触发回调。
  - `loadPlugin(...ctors)` / `unloadPlugin(...names)` — 管理插件模块。
  - `setConfig(name, value)` / `getConfig(name)` — 本地配置存取。
- **事件**: `actorSpawned`, `actorDespawn`（通过 `EventInstigator` 触发）。

**Component**: `component.ts`
- **职责**: Actor 的可插拔功能单元。定义生命周期钩子：`attach`, `start`, `update`, `detach`。
- **注意**: 若希望接收 `update()`，需将 `allowTicking = true`。
- **便利方法**:
  - `actor` getter：在 `start`/`update` 生命周期内可通过 `ReflectConfig` 获取当前上下文 Actor。
  - `addComponent` / `removeComponent`：在下一帧安全地修改组件集合（返回 Promise，保证在 next update 执行）。

**Spawn / Config**: `config.ts`
- **职责**: 管理 Actor / Component 的注册与自动生成策略（SpawnConfig 单例）。
- **功能**:
  - 注册全局的 Actor、PlayerController、AI Controller、指定 entity 的组件列表。
  - 提供 `actorComponentsLoader`、`playerComponentsLoader` 用于在 spawn 时构造组件实例。
  - 装饰器函数：`SpawnClass(entityType)`, `PlayerSpawnClass`, `PlayerComponent`, `ActorComponent`, `AiControllerClass`, `PlayerController`，用于模块静态注册。

**Controller**: `controller.ts`
- **职责**: Controller 是能「占有（possess）」Pawn 的 Actor。提供基础 `Controller` 与 `PlayerController`，定义 `possess`/`unPossess`/`getPawn` 与 `PlayerController.setupInput()` 抽象方法（player-specific 初始化）。

**Event**: `event.ts`
- **职责**: 提供事件相关工具：`EventInstigator`（用于对象级事件发布-订阅，支持多回调且删除性能好）、`EventComponent`（Component 版的事件容器），`EventSignal`（多观察者）与 `EventDelegate`（单回调委托）。

**Mod**: `mod.ts`
- **职责**: 定义模块（Mod）接口 `Mod` 与基类 `ModBase`。模块可以在 Application 启动/初始化/退出时挂载运行逻辑。

**Pawn**: `pawn.ts`
- **职责**: `Pawn` 是绑定在游戏实体的 Actor（extends Actor），实现 `Possessable` 接口。提供与 Minecraft 原生组件的快捷访问（如装备、背包）。

**Plugin**: `plugin.ts`
- **职责**: 定义插件接口 `IPlugin` 与插件加载器 `IPluginLoader` 的类型约束（`startModule`/`stopModule`）。

**Reflect**: `reflect.ts`
- **职责**: 提供运行时上下文引用：`ReflectConfig` 保存当前执行的 `contextActor`（供 `Component.actor` 使用），并提供 `ActorWeakRef` 用于弱引用访问 Actor（`deref()`/`isValid`）。

**Resource / Resources**: `resorce.ts`
- **职责**: 资源工具，定义 `Resource` 接口（`enter`/`exit`）与 `Resources` 管理器：`with`/`withAsync`（包装执行并保证 enter/exit）、`load`/`unload`（管理单例资源）和 `getResouce`。

**World / Types**: `world.ts`
- **职责**: 导出 `WorldLocation`、`ActorManager`、`IWorld` 等接口类型，作为 `Application` 与外部系统集成的契约。

**快速示例**
```ts
// 注册组件/Actor
@SpawnClass('minecraft:zombie')
class ZombieActor extends Actor {}

@ActorComponent
class HealthComponent extends Component {
  allowTicking = false
  attach() { /* init */ }
}

// 启动时在 Application 内部自动使用 SpawnConfig 创建 Actor/Components
```

**建议**
- 将每个复杂模块（如 `Application` / `Component` / `SpawnConfig`）单独拆文档页，如果需要我可以再按文件生成多页 `docs/architect/*.md`。

---

Generated on: 2026-01-03
