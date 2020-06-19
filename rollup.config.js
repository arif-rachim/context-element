// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import {terser} from "rollup-plugin-terser";

export default {
    input: 'src/index.ts',
    output: {
        dir: 'output',
        format: 'iife'
    },
    plugins: [typescript(), terser()]
};
//{lib: ["es5", "es6", "dom"], target: "es6"}
