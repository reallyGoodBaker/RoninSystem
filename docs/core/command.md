**command.ts — API 文档**

- **源文件**: `src/engine/core/command.ts`
- **职责**: 提供命令注册工具 `CommandRegistry`，将自定义模板或基于 token 的描述转换为 Minecraft `CustomCommandRegistry` 可用的注册信息。

主要类型
- `interface CommandOptions`
  - `name`, `description`, `permissionLevel`, `cheatsRequired`, `parameters`（`Enum | Required | Optional` 数组）

- `interface CommandHandlerOptions`
  - `rawArgs: unknown[]`, `origin: CustomCommandOrigin`
  - `success(message?)`, `failure(message?)` — 控制 handler 返回结果。

常量
- `StringParamType` — 将自定义参数类型映射为 `CustomCommandParamType`，常用类型包括 `int`, `float`, `string`, `entity`, `player`, `xyz/location`, `enum`, `item`, `block` 等。

核心类 — `CommandRegistry`
- `registerFns: Set<Function>` — 内部保存所有延迟注册函数。
- `registerAll(customRegistry)` — 将所有已注册的函数使用给定 `CustomCommandRegistry` 进行注册（通常在 `Application` 启动时调用）。
- `registerFromOptions(opts, fn)`
  - 行为: 根据 `opts.parameters` 中的 token（包含 `enum/required/optional`），构造 `mandatoryParameters` 与 `optionalParameters`，并调用 `customRegistry.registerCommand(...)` 将最终命令绑定到 handler。`fn` 接收解析后的 `args` 对象与 `CommandHandlerOptions`。
  - 返回: `this`（可链式）。
- `register(name, description, template, fn, permissionLevel?, cheatsRequired?)`
  - 行为: 使用内置 `commandToken(template)` 解析 template 为参数 tokens，然后调用 `registerFromOptions`。

实现细节
- `enumMapping` 用于为 `enum` 类型参数生成临时枚举 key 并在 `customRegistry` 上注册枚举值。
- 注册时会把解析后的参数按顺序映射到 `paramNames`，在 handler 被调用时将 `params` 数组按此顺序转成一个 `args` 对象供 `fn` 使用。

使用示例
```ts
// 直接使用模板注册
CommandRegistry.register(
  'sayhello',
  'Say hello to a player',
  'player',
  (args, opts) => {
    opts.success(`Hello ${args.player}`)
  }
)

// 使用从 tokenizer 得到的参数结构注册（高级）
CommandRegistry.registerFromOptions({ name: 'foo', description: 'bar', permissionLevel: 0, cheatsRequired: true, parameters: [...] }, (args, opts) => {
  // handle
})
```

注意
- `registerAll(customRegistry)` 应在 engine 启动并获得 `CustomCommandRegistry` 实例后调用（`Application` 启动流程中已处理）。
- `CommandRegistry` 的设计将模板解析与最终注册解耦，支持装饰器/注解方式集中声明命令（例如 `registerAllFromAnnotations()`）。
