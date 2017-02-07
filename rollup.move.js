import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/FreeMove/index.js',
    dest: 'dist/liply_FreeMove.js',
    plugins: [
        flow(),
        buble({
        })
    ],
    format: 'iife'
};