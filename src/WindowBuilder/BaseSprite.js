import Animator from './Animator.js'

export default class BaseSprite extends Sprite{
    animate(fields){
        if(!this._animator){
            this._animator = new Animator(this);
        }
        this._animator.animate(fields);
    }

    finishAnimation(){
        if(this._animator)this._animator.finish();
    }

    update(){
        if(this._animator)this._animator.update();

        super.update();
    }
}