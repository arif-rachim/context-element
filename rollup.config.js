// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import {terser} from "rollup-plugin-terser";

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'iife'
    },
    plugins: [typescript(), terser()]
};
