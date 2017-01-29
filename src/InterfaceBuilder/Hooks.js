
import {registerPluginCommands, wrapPrototype, arr2obj} from '../lib/util.js'
import ComponentManager from './ComponentManager.js'
import PersistentField from '../lib/PersistentField.js'
import parameters from './Parameters.js'

let field = new PersistentField(parameters.PLUGIN_NAME);
field.register('uiMode', false);

function getComponentManager(){
    return SceneManager._scene._componentManager;
}

registerPluginCommands({
    window(id, parentId, ...params){
        getComponentManager().add({
            type: 'Window',
            id, parentId,
            ...arr2obj(params)
        });
    },

    label(id, parentId, text, ...params){
        getComponentManager().add({
            type: 'Label',
            id, parentId,
            text,
            ...arr2obj(params)
        });
    },

    picture(id, parentId, picture, ...params){
        getComponentManager().add({
            type: 'Picture',
            id, parentId,
            picture,
            ...arr2obj(params)
        });
    },

    draw(type, id, param1st, ...params){
        getComponentManager().addCommand(type, id, {
            ...arr2obj(params),
            picture: param1st,
            text: param1st
        });
    },

    clear(id){
        getComponentManager().clearCommands(id);
    },

    close(id){
        getComponentManager().close(id);
    },

    container(id, parentId, ...params){
        getComponentManager().add({
            type: 'Container',
            id, parentId,
            ...arr2obj(params)
        });
    },

    animate(id, ...params){
        getComponentManager().animate(id, arr2obj(params));
    },

    uiMode(mode){
        field.uiMode = mode.toLowerCase() === 'on';
    },

    setTrigger(id, name){
        getComponentManager().setHandler(id, 'trigger', name);
    },

    removeTrigger(id){
        getComponentManager().removeHandler(id, 'trigger');
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

wrapPrototype(Game_Player, 'update', old=>function(active){
    if(field.uiMode){
        old.call(this, false)
    }else{
        old.call(this, active);
    }
});

wrapPrototype(Game_Timer, 'update', old=>function(active){
    if(field.uiMode){
        old.call(this, false)
    }else{
        old.call(this, active);
    }
});

wrapPrototype(Game_CharacterBase, 'update', old=>function(){
    if(!field.uiMode){
        old.call(this);
    }
});


wrapPrototype(Scene_Map, 'create', old=>function(){
    this._componentManager = new ComponentManager();

    if($gameSystem._componentManager){
        this._componentManager.load($gameSystem._componentManager);
        $gameSystem._componentManager = null;
    }

    old.call(this);
});

wrapPrototype(Scene_Map, 'terminate', old=>function(){
    $gameSystem._componentManager = this._componentManager.save();
    old.call(this);
});

wrapPrototype(Scene_Map, 'update', old=>function(){
    this._componentManager.update();

    if(!$gameMap.isEventRunning() && TouchInput.isTriggered()){
        const name = this._componentManager.getHandler('trigger', TouchInput.x, TouchInput.y);
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
    this.addChild(this._componentManager.getStage());
});

SceneManager.getComponentManager = function(){
    return getComponentManager();
};