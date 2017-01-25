export default class PersistentField {
    constructor(prefix){
        this._prefix = prefix;
    }

    register(name, defaultValue){
        const key = this._prefix + '_' + name;

        Object.defineProperty(this, name, {
            set(newValue){
                $gameSystem[key] = newValue;
            },
            get(){
                if($gameSystem[key] === undefined){
                    $gameSystem[key] = defaultValue;
                }

                return $gameSystem[key];
            }
        });
    }
}