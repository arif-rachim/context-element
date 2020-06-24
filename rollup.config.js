// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import {terser} from "rollup-plugin-terser";

const pkg = require('./package');

const minOutputFile = (name) => {
    const splitDots = name.split('.');
    return [...splitDots.slice(0,splitDots.length-1),'min',splitDots[splitDots.length-1]].join('.');
};

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'iife',
        },
        {
            file: minOutputFile(pkg.main),
            format: 'iife',
            plugins: [terser()]
        }
    ],
    plugins: [typescript()]
};
