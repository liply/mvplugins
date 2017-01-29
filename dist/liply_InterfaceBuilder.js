(function () {
'use strict';

/*:
 *
 * @help
 * hoge
 *
 * @param Grid Column
 * @default 12
 *
 * @param Grid Row
 * @default 8
 *
 *
 */

function MiniWindow(){
    this.convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
    this.actorName = Window_Base.prototype.actorName;
    this.partyMemberName = Window_Base.prototype.partyMemberName;
}

var miniWindow = new MiniWindow();

function convertEscapeCharacters(text){
    return miniWindow.convertEscapeCharacters(text);
}

function arr2obj(params){
    var result = {};
    for(var n = 0; n < params.length; n+=2){
        result[params[n]] = params[n+1];
    }

    return result;
}

function registerPluginCommands(commands){
    var lowerCaseCommands = {};
    Object.keys(commands).forEach(function (name){
        lowerCaseCommands[name.toLowerCase()] = commands[name];
    });

    var Game_Interpreter_prototype_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(cmd, args){
        var command = lowerCaseCommands[cmd.toLowerCase()];
        if(command){
            command.apply(this, args);
        }

        return Game_Interpreter_prototype_pluginCommand.call(this, cmd, args);
    };
}

function wrapPrototype(klass, method, fn){
    var oldMethod = klass.prototype[method];
    var newMethod = fn(oldMethod);

    klass.prototype[method] = newMethod;
}



function installArrayFind(){
    // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }
}

/*
 object-assign
 (c) Sindre Sorhus
 @license MIT
 */

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
    if (val === null || val === undefined) {
        throw new TypeError('Object.assign cannot be called with null or undefined');
    }

    return Object(val);
}

function shouldUseNative() {
    try {
        if (!Object.assign) {
            return false;
        }

        // Detect buggy property enumeration order in older V8 versions.

        // https://bugs.chromium.org/p/v8/issues/detail?id=4118
        var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
        test1[5] = 'de';
        if (Object.getOwnPropertyNames(test1)[0] === '5') {
            return false;
        }

        // https://bugs.chromium.org/p/v8/issues/detail?id=3056
        var test2 = {};
        for (var i = 0; i < 10; i++) {
            test2['_' + String.fromCharCode(i)] = i;
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
            return test2[n];
        });
        if (order2.join('') !== '0123456789') {
            return false;
        }

        // https://bugs.chromium.org/p/v8/issues/detail?id=3056
        var test3 = {};
        'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
            test3[letter] = letter;
        });
        if (Object.keys(Object.assign({}, test3)).join('') !==
            'abcdefghijklmnopqrst') {
            return false;
        }

        return true;
    } catch (err) {
        // We don't expect any of the above to throw, but better to be safe.
        return false;
    }
}

function installObjectAssign(){
    Object.assign = shouldUseNative() ? Object.assign : function (target, source) {
            var arguments$1 = arguments;

            var from;
            var to = toObject(target);
            var symbols;

            for (var s = 1; s < arguments.length; s++) {
                from = Object(arguments$1[s]);

                for (var key in from) {
                    if (hasOwnProperty.call(from, key)) {
                        to[key] = from[key];
                    }
                }

                if (getOwnPropertySymbols) {
                    symbols = getOwnPropertySymbols(from);
                    for (var i = 0; i < symbols.length; i++) {
                        if (propIsEnumerable.call(from, symbols[i])) {
                            to[symbols[i]] = from[symbols[i]];
                        }
                    }
                }
            }

            return to;
        };
}

function isInsideScreen(sprite){
    var b = sprite.getBounds();
    var gw = Graphics.width;
    var gh = Graphics.height;

    return b.x + b.width >= 0 &&
        b.x <= gw &&
        b.y + b.height >= 0 &&
        b.y <= gh;
}

