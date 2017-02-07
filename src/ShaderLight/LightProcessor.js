//@flow

import {LightFilter, TYPE_POINT, TYPE_CONE} from './LightFilter.js'

declare var Sprite;
declare var $gameMap;
declare var Graphics;

const FLICKER = 7;

export default class LightProcessor{
    _filterCache: {
        [key: string]: LightFilter
    };

    _ambient: {r:number, g: number, b: number};


    constructor(){
        this._filterCache = {};
    }

    setAmbient(color: Object){
        this._ambient = color;
    }

    _createOrGetFilter(numPoints: number, numCones: number){
        const key = numPoints + ':' + numCones;

        if(!this._filterCache[key]){
            this._filterCache[key] = new LightFilter(numPoints, numCones);
        }
        return this._filterCache[key];
    }

    _lightX(sprite: Sprite){
        return sprite.x - $gameMap.displayX();
    }

    _lightY(sprite: Sprite){
        return Graphics.height - (-$gameMap.tileHeight()/2 + sprite.y - $gameMap.displayY());
    }

    _flicker(l: Object){
        const r1 = l.radius;
        if(l.flicker) return r1 + FLICKER;
        else return r1;
    }

    _setupFilterLights(sprites: Array<Sprite>){
        const lights = sprites.filter(s=>s._character._light.length !== 0);
        let points = 0;
        let cones = 0;

        lights.forEach(sprite=>{
            sprite._character._light.forEach(light=>{
                switch(light.type){
                    case TYPE_POINT:
                        points++;
                        break;
                    case TYPE_CONE:
                        cones++;
                        break;
                }
            });
        });

        const filter = this._createOrGetFilter(points, cones);

        lights.forEach(sprite=>{
            sprite._character._light.forEach(light=>{
                if(light.type === TYPE_POINT){
                    filter.setLight(--points,
                        this._lightX(sprite), this._lightY(sprite),
                        light.radius, this._flicker(light),
                        light.r, light.g, light.b);

                }else if(light.type === TYPE_CONE){
                    let angle = this._dir(sprite);
                    filter.setCone(--cones,
                        this._lightX(sprite), this._lightY(sprite),
                        light.radius, this._flicker(light),
                        Math.cos(angle*Math.PI/180), Math.sin(angle*Math.PI/180),
                        light.angleMin*Math.PI/180, light.angleMax*Math.PI/180,
                        light.r, light.g, light.b);
                }
            });
        });

        let c = this._ambient;
        filter.setAmbient(c.r, c.g, c.b);

        return filter;
    }

    _quickReject(sprite: Sprite){
        const x = this._lightX(sprite);
        const y = this._lightY(sprite);
        const radius = sprite._character._light.radius;

        return x < -radius
            || x > Graphics.width + radius
            || y < -radius
            || y > Graphics.height + radius;
    }

    _dir(sprite: Sprite){
        switch(sprite._character.direction()){
            case 2:
                return 270;
            case 4:
                return 180;
            case 6:
                return 0;
            case 8:
                return 90;
        }

        return 0;
    }

    update(baseSprite: Sprite, characterSprites: Array<Sprite>){
        const sprites = [];

        characterSprites.forEach(sprite=>{
            if(sprite._character._light && !this._quickReject(sprite)){
                sprites.push(sprite);
            }
        });

        const filter = this._setupFilterLights(sprites);
        const filters = baseSprite.filters.filter((f)=>!(f instanceof LightFilter));
        filters.push(filter);
        baseSprite.filters = filters;
    }
}
