import ts from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'


export default [
    {
        input: './browser.ts',
        output: {
            file: '../../dist/editor/browser.js',
            format: 'esm'
        },
        plugins: [
            json(),
            ts({
                tsconfig: './tsconfig.json'
            }),
            nodeResolve(),
            typescriptPaths(),
            // terser(),
        ]
    },
    {
        input: './server.ts',
        output: {
            file: '../../dist/editor/server.cjs',
            format: 'cjs'
        },
        plugins: [
            json(),
            ts({
                tsconfig: './tsconfig.json'
            }),
            commonjs(),
            nodeResolve(),
            typescriptPaths(),
            // terser(),
        ]
    },
]
