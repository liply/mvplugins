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

// inspired by react-motion
// https://github.com/chenglou/react-motion

var defaultStiffness = 170;
var defaultDamping = 26;
var defaultEps = 0.01;

var AnimatedValue = function AnimatedValue(x, k, b, eps, setDirty){
    this._v = 0;
    this._x = x;
    this._k = k;
    this._b = b;
    this._destX = x;
    this._eps = eps;
    this._setDirty = setDirty;
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
        if(this._target[this._field] === destX && this._setDirty){
            this._target.dirty = false;
        }
        this._target[this._field] = this._x = destX;
        this._v = 0;

        if(this._setDirty) { this._target.dirty = true; }
    }else{
        this._target[this._field] = this._x = newX;
        this._v = newV;

        if(this._setDirty) { this._target.dirty = true; }
    }
};

var Animator = function Animator(target, setDirty){
    this._target = target;
    this._animatedValues = {};
    this._setDirty = setDirty;
};

Animator.prototype.animate = function animate (to){
        var this$1 = this;

    Object.keys(to).forEach(function (key){
        if(!this$1._animatedValues[key]){
            this$1._animatedValues[key] =
                new AnimatedValue(this$1._target[key], defaultStiffness, defaultDamping, defaultEps, this$1._setDirty);
        }
        this$1._animatedValues[key].targetField(this$1._target, key);
        this$1._animatedValues[key].set(to[key]);
    });
};

Animator.prototype.update = function update (){
        var this$1 = this;

    Object.keys(this._animatedValues).forEach(function (key){ return (this$1._animatedValues[key].update()); });
};

Animator.prototype.finish = function finish (){
        var this$1 = this;

    Object.keys(this._animatedValues).forEach(function (key){ return (this$1._animatedValues[key].finish()); });
    this._animatedValues = {};
};

var WidgetManager = function WidgetManager(target, type, widgets){
    var this$1 = this;

    this._widgets = {};
    this._renderingOrder = [];

    this._target = target;
    this._isWindow = type === 'Window';

    if(widgets){
        this._renderingOrder = widgets.map(function (widget){
            if(widget.bitmapName){
                widget.bitmap = ImageManager.loadPicture(widget.bitmapName);
            }
            return widget;
        });
        this._renderingOrder
            .forEach(function (widget){ return (this$1._widgets[widget.id] = widget); });

        this.markDirty();
    }
};

WidgetManager.prototype.save = function save (){
    return this._renderingOrder
        .map(function (widget){
            delete widget.bitmap;
            delete widget.animator;

            return widget;
        });
};

WidgetManager.prototype.animate = function animate (id, fields){
    var widget = this._widgets[id];
    if(widget){
        if(!widget.animator){
            widget.animator = new Animator(widget, true);
        }
        widget.animator.animate(fields);
    }
};

WidgetManager.prototype.finishAnimation = function finishAnimation (){
    this._renderingOrder.forEach(function (widget){ return (widget.animator && widget.animator.finish()); });
};

WidgetManager.prototype.add = function add (widget){
    var id = widget.id;
    this._renderingOrder.push(widget);
    this._widgets[id] = widget;
    this.markDirty();
};

WidgetManager.prototype.find = function find (id){
    return this._widgets[id];
};

WidgetManager.prototype.remove = function remove (id){
    var widget = this._widgets[id];

    this._renderingOrder.splice(this._renderingOrder.indexOf(widget), 1);
    delete this._widgets[id];

    this.markDirty();
};

WidgetManager.prototype.markDirty = function markDirty (){
    this._dirty = true;
};

WidgetManager.prototype._isWidgetChanged = function _isWidgetChanged (){
    return this._renderingOrder.some(function (widget){ return widget.dirty; });
};

WidgetManager.prototype._clearWidgetsDirtyFlag = function _clearWidgetsDirtyFlag (){
    this._renderingOrder.forEach(function (widget){ return (widget.dirty = false); });
};

WidgetManager.prototype.update = function update (){
    if(this._animator) { this._animator.update(); }
    if(ImageManager.isReady() && this.isDirty()){
        this.refresh();
    }
};

