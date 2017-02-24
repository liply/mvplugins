//@flow
//Lisenced under MIT

import {wrapPrototype, registerPluginCommands} from '../lib/util.js'
import PersistentField from '../lib/PersistentField.js'

declare var SceneManager;
declare var $gameVariables;

let field = new PersistentField('liply_TimeCounter');
field.register('count', 0);
field.register('variable', 0);

wrapPrototype(SceneManager, 'update', old=>function(){
    field.count += field.count + 1;
    if(field.variable){
        $gameVariables.setValue(field.variable, field.count);
    }

    old.apply(this, arguments);
});

registerPluginCommands({
    countTime(id){
        field.count = 0;
        field.variable = id;
    }
});