//      

                                                             
var WindowComponent = (function (Window_Base) {
    function WindowComponent(type            , parent          ){
        Window_Base.call(this);

        this._type = type;
        parent.addChild(this);

        this._assignTypeParameters();
        this._refreshAllParts();
    }

    if ( Window_Base ) WindowComponent.__proto__ = Window_Base;
    WindowComponent.prototype = Object.create( Window_Base && Window_Base.prototype );
    WindowComponent.prototype.constructor = WindowComponent;

    WindowComponent.prototype._assignTypeParameters = function _assignTypeParameters (){
        var this$1 = this;

        Object.keys(this._type).forEach(function (key){ return this$1[key] = this$1._type[key]; });
    };

    WindowComponent.prototype.update = function update (){
        this._assignTypeParameters();

        if(isInsideScreen(this)) { this._activateContent(); }
        else { this._deactivateContent(); }


        if(ImageManager.isReady() && this._needsContentRefresh()){
            this._refreshContent();
        }

        Window_Base.prototype.update.call(this);
    };

    WindowComponent.prototype._needsContentRefresh = function _needsContentRefresh (){
        if(!this.isContentActive()) { return false; }
        return !this.contents || this.contents.width !== this.width || this.contents.height !== this.height;
    };

    WindowComponent.prototype._refreshContent = function _refreshContent (){
        this.contents = new Bitmap(this.width, this.height);
    };

    WindowComponent.prototype.containsPoint = function containsPoint (point                        ){
        var gx = this.worldTransform.tx;
        var gy = this.worldTransform.ty;
        var w = this.width;
        var h = this.height;

        var x = point.x;
        var y = point.y;

        return gx <= x && x <= gx+w && gy <= y && y <= gy+h;
    };

    WindowComponent.prototype._deactivateContent = function _deactivateContent (){
        if(this._contentActive){
            var empty = ImageManager.loadEmptyBitmap();
            this._windowBackSprite.bitmap = empty;
            this._windowFrameSprite.bitmap = empty;
            this._windowCursorSprite.bitmap = empty;
            this.contents = empty;
            this._contentVisible = this.visible;

            this.visible = false;
            this._contentActive = false;
        }
    };

    WindowComponent.prototype.isContentActive = function isContentActive (){
        return this._contentActive;
    };

    WindowComponent.prototype._activateContent = function _activateContent () {
        if (!this._contentActive) {
            this._contentActive = true;

            if(this._contentVisible !== undefined)
                { this.visible = this._contentVisible; }

            this._refreshAllParts();
        }
    };

    return WindowComponent;
}(Window_Base));

//      

                                                             
var SpriteComponent = (function (Sprite) {
    function SpriteComponent(type             , parent           ){
        Sprite.call(this);

        if(type){ this._type = type; }
        this.markDirty();
        if(parent) { parent.addChild(this); }
    }

    if ( Sprite ) SpriteComponent.__proto__ = Sprite;
    SpriteComponent.prototype = Object.create( Sprite && Sprite.prototype );
    SpriteComponent.prototype.constructor = SpriteComponent;

    var prototypeAccessors = { anchorX: {},anchorY: {} };

    prototypeAccessors.anchorX.get = function ()        {
        return this.anchor.x;
    };

    prototypeAccessors.anchorX.set = function (value        ) {
        this.anchor.x = value;
    };

    prototypeAccessors.anchorY.get = function ()        {
        return this.anchor.y;
    };

    prototypeAccessors.anchorY.set = function (value        ) {
        this.anchor.y = value;
    };

    SpriteComponent.prototype.update = function update (){
        var this$1 = this;

        if(this._type) { Object.keys(this._type).forEach(function (key){ return this$1[key] = this$1._type[key]; }); }

        if(isInsideScreen(this)) { this._activateContent(); }
        else { this._deactivateContent(); }

        if(this._isContentActive && this._contentDirty){
            this._refreshContent();
            this._contentDirty = false;
        }

        Sprite.prototype.update.call(this);
    };

    SpriteComponent.prototype._activateContent = function _activateContent (){
        if(!this._isContentActive){
            this._refreshContent();

            this._isContentActive = true;
            this._contentDirty = false;
        }
    };

    SpriteComponent.prototype._deactivateContent = function _deactivateContent (){
        if(this._isContentActive){
            this.bitmap = null;

            this._isContentActive = false;
        }
    };

    SpriteComponent.prototype.markDirty = function markDirty (){
        this._contentDirty = true;
    };

    SpriteComponent.prototype._refreshContent = function _refreshContent (){};

    Object.defineProperties( SpriteComponent.prototype, prototypeAccessors );

    return SpriteComponent;
}(Sprite));

//      

