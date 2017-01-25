import Animator from './Animator.js'
import {saveBasic, defineHelperProperties} from './SpriteUtil.js'

export default class BaseSprite extends Sprite{
    constructor(data){
        super();
        if(data){
            Object.keys(data).forEach(key=>this[key] = data[key]);

            if(data.bitmapName){
                this.bitmap = ImageManager.loadPicture(data.bitmapName);
            }
        }
    }

    animate(fields){
        if(!this._animator){
            this._animator = new Animator(this);
        }
        this._animator.animate(fields);
    }

    save(){
        let data = saveBasic(this);
        data.type = 'BaseSprite';

        return data;
    }

    finishAnimation(){
        if(this._animator)this._animator.finish();
    }

    update(){
        if(this._animator)this._animator.update();

        super.update();
    }
}

defineHelperProperties(BaseSprite);