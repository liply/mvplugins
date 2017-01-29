// @flow
// inspired by react-motion
// https://github.com/chenglou/react-motion

const defaultStiffness = 170;
const defaultDamping = 26;
const defaultEps = 0.01;

class AnimatedValue{
    _v: number;
    _x: number;
    _k: number;
    _b: number;
    _destX: number;
    _eps: number;
    _target: Object;
    _field: string;


    constructor(x, k, b, eps){
        this._v = 0;
        this._x = x;
        this._k = k;
        this._b = b;
        this._destX = x;
        this._eps = eps;
    }

    targetField(target, field){
        this._target = target;
        this._field = field;
    }

    set(x){
        this._destX = x;
    }

    finish(){
        this._target[this._field] = this._destX;
    }

    update(){
        const v = this._v;
        const destX = this._destX;
        const x = this._x;
        const k = this._k;
        const b = this._b;
        const eps = this._eps;

        const Fspring = -k * (x - destX);
        const Fdamper = -b * v;

        const a = Fspring + Fdamper;

        const newV = v + a * (1 / 60);
        const newX = x + newV * (1 / 60);

        if(Math.abs(newV) < eps && Math.abs(newX - destX) < eps){
            this._target[this._field] = this._x = destX;
            this._v = 0;

            return true;
        }else{
            this._target[this._field] = this._x = newX;
            this._v = newV;

            return false;
        }
    }
}

export default class Animator{
    _target: Object;
    _animatedValues: {[key: string]: AnimatedValue};
    _stiffness: number;
    _damping: number;

    constructor(target: ?Object, stiffness: ?number, damping: ?number){
        if(target) this._target = target;
        this._animatedValues = {};
        this._stiffness = stiffness || defaultStiffness;
        this._damping = damping || defaultDamping;
    }

    animate(to: Object){
        Object.keys(to).forEach(key=>{
            if(!this._animatedValues[key]){
                this._animatedValues[key] =
                    new AnimatedValue(this._target[key], this._stiffness, this._damping, defaultEps);
            }
            this._animatedValues[key].targetField(this._target, key);
            this._animatedValues[key].set(to[key]);
        });
    }

    update(){
        let stable = true;
        Object.keys(this._animatedValues).forEach(key=>{
            stable = this._animatedValues[key].update() && stable;
        });

        return stable;
    }

    finish(){
        Object.keys(this._animatedValues).forEach(key=>(this._animatedValues[key].finish()));
        this._animatedValues = {};
    }
}