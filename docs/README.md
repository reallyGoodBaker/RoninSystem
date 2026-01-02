**RoninSystem Docs**

This directory contains developer-facing documentation generated from `src/engine/core` and `src/engine/core/architect`.

Quick navigation

- **Core documentation**: `docs/core/` — low-level engine modules (ticking, tags, command registry, profiler, etc.). See `docs/core/README.md` for details.
- **Architect documentation**: `docs/architect/` — Actor/Component framework, Application, SpawnConfig, Plugins, World integration.

Files (high level)

- `docs/core/`:
  - `types.md` — common types (`ConstructorOf`)
  - `ticking.md` — tick scheduling and `Tickable` system
  - `tag.md` — Tag system and `TaggableObject`
  - `store.md` — placeholder (source file empty)
  - `profiler.md` — debug/format/printing helpers
  - `predefined.md` — base Pawn / Controller implementations
  - `command.md` — command registration helper (`CommandRegistry`)

- `docs/architect/`:
  - See `docs/architect/README.md` for a full index of the Actor/Component framework docs.

How to use

- Browse the `docs/core` and `docs/architect` directories for API docs and examples.
- If you want these pages committed, I can create a git commit for you.
# RoninSystem 文档中心

欢迎来到 RoninSystem 文档中心。RoninSystem 是一个专为 Minecraft Bedrock 脚本 API 设计的高性能游戏框架，采用 TypeScript 编写，提供现代、类型安全的开发体验。

## 文档结构

### 核心文档
- [架构概览](./architecture-overview.md) - 整体设计理念和核心组件
- [快速开始](./quick-start.md) - 环境搭建和第一个示例

### 模块文档
- [有限状态机（FSM）](./modules/fsm.md) - 高性能有限状态机系统
- [状态树（StateTree）](./modules/statetree.md) - 层次化状态管理与异步任务
- [动画序列（AnimSeq）](./modules/animseq.md) - 动画管理与事件通知系统
- [浪人控制（Ronin）](./modules/ronin.md) - 玩家输入与控制

### 开发指南
- [TypeScript 最佳实践](./guides/typescript-best-practices.md)
- [性能优化](./guides/performance-optimization.md)
- [调试技巧](./guides/debugging-tips.md)

### API 参考
- [核心 API](./api/core.md)
- [插件 API](./api/plugins.md)

## 项目特点

1. **高性能**：预计算优化、内存安全、低开销设计
2. **类型安全**：全面的 TypeScript 支持，编译时错误检测
3. **模块化**：插件化架构，功能模块清晰分离
4. **易用性**：声明式 API、装饰器驱动、直观的配置
5. **健壮性**：全面的错误处理、失败快速原则、资源自动管理

## 开始使用

如果您是首次使用 RoninSystem，建议按照以下顺序阅读：
1. [快速开始](./quick-start.md) - 环境搭建和第一个示例
2. [架构概览](./architecture-overview.md) - 理解核心概念
3. [有限状态机（FSM）](./modules/fsm.md) - 学习最常用的状态管理模块

## 贡献

欢迎贡献代码和文档改进！请参阅 [贡献指南](./CONTRIBUTING.md)。

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。
