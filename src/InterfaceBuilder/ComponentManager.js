// @flow

import type {Any, NodeType, Base} from './ComponentTypes.js'

import WindowComponent from './WindowComponent.js'
import SpriteComponent from './SpriteComponent.js'
import LabelComponent from './LabelComponent.js'
import PictureComponent from './PictureComponent.js'
import {fillDefaultParams} from './SpriteUtil.js'

import Animator from './Animator.js'
import parameters from './Parameters.js'

type Component =  WindowComponent | SpriteComponent | LabelComponent;
type Handlers = { [key: string]: string }

declare var Graphics;
declare var Input;
declare var Window_Base;

class MiniWindow extends Window_Base{
    constructor(){
        super(0, 0, 1, 1);
    }
}

let miniWindow;

function convertEscapeCharacters(text: string): string{
    if(!miniWindow){
        miniWindow = new MiniWindow();
    }
    return miniWindow.convertEscapeCharacters(text);
}

export default class ComponentManager{
    _types: Array<Any>;
    _components: { [key: string]: Component };
    _animators: { [key: string]: Animator };
    _stage: SpriteComponent;
    _handlers: {
        trigger: Handlers,
        press: Handlers,
        longPress: Handlers,
        release: Handlers,
        emulation: Handlers
    };
    _keys: Object;
    _stiffness: ?number;
    _damping: ?number;

    constructor(){
        this._stage = new SpriteComponent();
        this.clear();
    }

    getStage(){
        return this._stage;
    }

    hasParent(t: Any, id: string){
        if(t.id === id) return true;

        while(t && t.parentId){
            if(t.id === id)return true;
            t = this._types.find(p=>(p.id === t.parentId));
        }

        return false;
    }

    close(id: string){
        if(id === 'stage'){
            this.clear();
        }else{
            let remove = this._types.filter((t:Any)=>this.hasParent(t,id));

            remove.forEach(type=>{
                const key = type.id;
                if(this._components[key]){
                    const c = this._components[key];
                    c.parent.removeChild(c);

                    delete this._components[key];
                }
            });

            this._types = this._types.filter((t:Any)=>!this.hasParent(t,id));
        }
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

            const converted = this._convertNumbers(component, true);
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

    setSpringParams(stiffness: number, damping: number){
        this._stiffness = stiffness;
        this._damping = damping;
    }

    setDefaultSpringParams(){
        this._stiffness = null;
        this._damping = null;
    }

    _convertNumbers(params: Object, removeDefault: ?boolean): any{
        let result = {};
        if(!removeDefault) fillDefaultParams(result);
        Object.keys(params).forEach(key=>{
            let {value, unit} = this._convertUnit(params[key]);
            if(unit === '%'){
                result[key+'P'] = value;
            }else{
                result[key] = value;
            }
        });

        return result;
    }

    _extractUnit(value: string): Object{
        const match = /^([\d\.]+)([a-zA-Z%]+)$/.exec(value);
        if(match) return {value: +match[1], unit: match[2]};
        return {value: +value, raw: value, unit: ''};
    }

    _convertUnit(rawValue: string){
        rawValue = convertEscapeCharacters(rawValue);
        let {value, unit, raw} = this._extractUnit(rawValue);

        return {value: this._calcUnit(value, unit, raw), unit};
    }

    _calcUnit(value: number, unit: string, raw: string){
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
                return isNaN(value)? raw: value;
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

    getEmulateEventName(){
        let name;
        Object.keys(this._handlers.emulation).forEach(key=>{
            if(Input.isPressed(key)){
                name = this._getEmulatedName(key, 'press') || name;
                this._keys[key] = true;
            }else if(this._keys[key]){
                name = this._getEmulatedName(key, 'release') || name;
                this._keys[key] = false;
            }
            if(Input.isTriggered(key)) name = this._getEmulatedName(key, 'trigger') || name;
            if(Input.isLongPressed(key)) name = this._getEmulatedName(key, 'longPress') || name;
        });

        return name;
    }

    _getEmulatedName(key: string, type: string){
        return this._handlers[type][this._handlers.emulation[key]];
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

        this._animators[id].setSpring(this._stiffness, this._damping);
        this._animators[id].animate(this._convertNumbers(fields, true));
    }

    emulateEvent(key: string, id: string){
        this._handlers.emulation[key] = id;
    }

    removeEventEmulation(key: string){
        delete this._handlers.emulation[key];
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
        this._keys = {};
        this._components = {stage: this._stage};
        this._animators = {};
        this._handlers = { release: {}, trigger: {}, emulation: {}, press: {}, longPress: {}} ;
    }

    load(data: Object){
        this.clear();
        this._types = data.types;
        this._handlers = data.handlers;
    }
}