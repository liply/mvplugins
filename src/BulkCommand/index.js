import {wrapPrototype, registerPluginCommands} from '../lib/util.js'

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
    wait(frame){
        if(isNaN(+frame)){
            this.setWaitMode(frame);
        }else{
            this.wait(+frame);
        }
    }
});

wrapPrototype(Game_Interpreter, 'command355', old=>function(){
    let script = this.currentCommand().parameters[0];
    this._bulkMode = true;
    if(/^\/\/\s*[@＠]bulk/.test(script)){
        while (this.nextEventCode() === 655){
            this._index++;
            let params = this.currentCommand().parameters[0]
                .split(' ')
                .filter(p=>p !== '');
            let command = params.shift();
            if(command) this.pluginCommand(command, params);

            if(this._waitMode !== '' || this._waitCount > 0) return true;
        }

        this._bulkMode = false;
        return true;
    }else{
        return old.call(this);
    }
});

wrapPrototype(Game_Interpreter, 'command655', old=>function(){
    if(this._bulkMode){
        while (this.currentCommand().code === 655){
            let params = this.currentCommand().parameters[0]
                .split(' ')
                .filter(p=>p !== '');
            let command = params.shift();
            if(command) this.pluginCommand(command, params);

            if(this._waitMode !== '' || this._waitCount > 0) return true;
            this._index++;
        }

        this._bulkMode = false;
    }

    return true;
});