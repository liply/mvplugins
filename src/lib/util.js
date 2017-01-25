
export function contains(str, value){
    return str.indexOf(value) !== -1;
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

export function cloneObject(obj){
    let result = {};
    Object.keys(obj).forEach(key=>(result[key] = obj[key]));

    return result;
}