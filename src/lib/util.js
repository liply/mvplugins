
export function contains(str, value){
    return str.indexOf(value) !== -1;
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

function find(array, predicate, context) {
/*
 The MIT License
 Copyright (c) Stefan Duberg
 https://github.com/stefanduberg/array-find
 */

    // if (typeof Array.prototype.find === 'function') {
    //     return array.find(predicate, context);
    // }

    context = context || this;
    var length = array.length;
    var i;

    if (typeof predicate !== 'function') {
        throw new TypeError(predicate + ' is not a function');
    }

    for (i = 0; i < length; i++) {
        if (predicate.call(context, array[i], i, array)) {
            return array[i];
        }
    }
}

export function installArrayFind(){
    if(!Array.prototype.find){
        Array.prototype.find = function(predicate, context){
            find(this, predicate, context);
        }
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
