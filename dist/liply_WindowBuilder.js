(function () {
'use strict';

/*:
 *
 * @help
 * hoge
 *
 *
 */

function contains(str, value){
    return str.indexOf(value) !== -1;
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
        }
    });

}

var BaseWindow = (function (Window_Base) {
    function BaseWindow(data){
        var this$1 = this;

        Window_Base.call(this);

        this._widgets = {};
        this._renderingOrder = [];

        if(data){
            delete data.type;

            Object.keys(data).forEach(function (key){
                switch(key){
                    case 'widgets':
                        this$1._renderingOrder = data.widgets.map(function (widget){
                            if(widget.bitmapName){
                                widget.bitmap = ImageManager.loadPicture(widget.bitmapName);
                            }
                            return widget;
                        });
                        this$1._renderingOrder
                            .forEach(function (widget){ return (this$1._widgets[widget.id] = widget); });
                        break;

                    default:
                        this$1[key] = data[key];
                }
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

        data.widgets = this._renderingOrder
            .map(function (widget){
                delete widget.bitmap;
                return widget;
            });

        return data;
    };

    BaseWindow.prototype.animateWidget = function animateWidget (id, fields){
        var widget = this._widgets[id];
        if(widget){
            if(!widget.animator){
                widget.animator = new Animator(widget, true);
            }
            widget.animator.animate(fields);
        }
    };

    BaseWindow.prototype.finishAnimation = function finishAnimation (){
        if(this._animator){ this._animator.finish(); }
    };

    BaseWindow.prototype.addWidget = function addWidget (widget){
        var id = widget.id;
        this._renderingOrder.push(widget);
        this._widgets[id] = widget;
        this.markDirty();
    };

    BaseWindow.prototype.findWidget = function findWidget (id){
        return this._widgets[id];
    };

    BaseWindow.prototype.removeWidget = function removeWidget (id){
        var widget = this._widgets[id];

        this._renderingOrder.splice(this._renderingOrder.indexOf(widget), 1);
        delete this._widgets[id];

        this.markDirty();
    };

    BaseWindow.prototype.markDirty = function markDirty (){
        this._dirty = true;
    };

    BaseWindow.prototype._isWidgetChanged = function _isWidgetChanged (){
        return this._renderingOrder.some(function (widget){ return widget.dirty; });
    };

    BaseWindow.prototype._clearWidgetsDirtyFlag = function _clearWidgetsDirtyFlag (){
        this._renderingOrder.forEach(function (widget){ return (widget.dirty = false); });
    };

    BaseWindow.prototype.update = function update (){
        Window_Base.prototype.update.call(this);

        if(this._animator) { this._animator.update(); }
        if(ImageManager.isReady() && (this._dirty || this._isWidgetChanged())){
            this.refresh();
        }
    };

    BaseWindow.prototype.refresh = function refresh (){
        var this$1 = this;

        this._dirty = false;
        this._clearWidgetsDirtyFlag();

        if(this.contents.width !== this.width || this.contents.height !== this.height){
            this.contents = new Bitmap(this.width, this.height);
        }
        this.contents.clear();
        this._renderingOrder.forEach(function (widget){ return this$1['draw'+widget.type](widget); });
    };

    BaseWindow.prototype.drawLabel = function drawLabel (label){
        this.drawTextEx(label.text, label.x, label.y);
    };

    BaseWindow.prototype.drawPicture = function drawPicture (picture){
        this.contents.blt(picture.bitmap,
            0, 0,
            picture.bitmap.width,
            picture.bitmap.height,
            picture.x, picture.y,
            picture.bitmap.width * (picture.scaleX || 1),
            picture.bitmap.height * (picture.scaleY || 1)
        );
    };

    return BaseWindow;
}(Window_Base));

defineHelperProperties(BaseWindow);

var BaseSprite = (function (Sprite) {
    function BaseSprite(data){
        var this$1 = this;

        Sprite.call(this);
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

    return BaseSprite;
}(Sprite));

defineHelperProperties(BaseSprite);

var LabelSprite = (function (BaseSprite$$1) {
    function LabelSprite(data){
        BaseSprite$$1.call(this, data);

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

var WindowBuilder = function WindowBuilder() {
    this._stage = new BaseSprite();
    this._order = [];
    this._sprites = {stage: this._stage};
};

WindowBuilder.prototype.getStage = function getStage (){
    return this._stage;
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
                var p = this$1._parseParams(window, params);
                window.animate(p);
                break;
            }

            if(window.findWidget && window.findWidget(id)){
                var p$1 = this$1._parseParams(window, params);
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
        window = new BaseWindow();
    }

    var p = this._parseParams(window, params);
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

    var p = this._parseParams(null, params);
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
        this._upsertSprite(id, parent, params, function (){ return new LabelSprite(); }, function (label){
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
        this._upsertSprite(id, parent, params, function (){ return new BaseSprite(); }, function (sprite){
            if(name) { sprite.bitmap = ImageManager.loadPicture(name); }
            sprite.bitmapName = name;
        });
    }
};

WindowBuilder.prototype._upsertWidget = function _upsertWidget (id, parent, params, modifier){
    var parentWindow = this._sprites[parent];
    if(parentWindow.findWidget(id)){
        var widget = parentWindow.findWidget(id);
        var newWidget = this._parseParams(parentWindow, params);
        Object.keys(newWidget)
            .forEach(function (key){ return widget[key] = newWidget[key]; });
        widget.dirty = true;
        modifier(widget);
    }else{
        var widget$1 = this._parseParams(parentWindow, params);
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

WindowBuilder.prototype._parseParams = function _parseParams (window, params){
        var this$1 = this;

    var result = {};

    for(var n = 0; n < params.length; n+=2){
        var type = params[n];
        result[type] = this$1._convertUnit(window, params[n + 1]);
    }

    return result;
};

WindowBuilder.prototype._convertUnit = function _convertUnit (window, value){
    if(contains(value, 'line')){
        return +value.slice(0, -4) * window.lineHeight();
    }
    if(contains(value, 'fit')){
        return window.fittingHeight(+value.slice(0, -3));
    }

    return +value;
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
                parentId: this$1._sprites[key]._liply_parentId})
        }
    }).filter(function (data){ return data; });

    return data;
};

WindowBuilder.prototype.load = function load (data){
        var this$1 = this;

    this.clear();

    data.sprites.forEach(function (data){
        var id = data.id;
        var parentId = data.parentId;
        switch(data.type){
            case 'BaseWindow':
                this$1._sprites[id] = new BaseWindow(data);
                break;

            case 'BaseSprite':
                this$1._sprites[id] = new BaseSprite(data);
                break;

            case 'LabelSprite':
                this$1._sprites[id] = new LabelSprite(data);
                break;
        }
        this$1._sprites[id]._liply_id = id;
        this$1._sprites[id]._liply_parentId = parentId;
        this$1._order.push(id);
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
    }
});


wrapPrototype(Scene_Map, 'create', function (old){ return function(){
    this._liply_windowBuilder = new WindowBuilder();

    if($gameSystem._liply_windowBuilder){
        this._liply_windowBuilder.load($gameSystem._liply_windowBuilder);
    }

    old.call(this);
}; });

wrapPrototype(Scene_Map, 'terminate', function (old){ return function(){
    $gameSystem._liply_windowBuilder = this._liply_windowBuilder.save();
    old.call(this);
}; });

wrapPrototype(Scene_Map, 'update', function (old){ return function(){
    this._liply_windowBuilder.update();
    old.call(this);
}; });

wrapPrototype(Scene_Map, 'createDisplayObjects', function (old){ return function(){
    old.call(this);
    this.addChild(this._liply_windowBuilder.getStage());
}; });

//
// wrapStatic(DataManager, 'saveGame', old=>function(){
//     let currentBuilder = getCurrentBuilder();
//     if(currentBuilder){
//         $gameSystem._liply_windowBuilder = currentBuilder.save();
//     }
//
//     let result = old.apply(this, arguments);
//
//     $gameSystem._liply_windowBuilder = null;
//
//     return result;
// });

}());
