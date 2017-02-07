
const ISQ2 = 1 / Math.sqrt(2);

export function toXy(d){
    switch(d){
        case 1:
            return {x: -ISQ2, y: ISQ2};
        case 2:
            return {x: 0, y: 1};
        case 3:
            return {x: ISQ2, y: ISQ2};
        case 4:
            return {x:-1, y: 0};
        case 5:
            return {x: 0,y: 0};
        case 6:
            return {x: 1, y: 0};
        case 7:
            return {x: -ISQ2, y: -ISQ2};
        case 8:
            return {x: 0, y: -1};
        case 9:
            return {x: ISQ2, y: -ISQ2};
    }

    return {x:0,y:0};
}



export function getDirection4(c){
    const dx = c._realX - c._beforeX;
    const dy = c._realY - c._beforeY;

    if(dx === 0 && dy === 0)return c.direction();

    const l = Math.sqrt(dx*dx+dy*dy);
    const ux = dx / l;
    const uy = dy / l;

    if(uy < -ISQ2){
        if(ux < -ISQ2) return 4;
        else if(ux > ISQ2) return 6;
        else return 8;
    }else if(uy > ISQ2){
        if(ux < -ISQ2) return 4;
        else if(ux > ISQ2) return 6;
        else return 2;
    }else{
        if(ux < -ISQ2) return 4;
        else if(ux > ISQ2) return 6;
        else return 2;
    }
}

export function real2grid(v){
    return Math.floor(v + 0.5);
}