WidgetManager.prototype.refresh = function refresh (){
        var this$1 = this;

    this._dirty = false;
    this._clearWidgetsDirtyFlag();

    var prefix;
    if(this._isWindow){
        this._target.contents.clear();
        prefix = '_drawWindow';
    }

    this._renderingOrder.forEach(function (widget){ return this$1[prefix+widget.type](widget); });
};

WidgetManager.prototype._drawWindowLabel = function _drawWindowLabel (label){
    this._target.drawTextEx(label.text, label.x, label.y);
};

WidgetManager.prototype._drawWindowPicture = function _drawWindowPicture (picture){
    this._target.contents.blt(picture.bitmap,
        0, 0,
        picture.bitmap.width,
        picture.bitmap.height,
        picture.x, picture.y,
        picture.bitmap.width * (picture.scaleX || 1),
        picture.bitmap.height * (picture.scaleY || 1)
    );
};

WidgetManager.prototype.isDirty = function isDirty (){
    return this._dirty || this._isWidgetChanged();
};

WidgetManager.prototype.getIdUnder = function getIdUnder (p){
        var this$1 = this;

    var id;
    var prefix = '_containsPointWindow';

    this._renderingOrder.forEach(function (widget){
        id = this$1[prefix+widget.type](widget, p);
    });

    return id;
};

WidgetManager.prototype._containsPointWindowPicture = function _containsPointWindowPicture (widget, p){
    var width = widget.bitmap.width;
    var height = widget.bitmap.height;

    return this._containsPointWindowWidgetBasic(widget.x, widget.y, width, height, p) && widget.id;
};

WidgetManager.prototype._containsPointWindowLabel = function _containsPointWindowLabel (widget, p){
    var width = this._target.textWidth(widget.text);
    var height = this._target.lineHeight();

    return this._containsPointWindowWidgetBasic(widget.x, widget.y, width, height, p) && widget.id;
};

WidgetManager.prototype._containsPointWindowWidgetBasic = function _containsPointWindowWidgetBasic (x, y, w, h, p){
    var gx = this._target._windowContentsSprite.worldTransform.tx + x;
    var gy = this._target._windowContentsSprite.worldTransform.ty + y;

    return gx <= p.x && p.x <= gx+w &&
        gy <= p.y && p.y <= gy+h;
};

function saveBasic(sprite){
    var data = {};
    ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'bitmapName', 'width', 'height'].forEach(function (key){
        data[key] = sprite[key];
    });

    return data;
}

function defineHelperProperties(klass){
    Object.defineProperties(klass.prototype, {
        scaleX: {
            get: function get(){
                return this.scale.x;
            },
            set: function set(value){
                this.scale.x = value;
            }
        },
        scaleY: {
            get: function get(){
                return this.scale.y;
            },
            set: function set(value){
                this.scale.y = value;
            }
        },

        anchorX: {
            get: function get(){
                return this.anchor.x;
            },
            set: function set(value){
                this.anchor.x = value;
            }
        },
        anchorY: {
            get: function get(){
                return this.anchor.y;
            },
            set: function set(value){
                this.anchor.y = value;
            }
        }
    });

}

