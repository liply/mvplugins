import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/InterfaceBuilder/index.js',
    dest: 'dist/liply_InterfaceBuilder.js',
    plugins: [
        flow(),
        buble({
            objectAssign: 'Object.assign'
        })
    ],
    format: 'iife'
};