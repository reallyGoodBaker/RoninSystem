**profiler.ts — API 文档**

- **源文件**: `src/engine/core/profiler.ts`
- **职责**: 提供调试与打印工具，将信息输出到 Minecraft world（玩家聊天/调试面板），并提供格式化、定制打印器与快速计时（`prof`）函数。

主要导出
- `registerCustomPrinter(matcher, printer)`
  - 注册一个自定义打印器。`matcher(inst)` 返回 true 表示该 printer 负责格式化该对象。

- `registerCustomTypePrinter(typeCtor, printer)`
  - 注册基于构造函数的打印器（通常用于类实例）。

- `format(...message)`
  - 将任意对象格式化为字符串用于输出。会对原始类型、函数、Minecraft 实体（包含 `nameTag` / `typeId`）做友好化输出；对对象会遍历原型链并将字段按颜色/类型标记。

- `print(level, ...message)` / `debug` / `info` / `warn` / `error`
  - 打印到世界消息（通过 `world.sendMessage`），`level` 决定前缀与颜色。

- `prof(name, fn, ...args)`
  - 简单的时间测量包装，执行 `fn(...args)` 并在完成后输出耗时信息（采用 `PROFIER_CONFIG` 中的阈值与颜色）。返回 `fn` 的返回值。

内部说明
- 文件中存在 `Profile`、`DebugTrack`、`DebugTreeNode` 等内部类型实现更复杂的可视化/跟踪逻辑，但当前导出的 API 主要为上面提到的打印与格式化函数。

自定义打印器示例
```ts
profiler.registerCustomTypePrinter(MyClass, inst => `MyClass(${inst.id})`)
profiler.info('object:', myObj)
```

使用示例
```ts
profiler.debug('Starting step', step)
profiler.prof('heavyTask', () => doHeavyWork())
```

注意
- 输出信息会通过 `world.sendMessage` 在服务器/运行环境广播，慎用在频繁或敏感信息打印场合。