var BaseWindow = (function (Window_Base) {
    function BaseWindow(id, data){
        var this$1 = this;

        Window_Base.call(this);

        this._widgets = new WidgetManager(this, 'Window', data && data.widgets);
        this._renderingOrder = [];
        this._id = id;

        if(data){
            delete data.type;
            delete data.widgets;

            Object.keys(data).forEach(function (key){
                this$1[key] = data[key];
            });

            this.markDirty();
        }
    }

    if ( Window_Base ) BaseWindow.__proto__ = Window_Base;
    BaseWindow.prototype = Object.create( Window_Base && Window_Base.prototype );
    BaseWindow.prototype.constructor = BaseWindow;

    BaseWindow.prototype.animate = function animate (fields){
        if(!this._animator){
            this._animator = new Animator(this);
        }
        this._animator.animate(fields);
    };

    BaseWindow.prototype.save = function save (){
        var data = saveBasic(this);
        data.type = 'BaseWindow';
        data.widgets = this._widgets.save();

        return data;
    };

    BaseWindow.prototype.animateWidget = function animateWidget (id, fields){
        this._widgets.animate(id, fields);
    };

    BaseWindow.prototype.finishAnimation = function finishAnimation (){
        if(this._animator){ this._animator.finish(); }
        this._widgets.finishAnimation();
    };

    BaseWindow.prototype.addWidget = function addWidget (widget){
        this._widgets.add(widget);
        this.markDirty();
    };

    BaseWindow.prototype.findWidget = function findWidget (id){
        return this._widgets.find(id);
    };

    BaseWindow.prototype.removeWidget = function removeWidget (id){
        this._widgets.remove(id);
    };

    BaseWindow.prototype.markDirty = function markDirty (){
        this._dirty = true;
    };

    BaseWindow.prototype.update = function update (){
        Window_Base.prototype.update.call(this);

        if(this._animator) { this._animator.update(); }
        if(ImageManager.isReady() && (this._dirty || this._widgets.isDirty())){
            this.refresh();
        }
    };

    BaseWindow.prototype.refresh = function refresh (){
        this._dirty = false;

        if(this.contents.width !== this.width || this.contents.height !== this.height){
            this.contents = new Bitmap(this.width, this.height);
        }
        this._widgets.refresh();
    };

    BaseWindow.prototype.containsPoint = function containsPoint (p){
        var gx = this.worldTransform.tx;
        var gy = this.worldTransform.ty;
        var w = this.width;
        var h = this.height;

        return gx <= p.x && p.x <= gx+w &&
                gy <= p.y && p.y <= gy+h;
    };

    BaseWindow.prototype.getIdUnder = function getIdUnder (p){
        if(this.containsPoint(p)){
            return this._widgets.getIdUnder(p) || this._id;
        }
    };

    return BaseWindow;
}(Window_Base));

defineHelperProperties(BaseWindow);

var BaseSprite = (function (Sprite) {
    function BaseSprite(id, data){
        var this$1 = this;

        Sprite.call(this);
        this._id = id;

        if(data){
            Object.keys(data).forEach(function (key){ return this$1[key] = data[key]; });

            if(data.bitmapName){
                this.bitmap = ImageManager.loadPicture(data.bitmapName);
            }
        }
    }

    if ( Sprite ) BaseSprite.__proto__ = Sprite;
    BaseSprite.prototype = Object.create( Sprite && Sprite.prototype );
    BaseSprite.prototype.constructor = BaseSprite;

    BaseSprite.prototype.animate = function animate (fields){
        if(!this._animator){
            this._animator = new Animator(this);
        }
        this._animator.animate(fields);
    };

    BaseSprite.prototype.save = function save (){
        var data = saveBasic(this);
        data.type = 'BaseSprite';

        return data;
    };

    BaseSprite.prototype.finishAnimation = function finishAnimation (){
        if(this._animator){ this._animator.finish(); }
    };

    BaseSprite.prototype.update = function update (){
        if(this._animator){ this._animator.update(); }

        Sprite.prototype.update.call(this);
    };

    BaseSprite.prototype.getIdUnder = function getIdUnder (point){
        return this.containsPoint(point) && this._id;
    };

    return BaseSprite;
}(Sprite));

defineHelperProperties(BaseSprite);

var LabelSprite = (function (BaseSprite$$1) {
    function LabelSprite(id, data){
        BaseSprite$$1.call(this, id, data);

        if(data && data.text){
            this.setText(data.text);
        }
    }

    if ( BaseSprite$$1 ) LabelSprite.__proto__ = BaseSprite$$1;
    LabelSprite.prototype = Object.create( BaseSprite$$1 && BaseSprite$$1.prototype );
    LabelSprite.prototype.constructor = LabelSprite;

    LabelSprite.prototype.setText = function setText (text) {
        this._text = text;

        var content = new Bitmap(this.width, this.height);
        content.drawText(text, 0, 0, this.width, this.height, this.align);
        this.bitmap = content;
    };

    LabelSprite.prototype.save = function save (){
        var data = BaseSprite$$1.prototype.save.call(this);
        data.text = this._text;
        data.type = 'LabelSprite';

        return data;
    };

    return LabelSprite;
}(BaseSprite));

