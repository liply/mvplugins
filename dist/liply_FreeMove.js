(function () {
'use strict';

var ISQ2 = 1 / Math.sqrt(2);

function toXy(d){
    switch(d){
        case 1:
            return {x: -ISQ2, y: ISQ2};
        case 2:
            return {x: 0, y: 1};
        case 3:
            return {x: ISQ2, y: ISQ2};
        case 4:
            return {x:-1, y: 0};
        case 5:
            return {x: 0,y: 0};
        case 6:
            return {x: 1, y: 0};
        case 7:
            return {x: -ISQ2, y: -ISQ2};
        case 8:
            return {x: 0, y: -1};
        case 9:
            return {x: ISQ2, y: -ISQ2};
    }

    return {x:0,y:0};
}



function getDirection4(c){
    var dx = c._realX - c._beforeX;
    var dy = c._realY - c._beforeY;

    if(dx === 0 && dy === 0){ return c.direction(); }

    var l = Math.sqrt(dx*dx+dy*dy);
    var ux = dx / l;
    var uy = dy / l;

    if(uy < -ISQ2){
        if(ux < -ISQ2) { return 4; }
        else if(ux > ISQ2) { return 6; }
        else { return 8; }
    }else if(uy > ISQ2){
        if(ux < -ISQ2) { return 4; }
        else if(ux > ISQ2) { return 6; }
        else { return 2; }
    }else{
        if(ux < -ISQ2) { return 4; }
        else if(ux > ISQ2) { return 6; }
        else { return 2; }
    }
}

function real2grid(v){
    return Math.floor(v + 0.5);
}

function wrapPrototype(klass, method, fn){
    var oldMethod = klass.prototype[method];
    var newMethod = fn(oldMethod);

    klass.prototype[method] = newMethod;
}

var R = 0.4;
var D = 0.1;
var EPS = 0.0001;

function hitXEdge(character, y){
    var y1 = character._realY + 0.5 - R;
    var y2 = character._realY + 0.5 + R;

    if(y1 <= y && y <= y2){
        if(y2 - y < R){
            character._realY = y - R - 0.5;
        }else{
            character._realY = y - D;
        }
    }
}

function hitYEdge(character, x){
    var x1 = character._realX + 0.5 - R;
    var x2 = character._realX + 0.5 + R;

    if(x1 <= x && x <= x2){
        if(x2 - x < R){
            character._realX = x - R - 0.5;
        }else{
            character._realX = x - D;
        }
    }
}


function hitCorner(character, x, y){
    var dx = character._realX + 0.5 - x;
    var dy = character._realY + 0.5 - y;
    var l = Math.sqrt(dx*dx+dy*dy);
    if(l > EPS){
        if(l < R) {
            var tx = dx / l * R;
            var ty = dy / l * R;
            character._realX = x + tx - 0.5;
            character._realY = y + ty - 0.5;
        }
    }else if(l < R){
        character._realX = x;
        character._realY = y;
    }
}

function hitMap(character){
    var x = Math.floor(character._realX + 0.5);
    var y = Math.floor(character._realY + 0.5);

    if(!character.isMapPassable(x-1, y, 8) || !character.isMapPassable(x, y-1, 4)){ hitCorner(character, x, y); }
    if(!character.isMapPassable(x, y-1, 6) || !character.isMapPassable(x+1, y, 8)){ hitCorner(character, x+1, y); }
    if(!character.isMapPassable(x-1, y, 2) || !character.isMapPassable(x, y+1, 4)){ hitCorner(character, x, y+1); }
    if(!character.isMapPassable(x, y+1, 6) || !character.isMapPassable(x+1, y, 2)){ hitCorner(character, x+1, y+1); }

    if(!character.isMapPassable(x, y, 2)){ hitXEdge(character, y+1); }
    if(!character.isMapPassable(x, y, 4)){ hitYEdge(character, x); }
    if(!character.isMapPassable(x, y, 6)){ hitYEdge(character, x+1); }
    if(!character.isMapPassable(x, y, 8)){ hitXEdge(character, y); }
}

function collideCharacter(c1, c2){
    var dx = c1._realX - c2._realX;
    var dy = c1._realY - c2._realY;
    var l2 = dx*dx+dy*dy;

    if(l2 < (R*2)*(R*2)){
        var ld2 = Math.sqrt(l2)/2;
        var cx = (c1._realX + c2._realX) / 2;
        var cy = (c1._realY + c2._realY) / 2;

        c1._realX = cx + (c1._realX - cx) / ld2 * R;
        c2._realX = cx + (c2._realX - cx) / ld2 * R;

        c1._realY = cy + (c1._realY - cy) / ld2 * R;
        c2._realY = cy + (c2._realY - cy) / ld2 * R;
    }
}

function collideEach(characters){
    var l = characters.length;
    for(var n = 0; n < l; ++n){
        for(var m = 0; m < l; ++m){
            if(n !== m){
                collideCharacter(characters[n], characters[m]);
            }
        }
    }
}

function restorePosition(characters){
    for(var n = 0,l = characters.length; n < l; ++n){
        var c = characters[n];
        c._deltaX = c._realX - c._beforeX || 0;
        c._deltaY = c._realY - c._beforeY || 0;

        c._realX = c._beforeX;
        c._realY = c._beforeY;
    }
}

function stepPosition(characters, step){
    for(var n = 0,l = characters.length; n < l; ++n) {
        var c = characters[n];
        c._realX += c._deltaX * step;
        c._realY += c._deltaY * step;
    }
}

function hitMapEvents(gameMap){
    var characters = gameMap.events().filter(function (e){ return e.isNormalPriority(); });
    characters.push($gamePlayer);

    restorePosition(characters);

    var STEP = 5;
    for(var n = 0; n < STEP; ++n){
        stepPosition(characters, 1/STEP);
        collideEach(characters);
    }
    characters.every(function (e){ return hitMap(e); });
}

function restorePositionIfHit(target, gameMap){
    gameMap.events().filter(function (e){ return e.isNormalPriority(); }).forEach(function (e){
        var dx = target._realX - e._realX;
        var dy = target._realY - e._realY;
        var l2 = dx*dx+dy*dy;

        if(l2 < (R*2)*(R*2)){
            var l = Math.sqrt(dx*dx+dy*dy);
            var ex = e._realX;
            var ey = e._realY;

            target._realX = ex + dx / l * R*2;
            target._realY = ey + dy / l * R*2;
        }
    });
}

wrapPrototype(Game_Temp, 'destinationX', function (old){ return function(){
    return Math.round(old.call(this));
}; });

wrapPrototype(Game_Temp, 'destinationY', function (old){ return function(){
    return Math.round(old.call(this));
}; });


wrapPrototype(Game_CharacterBase, 'update', function (old){ return function(){
    this._moving = this._beforeX !== this._realX || this._beforeY !== this._realY;

    this._beforeX = this._realX;
    this._beforeY = this._realY;
    old.call(this);
    this.refreshBushDepth();
}; });

wrapPrototype(Game_CharacterBase, 'updateMove', function (old){ return function(){
    if(this._targetMode){
        var dx = this._x - this._realX;
        var dy = this._y - this._realY;
        var l = Math.sqrt(dx*dx+dy*dy);
        var d = this.distancePerFrame();

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
}; });

wrapPrototype(Game_CharacterBase, 'updateMove', function (old){ return function(){
    if(this._targetMode){
        var dx = this._x - this._realX;
        var dy = this._y - this._realY;
        var l = Math.sqrt(dx*dx+dy*dy);
        var d = this.distancePerFrame();

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
}; });

wrapPrototype(Game_CharacterBase, 'isMoving', function (old){ return function(){
    return this._moving;
}; });

wrapPrototype(Game_CharacterBase, 'refreshBushDepth', function (old){ return function(){
    if (this.isNormalPriority() && !this.isObjectCharacter() &&
        this.isOnBush() && !this.isJumping()) {
        this._bushDepth = 12;
    } else {
        this._bushDepth = 0;
    }
}; });

wrapPrototype(Game_CharacterBase, 'moveStraight', function (old){ return function(d){
    old.call(this, d);
    if(this.isMovementSucceeded()){
        this._targetMode = true;
        this._moving = true;
    }
}; });

wrapPrototype(Game_Event, 'start', function (old){ return function(){
   old.call(this);
    if(this._starting){
        this._x = real2grid(this._realX);
        this._y = real2grid(this._realY);
        this._targetMode = false;
    }
}; });

function analogMapX(map, x) {
    var tileWidth = map.tileWidth();
    var originX = map._displayX * tileWidth;
    return (originX + x) / tileWidth;
}

function analogMapY(map, y) {
    var tileHeight = map.tileHeight();
    var originY = map._displayY * tileHeight;
    return (originY + y) / tileHeight;
}


wrapPrototype(Sprite_Destination, 'updatePosition', function (old){ return function(){
    var tileWidth = $gameMap.tileWidth();
    var tileHeight = $gameMap.tileHeight();
    var x = $gameTemp._destinationX;
    var y = $gameTemp._destinationY;
    this.x = $gameMap.adjustX(x) * tileWidth;
    this.y = $gameMap.adjustY(y) * tileHeight;

}; });

wrapPrototype(Scene_Map, 'processMapTouch', function (old){ return function(){
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
}; });


wrapPrototype(Scene_Map, 'update', function (old){ return function(){
    old.call(this);
    hitMapEvents($gameMap);
}; });

wrapPrototype(Game_Map, 'displayX', function (old){ return function(){
    return Math.round(this._displayX*this.tileWidth())/this.tileWidth();
}; });

wrapPrototype(Game_Map, 'displayY', function (old){ return function(){
    return Math.round(this._displayY*this.tileHeight())/this.tileHeight();
}; });

wrapPrototype(Game_Player, 'update', function (old){ return function(active){
    old.call(this, active);
    this.triggerAction();

}; });

wrapPrototype(Game_Player, 'moveByInput', function (old){ return function(){
    if (this.canMove()) {
        var x = this._realX, y = this._realY;

        var direction = Input.dir8;
        if (direction > 0) {
            var xy = toXy(direction);
            x += xy.x;
            y += xy.y;
            $gameTemp.clearDestination();
        } else if ($gameTemp.isDestinationValid()){
            x = $gameTemp._destinationX - 0.5;
            y = $gameTemp._destinationY - 0.5;
        }

        var dx = x - this._realX;
        var dy = y - this._realY;
        var l = Math.sqrt(dx*dx+dy*dy);
        var s = this.distancePerFrame();
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
}; });

wrapPrototype(Game_Follower, 'chaseCharacter', function (old){ return function(character){
    var dx = character._realX - this._realX;
    var dy = character._realY - this._realY;
    var l = Math.sqrt(dx*dx+dy*dy);
    var s = Math.min(l-1,this.distancePerFrame());
    if(l > 1){
        this._realX += dx / l * s;
        this._realY += dy / l * s;
        this.setDirection(getDirection4(this));
        this.resetStopCount();
    }

    this.setMoveSpeed($gamePlayer.realMoveSpeed());
}; });

function isActionRange(c1, c2){
    var dx = c1._realX - c2._realX;
    var dy = c1._realY - c2._realY;
    var l2 = dx*dx+dy*dy;
    return l2 < 1.1*1.1;
}

wrapPrototype(Game_Player, 'startMapEvent', function (old){ return function(tx, ty, triggers, normal){
    var this$1 = this;

    if (!$gameMap.isEventRunning()) {
        $gameMap.events().filter(function (e){
            for(var x = -1; x <= 1; ++x){
                for(var y = -1; y <= 1; ++y){
                    if(e.pos(tx+x,ty+y)) { return true; }
                }
            }
            return false;
        }).forEach(function (event){
            if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal && isActionRange(this$1, event)) {
                event.start();
            }
        });
    }
}; });


wrapPrototype(Game_Player, 'updateDashing', function (old){ return function(){
    if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled()) {
        this._dashing = this.isDashButtonPressed();
    } else {
        this._dashing = false;
    }
}; });

wrapPrototype(Game_Player, 'triggerAction', function (old){ return function(){
    if (this.triggerButtonAction()) {
        return true;
    }
    if (this.triggerTouchAction()) {
        return true;
    }
    return false;

}; });

// Licensed under MIT

}());
