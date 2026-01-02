**Ronin Core Plugin (ronin)**
- **Description:**: 浪人系统的基础扩展，提供自定义玩家类、控制器、以及基础 HUD/组件注册点。通常作为默认最小功能集被加载。
- **Source:**: `src/engine/plugins/ronin/`

- **主要类型与 API 签名:**
  - `class RoninPlugin implements IPlugin` (`index.ts`)
    - `name: string`
    - `description: string`
    - `startModule(): void` — 注册 spawn class、controller 与组件

  - `class RoninModPlayer extends Pawn` (`player.ts`)
    - 私有字段/状态:
      - `#health: number` — 内部血量缓存
      - `#determination: number`, `#determLevel: number` — 决心与容量
      - `#mental: number` — 理智等级
    - Getter/Setter:
      - `get health(): number` / `set health(value: number)` — 与 `EntityHealthComponent` 同步
      - `get determination(): number` / `set determination(value: number)`
      - `get determLevel(): number` / `set determLevel(value: number)`
      - `get mental(): number` / `set mental(value: number)`
    - Methods:
      - `upgradeDetermination(): void`
      - `downgradeDetermination(): void`
      - `resetDetermination(): void`
      - `upgradeMental(): void`
      - `downgradeMental(): void`
      - `isSane(): boolean`
      - `isNeutral(): boolean`
      - `isInsane(): boolean`
      - `get determinationState(): DeterminationState`
      - `get damageMultiplier(): number`
      - `get hurtMultiplier(): number`

  - `class RoninPlayerController extends PlayerController` (`roninController.ts`)
    - `readonly inputComponent: InputComponent`
    - `readonly OnAttack: EventSignal<[boolean]>`
    - `readonly OnInteract: EventSignal<[boolean]>`
    - `readonly OnSneak: EventSignal<[boolean]>`
    - `readonly OnSprint: EventSignal<[boolean]>`
    - `readonly OnJump: EventSignal<[boolean]>`
    - `setupInput(): void` — 将 `InputComponent` 加入控制器并将信号与输入事件绑定

- **使用建议与扩展:**
  - 若想拓展玩家行为，继承 `RoninModPlayer` 并覆盖特定 getter/setter 或方法，然后通过 `registerPlayerSpawnClass` 注册你的 spawn class。
  - 要扩展输入处理，继承 `RoninPlayerController` 并在 `setupInput()` 中加入额外监听，注意调用 `super.setupInput()` 以维持基础绑定。

**参考文件:** `index.ts`, `player.ts`, `roninController.ts`, `determination.ts`, `control.ts`
