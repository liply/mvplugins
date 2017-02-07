(function () {
'use strict';

/*:
 *
 * @help
 * ShaderLight Engine
 *
 * @param Player Radius
 * @default 50
 *
 * @param Player Cone Radius
 * @default 200
 *
 * @param Player Color
 * @default #ffffff
 *
 * @param Player AngleMin
 * @default 30
 *
 * @param Player AngleMax
 * @default 40
 *
 * @param Player Light Type
 * @default fire,lanthanum
 *
 * @param Ambient Color
 * @default #555555
 *
 */

var PLUGIN_NAME = 'liply_ShaderLight';
var parameters = PluginManager.parameters(PLUGIN_NAME);

var parameters$1 = {
    PLUGIN_NAME: PLUGIN_NAME,
    ambientColor: parameters['Ambient Color'],
    playerRadius: +parameters['Player Radius'],
    playerConeRadius: +parameters['Player Cone Radius'],
    playerColor: parameters['Player Color'],
    playerAngleMin: +parameters['Player AngleMin'],
    playerAngleMax: +parameters['Player AngleMax'],
    playerLightType: parameters['Player Light Type'].split(',').map(function (p){ return p.toLowerCase(); })
};

//      

var TYPE_POINT = 1;
var TYPE_CONE = 2;

function generateFragmentShader(numPoints        , numCones        ){
    //pointLights: x, y, r1, r2
    //coneLights: x, y, r1, r2
    //coneSetups: ux, uy, angleMin(cos), angleMax(cos)
    numPoints = numPoints || 1;
    numCones = numCones || 1;

    return ("\nprecision highp float;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform sampler2D uSampler;\n\nuniform vec4 u_pointLights[" + numPoints + "];\nuniform vec4 u_pointColors[" + numPoints + "];\n\nuniform vec4 u_coneLights[" + numCones + "];\nuniform vec4 u_coneSetups[" + numCones + "];\nuniform vec4 u_coneColors[" + numCones + "];\n\nuniform vec4 u_ambientColor; \n\nfloat calcPointLightPower(vec4 p){\n    float l = length(p.xy - gl_FragCoord.xy);\n    \n    return 1.0 - smoothstep(0.0, p.z+p.w, l);\n}\n\nfloat calcConeBasePower(vec4 p){\n    float l = length(p.xy - gl_FragCoord.xy);\n\n    float a = -1.0 / (p.w - p.z);\n    float b = -a * p.w;\n    \n    return clamp(a*l+b, 0.0, 1.0);\n}\n\nfloat calcConeLightPower(vec4 p, vec4 s){\n    vec2 unit = normalize(gl_FragCoord.xy - p.xy);\n    float u = dot(unit, s.xy);\n\n    return calcPointLightPower(p) * clamp(smoothstep(s.w, s.z, u), 0.0, 1.0);\n}\n\n\nvec4 applyLight(vec4 color){\n    vec4 light = vec4(0.0, 0.0, 0.0, 1.0);\n    for(int n = 0; n < " + numPoints + "; ++n){\n        light += calcPointLightPower(u_pointLights[n]) * u_pointColors[n];\n    }\n    \n    for(int n = 0; n < " + numCones + "; ++n){\n        light += calcConeLightPower(u_coneLights[n], u_coneSetups[n]) * u_coneColors[n];\n    }\n    \n    return clamp(light+u_ambientColor, vec4(0.0), vec4(1.0)) * color;\n}\n\nvoid main(){\n    gl_FragColor = applyLight(texture2D(uSampler, vTextureCoord));\n}\n");
}

                 

var LightFilter = (function (superclass) {
    function LightFilter(numPoints        , numCones        ){
        superclass.call(this, null, generateFragmentShader(numPoints, numCones));
    }

    if ( superclass ) LightFilter.__proto__ = superclass;
    LightFilter.prototype = Object.create( superclass && superclass.prototype );
    LightFilter.prototype.constructor = LightFilter;

    LightFilter.prototype.setLight = function setLight (num        , x        , y        , r1        , r2        , r        , g        , b        ){
        var lights = this.uniforms.u_pointLights;
        var colors = this.uniforms.u_pointColors;
        var i = num*4;
        lights[i+0] = x;
        lights[i+1] = y;
        lights[i+2] = r1;
        lights[i+3] = (r2-r1)*Math.random();

        colors[i+0] = r;
        colors[i+1] = g;
        colors[i+2] = b;
        colors[i+3] = 1.0;

        this.uniforms.u_pointLights = lights;
        this.uniforms.u_pointColors = colors;
    };

    LightFilter.prototype.setCone = function setCone (num        , x        , y        ,
            r1        , r2        ,
            ux        , uy        ,
            angleMin        , angleMax        ,
            r        , g        , b        ){
        var lights = this.uniforms.u_coneLights;
        var setups = this.uniforms.u_coneSetups;
        var colors = this.uniforms.u_coneColors;
        var i = num*4;
        lights[i+0] = x;
        lights[i+1] = y;
        lights[i+2] = r1;
        lights[i+3] = (r2-r1)*Math.random();

        setups[i+0] = ux;
        setups[i+1] = uy;
        setups[i+2] = Math.cos(angleMin);
        setups[i+3] = Math.cos(angleMax);

        colors[i+0] = r;
        colors[i+1] = g;
        colors[i+2] = b;
        colors[i+3] = 1.0;

        this.uniforms.u_coneLights = lights;
        this.uniforms.u_coneColors = colors;
        this.uniforms.u_coneSetups = setups;
    };

    LightFilter.prototype.setAmbient = function setAmbient (r        ,g        ,b        ){
        var color = this.uniforms.u_ambientColor;
        color[0] = r;
        color[1] = g;
        color[2] = b;
        color[3] = 1;
        this.uniforms.u_ambientColor = color;
    };

    return LightFilter;
}(PIXI.Filter));

var PersistentField = function PersistentField(prefix){
    this._prefix = prefix;
};

PersistentField.prototype.register = function register (name, defaultValue){
    var key = this._prefix + '_' + name;

    Object.defineProperty(this, name, {
        set: function set(newValue){
            $gameSystem[key] = newValue;
        },
        get: function get(){
            if($gameSystem[key] === undefined){
                $gameSystem[key] = defaultValue;
            }

            return $gameSystem[key];
        }
    });
};

//     

var FLICKER = 7;

var LightProcessor = function LightProcessor(){
    this._filterCache = {};
};

LightProcessor.prototype.setAmbient = function setAmbient (color    ){
    this._ambient = color;
};

LightProcessor.prototype._createOrGetFilter = function _createOrGetFilter (numPoints    , numCones    ){
    var key = numPoints + ':' + numCones;

    if(!this._filterCache[key]){
        this._filterCache[key] = new LightFilter(numPoints, numCones);
    }
    return this._filterCache[key];
};

LightProcessor.prototype._lightX = function _lightX (sprite    ){
    return sprite.x - $gameMap.displayX();
};

LightProcessor.prototype._lightY = function _lightY (sprite    ){
    return Graphics.height - (-$gameMap.tileHeight()/2 + sprite.y - $gameMap.displayY());
};

LightProcessor.prototype._flicker = function _flicker (l    ){
    var r1 = l.radius;
    if(l.flicker) { return r1 + FLICKER; }
    else { return r1; }
};

LightProcessor.prototype._setupFilterLights = function _setupFilterLights (sprites           ){
        var this$1 = this;

    var lights = sprites.filter(function (s){ return s._character._light.length !== 0; });
    var points = 0;
    var cones = 0;

    lights.forEach(function (sprite){
        sprite._character._light.forEach(function (light){
            switch(light.type){
                case TYPE_POINT:
                    points++;
                    break;
                case TYPE_CONE:
                    cones++;
                    break;
            }
        });
    });

    var filter = this._createOrGetFilter(points, cones);

    lights.forEach(function (sprite){
        sprite._character._light.forEach(function (light){
            if(light.type === TYPE_POINT){
                filter.setLight(--points,
                    this$1._lightX(sprite), this$1._lightY(sprite),
                    light.radius, this$1._flicker(light),
                    light.r, light.g, light.b);

            }else if(light.type === TYPE_CONE){
                var angle = this$1._dir(sprite);
                filter.setCone(--cones,
                    this$1._lightX(sprite), this$1._lightY(sprite),
                    light.radius, this$1._flicker(light),
                    Math.cos(angle*Math.PI/180), Math.sin(angle*Math.PI/180),
                    light.angleMin*Math.PI/180, light.angleMax*Math.PI/180,
                    light.r, light.g, light.b);
            }
        });
    });

    var c = this._ambient;
    filter.setAmbient(c.r, c.g, c.b);

    return filter;
};

LightProcessor.prototype._quickReject = function _quickReject (sprite    ){
    var x = this._lightX(sprite);
    var y = this._lightY(sprite);
    var radius = sprite._character._light.radius;

    return x < -radius
        || x > Graphics.width + radius
        || y < -radius
        || y > Graphics.height + radius;
};

LightProcessor.prototype._dir = function _dir (sprite    ){
    switch(sprite._character.direction()){
        case 2:
            return 270;
        case 4:
            return 180;
        case 6:
            return 0;
        case 8:
            return 90;
    }

    return 0;
};

LightProcessor.prototype.update = function update (baseSprite    , characterSprites           ){
        var this$1 = this;

    var sprites = [];

    characterSprites.forEach(function (sprite){
        if(sprite._character._light && !this$1._quickReject(sprite)){
            sprites.push(sprite);
        }
    });

    var filter = this._setupFilterLights(sprites);
    var filters = baseSprite.filters.filter(function (f){ return !(f instanceof LightFilter); });
    filters.push(filter);
    baseSprite.filters = filters;
};

var installedFind = false;
function findEventByName(name){
    if(!installedFind){
        installArrayFind();
        installedFind = true;
    }
    return $gameMap.events().find(function (ev){ return (ev && (ev.event().name === name)); });
}








function registerPluginCommands(commands){
    var lowerCaseCommands = {};
    Object.keys(commands).forEach(function (name){
        lowerCaseCommands[name.toLowerCase()] = commands[name];
    });

    var Game_Interpreter_prototype_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(cmd, args){
        var command = lowerCaseCommands[cmd.toLowerCase()];
        if(command){
            command.apply(this, args);
        }

        return Game_Interpreter_prototype_pluginCommand.call(this, cmd, args);
    };
}

function wrapPrototype(klass, method, fn){
    var oldMethod = klass.prototype[method];
    var newMethod = fn(oldMethod);

    klass.prototype[method] = newMethod;
}

function wrapStatic(klass, method, fn){
    var oldMethod = klass[method];
    var newMethod = fn(oldMethod);

    klass[method] = newMethod;
}

function installArrayFind(){
    // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }
}

//     

var field = new PersistentField('liply_ShaderLight');
field.register('enable', false);
field.register('playerRadius', parameters$1.playerRadius);
field.register('playerColor', parameters$1.playerColor);
field.register('playerAngleMin', parameters$1.playerAngleMin);
field.register('playerAngleMax', parameters$1.playerAngleMax);

function validateColor(color){
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
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
    var color = validateColor(colorString);
    target._light = target._light || [];

    target._light.push({
        type: TYPE_POINT,
        radius: radius,
        flicker: flicker,
        r: color.r,
        g: color.g,
        b: color.b
    });
    target._lightDisabled = false;
}

function setupConeLight(target, radius, colorString, angleMin, angleMax, flicker){
    var color = validateColor(colorString);
    target._light = target._light || [];

    target._light.push({
        type: TYPE_CONE,
        angleMin: angleMin,
        angleMax: angleMax,
        radius: radius,
        flicker: flicker,
        r: color.r,
        g: color.g,
        b: color.b
    });
    target._lightDisabled = false;
}

function setupEventLight(event, commands, flicker){
    var radius = +commands[0];
    var lightId = +commands[2];
    var targetEvent = isNaN(lightId)? event: $gameMap.event(lightId);

    setSelfSwitchD($gameMap.mapId(), targetEvent.eventId(), true);
    setupLight(targetEvent, radius, commands[1], flicker);
}

function setupEventConeLight(event, commands, flicker){
    var radius = +commands[0];
    var colorString = commands[1];
    var angleMin = +commands[2];
    var angleMax = +commands[3];
    var lightId = +commands[4];

    var target = isNaN(lightId)? event: $gameMap.event(lightId);
    setupConeLight(target, radius, colorString, angleMin, angleMax, flicker);
}

wrapPrototype(Game_Event, 'initialize', function (old){ return function(mapId, eventId){
    old.apply(this, arguments);

    var event = this.event();
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
}; });

function processLight(thisEvent, args){
    var event;
    switch(args[0]){
        case 'on':
            if(args[1] === 'player'){
                event = $gamePlayer;
            }else{
                event = findEventByName(args[1]);
                if(event) { event = thisEvent; }
            }

            event._lightDisabled = false;
            break;

        case 'off':
            if(args[1] === 'player'){
                event = $gamePlayer;
            }else{
                event = findEventByName(args[1]);
                if(event) { event = thisEvent; }
            }

            event._lightDisabled = true;
            break;

        case 'deactivate':
            field.enable = false;
            break;

        case 'activate':
            filed.enable = true;
            break;
    }
}


registerPluginCommands({
    light: function light(){
        var params = [], len = arguments.length;
        while ( len-- ) params[ len ] = arguments[ len ];

        processLight(this.event(), params);
    }
});

wrapPrototype(Game_Player, 'initialize', function (old){ return function(){
    old.apply(this, arguments);

    if(parameters$1.playerLightType.contains('light')){
        setupLight(this, parameters$1.playerRadius, parameters$1.playerColor, false);
    }
    if(parameters$1.playerLightType.contains('fire')){
        setupLight(this, parameters$1.playerRadius, parameters$1.playerColor, true);
    }
    if(parameters$1.playerLightType.contains('flashlight')){
        setupConeLight(this, parameters$1.playerConeRadius, parameters$1.playerColor,
            parameters$1.playerAngleMin, parameters$1.playerAngleMax, false);
    }
    if(parameters$1.playerLightType.contains('lanthanum')){
        setupConeLight(this, parameters$1.playerConeRadius, parameters$1.playerColor,
            parameters$1.playerAngleMin, parameters$1.playerAngleMax, true);
    }

}; });

wrapPrototype(Spriteset_Map, 'initialize', function (old){ return function(){
    this._lightProcessor = new LightProcessor();

    var color = validateColor(parameters$1.ambientColor);
    this._lightProcessor.setAmbient(color);

    old.apply(this, arguments);
}; });

wrapPrototype(Spriteset_Map, 'update', function (old){ return function() {
    this._lightProcessor.update(this._baseSprite, this._characterSprites);
    old.apply(this, arguments);
}; });

wrapStatic(SceneManager, 'preferableRendererType', function (old){ return function(){
    return 'webgl';
}; });

}());
