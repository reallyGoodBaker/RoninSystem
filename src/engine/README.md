# Ronin Mod Engine

v1.0.0-beta for `Minecraft: Bedrock Edition` 1.21.90

## 简介

Ronin Mod Engine 是一个用于开发 `Minecraft: Bedrock Edition` 模组的动作系统引擎。

## 需求
- `Minecraft: Bedrock Edition` 1.21.90+
- `typescript` 5.7+ (需全局安装)

## 注意事项
请将引擎文件复制到你的源码中，确保引擎文件与你的源码文件一同编译。

## 环境依赖
```json
{
    "devDependencies": {
        "@minecraft/server": "^2.1.0-beta.1.21.90-stable",
        "@minecraft/server-ui": "^2.0.0",
        "@rollup/plugin-json": "^6.1.0",
        "@rollup/plugin-node-resolve": "^16.0.1",
        "@rollup/plugin-terser": "^0.4.4",
        "@rollup/plugin-typescript": "^12.1.4",
        "rollup": "^4.46.2",
        "rollup-plugin-typescript-paths": "^1.5.0",
        "tsconfig-replace-paths": "^0.0.14",
        "tslib": "^2.8.1",
        "typescript": "^5.9.2"
    },
    "dependencies": {
        "@minecraft/math": "^2.2.8",
        "reflect-metadata": "^0.2.2",
        "typedi": "^0.10.0"
    }
}
```
### `tsconfig.json` 设置
```json
{
  "compilerOptions": {
    "target": "esnext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "module": "esnext",
    "rootDir": "./src",
    "moduleResolution": "bundler",
    "baseUrl": "./",
    "paths": {
        "@ronin/*": [
            "./src/engine/*"
        ],
        "@/*": [
            "./src/*"
        ]
    },
    "resolveJsonModule": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}

```

### 推荐设置

使用 `Rollup` 打包器可以更方便的进行模块化开发。

```js
// rollup.config.js
import ts from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'

export default {
    input: './src/index.ts',
    output: {
        file: './dist/index.js',
        format: 'esm'
    },
    plugins: [
        json(),
        ts(),
        nodeResolve(),
        typescriptPaths(),
        terser(),
    ],
    external: [
        "@minecraft/server",
        "@minecraft/server-ui"
    ]
}
```

```json
// package.json
{
    "devDependencies": {
        "@minecraft/server": "^2.1.0-beta.1.21.90-stable",
        "@minecraft/server-ui": "^2.0.0",
        "@rollup/plugin-node-resolve": "^16.0.1",
        "@rollup/plugin-typescript": "^12.1.4",
        "rollup": "^4.46.2",
        "rollup-plugin-typescript-paths": "^1.5.0",
        "tsconfig-replace-paths": "^0.0.14",
        "tslib": "^2.8.1",
        "typescript": "^5.9.2"
    },
    "dependencies": {
        "reflect-metadata": "^0.2.2",
        "typedi": "^0.10.0"
    }
}
```