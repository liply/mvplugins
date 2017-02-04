
export function contains(str, value){
    return str.indexOf(value) !== -1;
}

let installedFind = false;
export function findEventByName(name){
    if(!installedFind){
        installArrayFind();
        installedFind = true;
    }
    return $gameMap.events().find(ev=>(ev && (ev.event().name === name)));
}

export function findCommonEventIdByName(name){
    if(!installedFind){
        installArrayFind();
        installedFind = true;
    }

    let id;
    $dataCommonEvents.find((ev, idx)=>{
        if(ev && (ev.name === name)){
            id = idx;
            return true;
        }
    });

    return id;
}


function MiniWindow(){
    this.convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
    this.actorName = Window_Base.prototype.actorName;
    this.partyMemberName = Window_Base.prototype.partyMemberName;
}

let miniWindow = new MiniWindow();

export function convertEscapeCharacters(text){
    return miniWindow.convertEscapeCharacters(text);
}

export function arr2obj(params){
    let result = {};
    for(let n = 0; n < params.length; n+=2){
        result[params[n]] = params[n+1];
    }

    return result;
}

export function registerPluginCommands(commands){
    let lowerCaseCommands = {};
    Object.keys(commands).forEach((name)=>{
        lowerCaseCommands[name.toLowerCase()] = commands[name];
    });

    const Game_Interpreter_prototype_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(cmd, args){
        let command = lowerCaseCommands[cmd.toLowerCase()];
        if(command){
            command.apply(this, args);
        }

        return Game_Interpreter_prototype_pluginCommand.call(this, cmd, args);
    };
}

export function wrapPrototype(klass, method, fn){
    const oldMethod = klass.prototype[method];
    const newMethod = fn(oldMethod);

    klass.prototype[method] = newMethod;
}

export function wrapStatic(klass, method, fn){
    const oldMethod = klass[method];
    const newMethod = fn(oldMethod);

    klass[method] = newMethod;
}

export function installArrayFind(){
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

/*
 object-assign
 (c) Sindre Sorhus
 @license MIT
 */

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
    if (val === null || val === undefined) {
        throw new TypeError('Object.assign cannot be called with null or undefined');
    }

    return Object(val);
}

function shouldUseNative() {
    try {
        if (!Object.assign) {
            return false;
        }

        // Detect buggy property enumeration order in older V8 versions.

        // https://bugs.chromium.org/p/v8/issues/detail?id=4118
        var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
        test1[5] = 'de';
        if (Object.getOwnPropertyNames(test1)[0] === '5') {
            return false;
        }

        // https://bugs.chromium.org/p/v8/issues/detail?id=3056
        var test2 = {};
        for (var i = 0; i < 10; i++) {
            test2['_' + String.fromCharCode(i)] = i;
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
            return test2[n];
        });
        if (order2.join('') !== '0123456789') {
            return false;
        }

        // https://bugs.chromium.org/p/v8/issues/detail?id=3056
        var test3 = {};
        'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
            test3[letter] = letter;
        });
        if (Object.keys(Object.assign({}, test3)).join('') !==
            'abcdefghijklmnopqrst') {
            return false;
        }

        return true;
    } catch (err) {
        // We don't expect any of the above to throw, but better to be safe.
        return false;
    }
}

export function installObjectAssign(){
    Object.assign = shouldUseNative() ? Object.assign : function (target, source) {
            var from;
            var to = toObject(target);
            var symbols;

            for (var s = 1; s < arguments.length; s++) {
                from = Object(arguments[s]);

                for (var key in from) {
                    if (hasOwnProperty.call(from, key)) {
                        to[key] = from[key];
                    }
                }

                if (getOwnPropertySymbols) {
                    symbols = getOwnPropertySymbols(from);
                    for (var i = 0; i < symbols.length; i++) {
                        if (propIsEnumerable.call(from, symbols[i])) {
                            to[symbols[i]] = from[symbols[i]];
                        }
                    }
                }
            }

            return to;
        };
}
