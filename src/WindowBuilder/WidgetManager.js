
import Animator from './Animator.js'

export default class WidgetManager{
    constructor(target, type, widgets){
        this._widgets = {};
        this._renderingOrder = [];

        this._target = target;
        this._isWindow = type === 'Window';

        if(widgets){
            this._renderingOrder = widgets.map(widget=>{
                if(widget.bitmapName){
                    widget.bitmap = ImageManager.loadPicture(widget.bitmapName);
                }
                return widget;
            });
            this._renderingOrder
                .forEach(widget=>(this._widgets[widget.id] = widget));

            this.markDirty();
        }
    }

    save(){
        return this._renderingOrder
            .map(widget=>{
                delete widget.bitmap;
                delete widget.animator;

                return widget;
            });
    }

    animate(id, fields){
        let widget = this._widgets[id];
        if(widget){
            if(!widget.animator){
                widget.animator = new Animator(widget, true);
            }
            widget.animator.animate(fields);
        }
    }

    finishAnimation(){
        this._renderingOrder.forEach(widget=>(widget.animator && widget.animator.finish()));
    }

    add(widget){
        let id = widget.id;
        this._renderingOrder.push(widget);
        this._widgets[id] = widget;
        this.markDirty();
    }

    find(id){
        return this._widgets[id];
    }

    remove(id){
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
        if(this._animator) this._animator.update();
        if(ImageManager.isReady() && this.isDirty()){
            this.refresh();
        }
    }

    refresh(){
        this._dirty = false;
        this._clearWidgetsDirtyFlag();

        let prefix;
        if(this._isWindow){
            this._target.contents.clear();
            prefix = '_drawWindow';
        }

        this._renderingOrder.forEach((widget)=>this[prefix+widget.type](widget));
    }

    _drawWindowLabel(label){
        this._target.drawTextEx(label.text, label.x, label.y);
    }

    _drawWindowPicture(picture){
        this._target.contents.blt(picture.bitmap,
            0, 0,
            picture.bitmap.width,
            picture.bitmap.height,
            picture.x, picture.y,
            picture.bitmap.width * (picture.scaleX || 1),
            picture.bitmap.height * (picture.scaleY || 1)
        );
    }

    isDirty(){
        return this._dirty || this._isWidgetChanged();
    }

    getIdUnder(p){
        let id;
        let prefix = '_containsPointWindow';

        this._renderingOrder.forEach(widget=>{
            id = this[prefix+widget.type](widget, p);
        });

        return id;
    }

    _containsPointWindowPicture(widget, p){
        let width = widget.bitmap.width;
        let height = widget.bitmap.height;

        return this._containsPointWindowWidgetBasic(widget.x, widget.y, width, height, p) && widget.id;
    }

    _containsPointWindowLabel(widget, p){
        let width = this._target.textWidth(widget.text);
        let height = this._target.lineHeight();

        return this._containsPointWindowWidgetBasic(widget.x, widget.y, width, height, p) && widget.id;
    }

    _containsPointWindowWidgetBasic(x, y, w, h, p){
        const gx = this._target._windowContentsSprite.worldTransform.tx + x;
        const gy = this._target._windowContentsSprite.worldTransform.ty + y;

        return gx <= p.x && p.x <= gx+w &&
            gy <= p.y && p.y <= gy+h;
    }
}