
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
        },

        anchorX: {
            get(){
                return this.anchor.x;
            },
            set(value){
                this.anchor.x = value;
            }
        },
        anchorY: {
            get(){
                return this.anchor.y;
            },
            set(value){
                this.anchor.y = value;
            }
        }
    });

}


export function isInsideScreen(sprite){
    const b = sprite.getBounds();
    const gw = Graphics.width;
    const gh = Graphics.height;

    return b.x + b.width >= 0 &&
        b.x <= gw &&
        b.y + b.height >= 0 &&
        b.y <= gh;
}