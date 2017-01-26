import Animator from './Animator.js'
import WidgetManager from './WidgetManager.js'
import {saveBasic, defineHelperProperties} from './SpriteUtil.js'

export default class BaseWindow extends Window_Base{
    constructor(data){
        super();

        this._widgets = new WidgetManager(this, 'Window', data && data.widgets);
        this._renderingOrder = [];

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

        if(this._animator) this._animator.update();
        if(ImageManager.isReady() && (this._dirty || this._widgets.isDirty())){
            this.refresh();
        }
    }

    refresh(){
        this._dirty = false;

        if(this.contents.width !== this.width || this.contents.height !== this.height){
            this.contents = new Bitmap(this.width, this.height);
        }
        this._widgets.refresh();
    }

    containsPoint(p){
        let gx = this.worldTransform[2];
        let gy = this.worldTransform[5];
        let w = this.width;
        let h = this.height;

        return gx <= p.x && p.x <= gx+w &&
                gy <= p.y && p.y <= gy+h;
    }
}

defineHelperProperties(BaseWindow);