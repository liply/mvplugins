// @flow

import type {BaseSpriteType, NodeType} from './ComponentTypes.js'
import {isInsideScreen, assignParameters} from './SpriteUtil.js'

declare var Sprite;

export default class SpriteComponent extends Sprite{
    _type: BaseSpriteType;
    _contentDirty: boolean;

    get anchorX(): number{
        return this.anchor.x;
    }
    set anchorX(value: number) {
        this.anchor.x = value;
    }


    get scaleX(): number{
        return this.scale.x * 100;
    }
    set scaleX(value: number) {
        this.scale.x = value / 100;
    }

    get scaleY(): number{
        return this.scale.y * 100;
    }
    set scaleY(value: number) {
        this.scale.y = value / 100;
    }

    get anchorY(): number{
        return this.anchor.y;
    }
    set anchorY(value: number) {
        this.anchor.y = value;
    }

    constructor(type: ?BaseSpriteType, parent: ?NodeType){
        super();

        if(type)this._type = type;
        this.markContentDirty();
        if(parent) parent.addChild(this);
    }

    update(){
        if(this._type) assignParameters(this, this._type);

        if(isInsideScreen(this)) this._activateContent();
        else this._deactivateContent();

        if(this._isContentActive && this._contentDirty){
            this._contentDirty = false;
            this._refreshContent();
        }

        super.update();
    }

    _activateContent(){
        if(!this._isContentActive){
            this._isContentActive = true;
            this._contentDirty = false;

            this._refreshContent();
        }
    }

    _deactivateContent(){
        if(this._isContentActive){
            this.bitmap = null;

            this._isContentActive = false;
        }
    }

    markContentDirty(){
        this._contentDirty = true;
    }

    _refreshContent(){}
}