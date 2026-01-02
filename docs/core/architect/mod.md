**Mod — API 文档**

- **源文件**: `src/engine/core/architect/mod.ts`
- **职责**: 定义 Mod 插件接口与基类。Mod 可在 `Application` 的生命周期中注入行为（start / initialized / exit）。


接口（详细）
- `Mod extends Resource`
  - `start?(app: Application, ev: StartupEvent): void`
    - 在 `Application.enter()` 的 startup 过程被触发时调用（适合注册资源、初始化外部状态、订阅全局事件）。
  - `initialized?(app: Application): void`
    - 在 Application 完成初始化（所有 actors 尝试 start）后调用。此时可以访问并操作已创建的 actors。
  - `exit?(): void`
    - 在 Application 关闭/重启过程（shutdown）中调用，用于清理或保存运行时状态。

类: `ModBase`
- 实现: `ModBase implements Mod`
  - 行为: 构造时将自身设置为 `Application.modApp` 并将模块实例写入 `ReflectConfig.mod`，以便框架其他部分访问当前 mod。

示例
```ts
class MyMod extends ModBase {
  start(app, ev) {
    // 注册数据、加载配置、订阅事件
  }

  initialized(app) {
    // 访问 actors、执行延后初始化
  }

  exit() {
    // 清理
  }
}

// 通过 Resources.load 在应用启动时创建并 enter
Resources.load(MyMod)
```

最佳实践
- 避免在 `start()` 中执行耗时阻塞操作，若需异步初始化请使用异步逻辑并确保不会阻塞 `Application` 的启动流程。

