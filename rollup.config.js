import typescript from '@rollup/plugin-typescript';
import terser  from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

export default {
    input: {
        main: 'src/main.ts',
        //config: 'src/config/index.ts',
    },
    output: {
        dir: 'dist/',
        format: 'es',
        sourcemap: true,

        // Nice‑looking filenames
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',

        manualChunks(id) {
            if (id.includes('node_modules')) return 'vendor';   // shared libs
            if (id.includes('/src/config/')) return 'config';   // eager config
            // every other file keeps default: 1 chunk per dynamic import
        }
    },
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                __LOG_LEVEL__: JSON.stringify(process.env.LOG_LEVEL || 'info')
            }
        }),
        nodeResolve({
            exclude: [
                'src/imagery/**/*',
                'src/textures/**/*',
                //'src/drawings_local.ts'
            ]
        }),
        //terser()
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            sourceMap: true,
            inlineSources: true,
            declaration: false, // no need for .d.ts files
            noEmitOnError: true, // fail on type errors
        }),
    ],
    exclude: [
        'src/imagery/**',
        'src/textures/**'
    ],
};
