import ts from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import syncAssetsPlugin from './scripts/syncAssets.js'
import { parseConf } from './scripts/parser.js'


export default [
    {
        input: './src/index.ts',
        output: {
            file: `./assets/behaviors/${parseConf().behaviorName}/scripts/index.js`,
            format: 'esm'
        },
        plugins: [
            json(),
            ts(),
            nodeResolve(),
            typescriptPaths(),
            terser(),
            syncAssetsPlugin(),
        ],
        external: [
            "@minecraft/server",
            "@minecraft/server-ui"
        ],
    }
]