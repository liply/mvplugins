// @flow

import type {SpriteType, NodeType} from './ComponentTypes.js'
import {isInsideScreen} from './SpriteUtil.js'

declare var Sprite;

export default class SpriteComponent extends Sprite{
    _type: SpriteType;
    _contentDirty: boolean;

    get anchorX(): number{
        return this.anchor.x;
    }

    set anchorX(value: number) {
        this.anchor.x = value;
    }

    get anchorY(): number{
        return this.anchor.y;
    }

    set anchorY(value: number) {
        this.anchor.y = value;
    }

    constructor(type: ?SpriteType, parent: ?NodeType){
        super();

        if(type)this._type = type;
        this.markDirty();
        if(parent) parent.addChild(this);
    }

    update(){
        if(this._type) Object.keys(this._type).forEach(key=>this[key] = this._type[key]);

        if(isInsideScreen(this)) this._activateContent();
        else this._deactivateContent();

        if(this._isContentActive && this._contentDirty){
            this._refreshContent();
            this._contentDirty = false;
        }

        super.update();
    }

    _activateContent(){
        if(!this._isContentActive){
            this._refreshContent();

            this._isContentActive = true;
            this._contentDirty = false;
        }
    }

    _deactivateContent(){
        if(this._isContentActive){
            this.bitmap = null;

            this._isContentActive = false;
        }
    }

    markDirty(){
        this._contentDirty = true;
    }

    _refreshContent(){}
}