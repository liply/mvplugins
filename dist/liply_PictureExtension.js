(function () {
'use strict';

/*:
 * @param Grid Column
 * @default 12
 * @param Grid Row
 * @default 8
 */

/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 * https://gist.github.com/gre/1650294
 *
 * MIT License
 * Copyright (c) 2014 Gaëtan Renaudeau
 */
var EasingFunctions = {
    // no easing, no acceleration
    linear: function (t) { return t },
    // accelerating from zero velocity
    easeInQuad: function (t) { return t*t },
    // decelerating to zero velocity
    easeOutQuad: function (t) { return t*(2-t) },
    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
    // accelerating from zero velocity
    easeInCubic: function (t) { return t*t*t },
    // decelerating to zero velocity
    easeOutCubic: function (t) { return (--t)*t*t+1 },
    // acceleration until halfway, then deceleration
    easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
    // accelerating from zero velocity
    easeInQuart: function (t) { return t*t*t*t },
    // decelerating to zero velocity
    easeOutQuart: function (t) { return 1-(--t)*t*t*t },
    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
    // accelerating from zero velocity
    easeInQuint: function (t) { return t*t*t*t*t },
    // decelerating to zero velocity
    easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
    // acceleration until halfway, then deceleration
    easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};


var Tween = function Tween(){
    this._t = 0;
    this._commands = [];
    this._from = null;
    this._id = null;
};

Tween.prototype.add = function add (id, commands){
    this._commands = commands.concat(commands);
    this._id = id;
};

Tween.prototype.isEnd = function isEnd (){
    return commands.length === 0;
};

Tween.prototype.update = function update (lookupFunction){
    if(this._commands.length === 0) { return false; }
    var commands = this._commands;

    var target = lookupFunction(this._id);

    var type = '_' + commands[0];
    var time = +commands[1];
    var fn = commands[2];
    var to = +commands[3];

    this._t += (1 / time);
    switch(type){
        case '_delay':
            if(this._t >= 1){
                this._commands = commands.slice(2);
            }
            break;

        default:
            if(this._from === null){
                this._from = target[type];
            }

            if(this._t >= 1){
                target[type] = to;

                this._commands = commands.slice(4);
                this._t = 0;
                this._from = null;
            }else{
                var a = EasingFunctions[fn](t);
                target[type] = this._from * (1-a) + to * a;
            }
            break;
    }

    return true;
};

var PLUGIN_NAME = 'liply_PictureExtension';
var parameters = PluginManager.parameters(PLUGIN_NAME);

var p = {
    PLUGIN_NAME: PLUGIN_NAME,
    column: +parameters['Grid Column'],
    row: +parameters['Grid Row']
};

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

var field = new PersistentField(p.PLUGIN_NAME);
var tweens = [];

field.register('grid', []);
field.register('stand', []);


registerPluginCommands({
    tween: function tween(target){
        var params = [], len = arguments.length - 1;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

        var tween = new Tween();
        tween.add(target, params);
        tweens.push(tween);
    },

    grid: function grid(toggle, id){
        switch(toggle){
            case 'on':
                field.grid[+id] = true;
                break;

            case 'off':
                field.grid[+id] = false;
                break;
        }
    },

    stand: function stand(toggle, id){
        switch(toggle){
            case 'on':
                field.stand[+id] = true;
                break;

            case 'off':
                field.stand[+id] = false;
                break;
        }
    }
});

wrapPrototype(Game_Screen, 'update',function (old){ return function(){
    old.call(this);
    
    tweens.forEach(function(tween){
        tween.update(function (id){ return $gameScreen.picture(id); });
    });

    tweens = tweens.filter(function(tween){
        return !tween.isEnd();
    });

}; });

wrapPrototype(Sprite_Picture, 'updateOrigin', function (old){ return function(){
    old.call(this);

    if(field.stand[this._pictureId]){
        this.anchor.x = 0.5;
        this.anchor.y = 1;
    }
}; });

wrapPrototype(Sprite_Picture, 'updatePosition', function (old){ return function(){
    var picture = this.picture();

    if(field.grid[this._pictureId]){
        this.x = Math.floor(picture.x()*Graphics.width/p.column);
        this.y = Math.floor(picture.y()*Graphics.height/p.row);
    }else{
        old.call(this);
    }
    
}; });

}());
