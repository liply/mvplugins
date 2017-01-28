// @flow

import type {WindowType, NodeType} from './ComponentTypes.js'
import {isInsideScreen} from './SpriteUtil.js'

declare var Window_Base;
declare var ImageManager;

export default class WindowComponent extends Window_Base{
    _type: WindowType;

    constructor(type: WindowType, parent: NodeType){
        super();

        this._type = type;
        parent.addChild(this);

        this._assignTypeParameters();
        this._refreshAllParts();
    }

    _assignTypeParameters(){
        Object.keys(this._type).forEach(key=>this[key] = this._type[key]);
    }

    update(){
        this._assignTypeParameters();

        if(isInsideScreen(this)) this._activateContent();
        else this._deactivateContent();


        if(ImageManager.isReady() && this._needsContentRefresh()){
            this._refreshContent();
        }

        super.update();
    }

    _needsContentRefresh(){
        if(!this.isContentActive()) return false;
        return !this.contents || this.contents.width !== this.width || this.contents.height !== this.height;
    }

    _refreshContent(){
        this.contents = new Bitmap(this.width, this.height);
    }

    containsPoint(point){
        const gx = this.worldTransform.tx;
        const gy = this.worldTransform.ty;
        const w = this.width;
        const h = this.height;

        const x = point.x;
        const y = point.y;

        return gx <= x && x <= gx+w && gy <= y && y <= gy+h;
    }

    _deactivateContent(){
        if(this._contentActive){
            const empty = ImageManager.loadEmptyBitmap();
            this._windowBackSprite.bitmap = empty;
            this._windowFrameSprite.bitmap = empty;
            this._windowCursorSprite.bitmap = empty;
            this.contents = empty;
            this._contentVisible = this.visible;

            this.visible = false;
            this._contentActive = false;
        }
    }

    isContentActive(){
        return this._contentActive;
    }

    _activateContent() {
        if (!this._contentActive) {
            this._contentActive = true;

            if(this._contentVisible !== undefined)
                this.visible = this._contentVisible;

            this._refreshAllParts();
        }
    }
}