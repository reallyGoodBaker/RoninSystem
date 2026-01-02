**Spawn / Config — API 文档**

- **源文件**: `src/engine/core/architect/config.ts`
- **职责**: 管理 spawn 策略、组件注册以及为不同 entity type 提供对应 Actor / Controller class 与组件列表的单例 `SpawnConfig`。

SpawnConfig
- 单例访问: `SpawnConfig.getInst()`。
- 主要字段与方法:
  - specifiedActorComponents: Record<string, ConstructorOf<Component>[]> — 为特定 entity 指定额外组件。
  - actorComponentsLoader(entityType?) — 返回该 entityType 的组件实例数组（包含全局 actor components + 指定的 components）。
  - playerComponentsLoader() — 返回玩家 Pawn 在 spawn 时应附加的组件实例数组。
  - registerActorComponent(ctor)
  - registerPlayerComponent(ctor)
  - registerSpecifiedActorComponent(entityType, ...ctors)
  - registerSpawnClass(entityType, ctor)
  - registerPlayerControllerClass(ctor)
  - findSpawnClass(entityType, strict = false)
    - 返回配置的 spawn class，非 strict 时会回退到默认 Actor。
  - findPlayerControllerClass()
  - findAiControllerClass(entityType)
  - canAutoSpawn(entityType)
  - registerAutoSpawn(entityType)

装饰器辅助
- SpawnClass(entityType: string)
  - 将类注册为指定 entityType 的 spawn class。

- PlayerSpawnClass
  - 将类注册为玩家的 spawn class（`minecraft:player`）。

- ActorComponent / PlayerComponent
  - 将组件构造器注册入全局 Actor/Player components 列表（用于 loader）。

- AiControllerClass(entityType)
  - 注册 AI Controller 对应 entityType。

示例
```ts
@SpawnClass('minecraft:zombie')
class Zombie extends Actor {}

@ActorComponent
class LootComponent extends Component {}

SpawnConfig.getInst().registerSpecifiedActorComponent('custom:pet', ExtraAIComponent)
```

详细参考 — 函数/装饰器与行为
- `SpawnConfig.getInst()`
  - 返回：单例 `SpawnConfig`。

- 属性说明
  - `specifiedActorComponents: Record<string, ConstructorOf<Component>[]>`
    - 存储每个 entityType 额外的组件构造器列表。

- 方法说明（常用）
  - `actorComponentsLoader(entityType?: string): Component[]`
    - 返回值：组件实例数组。组合了全局注册的 `ActorComponents` 与 `specifiedActorComponents[entityType]`（如果存在）。
    - 用途：在 `Application.spawnEntityActor` 时用于构造组件实例。

  - `playerComponentsLoader(): Component[]`
    - 返回：玩家 Pawn 的组件实例列表（在 actorComponentsLoader 基础上追加 `PlayerComponents`）。

  - `registerSpecifiedActorComponent(entityType: string, ...ctors: ConstructorOf<Component>[])`
    - 功能：为特定 entityType 注册额外组件，传入构造器数组。

  - `registerSpawnClass(entityType: string, ctor: ConstructorOf<Actor>)`
    - 功能：给指定 entityType 注册 Actor 类，用于 spawn 时映射。

  - `findSpawnClass(entityType: string, strict = false)`
    - 返回：若 `strict === true` 严格返回已注册类或 `undefined`；否则返回已注册类或 `defaultSpawnClass`（或 Actor）。

装饰器行为（使用时机与副作用）
- `@SpawnClass('type')`
  - 在模块加载时（静态导入/执行）将目标类注册到 `SpawnConfig`。
  - 建议：模块导出时立即应用装饰器，确保 `Application.enter()` 时配置可用。

- `@ActorComponent` / `@PlayerComponent`
  - 将组件构造器放入全局注册列表（`ActorComponents` 或 `PlayerComponents`），用于运行时通过 loader 构造实例。

示例 — 扩展示例
```ts
// 指定某个 entityType 的额外组件
SpawnConfig.getInst().registerSpecifiedActorComponent('my:pet', ExtraAISensor, PetFollowComponent)

// 强制在 spawn 时使用自定义 Actor
@SpawnClass('my:boss')
class BossActor extends Actor {}
```
