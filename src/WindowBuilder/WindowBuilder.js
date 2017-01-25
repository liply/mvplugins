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

    clear(){
        this.close('stage');
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
        window._liply_id = id;
        window._liply_parentId = parent;

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
        if(name) sprite.bitmap = ImageManager.loadPicture(name);
        sprite.bitmapName = name;
        sprite._liply_id = id;
        sprite._liply_parentId = parent;

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
            picture.bitmapName = name;
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
            widget.id = id;
            modifier(widget);

            parentWindow.addWidget(widget);
        }
    }

    _applyBasicParams(w, p){
        w.x = p.x || w.x;
        w.y = p.y || w.y;

        w.width = p.width || w.width;
        w.height = p.height || w.height;

        w.scaleX = p.scaleX || w.scaleX;
        w.scaleY = p.scaleY || w.scaleY;

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
        Object.keys(this._sprites).forEach(key=>{
            this._sprites[key].finishAnimation();
        });

        let data = {};
        data.sprites = {};
        Object.keys(this._sprites).forEach(key=>{
            if(key !== 'stage'){
                data.sprites[key] = this._sprites[key].save();
                data.sprites[key]._liply_id = this._sprites[key]._liply_id;
                data.sprites[key]._liply_parentId = this._sprites[key]._liply_parentId;
            }
        });

        return data;
    }

    load(data){
        this.clear();

        Object.keys(data.sprites).forEach(key=>{
            switch(data.sprites[key].type){
                case 'BaseWindow':
                    this._sprites[key] = new BaseWindow(data.sprites[key]);
                    break;

                case 'BaseSprite':
                    this._sprites[key] = new BaseSprite(data.sprites[key]);
                    break;
            }
            this._sprites[key]._liply_id = data.sprites[key]._liply_id;
            this._sprites[key]._liply_parentId = data.sprites[key]._liply_parentId;
        });

        Object.keys(this._sprites).forEach(key=>{
            let sprite = this._sprites[key];
            if(sprite._liply_parentId){
                this._sprites[sprite._liply_parentId].addChild(sprite);
            }
        });
    }
}