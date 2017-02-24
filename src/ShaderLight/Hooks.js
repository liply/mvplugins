import parameters from './Parameters.js'

import {TYPE_POINT, TYPE_CONE} from './LightFilter.js'
import PersistentField from '../lib/PersistentField.js'
import LightProcessor from './LightProcessor.js'
import {wrapPrototype, wrapStatic, findEventByName, registerPluginCommands} from '../lib/util.js'

let field = new PersistentField('liply_ShaderLight');
field.register('enable', false);
field.register('playerRadius', parameters.playerRadius);
field.register('playerColor', parameters.playerColor);
field.register('playerAngleMin', parameters.playerAngleMin);
field.register('playerAngleMax', parameters.playerAngleMax);

function validateColor(color){
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
            r: parseInt(result[1], 16) / 0xFF,
            g: parseInt(result[2], 16)/ 0xFF,
            b: parseInt(result[3], 16) / 0xFF
        } : {r:1, g:1, b:1};
}

function setSelfSwitchD(mapId, eventId, value){
    $gameSelfSwitches.setValue([mapId, eventId, 'D'], value);
}

function setupLight(target, radius, colorString, flicker){
    const color = validateColor(colorString);
    target._light = target._light || [];

    target._light.push({
        type: TYPE_POINT,
        radius,
        flicker,
        r: color.r,
        g: color.g,
        b: color.b
    });
    target._lightDisabled = false;
}

function setupConeLight(target, radius, colorString, angleMin, angleMax, flicker){
    const color = validateColor(colorString);
    target._light = target._light || [];

    target._light.push({
        type: TYPE_CONE,
        angleMin,
        angleMax,
        radius,
        flicker,
        r: color.r,
        g: color.g,
        b: color.b
    });
    target._lightDisabled = false;
}

function setupEventLight(event, commands, flicker){
    const radius = +commands[0];
    const lightId = +commands[2];
    const targetEvent = isNaN(lightId)? event: $gameMap.event(lightId);

//    setSelfSwitchD($gameMap.mapId(), targetEvent.eventId(), true);
    setupLight(targetEvent, radius, commands[1], flicker);
}

function setupEventConeLight(event, commands, flicker){
    const radius = +commands[0];
    const colorString = commands[1];
    const angleMin = +commands[2];
    const angleMax = +commands[3];
    const lightId = +commands[4];

    const target = isNaN(lightId)? event: $gameMap.event(lightId);
    setupConeLight(target, radius, colorString, angleMin, angleMax, flicker);
}

wrapPrototype(Game_Event, 'initialize', old=>function(mapId, eventId){
    old.apply(this, arguments);

    let event = this.event();
    DataManager.extractMetadata(event);
    if(event.meta['light']){
        setupEventLight(this, event.meta['light'].split(' '), false);
    }
    if(event.meta['fire']){
        setupEventLight(this, event.meta['fire'].split(' '), true);
    }
    if(event.meta['flashlight']){
        setupEventConeLight(this, event.meta['cone'].split(' '), false);
    }
    if(event.meta['lanthanum']){
        setupEventConeLight(this, event.meta['cone'].split(' '), true);
    }


    let note = event.event().note.split(' ');
    let command = note.shift().toLowerCase();
    switch(command){
        case 'light':
            setupEventLight(this, note, false);
            break;
        case 'fire':
            setupEventLight(this, note, true);
            break;
        case 'flashlight':
            setupEventLight(this, note, false);
            break;
        case 'lanthanum':
            setupEventLight(this, note, true);
            break;
    }
});

function processLight(thisEvent, args){
    let event;
    switch(args[0]){
        case 'on':
            if(args[1] === 'player'){
                event = $gamePlayer;
            }else{
                event = findEventByName(args[1]);
                if(event) event = thisEvent;
            }

            event._lightDisabled = false;
            break;

        case 'off':
            if(args[1] === 'player'){
                event = $gamePlayer;
            }else{
                event = findEventByName(args[1]);
                if(event) event = thisEvent;
            }

            event._lightDisabled = true;
            break;

        case 'deactivate':
            field.enable = false;
            break;

        case 'activate':
            field.enable = true;
            break;
    }
}


registerPluginCommands({
    light(...params){
        processLight(this.event(), params);
    }
});

wrapPrototype(Game_Player, 'initialize', old=>function(){
    old.apply(this, arguments);

    if(parameters.playerLightType.contains('light')){
        setupLight(this, parameters.playerRadius, parameters.playerColor, false);
    }
    if(parameters.playerLightType.contains('fire')){
        setupLight(this, parameters.playerRadius, parameters.playerColor, true);
    }
    if(parameters.playerLightType.contains('flashlight')){
        setupConeLight(this, parameters.playerConeRadius, parameters.playerColor,
            parameters.playerAngleMin, parameters.playerAngleMax, false);
    }
    if(parameters.playerLightType.contains('lanthanum')){
        setupConeLight(this, parameters.playerConeRadius, parameters.playerColor,
            parameters.playerAngleMin, parameters.playerAngleMax, true);
    }

});

wrapPrototype(Spriteset_Map, 'initialize', old=>function(){
    this._lightProcessor = new LightProcessor();

    let color = validateColor(parameters.ambientColor);
    this._lightProcessor.setAmbient(color);

    old.apply(this, arguments);
});

wrapPrototype(Spriteset_Map, 'update', old=>function() {
    this._lightProcessor.update(this._baseSprite, this._characterSprites);
    old.apply(this, arguments);
});

wrapStatic(SceneManager, 'preferableRendererType', old=>function(){
    return 'webgl';
});