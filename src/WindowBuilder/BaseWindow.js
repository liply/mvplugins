import Animator from './Animator.js'
import {saveBasic, defineHelperProperties} from './SpriteUtil.js'

export default class BaseWindow extends Window_Base{
    constructor(data){
        super();

        this._widgets = {};
        this._renderingOrder = [];

        if(data){
            delete data.type;

            Object.keys(data).forEach(key=>{
                switch(key){
                    case 'widgets':
                        this._renderingOrder = data.widgets.map(widget=>{
                            if(widget.bitmapName){
                                widget.bitmap = ImageManager.loadPicture(widget.bitmapName);
                            }
                            return widget;
                        });
                        this._renderingOrder
                            .forEach(widget=>(this._widgets[widget.id] = widget));
                        break;

                    default:
                        this[key] = data[key];
                }
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

        data.widgets = this._renderingOrder
            .map(widget=>{
                delete widget.bitmap;
                return widget;
            });

        return data;
    }

    animateWidget(id, fields){
        let widget = this._widgets[id];
        if(widget){
            if(!widget.animator){
                widget.animator = new Animator(widget, true);
            }
            widget.animator.animate(fields);
        }
    }

    finishAnimation(){
        if(this._animator)this._animator.finish();
    }

    addWidget(widget){
        let id = widget.id;
        this._renderingOrder.push(widget);
        this._widgets[id] = widget;
        this.markDirty();
    }

    findWidget(id){
        return this._widgets[id];
    }

    removeWidget(id){
        let widget = this._widgets[id];

        this._renderingOrder.splice(this._renderingOrder.indexOf(widget), 1);
        delete this._widgets[id];

        this.markDirty();
    }

    markDirty(){
        this._dirty = true;
    }

    _isWidgetChanged(){
        return this._renderingOrder.some(widget=>widget.dirty);
    }

    _clearWidgetsDirtyFlag(){
        this._renderingOrder.forEach(widget=>(widget.dirty = false));
    }

    update(){
        super.update();

        if(this._animator) this._animator.update();
        if(ImageManager.isReady() && (this._dirty || this._isWidgetChanged())){
            this.refresh();
        }
    }

    refresh(){
        this._dirty = false;
        this._clearWidgetsDirtyFlag();

        if(this.contents.width !== this.width || this.contents.height !== this.height){
            this.contents = new Bitmap(this.width, this.height);
        }
        this.contents.clear();
        this._renderingOrder.forEach((widget)=>this['draw'+widget.type](widget));
    }

    drawLabel(label){
        this.drawTextEx(label.text, label.x, label.y);
    }

    drawPicture(picture){
        this.contents.blt(picture.bitmap,
            0, 0,
            picture.bitmap.width,
            picture.bitmap.height,
            picture.x, picture.y,
            picture.bitmap.width * (picture.scaleX || 1),
            picture.bitmap.height * (picture.scaleY || 1)
        );
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