import {wrapStatic, registerPluginCommands} from '../lib/util.js'

/*:
 * @author liply
 * @help
 * 以下のプラグインコマンドを導入します。
 *
 * sql
 * sqlを発行します。
 *
 * cursor fetch [from] [to] [column] [offset]
 * カーソルからデータを取り出します。
 * columnで指定したデータが、[from-to)の変数に書き込まれます。
 * オフセットを指定したい場合はoffsetを利用します。
 *
 * cursor count [id]
 * 発行したsqlが持つデータの数をidで指定した変数に格納します。
 *
 */

let C = [];

wrapStatic(DataManager, 'loadDatabase', old=>function(){
    if(window.__liply_DatabaseDevelopment){
        window.__liply_DatabaseDevelopment.then(()=>{
            DataManager.loadDataFile('$dataDatabase', 'Database.json');
        });
        window.__liply_DatabaseDevelopment = null;
    }else{
        DataManager.loadDataFile('$dataDatabase', 'Database.json');
    }
    old.call(this);
});

registerPluginCommands({
    sql(...params){
        const sql = params.join(' ');
        C = $dataDatabase[sql];
    },
    cursor(command, ...params){
        switch(command.toLowerCase()){
            case 'fetch': {
                let from = +params[0];
                let to = +params[1];
                let column = params[2];
                let offset = +params[3] || 0;
                for(let n = 0; n < to - from; n++){
                    $gameVariables.setValue(n+from, C[n+offset]? C[n+offset][column]: null);
                }
            }
            break;

            case 'count': {
                let id = +params[0];
                $gameVariables.setValue(id, C.length);
            }
        }
    }
});