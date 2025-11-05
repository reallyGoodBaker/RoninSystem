import ts from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'

export default [
    {
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
            // terser(),
        ],
        external: [
            "@minecraft/server",
            "@minecraft/server-ui"
        ],
    }
]