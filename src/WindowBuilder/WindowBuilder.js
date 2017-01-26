import BaseWindow from './BaseWindow.js'
import BaseSprite from './BaseSprite.js'
import LabelSprite from './LabelSprite.js'
import {contains} from '../lib/util.js'


export default class WindowBuilder{
    constructor() {
        this._stage = new BaseSprite();
        this._order = [];
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

            this._order.splice(this._order.indexOf(id), 1);
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

    _pushOrder(id){
        if(this._order.indexOf(id) === -1)this._order.push(id);
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
        }else{
            window = new BaseWindow();
        }

        let p = this._parseParams(window, params);
        this._applyBasicParams(window, p);
        window.setBackgroundType(p.background || 0);
        window._liply_id = id;
        window._liply_parentId = parent;

        this._sprites[id] = window;
        if(window.parent !== this._sprites[parent])
            this._sprites[parent].addChild(window);
        this._pushOrder(id);
    }

    _upsertSprite(id, parent, params, factory, modifier){
        let sprite;
        if(this._sprites[id]){
            sprite = this._sprites[id];
            sprite.finishAnimation();
        }else{
            sprite = factory();
        }

        let p = this._parseParams(null, params);
        this._applyBasicParams(sprite, p);

        sprite._liply_id = id;
        sprite._liply_parentId = parent;

        modifier(sprite);

        this._sprites[id] = sprite;
        if(sprite.parent !== this._sprites[parent])
            this._sprites[parent].addChild(sprite);

        this._pushOrder(id);
    }

    label(id, parent, text, params){
        if(this._isWidget(parent)){
            this._upsertWidget(id, parent, params, (label)=>{
                label.type = 'Label';
                label.text = text;
            });
        }else{
            this._upsertSprite(id, parent, params, ()=>new LabelSprite(), (label)=>{
                label.setText(text);
            })
        }
    }

    _isWidget(parentId){
        return parentId !== 'stage' && (this._sprites[parentId] instanceof BaseWindow);
    }

    picture(id, parent, name, params){
        if(this._isWidget(parent)){
            this._upsertWidget(id, parent, params, (picture)=>{
                picture.type = 'Picture';
                picture.bitmap = ImageManager.loadPicture(name);
                picture.bitmapName = name;
            });
        }else{
            this._upsertSprite(id, parent, params, ()=>new BaseSprite(), (sprite)=>{
                if(name) sprite.bitmap = ImageManager.loadPicture(name);
                sprite.bitmapName = name;
            });
        }
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
        data.sprites = this._order.map(key=>{
            if(key !== 'stage'){
                return {
                    ...this._sprites[key].save(),
                    id: this._sprites[key]._liply_id,
                    parentId: this._sprites[key]._liply_parentId
                }
            }
        }).filter(data=>data);

        return data;
    }

    load(data){
        this.clear();

        data.sprites.forEach(data=>{
            let id = data.id;
            let parentId = data.parentId;
            switch(data.type){
                case 'BaseWindow':
                    this._sprites[id] = new BaseWindow(data);
                    break;

                case 'BaseSprite':
                    this._sprites[id] = new BaseSprite(data);
                    break;

                case 'LabelSprite':
                    this._sprites[id] = new LabelSprite(data);
                    break;
            }
            this._sprites[id]._liply_id = id;
            this._sprites[id]._liply_parentId = parentId;
            this._order.push(id);
        });

        Object.keys(this._sprites).forEach(key=>{
            let sprite = this._sprites[key];
            if(sprite._liply_parentId){
                this._sprites[sprite._liply_parentId].addChild(sprite);
            }
        });
    }
}