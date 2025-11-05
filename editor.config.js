import ts from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import editorTsConf from './editor.tsconfig.json' with { type: 'json' }

export default [
    {
        input: './src/engine/tools/editor/browser.ts',
        output: {
            file: './dist/editor/browser.js',
            format: 'esm'
        },
        plugins: [
            json(),
            ts({
                tsconfig: './editor.tsconfig.json',
                include: ['src/engine/tools/**/*.ts'],
                exclude: ['node_modules/**']
            }),
            nodeResolve(),
            typescriptPaths(),
            // terser(),
        ]
    },
    {
        input: './src/engine/tools/editor/server.ts',
        output: {
            file: './dist/editor/server.cjs',
            format: 'cjs'
        },
        plugins: [
            json(),
            ts({
                tsconfig: './editor.tsconfig.json',
                include: ['src/engine/tools/**/*.ts'],
                exclude: ['node_modules/**']
            }),
            commonjs(),
            nodeResolve(),
            typescriptPaths(),
            // terser(),
        ]
    },
]
