import typescript from '@rollup/plugin-typescript';
import { terser }  from '@rollup/plugin-terser';

export default {
    input: {
        main: 'src/main.ts',
        //config: 'src/config/index.ts',
    },
    output: {
        file: 'dist/bundle.js',
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
        typescript({
            exclude: ['src/imagery/**/*', 'src/textures/**/*', 'src/drawings_local.ts']
        }),
        terser()
    ],
    exclude: [
        'src/imagery/**',
        'src/textures/**'
    ],
};
