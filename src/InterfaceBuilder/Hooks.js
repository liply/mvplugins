
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

    emulate(key, id){
        getComponentManager().emulateEvent(key ,id);
    },

    removeEmulation(key){
        getComponentManager().removeEventEmulation(key);
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

    spring(stiffness, damping){
        getComponentManager().setSpringParams(+stiffness, +damping);
    },

    springDefault(){
        getComponentManager().setDefaultSpringParams();
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
    },

    setLongPress(id, name){
        getComponentManager().setHandler(id, 'longPress', name);
    },

    removeLongPress(id){
        getComponentManager().removeHandler(id, 'longPress');
    },

    setPress(id, name){
        getComponentManager().setHandler(id, 'press', name);
    },

    removePress(id){
        getComponentManager().removeHandler(id, 'press');
    },

    setRelease(id, name){
        getComponentManager().setHandler(id, 'release', name);
    },

    removeRelease(id){
        getComponentManager().removeHandler(id, 'release');
    },

    wait(frame){
        this.wait(+frame);
        this._breakBulkMode = true;
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

function startEvent(name){
    const event = findEventByName(name);
    if(event){
        event.start();
        return true;
    }else{
        const id = findCommonEventIdByName(name);
        if(id){
            $gameTemp.reserveCommonEvent(id);
            return true;
        }
    }

    return false;
}

wrapPrototype(Scene_Map, 'update', old=>function(){
    this._componentManager.update();

    let eventRunning = $gameMap.isEventRunning();

    if(TouchInput.isTriggered() && !eventRunning){
        const name = this._componentManager.getHandler('trigger', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name) || eventRunning;
    }
    if(TouchInput.isPressed() && !eventRunning){
        const name = this._componentManager.getHandler('press', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name) || eventRunning;
    }
    if(TouchInput.isLongPressed() && !eventRunning){
        const name = this._componentManager.getHandler('longPress', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name) || eventRunning;
    }
    if(TouchInput.isReleased() && !eventRunning){
        const name = this._componentManager.getHandler('release', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name) || eventRunning;
    }

    if(!eventRunning){
        const name = this._componentManager.getEmulateEventName();
        startEvent(name);
    }

    old.call(this);
});

wrapPrototype(Scene_Map, 'createDisplayObjects', old=>function(){
    old.call(this);
    this.addChild(this._componentManager.getStage());
});

wrapPrototype(Game_Interpreter, 'command355', old=>function(){
    let script = this.currentCommand().parameters[0] + '\n';
    this._bulkMode = true;
    this._breakBulkMode = false;
    if(/^\/\/\s*@ib/.test(script)){
        while (this.nextEventCode() === 655){
            this._index++;
            let params = this.currentCommand().parameters[0].split(' ');
            let command = params.shift();
            this.pluginCommand(command, params);

            if(this._breakBulkMode) return true;
        }

        this._bulkMode = false;
        return true;
    }else{
        return old.call(this);
    }
});

wrapPrototype(Game_Interpreter, 'command655', old=>function(){
    this._breakBulkMode = false;
    if(this._bulkMode){
        while (this.currentCommand().code === 655){
            let params = this.currentCommand().parameters[0].split(' ');
            let command = params.shift();
            this.pluginCommand(command, params);

            if(this._breakBulkMode) return true;
            this._index++;
        }

        this._bulkMode = false;
    }

    return true;
});

SceneManager.getComponentManager = function(){
    return getComponentManager();
};