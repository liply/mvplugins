import BaseSprite from './BaseSprite.js'

export default class LabelSprite extends BaseSprite {
    constructor(id, data){
        super(id, data);

        if(data){
            this._text = data.text;
            this._align = data.align;
        }
    }

    setText(text) {
        this._text = text;
    }

    save(){
        let data = super.save();
        data.text = this._text;
        data.type = 'LabelSprite';

        return data;
    }

    _refreshContentHook(){
        if(this._text){
            let content = new Bitmap(this.width, this.height);
            content.drawText(this._text, 0, 0, this.width, this.height, this._align);
            this.bitmap = content;
        }
    }
}