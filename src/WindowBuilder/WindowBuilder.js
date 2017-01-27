import BaseWindow from './BaseWindow.js'
import BaseSprite from './BaseSprite.js'
import LabelSprite from './LabelSprite.js'
import parameters from './params.js'

export default class WindowBuilder{
    constructor() {
        this._stage = new BaseSprite();
        this._order = [];
        this._sprites = {stage: this._stage};
        this._handlers = {trigger: {}};
    }

    getStage(){
        return this._stage;
    }

    setOnTriggerHandler(id, commonId){
        this._handlers.trigger[id] = commonId;
    }

    removeOnTriggerHandler(id){
        delete this._handlers.trigger[id];
    }

    getIdUnder(x, y){
        let point = new PIXI.Point(x, y);
        let id;

        this._order.forEach(key=>{
            id = this._sprites[key].getIdUnder(point) || id;
        });

        return id;
    }

    getOnTriggerHandler(x, y){
        return this._handlers.trigger[this.getIdUnder(x, y)];
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
                    let p = this._parseParams(params);
                    window.animate(p);
                    break;
                }

                if(window.findWidget && window.findWidget(id)){
                    let p = this._parseParams(params);
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
            window = new BaseWindow(id);
        }

        let p = this._parseParams(params);
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

        let p = this._parseParams(params);
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
            this._upsertSprite(id, parent, params, ()=>new LabelSprite(id), (label)=>{
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
            this._upsertSprite(id, parent, params, ()=>new BaseSprite(id), (sprite)=>{
                if(name) sprite.bitmap = ImageManager.loadPicture(name);
                sprite.bitmapName = name;
            });
        }
    }

    _upsertWidget(id, parent, params, modifier){
        let parentWindow = this._sprites[parent];
        if(parentWindow.findWidget(id)){
            let widget = parentWindow.findWidget(id);
            let newWidget = this._parseParams(params);
            Object.keys(newWidget)
                .forEach(key=>widget[key] = newWidget[key]);
            widget.dirty = true;
            modifier(widget);
        }else{
            let widget = this._parseParams(params);
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

    _parseParams(params){
        let result = {};

        if(params instanceof Array){
            for(let n = 0; n < params.length; n+=2){
                const type = params[n];
                result[type] = this._convertUnit(params[n + 1]);
            }
        }else{
            Object.keys(params).forEach(key=>{
                result[key] = this._convertUnit(params[key]);
            });
        }

        return result;
    }

    _extractUnit(value){
        const match = /([\d\.]+)([a-zA-Z]+)/.exec(value);
        if(match) return {value: +match[1], unit: match[2]};
        return {value: +value};
    }

    _convertUnit(rawValue){
        rawValue = this._resolveReference(rawValue);
        let {value, unit} = this._extractUnit(rawValue);

        switch(unit){
            case 'column':
                return Graphics.width / parameters.column * value;
            case 'row':
                return Graphics.height / parameters.row * value;
            case 'vw':
                return Graphics.width * (value / 100);
            case 'vh':
                return Graphics.height * (value / 100);
            case 'bw':
                return Graphics.boxWidth * (value / 100);
            case 'bh':
                return Graphics.boxHeight * (value / 100);
            default:
                return value;
        }
    }

    _resolveReference(value){
        let match;
        let expVariable = /\\V\[(\d)\][a-zA-Z]+/;
        if(match = expVariable.exec(value)){
            return value.replace(expVariable, $gameVariables.value(+match[1]));
        }

        return value;
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
                    parentId: this._sprites[key]._liply_parentId,
                    handlers: this._handlers
                }
            }
        }).filter(data=>data);

        return data;
    }

    load(data){
        this.clear();

        data._handlers = data.handlers;

        data.sprites.forEach(data=>{
            let id = data.id;
            let parentId = data.parentId;
            switch(data.type){
                case 'BaseWindow':
                    this._sprites[id] = new BaseWindow(id, data);
                    break;

                case 'BaseSprite':
                    this._sprites[id] = new BaseSprite(id, data);
                    break;

                case 'LabelSprite':
                    this._sprites[id] = new LabelSprite(id, data);
                    break;
            }
            this._sprites[id]._liply_id = id;
            this._sprites[id]._liply_parentId = parentId;
            this._pushOrder(id);
        });

        Object.keys(this._sprites).forEach(key=>{
            let sprite = this._sprites[key];
            if(sprite._liply_parentId){
                this._sprites[sprite._liply_parentId].addChild(sprite);
            }
        });
    }
}