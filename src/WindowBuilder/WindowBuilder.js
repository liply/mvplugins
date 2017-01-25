import BaseWindow from './BaseWindow.js'
import BaseSprite from './BaseSprite.js'
import {contains} from '../lib/util.js'


export default class WindowBuilder{
    constructor() {
        this._stage = new BaseSprite();
        this._sprites = {stage: this._stage};
    }

    getStage(){
        return this._stage;
    }

    close(id){
        if(id === 'stage'){
            const children = this._stage.children.slice(0);
            children.forEach(child=>this._stage.removeChild(child));
            this._sprites = {stage: this._stage};
        }else{
            const sprite = this._sprites[id];
            if(sprite instanceof BaseWindow){
                sprite.close();
            }else{
                sprite.parent.removeChild(sprite);
                delete this._sprites[id];
            }
        }
    }

    find(id){
        for(let key in this._sprites){
            if(this._sprites.hasOwnProperty(key)){
                const window = this._sprites[key];
                if(key === id) return window;

                const widget = window.findWidget(id);
                if(widget) return widget;
            }
        }
    }

    update(){
        const toRemove = Object.keys(this._sprites)
            .filter(key=>{
                let sprite = this._sprites[key];
                if(sprite.isClosed && sprite.isClosed()) return true;
            });

        toRemove.forEach(key=>(delete this._sprites[key]));
    }

    refresh(){
        Object.keys(this._sprites)
            .forEach(key=>this._sprites[key].refresh());
    }

    animate(id, params){

        for(let key in this._sprites){
            if(this._sprites.hasOwnProperty(key)){
                const window = this._sprites[key];
                if(key === id){
                    let p = this._parseParams(window, params);
                    window.animate(p);
                    break;
                }

                if(window.findWidget && window.findWidget(id)){
                    let p = this._parseParams(window, params);
                    window.animateWidget(p);
                    break;
                }
            }
        }
    }

    window(id, parent, params){
        let window;
        if(this._sprites[id]){
            window = this._sprites[id];
            window.finishAnimation();
            window.parent.removeChild(window);
        }else{
            window = new BaseWindow();
        }

        let p = this._parseParams(window, params);
        this._applyBasicParams(window, p);
        window.setBackgroundType(p.background || 0);
        window.contents = new Bitmap(p.width, p.height);

        this._sprites[id] = window;
        this._sprites[parent].addChild(window);
    }

    sprite(id, parent, name, params){
        let sprite;
        if(this._sprites[id]){
            sprite = this._sprites[id];
            sprite.finishAnimation();
            sprite.parent.removeChild(sprite);
        }else{
            sprite = new BaseSprite();
        }

        let p = this._parseParams(null, params);
        this._applyBasicParams(sprite, p);
        sprite.bitmap = ImageManager.loadPicture(name);

        this._sprites[id] = sprite;
        this._sprites[parent].addChild(sprite);
    }

    label(id, parent, text, params){
        this._upsertWidget(id, parent, params, (label)=>{
            label.type = 'Label';
            label.text = text;
        });
    }

    picture(id, parent, name, params){
        this._upsertWidget(id, parent, params, (picture)=>{
            picture.type = 'Picture';
            picture.bitmap = ImageManager.loadPicture(name);
        });
    }

    _upsertWidget(id, parent, params, modifier){
        let parentWindow = this._sprites[parent];
        if(parentWindow.findWidget(id)){
            let widget = parentWindow.findWidget(id);
            let newWidget = this._parseParams(parentWindow, params);
            Object.keys(newWidget)
                .forEach(key=>widget[key] = newWidget[key]);
            widget.dirty = true;
            modifier(widget);
        }else{
            let widget = this._parseParams(parentWindow, params);
            modifier(widget);

            parentWindow.addWidget(id, widget);
        }
    }

    _applyBasicParams(w, p){
        w.x = p.x || w.x;
        w.y = p.y || w.y;

        w.width = p.width || w.width;
        w.height = p.height || w.height;

        if(p.visible !== undefined)
            w.visible = p.visible;
    }

    _parseParams(window, params){
        let result = {};

        for(let n = 0; n < params.length; n+=2){
            const type = params[n];
            result[type] = this._convertUnit(window, params[n + 1]);
        }

        return result;
    }

    _convertUnit(window, value){
        if(contains(value, 'line')){
            return +value.slice(0, -4) * window.lineHeight();
        }
        if(contains(value, 'fit')){
            return window.fittingHeight(+value.slice(0, -3));
        }

        return +value;
    }

    save(){
    }

    load(){
    }
}