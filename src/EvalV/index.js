//@flow

import {registerPluginCommands} from '../lib/util.js'

declare var $gameVariables;
declare var $gameSwitches;

registerPluginCommands({
    evalV(){
        let V = $gameVariables._data;
        let S = $gameSwitches._data;

        eval(Array.prototype.join.call(arguments, ' '));
    }
});
