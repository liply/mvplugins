import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/InterfaceBuilder/index.js',
    dest: 'game/js/plugins/liply_InterfaceBuilder.js',
    plugins: [
        flow(),
        buble({
            objectAssign: 'Object.assign'
        })
    ],
    sourceMap: true,
    format: 'iife'
};