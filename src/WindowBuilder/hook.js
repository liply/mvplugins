import {registerPluginCommands, wrapPrototype} from '../lib/util.js'
import WindowBuilder from './WindowBuilder.js'

let builder = new WindowBuilder();

registerPluginCommands({
    window(id, parent, ...params){
        builder.window(id, parent, params);
    },

    label(id, parent, text, ...params){
        builder.label(id, parent, text, params);
    },

    picture(id, parent, name, ...params){
        builder.picture(id, parent, name, params);
    },

    closeWindow(id){
        builder.close(id);
    },

    animate(id, ...params){
        builder.animate(id, params);
    }
});


wrapPrototype(Scene_Map, 'terminate', old=>function(){
    old.call(this);
    this.removeChild(builder.getStage());
});


wrapPrototype(Scene_Map, 'update', old=>function(){
    builder.update();
    old.call(this);
});

wrapPrototype(Scene_Map, 'createDisplayObjects', old=>function(){
    old.call(this);
    this.addChild(builder.getStage());
});
