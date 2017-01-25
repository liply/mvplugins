import Animator from './Animator.js'

export default class BaseWindow extends Window_Base{
    constructor(){
        super();

        this._widgets = {};
        this._renderingOrder = [];
        this._widgetAnimators = [];
    }

    animate(fields){
        if(!this._animator){
            this._animator = new Animator(this);
        }
        this._animator.animate(fields);
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

    addWidget(id, widget){
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

        this.contents.clear();
        this._renderingOrder.forEach((widget)=>this['draw'+widget.type](widget));
    }

    drawLabel(label){
        this.drawTextEx(label.text, label.x, label.y);
    }

    drawPicture(picture){
        this.contents.blt(picture.bitmap,
            0, 0,
            picture.bitmap.width, picture.bitmap.height,
            picture.x, picture.y);
    }
}