var PLUGIN_NAME = 'liply_WindowBuilder';
var parameters = PluginManager.parameters(PLUGIN_NAME);

var parameters$1 = {
    PLUGIN_NAME: PLUGIN_NAME,
    column: +parameters['Grid Column'],
    row: +parameters['Grid Row']
};

var WindowBuilder = function WindowBuilder() {
    this._stage = new BaseSprite();
    this._order = [];
    this._sprites = {stage: this._stage};
    this._handlers = {trigger: {}};
};

WindowBuilder.prototype.getStage = function getStage (){
    return this._stage;
};

WindowBuilder.prototype.setOnTriggerHandler = function setOnTriggerHandler (id, commonId){
    this._handlers.trigger[id] = commonId;
};

WindowBuilder.prototype.removeOnTriggerHandler = function removeOnTriggerHandler (id){
    delete this._handlers.trigger[id];
};

WindowBuilder.prototype.getIdUnder = function getIdUnder (x, y){
        var this$1 = this;

    var point = new PIXI.Point(x, y);
    var id;

    this._order.forEach(function (key){
        id = this$1._sprites[key].getIdUnder(point) || id;
    });

    return id;
};

WindowBuilder.prototype.getOnTriggerHandler = function getOnTriggerHandler (x, y){
    return this._handlers.trigger[this.getIdUnder(x, y)];
};

WindowBuilder.prototype.clear = function clear (){
    this.close('stage');
};

WindowBuilder.prototype.close = function close (id){
        var this$1 = this;

    if(id === 'stage'){
        var children = this._stage.children.slice(0);
        children.forEach(function (child){ return this$1._stage.removeChild(child); });
        this._sprites = {stage: this._stage};
    }else{
        var sprite = this._sprites[id];
        if(sprite instanceof BaseWindow){
            sprite.close();
        }else{
            sprite.parent.removeChild(sprite);
            delete this._sprites[id];
        }

        this._order.splice(this._order.indexOf(id), 1);
    }
};

WindowBuilder.prototype.find = function find (id){
        var this$1 = this;

    for(var key in this$1._sprites){
        if(this$1._sprites.hasOwnProperty(key)){
            var window = this$1._sprites[key];
            if(key === id) { return window; }

            var widget = window.findWidget(id);
            if(widget) { return widget; }
        }
    }
};

WindowBuilder.prototype.update = function update (){
        var this$1 = this;

    var toRemove = Object.keys(this._sprites)
        .filter(function (key){
            var sprite = this$1._sprites[key];
            if(sprite.isClosed && sprite.isClosed()) { return true; }
        });

    toRemove.forEach(function (key){ return (delete this$1._sprites[key]); });
};

WindowBuilder.prototype.refresh = function refresh (){
        var this$1 = this;

    Object.keys(this._sprites)
        .forEach(function (key){ return this$1._sprites[key].refresh(); });
};

WindowBuilder.prototype._pushOrder = function _pushOrder (id){
    if(this._order.indexOf(id) === -1){ this._order.push(id); }
};

WindowBuilder.prototype.animate = function animate (id, params){
        var this$1 = this;

    for(var key in this$1._sprites){
        if(this$1._sprites.hasOwnProperty(key)){
            var window = this$1._sprites[key];
            if(key === id){
                var p = this$1._parseParams(params);
                window.animate(p);
                break;
            }

            if(window.findWidget && window.findWidget(id)){
                var p$1 = this$1._parseParams(params);
                window.animateWidget(p$1);
                break;
            }
        }
    }
};

