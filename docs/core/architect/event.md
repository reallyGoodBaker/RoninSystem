**Event — API 文档**

- **源文件**: `src/engine/core/architect/event.ts`
- **职责**: 提供一组事件/信号/委托工具，用于组件或对象间的发布-订阅通信。


类型与类（详细）

- `EventInstigator<M extends { [key in keyof M]: unknown[] } = {}>`
  - 用途: 面向对象的事件管理器，适合需要频繁添加/删除监听器的场景。
  - 内部实现: 使用 `EventLinked` 链表来维护订阅者，删除操作为 O(1)（相较于数组 splice 性能更优）。
  - 方法:
    - `addListener<T extends keyof M>(eventName: T, callback: (...args: M[T]) => void): void`
    - `trigger<T extends keyof M>(eventName: T, ...args: M[T]): void`
    - `removeListener<T extends keyof M>(eventName: T, callback: Function): void`

- `EventComponent<M> extends Component`:
  - 作为 Component 的事件容器，API 与 `EventInstigator` 保持一致，但事件生命周期绑定到组件实例。

- `EventSignal<A extends unknown[] = unknown[]>`:
  - 简单的多观察者实现，适合事件较少变动但广播较频繁的场景。
  - 方法:
    - `addListener(callback: (...args: A) => void): void`
    - `removeListener(callback: (...args: A) => void): void`（通过索引删除，可能为 O(n)）
    - `trigger(...args: A): void`

- `EventDelegate<A extends unknown[] = unknown[]>`:
  - 单回调委托，适合只有单一消费者的情况（例如 UI 回调）。
  - 方法:
    - `bind(callback: (...args: A) => void, thisArg?: any): void`
    - `call(...args: A): void`
    - `unbind(): void`

性能与使用建议
- 若监听器需要频繁删除/替换（例如动态注册/注销），优先选用 `EventInstigator` 或 `EventComponent`。
- 若订阅集合稳定但触发频率高，`EventSignal` 更简单轻量。
- `EventDelegate` 用于一对一委托场景，避免数组分配和管理成本。

示例 — 基本使用
```ts
// EventSignal
const sig = new EventSignal<[number]>()
sig.addListener(v => console.log('val', v))
sig.trigger(42)

// EventInstigator
class Door extends EventInstigator<{ open: [], close: [] }> {
  open() { this.trigger('open') }
}

const d = new Door()
d.addListener('open', () => console.log('door opened'))
d.open()
```

示例
```ts
const sig = new EventSignal<[number]>()
sig.addListener(v => console.log(v))
sig.trigger(42)

class MyComp extends EventComponent<{ hit: [number] }> {
  onHit(dmg: number) { this.trigger('hit', dmg) }
}
```
