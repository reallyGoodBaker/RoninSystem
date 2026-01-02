**Component — API 文档**

- **源文件**: `src/engine/core/architect/component.ts`
- **职责**: Component 是 Actor 的功能模块，定义生命周期钩子并提供便捷方法用于在安全时机（下一帧）修改组件集合。

类与属性（签名）
- abstract class Component<A extends Actor = Actor>
  - readonly actor: A (getter)
  - allowTicking: boolean = false
  - update?(dTick: number, dMs: number): void
  - attach?(): void
  - start?(): void
  - detach?(): void

生命周期说明
- attach():
  - 调用时机: `Actor.addComponent()` 中调用。
  - 建议: 在此处完成组件的最小初始化（例如创建内部状态、订阅事件等）。

- start():
  - 调用时机: 当 actor 的所有组件都已 attach（即准备好）时由 `Actor.tryStart()` 集中触发。
  - 建议: 在此处进行依赖于其他组件已存在的初始化（例如查找其它组件引用）。

- update(dTick, dMs):
  - 调用时机: 当 `allowTicking = true` 且 Actor 的 `tick()` 被调用时。
  - 参数: `dTick`（number）和 `dMs`（number）。

- detach():
  - 调用时机: 当组件被移除（`Actor.removeComponent()`）时。
  - 建议: 在此处取消订阅、释放资源。

上下文与安全使用
- `actor` getter:
  - 仅在 `start()` 与 `update()` 生命周期内保证可以通过 `ReflectConfig` 获得正确上下文。
  - 如果需要跨异步边界保留 actor 引用，请使用 `ReflectConfig.contextActorRef()` 创建弱引用。

修改组件集合的安全方式
- component.addComponent(...) / component.removeComponent(...)
  - 说明: 这些方法会在调用时返回 Promise，并在下一帧通过 Actor.beforeNextUpdate 执行真实的添加/删除操作，从而避免在当前生命周期内并发修改导致的问题。

示例 — 一个完整的 Component
```ts
class HealthComponent extends Component {
  allowTicking = false
  private hp = 100

  attach() { /* 最小初始化 */ }

  start() {
    // 可以安全地读取其它组件
    const render = this.getComponent(RenderComponent)
  }

  update(dt, dms) {
    // 仅当 allowTicking = true 时才会被调用
  }

  detach() { /* 清理 */ }
}

// 在组件内异步添加新组件
async function addStatus(cmp: HealthComponent) {
  await cmp.addComponent(new StatusEffectComponent())
}
```

辅助方法
- getComponent<T extends Component>(clsOrName)
  - 快捷从当前 `actor` 获取同一 Actor 下的其他组件。

- addComponent(...) : Promise<void>
  - 在下一次更新前将组件插入 Actor（避免即时修改导致的并发问题）。返回在下次更新时解析的 Promise。

- removeComponent(...) : Promise<void>
  - 在下一次更新前从 Actor 移除组件（返回 Promise）。

关于 `actor` getter
- 在 `start` 或 `update` 生命周期中，`Component.actor` 从 `ReflectConfig.unsafeCtxActor()` 获得当前上下文 Actor。不要在生命周期外长期持有该引用；如需弱引用请使用 `ReflectConfig.contextActorRef()`。

示例
```ts
class HealthComponent extends Component {
  attach() { this.actor /* 仅在生命周期中安全访问 */ }
  start() { /* 初始化 */ }
  allowTicking = true
  update(dt, dms) { /* 每帧行为 */ }
}

// 在组件内部安全地添加另一个组件：
await health.addComponent(new StatusEffectComponent())
```
