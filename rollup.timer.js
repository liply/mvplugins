import buble from "rollup-plugin-buble";

export default {
    entry: 'src/Timer/index.js',
    dest: 'dist/liply_Timer.js',
    plugins: [
        buble({
        })
    ],
    onwarn: function(msg){},
    format: 'iife'
};