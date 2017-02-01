// @flow

import SpriteComponent from './SpriteComponent'

declare var ImageManager;

export default class PictureComponent extends SpriteComponent{
    _picture: string;

    get frameX(): number{
        return this._frame.x;
    }
    set frameX(value: number){
        this._frameDirty = true;
        this._frame.x = value;
        this._frameXP = null;
    }

    get frameXP(): number{
        if(this.bitmap && this.bitmap.width){
            return this._frame.x / this.bitmap.width * 100;
        }
        return 0;
    }
    set frameXP(value: number){
        this._frameDirty = true;
        this._frameXP = value / 100;
    }

    get frameY(): number{
        return this._frame.y;
    }
    set frameY(value: number){
        this._frameDirty = true;
        this._frame.y = value;
        this._frameYP = null;
    }

    get frameYP(): number{
        if(this.bitmap && this.bitmap.height){
            return this._frame.y / this.bitmap.height * 100;
        }
        return 0;
    }
    set frameYP(value: number){
        this._frameDirty = true;
        this._frameYP = value / 100;
    }

    get frameWidth(): number{
        return this._frame.width;
    }
    set frameWidth(value: number){
        this._frameDirty = true;
        this._frame.width = value;
        this._frameWidthP = null;
    }

    get frameWidthP(): number{
        if(this.bitmap && this.bitmap.width){
            return this._frame.width / this.bitmap.width * 100;
        }
        return 0;
    }
    set frameWidthP(value: number){
        this._frameDirty = true;
        this._frameWidthP = value / 100;
    }

    get frameHeight(): number{
        return this._frame.height;
    }
    set frameHeight(value: number){
        this._frameDirty = true;
        this._frame.height = value;
        this._frameHeightP = null;
    }

    get frameHeightP(): number{
        if(this.bitmap && this.bitmap.height){
            return this._frame.height / this.bitmap.height * 100;
        }
        return 0;
    }
    set frameHeightP(value: number){
        this._frameDirty = true;
        this._frameHeightP = value / 100;
    }

    get picture(): string{
        return this._picture;
    }
    set picture(value: string){
        if(this._picture !== value){
            this.markContentDirty();
            this._picture = value;
        }
    }

    update(){
        super.update();

        if(this._frameDirty && this.bitmap && this.bitmap.isReady()){
            this._frameDirty = false;

            if(this._frameXP != null){
                this._frame.x = this.bitmap.width * this._frameXP;
            }
            if(this._frameYP != null){
                this._frame.y = this.bitmap.height * this._frameYP;
            }

            if(this._frameWidthP != null){
                this._frame.width = this.bitmap.width * this._frameWidthP;
            }
            if(this._frameHeightP != null){
                this._frame.height = this.bitmap.height * this._frameHeightP;
            }
            this._refresh();
        }
    }

    _refreshContent(){
        this.bitmap = ImageManager.loadPicture(this._picture);
    }
}