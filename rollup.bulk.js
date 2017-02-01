import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/BulkCommand/index.js',
    dest: 'dist/liply_BulkCommand.js',
    plugins: [
        flow(),
        buble({
        })
    ],
    format: 'iife'
};