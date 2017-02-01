(function () {
'use strict';

/*:
 * @plugindesc ピクチャに対して便利な機能を追加します。
 * @author liply
 *
 * @help
 * 以下のプラグインコマンドを追加します。
 *   tween add [ピクチャ番号] [パラメータ]
 *   tween new [ピクチャ番号] [パラメータ]
 * Tween（なめらか移動）の追加/新規作成を行います。
 *
 * パラメータの書式は以下です。
 * [パラメータ名] [値] [時間] [補間関数]
 * パラメータ名は、以下が有効です。
 *   x, y, scaleX, scaleY, rotation
 * 補間関数は、以下が有効です。
 *   linear, ease[In/Out/InOut][Quad/Cubic/Quart/Quint]
 * 時間の単位はフレーム数です。
 *
 * また、特殊なパラメータとしてdelayが用意されています。
 * delayは時間を取り、その時間Tweenの実行を停止します。
 *
 *   tween finish
 * Tweenの実行を早送りし、終了します。
 *
 *   gridMode [on/off] [ピクチャ番号]
 * 指定のピクチャの座標がPX指定ではなく、グリッド配置に変更されます。
 *
 *   standMode [on/off] [ピクチャ番号]
 * 指定のピクチャが立ち絵モードになります。立ち絵モードになると、原点が足元になります。
 *
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
    this._commands = this._commands.concat(commands);
    this._id = id;
};

Tween.prototype.getId = function getId (){
    return this._id;
};

Tween.prototype.isEnd = function isEnd (){
    return this._commands.length === 0;
};

Tween.prototype.finish = function finish (){
    while(this._commands.length > 0) { update(true); }
};

Tween.prototype.update = function update (finishFlag){
    if(this._commands.length === 0) { return false; }
    var commands = this._commands;

    var target = $gameScreen.picture(this._id);

    var type = '_' + commands[0];
    var to = +commands[1];
    var time = +commands[2];
    var fn = commands[3];

    switch(type){
        case '_delay':
            this._t += (1 / to);
            if(this._t >= 1 || finishFlag){
                this._commands = commands.slice(2);
                this._t = 0;
                this._from = null;
            }
            break;

        default:
            this._t += (1 / time);
            if(this._from === null){
                this._from = target[type];
            }

            if(this._t >= 1 || finishFlag){
                target[type] = to;

                this._commands = commands.slice(4);
                this._t = 0;
                this._from = null;
            }else{
                var a = EasingFunctions[fn](this._t);
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

installArrayFind();

var field = new PersistentField(p.PLUGIN_NAME);
var tweens = [];

field.register('grid', []);
field.register('stand', []);


registerPluginCommands({
    tween: function tween(cmd, target){
        var params = [], len = arguments.length - 2;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 2 ];

        var targetId = +target;
        var tween = null;
        switch(cmd.toLowerCase()){
            case 'add':
                tween = tweens
                    .slice(0)
                    .reverse()
                    .find(function (tween){ return tween.getId() === targetId; });

                if(!tween){
                    tween = new Tween();
                    tweens.push(tween);
                }

                tween.add(targetId, params);
                break;

            case 'new':
                tween = new Tween();
                tween.add(target, params);
                tweens.push(tween);
                break;

            case 'finish':
                tweens.forEach(function (tween){ return tween.finish(); });
                break;
        }

    },

    gridMode: function gridMode(toggle, id){
        switch(toggle){
            case 'on':
                field.grid[+id] = true;
                break;

            case 'off':
                field.grid[+id] = false;
                break;
        }
    },

    standMode: function standMode(toggle, id){
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

wrapPrototype(Game_Interpreter, 'updateWaitMode', function (old){ return function(){
    if(this._waitMode === 'tween'){
        if(tweens.length === 0){
            this._waitMode = '';
            return false;
        }
        return true;
    }else{
        return old.call(this);
    }
}; });

wrapPrototype(Game_Screen, 'update',function (old){ return function(){
    old.call(this);
    
    tweens.forEach(function(tween){
        tween.update();
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
