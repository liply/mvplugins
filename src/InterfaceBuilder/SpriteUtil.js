export function isInsideScreen(sprite){
    const b = sprite.getBounds();
    const gw = Graphics.width;
    const gh = Graphics.height;

    return b.x + b.width >= 0 &&
        b.x <= gw &&
        b.y + b.height >= 0 &&
        b.y <= gh;
}