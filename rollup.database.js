import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/Database/index.js',
    dest: 'dist/liply_Database.js',
    plugins: [
        flow(),
        buble({
        })
    ],
    format: 'iife'
};