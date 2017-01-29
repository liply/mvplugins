// @flow

import type {CanvasType} from './ComponentTypes.js'

import renderCommands from './RenderingCommands.js'
import SpriteComponent from './SpriteComponent'

declare var Bitmap;

export default class CanvasComponent extends SpriteComponent{
    _refreshContent(){
        let bitmap = this.bitmap;
        let type = ((this._type: any): CanvasType);

        if(!bitmap || bitmap.width !== type.width || bitmap.height !== type.height){
            bitmap = new Bitmap(type.width, type.height);
        }
        this.bitmap = bitmap;

        if(!renderCommands(bitmap, type.commands)){
            this.markContentDirty();
        }
    }
}