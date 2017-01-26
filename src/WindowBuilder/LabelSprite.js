import BaseSprite from './BaseSprite.js'

export default class LabelSprite extends BaseSprite {
    constructor(data){
        super(data);

        if(data && data.text){
            this.setText(data.text);
        }
    }

    setText(text) {
        this._text = text;

        let content = new Bitmap(this.width, this.height);
        content.drawText(text, 0, 0, this.width, this.height, this.align);
        this.bitmap = content;
    }

    save(){
        let data = super.save();
        data.text = this._text;
        data.type = 'LabelSprite';

        return data;
    }
}