var LabelComponent = (function (SpriteComponent$$1) {
    function LabelComponent () {
        SpriteComponent$$1.apply(this, arguments);
    }

    if ( SpriteComponent$$1 ) LabelComponent.__proto__ = SpriteComponent$$1;
    LabelComponent.prototype = Object.create( SpriteComponent$$1 && SpriteComponent$$1.prototype );
    LabelComponent.prototype.constructor = LabelComponent;

    var prototypeAccessors = { text: {} };

    prototypeAccessors.text.get = function ()        {
        return this._text;
    };
    prototypeAccessors.text.set = function (value        ){
        if(this._text !== value){
            this.markDirty();
            this._text = value;
        }
    };

    LabelComponent.prototype._refreshContent = function _refreshContent (){
        var content = new Bitmap(this.width, this.height);
        content.drawText(this._text, 0, 0, this.width, this.height, this.align);
        this.bitmap = content;
    };

    Object.defineProperties( LabelComponent.prototype, prototypeAccessors );

    return LabelComponent;
}(SpriteComponent));

//      

var PictureComponent = (function (SpriteComponent$$1) {
    function PictureComponent () {
        SpriteComponent$$1.apply(this, arguments);
    }

    if ( SpriteComponent$$1 ) PictureComponent.__proto__ = SpriteComponent$$1;
    PictureComponent.prototype = Object.create( SpriteComponent$$1 && SpriteComponent$$1.prototype );
    PictureComponent.prototype.constructor = PictureComponent;

    var prototypeAccessors = { picture: {} };

    prototypeAccessors.picture.get = function ()        {
        return this._picture;
    };
    prototypeAccessors.picture.set = function (value        ){
        if(this._picture !== value){
            this.markDirty();
            this._picture = value;
        }
    };

    PictureComponent.prototype._refreshContent = function _refreshContent (){
        this.bitmap = ImageManager.loadPicture(this._picture);
    };

    Object.defineProperties( PictureComponent.prototype, prototypeAccessors );

    return PictureComponent;
}(SpriteComponent));

//      
// inspired by react-motion
// https://github.com/chenglou/react-motion

var defaultStiffness = 170;
var defaultDamping = 26;
var defaultEps = 0.01;

var AnimatedValue = function AnimatedValue(x, k, b, eps){
    this._v = 0;
    this._x = x;
    this._k = k;
    this._b = b;
    this._destX = x;
    this._eps = eps;
};

AnimatedValue.prototype.targetField = function targetField (target, field){
    this._target = target;
    this._field = field;
};

AnimatedValue.prototype.set = function set (x){
    this._destX = x;
};

AnimatedValue.prototype.finish = function finish (){
    this._target[this._field] = this._destX;
};

AnimatedValue.prototype.update = function update (){
    var v = this._v;
    var destX = this._destX;
    var x = this._x;
    var k = this._k;
    var b = this._b;
    var eps = this._eps;

    var Fspring = -k * (x - destX);
    var Fdamper = -b * v;

    var a = Fspring + Fdamper;

    var newV = v + a * (1 / 60);
    var newX = x + newV * (1 / 60);

    if(Math.abs(newV) < eps && Math.abs(newX - destX) < eps){
        this._target[this._field] = this._x = destX;
        this._v = 0;

        return true;
    }else{
        this._target[this._field] = this._x = newX;
        this._v = newV;

        return false;
    }
};

var Animator = function Animator(target     ){
    if(target) { this._target = target; }
    this._animatedValues = {};
};

Animator.prototype.animate = function animate (to    ){
        var this$1 = this;

    Object.keys(to).forEach(function (key){
        if(!this$1._animatedValues[key]){
            this$1._animatedValues[key] =
                new AnimatedValue(this$1._target[key], defaultStiffness, defaultDamping, defaultEps);
        }
        this$1._animatedValues[key].targetField(this$1._target, key);
        this$1._animatedValues[key].set(to[key]);
    });
};

Animator.prototype.update = function update (){
        var this$1 = this;

    var stable = true;
    Object.keys(this._animatedValues).forEach(function (key){
        stable = this$1._animatedValues[key].update() && stable;
    });

    return stable;
};

Animator.prototype.finish = function finish (){
        var this$1 = this;

    Object.keys(this._animatedValues).forEach(function (key){ return (this$1._animatedValues[key].finish()); });
    this._animatedValues = {};
};

var PLUGIN_NAME = 'liply_InterfaceBuilder';
var parameters = PluginManager.parameters(PLUGIN_NAME);

var parameters$1 = {
    PLUGIN_NAME: PLUGIN_NAME,
    column: +parameters['Grid Column'],
    row: +parameters['Grid Row']
};

//      

                                          

var IGNORE = ['id', 'picture', 'type', 'text', 'parentId'];

var ComponentManager = function ComponentManager(){
    this._stage = new SpriteComponent();
    this.clear();
};

