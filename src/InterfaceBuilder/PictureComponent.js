// @flow

import SpriteComponent from './SpriteComponent'

declare var ImageManager;

export default class PictureComponent extends SpriteComponent{
    _picture: string;

    get picture(): string{
        return this._picture;
    }
    set picture(value: string){
        if(this._picture !== value){
            this.markContentDirty();
            this._picture = value;
        }
    }

    _refreshContent(){
        this.bitmap = ImageManager.loadPicture(this._picture);
    }
}