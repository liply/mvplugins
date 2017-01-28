import Animator from './Animator.js'
import {saveBasic, defineHelperProperties, isInsideScreen} from './SpriteUtil.js'

export default class BaseSprite extends Sprite{
    constructor(id, data){
        super();
        this._id = id;

        if(data){
            Object.keys(data).forEach(key=>this[key] = data[key]);

            if(data.bitmapName){
                this._bitmapName = data.bitmapName;
                this._markContentDirty();
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

        if(isInsideScreen(this)) this._activateBitmap();
        else this._deactivateBitmap();
        if(this.isBitmapActive() && this._contentDirty){
            this._refreshContent();
        }

        super.update();
    }

    getIdUnder(point){
        return this.containsPoint(point) && this._id;
    }

    _deactivateBitmap(){
        if(this._bitmapActive){
            this.bitmap = ImageManager.loadEmptyBitmap();
            this._bitmapVisible = this.visible;

            this.visible = false;
            this._bitmapActive = false;
        }
    }

    isBitmapActive(){
        return this._bitmapActive;
    }

    _activateBitmap() {
        if (!this._bitmapActive) {
            this._bitmapActive = true;

            if(this._bitmapVisible !== undefined)
                this.visible = this._bitmapVisible;

            this._markContentDirty();
        }
    }

    _markContentDirty(){
        this._contentDirty = true;
    }

    _refreshContent(){
        this._contentDirty = false;
        this._refreshContentHook();
    }

    _refreshContentHook(){
        if(this._bitmapName)
            this.bitmap = ImageManager.loadPicture(this._bitmapName)
    }
}

defineHelperProperties(BaseSprite);