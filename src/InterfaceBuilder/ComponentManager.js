// @flow

import type {Any, NodeType} from './ComponentTypes.js'

import WindowComponent from './WindowComponent.js'
import SpriteComponent from './SpriteComponent.js'
import LabelComponent from './LabelComponent.js'
import PictureComponent from './PictureComponent.js'

import Animator from './Animator.js'
import {convertEscapeCharacters} from '../lib/util.js'
import parameters from './Parameters.js'

type Component =  WindowComponent | SpriteComponent | LabelComponent;
type Handlers = { [key: string]: string }

declare var Graphics;

const IGNORE = ['id', 'picture', 'type', 'text', 'parentId'];

export default class ComponentManager{
    _types: Array<Any>;
    _components: { [key: string]: Component };
    _animators: { [key: string]: Animator };
    _stage: SpriteComponent;
    _handlers: {
        trigger: Handlers
    };

    constructor(){
        this._stage = new SpriteComponent();
        this.clear();
    }

    getStage(){
        return this._stage;
    }

    add(component: Any){
        const id = component.id;
        if(!this.find(id)){
            this._types.push(this._convertNumbers(component));
        }else{
            if(this._animators[id]){
                this._animators[id].finish();
                delete this._animators[id];
            }

            const converted = this._convertNumbers(component);
            const targetType = this._types.find(type=>type.id === id);
            if(targetType)
                Object.keys(converted).forEach(key=>targetType[key]=converted[key]);

            if(this._components[id]){
                this._components[id].update();
            }
        }
    }

    addCommand(commandType: string, id: string, params: Object){
        let type = this.find(id);
        if(type){
            switch(type.type){
                case 'Canvas': case 'Window':
                    type.commands = type.commands || [];
                    type.commands.push({
                        ...this._convertNumbers(params),
                        type: commandType
                    });
                    if(this._components[id])
                        this._components[id].markContentDirty();
                    break;
            }
        }
    }

    clearCommands(id: string){
        let type = this.find(id);
        if(type){
            switch(type.type){
                case 'Canvas': case 'Window':
                    if(type.commands) type.commands.splice(0);
                    if(this._components[id]) this._components[id].markContentDirty();
                    break;
            }
        }
    }

    _convertNumbers(params: Object){
        Object.keys(params).forEach(key=>{
            if(IGNORE.indexOf(key) === -1){
                params[key] = this._convertUnit(params[key]);
            }
        });

        return params;
    }

    _extractUnit(value: string){
        const match = /([\d\.]+)([a-zA-Z%]+)/.exec(value);
        if(match) return {value: +match[1], unit: match[2]};
        return {value: +value, unit: ''};
    }

    _convertUnit(rawValue: string){
        rawValue = convertEscapeCharacters(rawValue);
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
            case '%':
                return value / 100;
            default:
                return value;
        }
    }


    find(id: string){
        return this._types.find(c=>(c.id === id));
    }

    update(){
        let toRemove = [];
        Object.keys(this._animators).forEach(key=>{
            if(this._animators[key].update()){
                toRemove.push(key);
            }
        });

        toRemove.forEach(key=>delete this._animators[key]);

        this._types.forEach(type=>{
            let component = this._components[type.id];
            if(!component){
                component = this._createComponent(type, this._components[type.parentId]);
                if(component) this._components[type.id] = component;
            }
        });
    }

    _createComponent(type: Any, parent: NodeType): ?Component{
        switch(type.type){
            case 'Window':
                return new WindowComponent(type, parent);
            case 'Sprite':
                return new SpriteComponent(type, parent);
            case 'Container':
                return new SpriteComponent(type, parent);
            case 'Label':
                return new LabelComponent(type, parent);
            case 'Picture':
                return new PictureComponent(type, parent);
        }
    }

    setHandler(id: string, type: string, name: string){
        if(!this._handlers[type][id]){
            this._handlers[type][id] = name;
        }
    }

    removeHandler(id: string, type: string){
        delete this._handlers[type][id];
    }

    getHandler(type: string, x: number, y: number){
        let id = this.getIdUnder(x, y);
        if(id){
            return this._handlers[type][id];
        }
        return null;
    }

    getIdUnder(x: number, y: number){
        let id;
        let point = {x,y};

        this._types.forEach(type=>{
            let component = this._components[type.id];
            if(component.containsPoint(point)) id = type.id;
        });

        return id;
    }

    animate(id: string, fields: Object){
        if(!this._animators[id]){
            this._animators[id] = new Animator(this._types.find(type=>(type.id===id)));
        }
        this._animators[id].animate(this._convertNumbers(fields));
    }

    finishAnimation(){
        Object.keys(this._animators).forEach(key=>{
            this._animators[key].finish();
        });
    }

    save(){
        this.finishAnimation();

        return {
            types: this._types,
            handlers: this._handlers
        }
    }

    clear(){
        this._stage.children.slice(0).forEach(child=>this._stage.removeChild(child));

        this._types = [];
        this._components = {stage: this._stage};
        this._animators = {};
        this._handlers = { trigger: {}} ;
    }

    load(data: Object){
        this.clear();
        this._types = data.types;
        this._handlers = data.handlers;
    }
}