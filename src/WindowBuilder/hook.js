import {registerPluginCommands, wrapPrototype, wrapStatic} from '../lib/util.js'
import WindowBuilder from './WindowBuilder.js'

function getCurrentBuilder(){
    return SceneManager._scene._liply_windowBuilder;
}

registerPluginCommands({
    window(id, parent, ...params){
        getCurrentBuilder().window(id, parent, params);
    },

    label(id, parent, text, ...params){
        getCurrentBuilder().label(id, parent, text, params);
    },

    picture(id, parent, name, ...params){
        getCurrentBuilder().picture(id, parent, name, params);
    },

    sprite(id, parent, name, ...params){
        getCurrentBuilder().sprite(id, parent, name, params);
    },

    close(id){
        getCurrentBuilder().close(id);
    },

    container(id, parent, ...params){
        getCurrentBuilder().sprite(id, parent, null, params);
    },

    animate(id, ...params){
        getCurrentBuilder().animate(id, params);
    }
});


wrapPrototype(Scene_Map, 'create', old=>function(){
    this._liply_windowBuilder = new WindowBuilder();

    if($gameSystem._liply_windowBuilder){
        this._liply_windowBuilder.load($gameSystem._liply_windowBuilder);
    }

    old.call(this);
});

wrapPrototype(Scene_Map, 'terminate', old=>function(){
    $gameSystem._liply_windowBuilder = this._liply_windowBuilder.save();
    old.call(this);
});

wrapPrototype(Scene_Map, 'update', old=>function(){
    this._liply_windowBuilder.update();
    old.call(this);
});

wrapPrototype(Scene_Map, 'createDisplayObjects', old=>function(){
    old.call(this);
    this.addChild(this._liply_windowBuilder.getStage());
});

//
// wrapStatic(DataManager, 'saveGame', old=>function(){
//     let currentBuilder = getCurrentBuilder();
//     if(currentBuilder){
//         $gameSystem._liply_windowBuilder = currentBuilder.save();
//     }
//
//     let result = old.apply(this, arguments);
//
//     $gameSystem._liply_windowBuilder = null;
//
//     return result;
// });