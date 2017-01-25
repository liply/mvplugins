import buble from 'rollup-plugin-buble'

export default {
    entry: 'src/WindowBuilder/index.js',
    dest: 'dist/liply_WindowBuilder.js',
    plugins: [ buble() ],
    format: 'iife'
};