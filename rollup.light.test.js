import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'

export default {
    entry: 'src/ShaderLight/index.js',
    dest: 'game/js/plugins/liply_ShaderLight.js',
    plugins: [
        flow(),
        buble({
        })
    ],
    format: 'iife'
};