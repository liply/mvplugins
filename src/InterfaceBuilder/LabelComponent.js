// @flow

import SpriteComponent from './SpriteComponent'

export default class LabelComponent extends SpriteComponent{
    _text: string;

    get text(): string{
        return this._text;
    }
    set text(value): string{
        if(this._text !== value){
            this.markDirty();
            this._text = value;
        }
    }

    _refreshContent(){
        let content = new Bitmap(this.width, this.height);
        content.drawText(this._text, 0, 0, this.width, this.height, this.align);
        this.bitmap = content;
    }
}