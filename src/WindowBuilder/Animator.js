// inspired by react-motion
// https://github.com/chenglou/react-motion

const defaultStiffness = 170;
const defaultDamping = 26;
const defaultEps = 0.01;

class AnimatedValue{
    constructor(x, k, b, eps, setDirty){
        this._v = 0;
        this._x = x;
        this._k = k;
        this._b = b;
        this._destX = x;
        this._eps = eps;
        this._setDirty = setDirty;
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
            if(this._target[this._field] === destX && this._setDirty){
                this._target.dirty = false;
            }
            this._target[this._field] = this._x = destX;
            this._v = 0;

            if(this._setDirty) this._target.dirty = true;
        }else{
            this._target[this._field] = this._x = newX;
            this._v = newV;

            if(this._setDirty) this._target.dirty = true;
        }
    }
}

export default class Animator{
    constructor(target, setDirty){
        this._target = target;
        this._animatedValues = {};
        this._setDirty = setDirty;
    }

    animate(to){
        Object.keys(to).forEach(key=>{
            if(!this._animatedValues[key]){
                this._animatedValues[key] =
                    new AnimatedValue(this._target[key], defaultStiffness, defaultDamping, defaultEps, this._setDirty);
            }
            this._animatedValues[key].targetField(this._target, key);
            this._animatedValues[key].set(to[key]);
        });
    }

    update(){
        Object.keys(this._animatedValues).forEach(key=>(this._animatedValues[key].update()));
    }

    finish(){
        Object.keys(this._animatedValues).forEach(key=>(this._animatedValues[key].finish()));
        this._animatedValues = {};
    }
}