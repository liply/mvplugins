import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/TimeCounter/index.js',
    dest: 'dist/liply_TimeCounter.js',
    plugins: [
        flow(),
        buble({
        })
    ],
    format: 'iife'
};