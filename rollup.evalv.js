import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/EvalV/index.js',
    dest: 'dist/liply_EvalV.js',
    plugins: [
        flow(),
        buble({
        })
    ],
    onwarn: function(msg){},
    format: 'iife'
};