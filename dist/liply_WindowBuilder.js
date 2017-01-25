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

var BaseWindow = (function (Window_Base) {
    function BaseWindow(){
        Window_Base.call(this);

        this._widgets = {};
        this._renderingOrder = [];
        this._widgetAnimators = [];
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

    BaseWindow.prototype.addWidget = function addWidget (id, widget){
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

        this.contents.clear();
        this._renderingOrder.forEach(function (widget){ return this$1['draw'+widget.type](widget); });
    };

    BaseWindow.prototype.drawLabel = function drawLabel (label){
        this.drawTextEx(label.text, label.x, label.y);
    };

    BaseWindow.prototype.drawPicture = function drawPicture (picture){
        this.contents.blt(picture.bitmap,
            0, 0,
            picture.bitmap.width, picture.bitmap.height,
            picture.x, picture.y);
    };

    return BaseWindow;
}(Window_Base));

var BaseSprite = (function (Sprite) {
    function BaseSprite () {
        Sprite.apply(this, arguments);
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

    BaseSprite.prototype.finishAnimation = function finishAnimation (){
        if(this._animator){ this._animator.finish(); }
    };

    BaseSprite.prototype.update = function update (){
        if(this._animator){ this._animator.update(); }

        Sprite.prototype.update.call(this);
    };

    return BaseSprite;
}(Sprite));

var WindowBuilder = function WindowBuilder() {
    this._stage = new BaseSprite();
    this._sprites = {stage: this._stage};
};

WindowBuilder.prototype.getStage = function getStage (){
    return this._stage;
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
        window.parent.removeChild(window);
    }else{
        window = new BaseWindow();
    }

    var p = this._parseParams(window, params);
    this._applyBasicParams(window, p);
    window.setBackgroundType(p.background || 0);
    window.contents = new Bitmap(p.width, p.height);

    this._sprites[id] = window;
    this._sprites[parent].addChild(window);
};

WindowBuilder.prototype.sprite = function sprite (id, parent, name, params){
    var sprite;
    if(this._sprites[id]){
        sprite = this._sprites[id];
        sprite.finishAnimation();
        sprite.parent.removeChild(sprite);
    }else{
        sprite = new BaseSprite();
    }

    var p = this._parseParams(null, params);
    this._applyBasicParams(sprite, p);
    sprite.bitmap = ImageManager.loadPicture(name);

    this._sprites[id] = sprite;
    this._sprites[parent].addChild(sprite);
};

WindowBuilder.prototype.label = function label (id, parent, text, params){
    this._upsertWidget(id, parent, params, function (label){
        label.type = 'Label';
        label.text = text;
    });
};

WindowBuilder.prototype.picture = function picture (id, parent, name, params){
    this._upsertWidget(id, parent, params, function (picture){
        picture.type = 'Picture';
        picture.bitmap = ImageManager.loadPicture(name);
    });
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
        modifier(widget$1);

        parentWindow.addWidget(id, widget$1);
    }
};

WindowBuilder.prototype._applyBasicParams = function _applyBasicParams (w, p){
    w.x = p.x || w.x;
    w.y = p.y || w.y;

    w.width = p.width || w.width;
    w.height = p.height || w.height;

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
};

WindowBuilder.prototype.load = function load (){
};

var builder = new WindowBuilder();

registerPluginCommands({
    window: function window(id, parent){
        var params = [], len = arguments.length - 2;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 2 ];

        builder.window(id, parent, params);
    },

    label: function label(id, parent, text){
        var params = [], len = arguments.length - 3;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 3 ];

        builder.label(id, parent, text, params);
    },

    picture: function picture(id, parent, name){
        var params = [], len = arguments.length - 3;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 3 ];

        builder.picture(id, parent, name, params);
    },

    closeWindow: function closeWindow(id){
        builder.close(id);
    },

    animate: function animate(id){
        var params = [], len = arguments.length - 1;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

        builder.animate(id, params);
    }
});


wrapPrototype(Scene_Map, 'terminate', function (old){ return function(){
    old.call(this);
    this.removeChild(builder.getStage());
}; });


wrapPrototype(Scene_Map, 'update', function (old){ return function(){
    builder.update();
    old.call(this);
}; });

wrapPrototype(Scene_Map, 'createDisplayObjects', function (old){ return function(){
    old.call(this);
    this.addChild(builder.getStage());
}; });

}());
