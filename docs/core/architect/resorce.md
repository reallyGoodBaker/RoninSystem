**Resource / Resources — API 文档**

- **源文件**: `src/engine/core/architect/resorce.ts`
- **职责**: 管理实现 `Resource` 接口的单例资源，并提供 `with`/`withAsync` 的执行包装，保证在执行前后分别调用资源的 `enter`/`exit`。

接口
- Resource
  - enter?(): void
  - exit?(): void

类与方法（详细）
- `Resources.with(res: Resource, fn: () => T): [T, Error]`
  - 说明: 同步执行包装，先调用 `res.enter()`，然后执行 `fn()`，再调用 `res.exit()`。
  - 返回: 若 `fn()` 成功则 `[result, null]`，若抛错则 `[null, error]`。

- `Resources.withAsync(res: Resource, afn: () => Promise<T>)`
  - 异步版本：保证在 `afn()` 完成（resolve/reject）后调用 `res.exit()`。

- `Resources.load(...ctors: ConstructorOf<Resource>[])`
  - 功能: 为每个传入的 Resource 构造器实例化对象，调用其实例的 `enter()`，并将实例保存在内部映射中用于后续访问。
  - 返回: 创建的资源实例数组。

- `Resources.getResouce(ctor: ConstructorOf<Resource>)`
  - 返回: 指定构造函数对应的已加载实例，若未加载返回 `undefined`。

- `Resources.unload(...ctors: ConstructorOf<Resource>[])`
  - 行为: 对每个传入的构造器，查找已缓存实例并调用 `exit()`，随后从缓存中移除该实例。

并发与异常处理注意
- `with`/`withAsync` 会在 try/catch 中调用 `fn`/`afn`，并确保 `exit()` 在成功或失败时都会被调用。
- `Resources.load` 在调用 `enter()` 时若出现异常，已成功创建/注册的其它资源仍保留在映射中；若需要回滚行为，调用方应在捕获异常后显式调用 `Resources.unload(...)`。


示例
```ts
class MyRes implements Resource { enter() { /* init */ } exit() { /* cleanup */ } }
Resources.load(MyRes)
const inst = Resources.getResouce(MyRes)
Resources.unload(MyRes)
```
