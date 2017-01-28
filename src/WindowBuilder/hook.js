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

    close(id){
        getCurrentBuilder().close(id);
    },

    container(id, parent, ...params){
        getCurrentBuilder().sprite(id, parent, null, params);
    },

    animate(id, ...params){
        getCurrentBuilder().animate(id, params);
    },

    setTrigger(id, commonId){
        getCurrentBuilder().setOnTriggerHandler(id, commonId);
    },

    removeTrigger(id){
        getCurrentBuilder().removeOnTriggerHandler(id);
    }
});

function findEventByName(name){
    return $gameMap.events().find(ev=>(ev && (ev.event().name === name)));
}

function findCommonEventIdByName(name){
    let id;
    $dataCommonEvents.find((ev, idx)=>{
        if(ev && (ev.name === name)){
            id = idx;
            return true;
        }
    });

    return id;
}


wrapPrototype(Scene_Map, 'create', old=>function(){
    this._liply_windowBuilder = new WindowBuilder();

    if($gameSystem._liply_windowBuilder){
        this._liply_windowBuilder.load($gameSystem._liply_windowBuilder);
        $gameSystem._liply_windowBuilder = null;
    }

    old.call(this);
});

wrapPrototype(Scene_Map, 'terminate', old=>function(){
    $gameSystem._liply_windowBuilder = this._liply_windowBuilder.save();
    old.call(this);
});

wrapPrototype(Scene_Map, 'update', old=>function(){
    this._liply_windowBuilder.update();

    if(!$gameMap.isEventRunning() && TouchInput.isTriggered()){
        const name = this._liply_windowBuilder.getOnTriggerHandler(TouchInput.x, TouchInput.y);
        const event = findEventByName(name);
        if(event){
            event.start();
        }else{
            const id = findCommonEventIdByName(name);
            if(id){
                $gameTemp.reserveCommonEvent(id);
            }
        }
    }

    old.call(this);
});

wrapPrototype(Scene_Map, 'createDisplayObjects', old=>function(){
    old.call(this);
    this.addChild(this._liply_windowBuilder.getStage());
});

SceneManager.getWindowBuilder = function(){
    return getCurrentBuilder();
};