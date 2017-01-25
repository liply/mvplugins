import buble from 'rollup-plugin-buble'

export default {
    entry: 'src/PictureExtension/index.js',
    dest: 'dist/liply_PictureExtension.js',
    plugins: [ buble() ],
    format: 'iife'
};