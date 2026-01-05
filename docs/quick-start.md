# 快速开始

本快速开始面向想立即在本地构建、开发和调试 RoninSystem 的开发者。假设您已在系统中安装了 Node.js（推荐 LTS）。

## 先决条件
- Node.js LTS（建议 >= 18）
- npm（随 Node.js 一起安装）或等效包管理器


## 安装依赖

使用 `npm` 安装依赖：

```bash
npm install
```

## 常用脚本

仓库中已定义的常用 `npm` 脚本（见 `package.json`）：

- `npm run link`：运行 `scripts/link.js`，用于链接或准备本地资源。
- `npm run build`：执行预构建并使用 Rollup 打包主库。
- `npm run watch`：预构建后以 Rollup 监听模式构建，便于开发时实时重建。
- `npm run editor`：构建编辑器（`build-editor`）并启动编辑器服务器。
- `npm run build-addon`：在完成构建后打包附加资源/插件。
- `npm run docs`：生成 API 文档（使用 TypeDoc），输出到 `docs/engine`。

示例：本地开发时常用命令

```bash
# 只构建并进入监听模式（推荐插件/核心开发）
npm run watch

# 启动编辑器（构建 + 本地服务器）
npm run editor

# 生成最终构建产物
npm run build

# 打包扩展/插件
npm run build-addon
```

## 构建产物与目录

- 构建输出目录：`dist/`
- 编辑器代码位于：`src/editor/`（静态资源在 `src/editor/style.css` 等）
- 游戏资源位于：`assets/`（供打包时使用）

## 本地开发流程建议

1. `npm install`
2. `npm run link`（如需将资源链接到工作区）
3. `npm run watch` 开发核心逻辑；若需要编辑器界面，单独运行 `npm run editor` 来启动编辑器服务器
4. 修改 TypeScript 源码，Rollup 会在监听模式下自动重建

## 生成文档

运行：

```bash
npm run docs
```

生成的文档位于 `docs/engine`。

## 常见问题

- 如果构建失败，请先检查 Node 版本并删除 `node_modules` 后重装。
- 编辑器构建依赖 Tailwind，请确保 `@tailwindcss/cli` 已安装（项目 devDependencies 中已包含）。

## 贡献

欢迎提交 PR。请参阅仓库根目录的贡献指南和代码风格约定。

---

如需把本快速开始翻译成英文或扩展示例（比如如何在 Bedrock 环境部署打包产物），我可以继续补充。
