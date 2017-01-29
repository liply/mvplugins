// @flow

import type {WindowType, NodeType} from './ComponentTypes.js'

import {isInsideScreen, assignParameters} from './SpriteUtil.js'
import renderCommands from './RenderingCommands.js'

declare var Window_Base;
declare var ImageManager;
declare var Bitmap;

export default class WindowComponent extends Window_Base{
    _type: WindowType;
    _contentReady: boolean;

    constructor(type: WindowType, parent: NodeType){
        super();

        this._type = type;
        parent.addChild(this);

        this._assignTypeParameters();
        this._refreshAllParts();
    }

    _assignTypeParameters(){
        assignParameters(this, this._type);
    }

    update(){
        this._assignTypeParameters();

        if(isInsideScreen(this)) this._activateContent();
        else this._deactivateContent();

        if(this._needContentRefresh()){
            this._refreshContent();
        }

        super.update();
    }

    _needContentRefresh(){
        if(!this.isContentActive()) return false;
        return !this._contentReady || !this.contents || this._needResize();
    }

    _needResize(){
        return this.contents.width !== this.width || this.contents.height !== this.height;
    }

    _refreshContent(){
        if(this._needResize()){
            this.contents = new Bitmap(this.width, this.height);
            this._contentReady = false;
        }

        if(this.contents && !this._contentReady){
            if(renderCommands(this.contents, this._type.commands)){
                this._contentReady = true;
            }
        }
    }

    containsPoint(point: {x: number, y: number}){
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

    markContentDirty(){
        this._contentReady = false;
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