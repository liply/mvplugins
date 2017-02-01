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

/*:
 * @plugindesc Scriptコマンドを利用して、プラグインコマンドを連続発行します。
 * @author liply
 *
 * @help
 * スクリプトコマンドの先頭にスペースを入れず、半角で、以下を追加してください。
 *
 * //＠bulk
 *
 * これでこれ以下の行はプラグインコマンドになります。
 *
 * また、使用頻度が高いwaitプラグインコマンドを導入します。
 *   wait 30
 * で３０フレーム待機します。
 *   wait tween
 * 等で（他のプラグインが対応していれば）該当するコマンドが終了するまで待機します。
 *
 */


registerPluginCommands({
    wait: function wait(frame){
        if(isNaN(+frame)){
            this.setWaitMode(frame);
        }else{
            this.wait(+frame);
        }
    }
});

wrapPrototype(Game_Interpreter, 'command355', function (old){ return function(){
    var this$1 = this;

    var script = this.currentCommand().parameters[0] + '\n';
    this._bulkMode = true;
    if(/^\/\/\s*@bulk/.test(script)){
        while (this.nextEventCode() === 655){
            this$1._index++;
            var params = this$1.currentCommand().parameters[0]
                .split(' ')
                .filter(function (p){ return p !== ''; });
            var command = params.shift();
            this$1.pluginCommand(command, params);

            if(this$1._waitMode !== '' || this$1._waitCount > 0) { return true; }
        }

        this._bulkMode = false;
        return true;
    }else{
        return old.call(this);
    }
}; });

wrapPrototype(Game_Interpreter, 'command655', function (old){ return function(){
    var this$1 = this;

    if(this._bulkMode){
        while (this.currentCommand().code === 655){
            var params = this$1.currentCommand().parameters[0]
                .split(' ')
                .filter(function (p){ return p !== ''; });
            var command = params.shift();
            this$1.pluginCommand(command, params);

            if(this$1._waitMode !== '' || this$1._waitCount > 0) { return true; }
            this$1._index++;
        }

        this._bulkMode = false;
    }

    return true;
}; });

}());
