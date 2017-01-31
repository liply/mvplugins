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

//     

var field = new PersistentField('liply_TimeCounter');
field.register('count', 0);
field.register('variable', 0);

wrapPrototype(SceneManager, 'update', function (old){ return function(){
    field.count += field.count + 1;
    if(field.variable){
        $gameVariables.setValue(field.variable, field.count);
    }

    old.apply(this, arguments);
}; });

registerPluginCommands({
    countTime: function countTime(id){
        field.count = 0;
        field.variable = id;
    }
});

}());
