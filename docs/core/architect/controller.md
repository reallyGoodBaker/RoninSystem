**Controller — API 文档**
详细 API
- Interface: `IController` (extends Actor)
  - `possess(pawn: Possessable): void`
  - `unPossess(): void`
  - `getPawn<T extends Possessable = Possessable>(): T | undefined`

- Class: `Controller` extends `Actor` implements `IController`
  - `protected pawn: Possessable | null`
  - `possess(pawn: Possessable): void`
    - 将 controller 与 pawn 绑定并调用 `pawn.onPossess(this)`。
  - `unPossess(): void`
    - 解除绑定并调用 `pawn.onUnPossess()`。
  - `getPawn<T extends Possessable>(): T | undefined`

- Abstract: `PlayerController` extends `Actor` implements `IController`
  - 与 `Controller` 行为类似，额外要求实现：
    - `abstract setupInput(): void`
      - 用于绑定玩家输入（例如按键、hotbar、动作映射）。

实现细节与约定
- `possess` 应该抛出错误如果 controller 已经拥有一个 pawn，避免重复持有。
- `unPossess` 不抛出错误（若未持有 pawn 则安静返回）。

示例 — AI Controller
```ts
class AiController extends Controller {
  start() { /* 初始化 AI 状态 */ }
}

const ai = new AiController('ac_1')
ai.possess(pawn)
```

示例 — PlayerController
```ts
class MyPlayerController extends PlayerController {
  setupInput() {
    // 绑定按键/输入事件
  }
}

const pc = new MyPlayerController('pc_1')
pc.possess(playerPawn)
pc.setupInput()
```

- **源文件**: `src/engine/core/architect/controller.ts`
- **职责**: Controller 表示能“占有（possess）”一个 Pawn 的 Actor。提供基础 `Controller` 与 `PlayerController` 抽象类，以及 `IController` 接口与 `Possessable` 接口定义。

接口
- IController extends Actor
  - possess(pawn: Possessable): void
  - unPossess(): void
  - getPawn<T extends Possessable>(): T | undefined

类
- Controller extends Actor implements IController
  - possess(pawn) — 将自身与 pawn 绑定，并调用 pawn.onPossess(this)
  - unPossess() — 解除绑定并调用 pawn.onUnPossess()
  - getPawn() — 返回当前绑定的 pawn

- PlayerController (抽象) extends Actor implements IController
  - 与 Controller 相同，但强制 `setupInput()` 抽象方法，供玩家控制器实现按键/输入绑定。

接口 Possessable
- getController<T extends IController>(): T
- onPossess(controller: IController): void
- onUnPossess(): void

使用示例
```ts
class MyAiController extends Controller {
  // 可在 start/setup 中初始化 AI 状态机
}

const pc = new MyAiController('ac_1')
pc.possess(pawnActor)
// later
pc.unPossess()
```
