
export function saveBasic(sprite){
    let data = {};
    ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'bitmapName', 'width', 'height'].forEach(key=>{
        data[key] = sprite[key];
    });

    return data;
}

export function defineHelperProperties(klass){
    Object.defineProperties(klass.prototype, {
        scaleX: {
            get(){
                return this.scale.x;
            },
            set(value){
                this.scale.x = value;
            }
        },
        scaleY: {
            get(){
                return this.scale.y;
            },
            set(value){
                this.scale.y = value;
            }
        }
    });

}