ComponentManager.prototype.getStage = function getStage (){
    return this._stage;
};

ComponentManager.prototype.add = function add (component       ){
    var id = component.id;
    if(!this.find(id)){
        this._types.push(this._convertNumbers(component));
    }else{
        if(this._animators[id]){
            this._animators[id].finish();
            delete this._animators[id];
        }

        var converted = this._convertNumbers(component);
        var targetType = this._types.find(function (type){ return type.id === id; });
        if(targetType)
            { Object.keys(converted).forEach(function (key){ return targetType[key]=converted[key]; }); }

        if(this._components[id]){
            this._components[id].update();
        }
    }
};

ComponentManager.prototype._convertNumbers = function _convertNumbers (params    ){
        var this$1 = this;

    Object.keys(params).forEach(function (key){
        if(IGNORE.indexOf(key) === -1){
            params[key] = this$1._convertUnit(params[key]);
        }
    });

    return params;
};

ComponentManager.prototype._extractUnit = function _extractUnit (value    ){
    var match = /([\d\.]+)([a-zA-Z%]+)/.exec(value);
    if(match) { return {value: +match[1], unit: match[2]}; }
    return {value: +value, unit: ''};
};

ComponentManager.prototype._convertUnit = function _convertUnit (rawValue    ){
    rawValue = convertEscapeCharacters(rawValue);
    var ref = this._extractUnit(rawValue);
        var value = ref.value;
        var unit = ref.unit;

    switch(unit){
        case 'column':
            return Graphics.width / parameters$1.column * value;
        case 'row':
            return Graphics.height / parameters$1.row * value;
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
};


ComponentManager.prototype.find = function find (id    ){
    return this._types.find(function (c){ return (c.id === id); });
};

ComponentManager.prototype.update = function update (){
        var this$1 = this;

    var toRemove = [];
    Object.keys(this._animators).forEach(function (key){
        if(this$1._animators[key].update()){
            toRemove.push(key);
        }
    });

    toRemove.forEach(function (key){ return delete this$1._animators[key]; });

    this._types.forEach(function (type){
        var component = this$1._components[type.id];
        if(!component){
            component = this$1._createComponent(type, this$1._components[type.parentId]);
            if(component) { this$1._components[type.id] = component; }
        }
    });
};

ComponentManager.prototype._createComponent = function _createComponent (type       , parent            )        {
    switch(type.type){
        case 'Window':
            return new WindowComponent(type, parent);
        case 'Sprite': case 'Container':
            return new SpriteComponent(type, parent);
        case 'Label':
            return new LabelComponent(type, parent);
        case 'Picture':
            return new PictureComponent(type, parent);
    }
};

ComponentManager.prototype.setHandler = function setHandler (id    , type    , name    ){
    if(!this._handlers[type][id]){
        this._handlers[type][id] = name;
    }
};

ComponentManager.prototype.removeHandler = function removeHandler (id    , type    ){
    delete this._handlers[type][id];
};

ComponentManager.prototype.getHandler = function getHandler (type    , x    , y    ){
    var id = this.getIdUnder(x, y);
    if(id){
        return this._handlers[type][id];
    }
    return null;
};

ComponentManager.prototype.getIdUnder = function getIdUnder (x    , y    ){
        var this$1 = this;

    var id;
    var point = {x: x,y: y};

    this._types.forEach(function (type){
        var component = this$1._components[type.id];
        if(component.containsPoint(point)) { id = type.id; }
    });

    return id;
};

ComponentManager.prototype.animate = function animate (id    , fields    ){
    if(!this._animators[id]){
        this._animators[id] = new Animator(this._types.find(function (type){ return (type.id===id); }));
    }
    this._animators[id].animate(this._convertNumbers(fields));
};

ComponentManager.prototype.finishAnimation = function finishAnimation (){
        var this$1 = this;

    Object.keys(this._animators).forEach(function (key){
        this$1._animators[key].finish();
    });
};

ComponentManager.prototype.save = function save (){
    this.finishAnimation();

    return {
        types: this._types,
        handlers: this._handlers
    }
};

ComponentManager.prototype.clear = function clear (){
        var this$1 = this;

    this._stage.children.slice(0).forEach(function (child){ return this$1._stage.removeChild(child); });

    this._types = [];
    this._components = {stage: this._stage};
    this._animators = {};
    this._handlers = { trigger: {}} ;
};

ComponentManager.prototype.load = function load (data    ){
    this.clear();
    this._types = data.types;
    this._handlers = data.handlers;
};

var PersistentField = function PersistentField(prefix){
    this._prefix = prefix;
};

PersistentField.prototype.register = function register (name, defaultValue){
    var key = this._prefix + '_' + name;

    Object.defineProperty(this, name, {
        set: function set(newValue){
            $gameSystem[key] = newValue;
        },
        get: function get(){
            if($gameSystem[key] === undefined){
                $gameSystem[key] = defaultValue;
            }

            return $gameSystem[key];
        }
    });
};

var field = new PersistentField(parameters$1.PLUGIN_NAME);
field.register('uiMode', false);

function getComponentManager(){
    return SceneManager._scene._componentManager;
}

registerPluginCommands({
    window: function window(id, parentId){
        var params = [], len = arguments.length - 2;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 2 ];

        getComponentManager().add(Object.assign({}, {type: 'Window',
            id: id, parentId: parentId},
            arr2obj(params)));
    },

    label: function label(id, parentId, text){
        var params = [], len = arguments.length - 3;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 3 ];

        getComponentManager().add(Object.assign({}, {type: 'Label',
            id: id, parentId: parentId,
            text: text},
            arr2obj(params)));
    },

    picture: function picture(id, parentId, picture$1){
        var params = [], len = arguments.length - 3;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 3 ];

        getComponentManager().add(Object.assign({}, {type: 'Picture',
            id: id, parentId: parentId,
            picture: picture$1},
            arr2obj(params)));
    },

    close: function close(id){
        getComponentManager().close(id);
    },

    container: function container(id, parentId){
        var params = [], len = arguments.length - 2;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 2 ];

        getComponentManager().add(Object.assign({}, {type: 'Container',
            id: id, parentId: parentId},
            arr2obj(params)));
    },

    animate: function animate(id){
        var params = [], len = arguments.length - 1;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

        getComponentManager().animate(id, arr2obj(params));
    },

    uiMode: function uiMode(mode){
        field.uiMode = mode.toLowerCase() === 'on';
    },

    setTrigger: function setTrigger(id, name){
        getComponentManager().setHandler(id, 'trigger', name);
    },

    removeTrigger: function removeTrigger(id){
        getComponentManager().removeHandler(id, 'trigger');
    }
});

