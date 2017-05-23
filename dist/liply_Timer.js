(function () {
'use strict';

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

/*:
 *
 * @author liply
 *
 * @help
 * 一定間隔でスイッチをONにするタイマーを作成・破棄します。
 * ゲームが起動していない場合も時間が進行します。
 * 例として、20分のタイマーを作成し、70分ゲームを閉じ、起動した場合、
 * スイッチは3回、ONになります。
 *
 * CreateTimer スイッチID 間隔（分）
 * DestroyTimer スイッチID
 *
 * スイッチIDにはセルフスイッチ（A,B,C,D）も利用できます。
 *
 * 例：
 *
 * CreateTimer 10 20
 * 20分間隔でスイッチ10番をONにします。
 *
 * DestroyTimer 10
 * スイッチ10番をONにしようとしているタイマーを破棄します。
 *
 * v1.1(2017/05/23)
 * Eventが走ってる最中はTickしないように修正
 *
 */

var field = new PersistentField('liply_KitchenTimer');
field.register('timers', {});
field.register('currentTime', Date.now());

function createTimer(id, minutes){
    var interval = minutes * 60 * 1000;
    field.timers[id] = {id: id, next: Date.now()+interval, interval: interval};
}

function createSelfTimer(eventId, id, minutes){
    var interval = minutes * 60 * 1000;
    var event = $gameMap.event(eventId);
    event.timers = event.timers || {};
    event.timers[id] = {next: Date.now()+interval, interval: interval, id: id};
}

function tickTimer(current, timer){
    if(!$gameSwitches.value(timer.id) && timer.next < current){
        $gameSwitches.setValue(timer.id, true);
        timer.next += timer.interval;
    }
}

function tickSelfTimers(current, ev){
    if(ev.timers){
        Object.keys(ev.timers)
            .map(function (key){ return ev.timers[key]; })
            .forEach(function (timer){ return tickSelfTimer(current, ev, timer); });
    }
}

function tickSelfTimer(current, ev, timer){
    var key = [ev._mapId, ev.eventId(), timer.id];
    if(!$gameSelfSwitches.value(key) && timer.next < current){
        $gameSelfSwitches.setValue(key, true);
        timer.next += timer.interval;
    }
}

wrapPrototype(Scene_Map, 'update', function (old){ return function(){
    var current = Date.now();

    if(!$gameMap.isEventRunning()){
        Object.keys(field.timers).forEach(function (key){
            var timer = field.timers[key];

            tickTimer(current, timer);
        });

        $gameMap.events().filter(function (ev){ return ev.timers; }).forEach(function (ev){
            tickSelfTimers(ev);
        });
    }

    old.apply(this, arguments);
}; });

registerPluginCommands({
    createTimer: function createTimer$1(switchId, minutes){
        if(switchId.match(/[abcdABCD]/)){
            createSelfTimer(this.eventId(), switchId.toUpperCase(), minutes);
        }else{
            createTimer(switchId, minutes);
        }
    },

    destroyTimer: function destroyTimer(switchId){
        if(switchId.match(/[abcdABCD]/)){
            delete $gameMap.event(this.eventId()).timers[switchId];
        }else{
            delete field.timers[switchId];
        }

    }
});

}());
