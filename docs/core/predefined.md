**predefined.ts — API 文档**

- **源文件**: `src/engine/core/predefined.ts`
- **职责**: 提供预定义的基础 Actor/Pawn/Controller 实现，便于快速为玩家/实体创建基本行为。

主要导出
- `class BasePlayer extends Pawn`
  - 私有字段: `#health: number`（默认 20）
  - getter/setter: `health` — 设置时会尝试读取 `EntityHealthComponent` 并调用 `setCurrentValue`（有范围保护，使用 `clampNumber` 限制 0–20）。

- `class BasePlayerController extends PlayerController`
  - 字段: `inputComponent` — 一个 `InputComponent` 实例（来自 `@ronin/input/inputComponent`）。
  - `setupInput()` 实现：将 `inputComponent` 添加到 controller 的组件集合（供玩家输入驱动）。

使用场景
- `BasePlayer` 适合作为玩家 Pawn 的基础实现，封装了对原生 `EntityHealthComponent` 的读写。
- `BasePlayerController` 提供了基础的输入组件挂载点，实际游戏可扩展 `setupInput()` 绑定更多输入行为。

示例
```ts
class MyPlayer extends BasePlayer {
  // 扩展自定义属性/方法
}

class MyController extends BasePlayerController {
  setupInput() {
    super.setupInput()
    // 额外绑定
  }
}
```
