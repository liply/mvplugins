import Animator from './Animator.js'
import WidgetManager from './WidgetManager.js'
import {saveBasic, defineHelperProperties, isInsideScreen} from './SpriteUtil.js'

export default class BaseWindow extends Window_Base{
    constructor(id, data){
        super();

        this._widgets = new WidgetManager(this, 'Window', data && data.widgets);
        this._renderingOrder = [];
        this._id = id;

        if(data){
            delete data.type;
            delete data.widgets;

            Object.keys(data).forEach(key=>{
                this[key] = data[key];
            });

            this.markDirty();
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
        data.type = 'BaseWindow';
        data.widgets = this._widgets.save();

        return data;
    }

    animateWidget(id, fields){
        this._widgets.animate(id, fields);
    }

    finishAnimation(){
        if(this._animator)this._animator.finish();
        this._widgets.finishAnimation();
    }

    addWidget(widget){
        this._widgets.add(widget);
        this.markDirty();
    }

    findWidget(id){
        return this._widgets.find(id);
    }

    removeWidget(id){
        this._widgets.remove(id);
    }

    markDirty(){
        this._dirty = true;
    }

    update(){
        super.update();

        if(isInsideScreen(this)) this._activateBitmap();
        else this._deactivateBitmap();

        if(this._animator) this._animator.update();
        if(ImageManager.isReady() && (this._dirty || this._widgets.isDirty())){
            this.refresh();
        }
    }

    refresh(){
        this._dirty = false;

        if(this.isBitmapActive() && (this.contents.width !== this.width || this.contents.height !== this.height)){
            this.contents = new Bitmap(this.width, this.height);
        }
        this._widgets.refresh();
    }

    containsPoint(p){
        let gx = this.worldTransform.tx;
        let gy = this.worldTransform.ty;
        let w = this.width;
        let h = this.height;

        return gx <= p.x && p.x <= gx+w &&
                gy <= p.y && p.y <= gy+h;
    }

    getIdUnder(p){
        if(this.containsPoint(p)){
            return this._widgets.getIdUnder(p) || this._id;
        }
    }

    _deactivateBitmap(){
        if(this._bitmapActive){
            const empty = ImageManager.loadEmptyBitmap();
            this._windowBackSprite.bitmap = empty;
            this._windowFrameSprite.bitmap = empty;
            this._windowCursorSprite.bitmap = empty;
            this.contents = empty;
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

            this._refreshAllParts();
            this.markDirty();
        }
    }
}

defineHelperProperties(BaseWindow);