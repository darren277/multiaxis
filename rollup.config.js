import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'esm',
        sourcemap: true
    },
    plugins: [typescript()],
    exclude: [
        'src/imagery/**',
        'src/textures/**'
    ],
};
