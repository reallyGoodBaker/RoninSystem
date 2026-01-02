**Reflect — API 文档**

- **源文件**: `src/engine/core/architect/reflect.ts`
- **职责**: 提供运行时上下文存取与弱引用工具，允许在组件生命周期内通过全局上下文读取当前 Actor，并为 long-lived 引用提供弱引用包装。

ReflectConfig
- `static mod: Mod`
- `static set contextActor(actor: Actor)`
  - 用于由运行时设置当前上下文 Actor（通常在 Actor 调用组件钩子前由框架设置）。
- `static unsafeCtxActor(): Actor | undefined`
  - 返回内部保存的 Actor（请仅在生命周期中使用）。
- `static contextActorRef(): ActorWeakRef`
  - 返回 `ActorWeakRef`，用于跨异步边界获取 Actor 的弱引用。

ActorWeakRef
- `constructor(actor: Actor)`
- `deref(): Actor | undefined`
  - 如果引用仍有效则返回 Actor（并清空内部引用），否则返回 undefined。
- `get isValid(): boolean`
  - 检查内部 Actor 引用是否仍代表有效的原生实体（若是 Pawn，会检查 `entity.isValid`）。

注意与使用场景
- `ReflectConfig` 的上下文 actor 是框架内部使用的全局可变状态，不要在组件外滥用。需要长期保留 actor 时使用 `ActorWeakRef`。

使用示例
```ts
// 在组件生命周期内创建弱引用并在异步回调中使用
const ref = ReflectConfig.contextActorRef()
setTimeout(() => {
  const actor = ref.deref()
  if (actor) {
    // actor 仍有效，可以安全访问
  }
}, 1000)
```