WindowBuilder.prototype.window = function window (id, parent, params){
    var window;
    if(this._sprites[id]){
        window = this._sprites[id];
        window.finishAnimation();
    }else{
        window = new BaseWindow(id);
    }

    var p = this._parseParams(params);
    this._applyBasicParams(window, p);
    window.setBackgroundType(p.background || 0);
    window._liply_id = id;
    window._liply_parentId = parent;

    this._sprites[id] = window;
    if(window.parent !== this._sprites[parent])
        { this._sprites[parent].addChild(window); }
    this._pushOrder(id);
};

WindowBuilder.prototype._upsertSprite = function _upsertSprite (id, parent, params, factory, modifier){
    var sprite;
    if(this._sprites[id]){
        sprite = this._sprites[id];
        sprite.finishAnimation();
    }else{
        sprite = factory();
    }

    var p = this._parseParams(params);
    this._applyBasicParams(sprite, p);

    sprite._liply_id = id;
    sprite._liply_parentId = parent;

    modifier(sprite);

    this._sprites[id] = sprite;
    if(sprite.parent !== this._sprites[parent])
        { this._sprites[parent].addChild(sprite); }

    this._pushOrder(id);
};

WindowBuilder.prototype.label = function label (id, parent, text, params){
    if(this._isWidget(parent)){
        this._upsertWidget(id, parent, params, function (label){
            label.type = 'Label';
            label.text = text;
        });
    }else{
        this._upsertSprite(id, parent, params, function (){ return new LabelSprite(id); }, function (label){
            label.setText(text);
        });
    }
};

WindowBuilder.prototype._isWidget = function _isWidget (parentId){
    return parentId !== 'stage' && (this._sprites[parentId] instanceof BaseWindow);
};

WindowBuilder.prototype.picture = function picture (id, parent, name, params){
    if(this._isWidget(parent)){
        this._upsertWidget(id, parent, params, function (picture){
            picture.type = 'Picture';
            picture.bitmap = ImageManager.loadPicture(name);
            picture.bitmapName = name;
        });
    }else{
        this._upsertSprite(id, parent, params, function (){ return new BaseSprite(id); }, function (sprite){
            if(name) { sprite.bitmap = ImageManager.loadPicture(name); }
            sprite.bitmapName = name;
        });
    }
};

WindowBuilder.prototype._upsertWidget = function _upsertWidget (id, parent, params, modifier){
    var parentWindow = this._sprites[parent];
    if(parentWindow.findWidget(id)){
        var widget = parentWindow.findWidget(id);
        var newWidget = this._parseParams(params);
        Object.keys(newWidget)
            .forEach(function (key){ return widget[key] = newWidget[key]; });
        widget.dirty = true;
        modifier(widget);
    }else{
        var widget$1 = this._parseParams(params);
        widget$1.id = id;
        modifier(widget$1);

        parentWindow.addWidget(widget$1);
    }
};

WindowBuilder.prototype._applyBasicParams = function _applyBasicParams (w, p){
    w.x = p.x || w.x;
    w.y = p.y || w.y;

    w.width = p.width || w.width;
    w.height = p.height || w.height;

    w.scaleX = p.scaleX || w.scaleX;
    w.scaleY = p.scaleY || w.scaleY;

    if(p.visible !== undefined)
        { w.visible = p.visible; }
};

WindowBuilder.prototype._parseParams = function _parseParams (params){
        var this$1 = this;

    var result = {};

    if(params instanceof Array){
        for(var n = 0; n < params.length; n+=2){
            var type = params[n];
            result[type] = this$1._convertUnit(params[n + 1]);
        }
    }else{
        Object.keys(params).forEach(function (key){
            result[key] = this$1._convertUnit(params[key]);
        });
    }

    return result;
};

WindowBuilder.prototype._extractUnit = function _extractUnit (value){
    var match = /([\d\.]+)([a-zA-Z]+)/.exec(value);
    if(match) { return {value: +match[1], unit: match[2]}; }
    return {value: +value};
};

WindowBuilder.prototype._convertUnit = function _convertUnit (rawValue){
    rawValue = this._resolveReference(rawValue);
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
        default:
            return value;
    }
};

