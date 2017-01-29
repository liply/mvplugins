export function isInsideScreen(sprite){
    const b = sprite.getBounds();
    const gw = Graphics.width;
    const gh = Graphics.height;

    return b.x + b.width >= 0 &&
        b.x <= gw &&
        b.y + b.height >= 0 &&
        b.y <= gh;
}

export function assignParameters(target, params){
    Object.keys(params).forEach(key=>{
        if(target[key] !== params[key])target[key] = params[key];
    })
}

export function fillDefaultParams(type){
    type.x = 0;
    type.y = 0;
    type.scaleX = 100;
    type.scaleY = 100;
    type.rotation = 0;
}
