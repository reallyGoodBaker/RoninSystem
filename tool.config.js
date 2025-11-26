import ts from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'


export default [
    {
        input: './src/tools/generator/bundleFiles.ts',
        output: {
            file: `./dist/tools/bundleFiles.cjs`,
            format: 'cjs'
        },
        plugins: [
            json(),
            ts({
                compilerOptions: {
                    outDir: './dist',
                    target: 'esnext'
                }
            }),
            nodeResolve(),
            terser(),
        ],
        external: [
            "@minecraft/server",
            "@minecraft/server-ui"
        ],
    },
    {
        input: './src/tools/generator/index.ts',
        output: {
            file: `./dist/tools/generator.cjs`,
            format: 'cjs'
        },
        plugins: [
            json(),
            ts({
                compilerOptions: {
                    outDir: './dist',
                    target: 'esnext'
                }
            }),
            nodeResolve(),
            terser(),
        ],
        external: [
            "@minecraft/server",
            "@minecraft/server-ui"
        ],
    },
]