function findEventByName(name){
    return $gameMap.events().find(function (ev){ return (ev && (ev.event().name === name)); });
}

function findCommonEventIdByName(name){
    var id;
    $dataCommonEvents.find(function (ev, idx){
        if(ev && (ev.name === name)){
            id = idx;
            return true;
        }
    });

    return id;
}

wrapPrototype(Game_Player, 'update', function (old){ return function(active){
    if(field.uiMode){
        old.call(this, false);
    }else{
        old.call(this, active);
    }
}; });

wrapPrototype(Game_Timer, 'update', function (old){ return function(active){
    if(field.uiMode){
        old.call(this, false);
    }else{
        old.call(this, active);
    }
}; });

wrapPrototype(Game_CharacterBase, 'update', function (old){ return function(){
    if(!field.uiMode){
        old.call(this);
    }
}; });


wrapPrototype(Scene_Map, 'create', function (old){ return function(){
    this._componentManager = new ComponentManager();

    if($gameSystem._componentManager){
        this._componentManager.load($gameSystem._componentManager);
        $gameSystem._componentManager = null;
    }

    old.call(this);
}; });

wrapPrototype(Scene_Map, 'terminate', function (old){ return function(){
    $gameSystem._componentManager = this._componentManager.save();
    old.call(this);
}; });

wrapPrototype(Scene_Map, 'update', function (old){ return function(){
    this._componentManager.update();

    if(!$gameMap.isEventRunning() && TouchInput.isTriggered()){
        var name = this._componentManager.getHandler('trigger', TouchInput.x, TouchInput.y);
        var event = findEventByName(name);
        if(event){
            event.start();
        }else{
            var id = findCommonEventIdByName(name);
            if(id){
                $gameTemp.reserveCommonEvent(id);
            }
        }
    }

    old.call(this);
}; });

wrapPrototype(Scene_Map, 'createDisplayObjects', function (old){ return function(){
    old.call(this);
    this.addChild(this._componentManager.getStage());
}; });

SceneManager.getComponentManager = function(){
    return getComponentManager();
};

installArrayFind();
installObjectAssign();

}());
