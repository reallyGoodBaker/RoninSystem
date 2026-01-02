**Plugin — API 文档**

- **源文件**: `src/engine/core/architect/plugin.ts`
- **职责**: 定义插件接口与插件加载器的类型约束，供 `Application` 使用以动态加载/卸载模块功能。


接口（详细）
- `IPlugin`
  - `readonly name: string` — 插件唯一名称，用于在 `Application.plugins` 中索引。
  - `readonly description: string` — 插件描述。
  - `startModule(app: IApplication): void` — 在插件被加载时调用（传入 `Application` 作为运行时上下文）。
  - `stopModule?(app: IApplication): void` — 在插件被卸载时调用，用于清理注册的事件或资源。

- `IPluginLoader`（例如 `Application`）
  - `loadPlugin(...ctor: ConstructorOf<IPlugin>[]): IPluginLoader` — 传入插件构造器数组，逐个实例化并调用 `startModule`。
  - `unloadPlugin(...name: string[]): IPluginLoader` — 通过插件名卸载并调用其 `stopModule`。
  - `getPlugin(name: string): IPlugin | undefined` — 获取已加载插件实例。

使用建议
- 插件应将注册逻辑（事件注册、命令注册、资源申请）放在 `startModule`，并在 `stopModule` 中做对应清理。
- 避免在 `startModule` 内做强阻塞或长时间计算，若需异步任务请在内部管理 Promise 并保持 `startModule` 快速返回。

示例
```ts
class MyPlugin implements IPlugin {
  name = 'my-plugin'
  description = 'Demo plugin'
  startModule(app) {
    // 注册事件、命令等
    app.getInst() // 使用 app
  }
  stopModule(app) {
    // 注销
  }
}

Application.getInst().loadPlugin(MyPlugin)
```
