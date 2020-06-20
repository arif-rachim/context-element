// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import {terser} from "rollup-plugin-terser";

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'index.js',
            format: 'iife'
        },
        {
            file: 'index.min.js',
            format: 'iife',
            plugins: [terser()]
        }
    ],
    plugins: [typescript()]
};
