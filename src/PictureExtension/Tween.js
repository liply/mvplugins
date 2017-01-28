/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 * https://gist.github.com/gre/1650294
 *
 * MIT License
 * Copyright (c) 2014 Gaëtan Renaudeau
 */
const EasingFunctions = {
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


export default class Tween {
    constructor(){
        this._t = 0;
        this._commands = [];
        this._from = null;
        this._id = null;
    }

    add(id, commands){
        this._commands = commands.concat(commands);
        this._id = id;
    }

    isEnd(){
        return commands.length === 0;
    }

    update(lookupFunction){
        if(this._commands.length === 0) return false;
        let commands = this._commands;

        const target = lookupFunction(this._id);

        const type = '_' + commands[0];
        const time = +commands[1];
        const fn = commands[2];
        const to = +commands[3];

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
                    let a = EasingFunctions[fn](t);
                    target[type] = this._from * (1-a) + to * a;
                }
                break;
        }

        return true;
    }
}