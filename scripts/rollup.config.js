import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import del from 'rollup-plugin-delete';

const banner = `/*!
* Publisher – Javascript Pub/Sub library
* @license MIT
* © 2013–2025 Frank Kudermann @ alphanull
*/`;

export default [
    {
        input: 'src/publisher.js',
        output: {
            file: 'dist/publisher.min.js',
            format: 'esm',
            sourcemap: false,
            banner
        },
        plugins: [
            del({ targets: 'dist/*' }),
            resolve(),
            terser()
        ]
    },
    {
        input: 'src/publisher.js',
        output: {
            file: 'dist/publisher.min.cjs',
            format: 'umd',
            name: 'publisher',
            sourcemap: false,
            banner
        },
        plugins: [
            resolve(),
            terser()
        ]
    }
];
