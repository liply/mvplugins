const R = 0.4;
const D = 0.1;
const EPS = 0.0001;

function hitXEdge(character, y){
    const y1 = character._realY + 0.5 - R;
    const y2 = character._realY + 0.5 + R;

    if(y1 <= y && y <= y2){
        if(y2 - y < R){
            character._realY = y - R - 0.5;
        }else{
            character._realY = y - D;
        }
    }
}

function hitYEdge(character, x){
    const x1 = character._realX + 0.5 - R;
    const x2 = character._realX + 0.5 + R;

    if(x1 <= x && x <= x2){
        if(x2 - x < R){
            character._realX = x - R - 0.5;
        }else{
            character._realX = x - D;
        }
    }
}


function hitCorner(character, x, y){
    const dx = character._realX + 0.5 - x;
    const dy = character._realY + 0.5 - y;
    const l = Math.sqrt(dx*dx+dy*dy);
    if(l > EPS){
        if(l < R) {
            const tx = dx / l * R;
            const ty = dy / l * R;
            character._realX = x + tx - 0.5;
            character._realY = y + ty - 0.5;
        }
    }else if(l < R){
        character._realX = x;
        character._realY = y;
    }
}

export function hitMap(character){
    const x = Math.floor(character._realX + 0.5);
    const y = Math.floor(character._realY + 0.5);

    if(!character.isMapPassable(x-1, y, 8) || !character.isMapPassable(x, y-1, 4))hitCorner(character, x, y);
    if(!character.isMapPassable(x, y-1, 6) || !character.isMapPassable(x+1, y, 8))hitCorner(character, x+1, y);
    if(!character.isMapPassable(x-1, y, 2) || !character.isMapPassable(x, y+1, 4))hitCorner(character, x, y+1);
    if(!character.isMapPassable(x, y+1, 6) || !character.isMapPassable(x+1, y, 2))hitCorner(character, x+1, y+1);

    if(!character.isMapPassable(x, y, 2))hitXEdge(character, y+1);
    if(!character.isMapPassable(x, y, 4))hitYEdge(character, x);
    if(!character.isMapPassable(x, y, 6))hitYEdge(character, x+1);
    if(!character.isMapPassable(x, y, 8))hitXEdge(character, y);
}

function collideCharacter(c1, c2){
    const dx = c1._realX - c2._realX;
    const dy = c1._realY - c2._realY;
    const l2 = dx*dx+dy*dy;

    if(l2 < (R*2)*(R*2)){
        const ld2 = Math.sqrt(l2)/2;
        const cx = (c1._realX + c2._realX) / 2;
        const cy = (c1._realY + c2._realY) / 2;

        c1._realX = cx + (c1._realX - cx) / ld2 * R;
        c2._realX = cx + (c2._realX - cx) / ld2 * R;

        c1._realY = cy + (c1._realY - cy) / ld2 * R;
        c2._realY = cy + (c2._realY - cy) / ld2 * R;
    }
}

function collideEach(characters){
    const l = characters.length;
    for(let n = 0; n < l; ++n){
        for(let m = 0; m < l; ++m){
            if(n !== m){
                collideCharacter(characters[n], characters[m]);
            }
        }
    }
}

function restorePosition(characters){
    for(let n = 0,l = characters.length; n < l; ++n){
        const c = characters[n];
        c._deltaX = c._realX - c._beforeX || 0;
        c._deltaY = c._realY - c._beforeY || 0;

        c._realX = c._beforeX;
        c._realY = c._beforeY;
    }
}

function stepPosition(characters, step){
    for(let n = 0,l = characters.length; n < l; ++n) {
        const c = characters[n];
        c._realX += c._deltaX * step;
        c._realY += c._deltaY * step;
    }
}

export function hitMapEvents(gameMap){
    const characters = gameMap.events().filter((e)=>e.isNormalPriority());
    characters.push($gamePlayer);

    restorePosition(characters);

    const STEP = 5;
    for(let n = 0; n < STEP; ++n){
        stepPosition(characters, 1/STEP);
        collideEach(characters);
    }
    characters.every((e)=>hitMap(e));
}

export function restorePositionIfHit(target, gameMap){
    gameMap.events().filter((e)=>e.isNormalPriority()).forEach((e)=>{
        const dx = target._realX - e._realX;
        const dy = target._realY - e._realY;
        const l2 = dx*dx+dy*dy;

        if(l2 < (R*2)*(R*2)){
            const l = Math.sqrt(dx*dx+dy*dy);
            const ex = e._realX;
            const ey = e._realY;

            target._realX = ex + dx / l * R*2;
            target._realY = ey + dy / l * R*2;
        }
    });
}