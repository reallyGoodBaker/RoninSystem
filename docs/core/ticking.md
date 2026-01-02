**ticking.ts — API 文档**

- **源文件**: `src/engine/core/ticking.ts`
- **职责**: 提供引擎层的 tick（每帧/定时）调度工具，包含 `Tickable` 接口、组调度（Ticking）与若干便捷函数（queue/timeout/repeat）。

主要类型
- `interface Tickable`
  - `allowTicking: boolean` — 是否允许被调度执行。
  - `readonly tickingGroup: string` — 所属的 ticking 组名，用于将对象放入指定分组的调度器。
  - `tick?(dt: number, dms: number): void` — 每帧调用方法（优先）。
  - `update?(dt: number, dms: number): void` — 如果 `tick` 不存在，会调用 `update`。

主要导出
- `TickableObject`（装饰器）
  - 将类标记为自动加入 ticking 调度的类型（通过 `ObjectHelper` 构造监听器在实例化时自动添加）。

- `ticking` 命名空间
  - `queue(task: () => void)` — 通过 `system.run` 在下一个 tick 执行一次任务。
  - `timeout(fn: () => void, delay?: number)` — 封装 `system.runTimeout`。
  - `repeat(fn: () => void, interval?: number)` — 封装 `system.runInterval`。
  - `tickable(group: string, fn: CallableFunction)` — 快速创建并返回一个临时 `Tickable` 对象并注册到组中。
  - `getTickingGroup(group: string)` — 获取或创建指定的 `Ticking` 组调度器。
  - `tick(group: string)` — 人工触发指定组的一次 tick（调用组内所有 tickables）。
  - `clear(group: string)` / `clearAll()` — 删除指定组或全部组。
  - `addTickingObject(tickable: Tickable)` / `removeTickingObject(tickable: Tickable)` — 将对象添加/移除到其所属组。

Ticking 类
- `class Ticking`
  - 字段: `tickables: Set<Tickable>`、`lastTick`、`lastDate`、`dilation`
  - `tick()`：计算 `dt` 与 `dms`（基于 `system.currentTick` 与 Date.now），遍历 `tickables` 并对允许 ticking 的对象调用 `(tick ?? update)(dt, dms)`。

实现/性能提示
- 使用分组 (`tickingGroup`) 可以把不同更新频率或场景的对象分开管理。
- `TickableObject` 装饰器结合 `ObjectHelper` 可自动将实例加入调度，适用于希望无需手工注册的类。

示例
```ts
@TickableObject
class MyService {
  tickingGroup = 'service'
  allowTicking = true
  tick(dt, dms) { /* 每帧逻辑 */ }
}

// 每帧触发特定分组
ticking.repeat(() => ticking.tick('actor'))
```
