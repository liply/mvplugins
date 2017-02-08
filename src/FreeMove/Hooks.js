
import {getDirection4, real2grid, toXy} from './CharacterUtil.js';
import {wrapPrototype} from '../lib/util.js'
import {hitMap, hitMapEvents, restorePositionIfHit} from './hitMap.js'

wrapPrototype(Game_Temp, 'destinationX', old=>function(){
    return Math.round(old.call(this));
});

wrapPrototype(Game_Temp, 'destinationY', old=>function(){
    return Math.round(old.call(this));
});


wrapPrototype(Game_CharacterBase, 'update', old=>function(){
    this._moving = this._beforeX !== this._realX || this._beforeY !== this._realY;

    this._beforeX = this._realX;
    this._beforeY = this._realY;
    old.call(this);
    this.refreshBushDepth();
});

wrapPrototype(Game_CharacterBase, 'updateMove', old=>function(){
    if(this._targetMode){
        const dx = this._x - this._realX;
        const dy = this._y - this._realY;
        const l = Math.sqrt(dx*dx+dy*dy);
        const d = this.distancePerFrame();

        if(l < d){
            this._realX = this._x;
            this._realY = this._y;
            this._targetMode = false;
        }else{
            this._realX += dx / l * d;
            this._realY += dy / l * d;
        }
    }else{
        this._x = real2grid(this._realX);
        this._y = real2grid(this._realY);
    }
    this.checkEventTriggerTouchFront(getDirection4(this));
});

wrapPrototype(Game_CharacterBase, 'updateMove', old=>function(){
    if(this._targetMode){
        const dx = this._x - this._realX;
        const dy = this._y - this._realY;
        const l = Math.sqrt(dx*dx+dy*dy);
        const d = this.distancePerFrame();

        if(l < d){
            this._realX = this._x;
            this._realY = this._y;
            this._targetMode = false;
        }else{
            this._realX += dx / l * d;
            this._realY += dy / l * d;
        }
    }else{
        this._x = real2grid(this._realX);
        this._y = real2grid(this._realY);
    }
    this.checkEventTriggerTouchFront(getDirection4(this));
});

wrapPrototype(Game_CharacterBase, 'isMoving', old=>function(){
    return this._moving;
});

wrapPrototype(Game_CharacterBase, 'refreshBushDepth', old=>function(){
    if (this.isNormalPriority() && !this.isObjectCharacter() &&
        this.isOnBush() && !this.isJumping()) {
        this._bushDepth = 12;
    } else {
        this._bushDepth = 0;
    }
});

wrapPrototype(Game_CharacterBase, 'moveStraight', old=>function(d){
    old.call(this, d);
    if(this.isMovementSucceeded()){
        this._targetMode = true;
        this._moving = true;
    }
});

wrapPrototype(Game_Event, 'start', old=>function(){
   old.call(this);
    if(this._starting){
        this._x = real2grid(this._realX);
        this._y = real2grid(this._realY);
        this._targetMode = false;
    }
});

function analogMapX(map, x) {
    const tileWidth = map.tileWidth();
    const originX = map._displayX * tileWidth;
    return (originX + x) / tileWidth;
}

function analogMapY(map, y) {
    const tileHeight = map.tileHeight();
    const originY = map._displayY * tileHeight;
    return (originY + y) / tileHeight;
}


wrapPrototype(Sprite_Destination, 'updatePosition', old=>function(){
    const tileWidth = $gameMap.tileWidth();
    const tileHeight = $gameMap.tileHeight();
    const x = $gameTemp._destinationX;
    const y = $gameTemp._destinationY;
    this.x = $gameMap.adjustX(x) * tileWidth;
    this.y = $gameMap.adjustY(y) * tileHeight;

});

wrapPrototype(Scene_Map, 'processMapTouch', old=>function(){
    if (TouchInput.isTriggered() || this._touchCount > 0) {
        if (TouchInput.isPressed()) {
            if (this._touchCount === 0 || this._touchCount >= 15) {
                var x = analogMapX($gameMap, TouchInput.x);
                var y = analogMapY($gameMap, TouchInput.y);
                $gameTemp.setDestination(x, y);
            }
            this._touchCount++;
        } else {
            $gameTemp.clearDestination();
            this._touchCount = 0;
        }
    }
});


wrapPrototype(Scene_Map, 'update', old=>function(){
    old.call(this);
    hitMapEvents($gameMap);
});

wrapPrototype(Game_Map, 'displayX', old=>function(){
    return Math.round(this._displayX*this.tileWidth())/this.tileWidth();
});

wrapPrototype(Game_Map, 'displayY', old=>function(){
    return Math.round(this._displayY*this.tileHeight())/this.tileHeight();
});

wrapPrototype(Game_Player, 'update', old=>function(active){
    old.call(this, active);
    this.triggerAction();

});

wrapPrototype(Game_Player, 'moveByInput', old=>function(){
    if (this.canMove()) {
        let x = this._realX, y = this._realY;

        let direction = Input.dir8;
        if (direction > 0) {
            const xy = toXy(direction);
            x += xy.x;
            y += xy.y;
            $gameTemp.clearDestination();
        } else if ($gameTemp.isDestinationValid()){
            x = $gameTemp._destinationX - 0.5;
            y = $gameTemp._destinationY - 0.5;
        }

        const dx = x - this._realX;
        const dy = y - this._realY;
        const l = Math.sqrt(dx*dx+dy*dy);
        const s = this.distancePerFrame();
        if(s > l){
            this._realX = x;
            this._realY = y;
            this._moving = false;
        }else{
            this._realX += dx / l * s;
            this._realY += dy / l * s;

            this.setDirection(getDirection4(this));
            this.resetStopCount();
            this._moving = true;
        }

        restorePositionIfHit(this, $gameMap);
        hitMap(this);
        this._followers.updateMove();
    }
});

wrapPrototype(Game_Follower, 'chaseCharacter', old=>function(character){
    const dx = character._realX - this._realX;
    const dy = character._realY - this._realY;
    const l = Math.sqrt(dx*dx+dy*dy);
    const s = Math.min(l-1,this.distancePerFrame());
    if(l > 1){
        this._realX += dx / l * s;
        this._realY += dy / l * s;
        this.setDirection(getDirection4(this));
        this.resetStopCount();
    }

    this.setMoveSpeed($gamePlayer.realMoveSpeed());
});

function isActionRange(c1, c2){
    const dx = c1._realX - c2._realX;
    const dy = c1._realY - c2._realY;
    const l2 = dx*dx+dy*dy;
    return l2 < 1.1*1.1;
}

wrapPrototype(Game_Player, 'startMapEvent', old=>function(tx, ty, triggers, normal){
    if (!$gameMap.isEventRunning()) {
        $gameMap.events().filter((e)=>{
            for(let x = -1; x <= 1; ++x){
                for(let y = -1; y <= 1; ++y){
                    if(e.pos(tx+x,ty+y)) return true;
                }
            }
            return false;
        }).forEach((event)=>{
            if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal && isActionRange(this, event)) {
                event.start();
            }
        });
    }
});


wrapPrototype(Game_Player, 'updateDashing', old=>function(){
    if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled()) {
        this._dashing = this.isDashButtonPressed();
    } else {
        this._dashing = false;
    }
});

wrapPrototype(Game_Player, 'triggerAction', old=>function(){
    if (this.triggerButtonAction()) {
        return true;
    }
    if (this.triggerTouchAction()) {
        return true;
    }
    return false;

});