WindowBuilder.prototype._resolveReference = function _resolveReference (value){
    var match;
    var expVariable = /\\V\[(\d)\][a-zA-Z]+/;
    if(match = expVariable.exec(value)){
        return value.replace(expVariable, $gameVariables.value(+match[1]));
    }

    return value;
};

WindowBuilder.prototype.save = function save (){
        var this$1 = this;

    Object.keys(this._sprites).forEach(function (key){
        this$1._sprites[key].finishAnimation();
    });

    var data = {};
    data.sprites = this._order.map(function (key){
        if(key !== 'stage'){
            return Object.assign({}, this$1._sprites[key].save(),
                {id: this$1._sprites[key]._liply_id,
                parentId: this$1._sprites[key]._liply_parentId,
                handlers: this$1._handlers})
        }
    }).filter(function (data){ return data; });

    return data;
};

WindowBuilder.prototype.load = function load (data){
        var this$1 = this;

    this.clear();

    data._handlers = data.handlers;

    data.sprites.forEach(function (data){
        var id = data.id;
        var parentId = data.parentId;
        switch(data.type){
            case 'BaseWindow':
                this$1._sprites[id] = new BaseWindow(id, data);
                break;

            case 'BaseSprite':
                this$1._sprites[id] = new BaseSprite(id, data);
                break;

            case 'LabelSprite':
                this$1._sprites[id] = new LabelSprite(id, data);
                break;
        }
        this$1._sprites[id]._liply_id = id;
        this$1._sprites[id]._liply_parentId = parentId;
        this$1._pushOrder(id);
    });

    Object.keys(this._sprites).forEach(function (key){
        var sprite = this$1._sprites[key];
        if(sprite._liply_parentId){
            this$1._sprites[sprite._liply_parentId].addChild(sprite);
        }
    });
};

function getCurrentBuilder(){
    return SceneManager._scene._liply_windowBuilder;
}

registerPluginCommands({
    window: function window(id, parent){
        var params = [], len = arguments.length - 2;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 2 ];

        getCurrentBuilder().window(id, parent, params);
    },

    label: function label(id, parent, text){
        var params = [], len = arguments.length - 3;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 3 ];

        getCurrentBuilder().label(id, parent, text, params);
    },

    picture: function picture(id, parent, name){
        var params = [], len = arguments.length - 3;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 3 ];

        getCurrentBuilder().picture(id, parent, name, params);
    },

    close: function close(id){
        getCurrentBuilder().close(id);
    },

    container: function container(id, parent){
        var params = [], len = arguments.length - 2;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 2 ];

        getCurrentBuilder().sprite(id, parent, null, params);
    },

    animate: function animate(id){
        var params = [], len = arguments.length - 1;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

        getCurrentBuilder().animate(id, params);
    },

    setTrigger: function setTrigger(id, commonId){
        getCurrentBuilder().setOnTriggerHandler(id, commonId);
    },

    removeTrigger: function removeTrigger(id){
        getCurrentBuilder().removeOnTriggerHandler(id);
    }
});


wrapPrototype(Scene_Map, 'create', function (old){ return function(){
    this._liply_windowBuilder = new WindowBuilder();

    if($gameSystem._liply_windowBuilder){
        this._liply_windowBuilder.load($gameSystem._liply_windowBuilder);
        $gameSystem._liply_windowBuilder = null;
    }

    old.call(this);
}; });

wrapPrototype(Scene_Map, 'terminate', function (old){ return function(){
    $gameSystem._liply_windowBuilder = this._liply_windowBuilder.save();
    old.call(this);
}; });

wrapPrototype(Scene_Map, 'update', function (old){ return function(){
    this._liply_windowBuilder.update();

    if(!$gameMap.isEventRunning() && TouchInput.isTriggered()){
        var commonId = this._liply_windowBuilder.getOnTriggerHandler(TouchInput.x, TouchInput.y);
        if(commonId){
            $gameTemp.reserveCommonEvent(commonId);
        }
    }

    old.call(this);
}; });

wrapPrototype(Scene_Map, 'createDisplayObjects', function (old){ return function(){
    old.call(this);
    this.addChild(this._liply_windowBuilder.getStage());
}; });

}());
