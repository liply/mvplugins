(function () {
'use strict';

/*:
 * @plugindesc 汎用UI作成プラグイン
 * @author liply
 * @help
 * ユーザーインターフェイスをプラグインコマンドで作り出すプラグインです。
 * Licensed under MIT
 *
 * 基本：
 * 最初にstageが作成されます。特に親がいない場合は、stageを指定してください。
 * パラメータ名は以下の指定が可能です。
 * x
 * y
 * scaleX
 * scaleY
 * rotation
 * anchorX
 * anchorY
 * width
 * height
 * opacity
 * background（ウインドウのみ）
 *
 * 単位は以下の指定が可能です。
 * column
 * ゲーム画面の幅をプラグインパラメータcolumnで割ったものです。
 * row
 * ゲーム画面の高さをプラグインパラメータrowで割ったものです。
 * vw
 * ゲーム画面の幅を基準にした値です。１００で１００％です。
 * vh
 * ゲーム画面の高さを基準にした値です。１００で１００％です。
 * bw
 * ボックスの幅を基準にした値です。１００で１００％です。
 * bh
 * ボックスの高さを基準にした値です。１００で１００％です。
 *
 *
 * 以下のプラグインコマンドが導入されます。
 *
 * window ID 親ID パラメータ名 パラメータ値 ...
 * label ID 親ID テキスト パラメータ名 パラメータ値 ...
 * picture ID 親ID ピクチャ名 パラメータ名 パラメータ値 ...
 * container ID 親ID パラメータ名 パラメータ値 ...
 *
 * 各種UIコンポーネントを作成します。
 * window: ツクールのステータス画面等で表示されるウインドウです
 * label: 文字を表示します
 * picture: 画像を表示します
 * container: 他の親になる機能のみをもった、軽量のUIコンポーネントです。
 *
 *
 * draw picture/text ID ピクチャ名/テキスト パラメータ名 パラメータ値 ...
 * windowの内部にピクチャかテキストを描画します。
 *
 * clear ID
 * draw命令をすべて消します。
 *
 * emulate キー名 ID
 * 指定IDのUIコンポーネントを、キー名のボタンにします。
 *
 * removeEmulation キー名
 * ボタン化を解除します。
 *
 * close ID
 * UIコンポーネントを閉じます。
 *
 * animate ID パラメータ名 パラメータ値 ...
 * 指定IDのパラメータを、動かします。
 * ばねで引っ張ったような挙動になります。
 *
 * spring 強さ 固さ
 * animate命令で利用するばねの強さと固さを指定します。
 *
 * springDefault
 * ばねの強さ、固さを初期状態に戻します。
 *
 * uiMode on/off
 * UIモードを切り替えます。UIモードに入ると、マップ操作を受け付けなくなります。
 *
 * setTrigger/LongPress/Press/Release ID イベント名
 * UIコンポーネントに対して各種イベントが起きると、イベント名を含むイベントを起動します。
 * まずマップ内を検索して、無ければコモンイベントを検索します。
 *
 * @param Grid Column
 * @default 12
 *
 * @param Grid Row
 * @default 8
 *
 *
 */

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

function assignParameters(target, params){
    Object.keys(params).forEach(function (key){
        if(target[key] !== params[key]){ target[key] = params[key]; }
    });
}

function fillDefaultParams(type){
    type.x = 0;
    type.y = 0;
    type.scaleX = 100;
    type.scaleY = 100;
    type.rotation = 0;
}

//      

                   
                         

                              
              
              
                   
                    
 

                                                     
                    
                    
 

                                                   
                 
                   
                  
 

                                                              

function renderCommands(target        , commands                          ){
    if(!commands){ return true; }

    var bitmaps = {};
    var notReady = false;
    commands.forEach(function (command){
        switch(command.type){
            case 'picture':
                var bitmap = ImageManager.loadPicture(command.picture);
                notReady = !bitmap.isReady() || notReady;
                bitmaps[command.picture] = bitmap;
        }
    });

    if(notReady){ return false; }

    target.clear();
    commands.forEach(function (command){
        switch(command.type){
            case 'picture':
                var bitmap = bitmaps[command.picture];
                target.blt(
                    bitmap, 0, 0, bitmap.width, bitmap.height,
                    command.x, command.y,
                    command.width || bitmap.width,
                    command.height || bitmap.height
                    );
                break;

            case 'label':
                target.drawText(command.text, command.x, command.y,
                    command.width || target.measureTextWidth(command.text),
                    command.height || target.fontSize,
                    command.align
                );
                break;
        }
    });

    return true;
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

    var prototypeAccessors = { scaleX: {},scaleY: {} };

    prototypeAccessors.scaleX.get = function ()        {
        return this.scale.x * 100;
    };
    prototypeAccessors.scaleX.set = function (value        ) {
        this.scale.x = value / 100;
    };

    prototypeAccessors.scaleY.get = function ()        {
        return this.scale.y * 100;
    };
    prototypeAccessors.scaleY.set = function (value        ) {
        this.scale.y = value / 100;
    };

    WindowComponent.prototype._assignTypeParameters = function _assignTypeParameters (){
        assignParameters(this, this._type);
    };

    WindowComponent.prototype.update = function update (){
        this._assignTypeParameters();

        if(isInsideScreen(this)) { this._activateContent(); }
        else { this._deactivateContent(); }

        if(this._needContentRefresh()){
            this._refreshContent();
        }

        Window_Base.prototype.update.call(this);
    };

    WindowComponent.prototype._needContentRefresh = function _needContentRefresh (){
        if(!this.isContentActive()) { return false; }
        return !this._contentReady || !this.contents || this._needResize();
    };

    WindowComponent.prototype._needResize = function _needResize (){
        return this.contents.width !== this.width || this.contents.height !== this.height;
    };

    WindowComponent.prototype._refreshContent = function _refreshContent (){
        if(this._needResize()){
            this.contents = new Bitmap(this.width, this.height);
            this._contentReady = false;
        }

        if(this.contents && !this._contentReady){
            if(renderCommands(this.contents, this._type.commands)){
                this._contentReady = true;
            }
        }
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

    WindowComponent.prototype.markContentDirty = function markContentDirty (){
        this._contentReady = false;
    };

    WindowComponent.prototype._activateContent = function _activateContent () {
        if (!this._contentActive) {
            this._contentActive = true;

            if(this._contentVisible !== undefined)
                { this.visible = this._contentVisible; }

            this._refreshAllParts();
        }
    };

    Object.defineProperties( WindowComponent.prototype, prototypeAccessors );

    return WindowComponent;
}(Window_Base));

//      

                                                                 
var SpriteComponent = (function (Sprite) {
    function SpriteComponent(type                 , parent           ){
        Sprite.call(this);

        if(type){
            this._type = type;
        }
        this.markContentDirty();
        if(parent) { parent.addChild(this); }
    }

    if ( Sprite ) SpriteComponent.__proto__ = Sprite;
    SpriteComponent.prototype = Object.create( Sprite && Sprite.prototype );
    SpriteComponent.prototype.constructor = SpriteComponent;

    var prototypeAccessors = { anchorX: {},scaleX: {},scaleY: {},anchorY: {} };

    prototypeAccessors.anchorX.get = function ()        {
        return this.anchor.x * 100;
    };
    prototypeAccessors.anchorX.set = function (value        ) {
        this.anchor.x = value / 100;
    };


    prototypeAccessors.scaleX.get = function ()        {
        return this.scale.x * 100;
    };
    prototypeAccessors.scaleX.set = function (value        ) {
        this.scale.x = value / 100;
    };

    prototypeAccessors.scaleY.get = function ()        {
        return this.scale.y * 100;
    };
    prototypeAccessors.scaleY.set = function (value        ) {
        this.scale.y = value / 100;
    };

    prototypeAccessors.anchorY.get = function ()        {
        return this.anchor.y * 100;
    };
    prototypeAccessors.anchorY.set = function (value        ) {
        this.anchor.y = value / 100;
    };

    SpriteComponent.prototype.update = function update (){
        if(this._type) { assignParameters(this, this._type); }

        if(isInsideScreen(this)) { this._activateContent(); }
        else { this._deactivateContent(); }

        if(this._isContentActive && this._contentDirty){
            this._contentDirty = false;
            this._refreshContent();
        }

        Sprite.prototype.update.call(this);
    };

    SpriteComponent.prototype._activateContent = function _activateContent (){
        if(!this._isContentActive){
            this._isContentActive = true;
            this._contentDirty = false;

            this._refreshContent();
        }
    };

    SpriteComponent.prototype._deactivateContent = function _deactivateContent (){
        if(this._isContentActive){
            this.bitmap = null;

            this._isContentActive = false;
        }
    };

    SpriteComponent.prototype.markContentDirty = function markContentDirty (){
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
            this.markContentDirty();
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

    var prototypeAccessors = { frameX: {},frameXP: {},frameY: {},frameYP: {},frameWidth: {},frameWidthP: {},frameHeight: {},frameHeightP: {},picture: {} };

    prototypeAccessors.frameX.get = function ()        {
        return this._frame.x;
    };
    prototypeAccessors.frameX.set = function (value        ){
        this._frameDirty = true;
        this._frame.x = value;
        this._frameXP = null;
    };

    prototypeAccessors.frameXP.get = function ()        {
        if(this.bitmap && this.bitmap.width){
            return this._frame.x / this.bitmap.width * 100;
        }
        return 0;
    };
    prototypeAccessors.frameXP.set = function (value        ){
        this._frameDirty = true;
        this._frameXP = value / 100;
    };

    prototypeAccessors.frameY.get = function ()        {
        return this._frame.y;
    };
    prototypeAccessors.frameY.set = function (value        ){
        this._frameDirty = true;
        this._frame.y = value;
        this._frameYP = null;
    };

    prototypeAccessors.frameYP.get = function ()        {
        if(this.bitmap && this.bitmap.height){
            return this._frame.y / this.bitmap.height * 100;
        }
        return 0;
    };
    prototypeAccessors.frameYP.set = function (value        ){
        this._frameDirty = true;
        this._frameYP = value / 100;
    };

    prototypeAccessors.frameWidth.get = function ()        {
        return this._frame.width;
    };
    prototypeAccessors.frameWidth.set = function (value        ){
        this._frameDirty = true;
        this._frame.width = value;
        this._frameWidthP = null;
    };

    prototypeAccessors.frameWidthP.get = function ()        {
        if(this.bitmap && this.bitmap.width){
            return this._frame.width / this.bitmap.width * 100;
        }
        return 0;
    };
    prototypeAccessors.frameWidthP.set = function (value        ){
        this._frameDirty = true;
        this._frameWidthP = value / 100;
    };

    prototypeAccessors.frameHeight.get = function ()        {
        return this._frame.height;
    };
    prototypeAccessors.frameHeight.set = function (value        ){
        this._frameDirty = true;
        this._frame.height = value;
        this._frameHeightP = null;
    };

    prototypeAccessors.frameHeightP.get = function ()        {
        if(this.bitmap && this.bitmap.height){
            return this._frame.height / this.bitmap.height * 100;
        }
        return 0;
    };
    prototypeAccessors.frameHeightP.set = function (value        ){
        this._frameDirty = true;
        this._frameHeightP = value / 100;
    };

    prototypeAccessors.picture.get = function ()        {
        return this._picture;
    };
    prototypeAccessors.picture.set = function (value        ){
        if(this._picture !== value){
            this.markContentDirty();
            this._picture = value;
        }
    };

    PictureComponent.prototype.update = function update (){
        SpriteComponent$$1.prototype.update.call(this);

        if(this._frameDirty && this.bitmap && this.bitmap.isReady()){
            this._frameDirty = false;

            if(this._frameXP != null){
                this._frame.x = this.bitmap.width * this._frameXP;
            }
            if(this._frameYP != null){
                this._frame.y = this.bitmap.height * this._frameYP;
            }

            if(this._frameWidthP != null){
                this._frame.width = this.bitmap.width * this._frameWidthP;
            }
            if(this._frameHeightP != null){
                this._frame.height = this.bitmap.height * this._frameHeightP;
            }
            this._refresh();
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

AnimatedValue.prototype.set = function set (x, k, b){
    this._destX = x;
    this._k = k;
    this._b = b;
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

var Animator = function Animator(target     , stiffness     , damping     ){
    if(target) { this._target = target; }
    this._animatedValues = {};
    this._stiffness = stiffness || defaultStiffness;
    this._damping = damping || defaultDamping;
};

Animator.prototype.setSpring = function setSpring (stiffness     , damping     ){
    this._stiffness = stiffness || defaultStiffness;
    this._damping = damping || defaultDamping;
};

Animator.prototype.animate = function animate (to    ){
        var this$1 = this;

    Object.keys(to).forEach(function (key){
        if(!this$1._animatedValues[key]){
            this$1._animatedValues[key] =
                new AnimatedValue(this$1._target[key], this$1._stiffness, this$1._damping, defaultEps);
        }
        this$1._animatedValues[key].targetField(this$1._target, key);
        this$1._animatedValues[key].set(to[key], this$1._stiffness, this$1._damping);
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

                                                            

var MiniWindow = (function (Window_Base) {
    function MiniWindow(){
        Window_Base.call(this, 0, 0, 1, 1);
    }

    if ( Window_Base ) MiniWindow.__proto__ = Window_Base;
    MiniWindow.prototype = Object.create( Window_Base && Window_Base.prototype );
    MiniWindow.prototype.constructor = MiniWindow;

    return MiniWindow;
}(Window_Base));

var miniWindow;

function convertEscapeCharacters(text        )        {
    if(!miniWindow){
        miniWindow = new MiniWindow();
    }
    return miniWindow.convertEscapeCharacters(text);
}

var ComponentManager = function ComponentManager(){
    this._stage = new SpriteComponent();
    this.clear();
};

ComponentManager.prototype.getStage = function getStage (){
    return this._stage;
};

ComponentManager.prototype.hasParent = function hasParent (t , id    ){
        var this$1 = this;

    if(t.id === id) { return true; }

    while(t && t.parentId){
        if(t.id === id){ return true; }
        t = this$1._types.find(function (p){ return (p.id === t.parentId); });
    }

    return false;
};

ComponentManager.prototype.close = function close (id    ){
        var this$1 = this;

    if(id === 'stage'){
        this.clear();
    }else{
        var remove = this._types.filter(function (t){ return this$1.hasParent(t,id); });

        remove.forEach(function (type){
            var key = type.id;
            if(this$1._components[key]){
                var c = this$1._components[key];
                c.parent.removeChild(c);

                delete this$1._components[key];
            }
        });

        this._types = this._types.filter(function (t){ return !this$1.hasParent(t,id); });
    }
};

ComponentManager.prototype.add = function add (component ){
    var id = component.id;
    if(!this.find(id)){
        this._types.push(this._convertNumbers(component));
    }else{
        if(this._animators[id]){
            this._animators[id].finish();
            delete this._animators[id];
        }

        var converted = this._convertNumbers(component, true);
        var targetType = this._types.find(function (type){ return type.id === id; });
        if(targetType)
            { Object.keys(converted).forEach(function (key){ return targetType[key]=converted[key]; }); }

        if(this._components[id]){
            this._components[id].update();
        }
    }
};

ComponentManager.prototype.addCommand = function addCommand (commandType    , id    , params    ){
    var type = this.find(id);
    if(type){
        switch(type.type){
            case 'Canvas': case 'Window':
                type.commands = type.commands || [];
                type.commands.push(Object.assign({}, this._convertNumbers(params),
                    {type: commandType}));
                if(this._components[id])
                    { this._components[id].markContentDirty(); }
                break;
        }
    }
};

ComponentManager.prototype.clearCommands = function clearCommands (id    ){
    var type = this.find(id);
    if(type){
        switch(type.type){
            case 'Canvas': case 'Window':
                if(type.commands) { type.commands.splice(0); }
                if(this._components[id]) { this._components[id].markContentDirty(); }
                break;
        }
    }
};

ComponentManager.prototype.setSpringParams = function setSpringParams (stiffness    , damping    ){
    this._stiffness = stiffness;
    this._damping = damping;
};

ComponentManager.prototype.setDefaultSpringParams = function setDefaultSpringParams (){
    this._stiffness = null;
    this._damping = null;
};

ComponentManager.prototype._convertNumbers = function _convertNumbers (params    , removeDefault      ) {
        var this$1 = this;

    var result = {};
    if(!removeDefault) { fillDefaultParams(result); }
    Object.keys(params).forEach(function (key){
        var ref = this$1._convertUnit(params[key]);
            var value = ref.value;
            var unit = ref.unit;
        if(unit === '%'){
            result[key+'P'] = value;
        }else{
            result[key] = value;
        }
    });

    return result;
};

ComponentManager.prototype._extractUnit = function _extractUnit (value    )    {
    var match = /^([\d\.]+)([a-zA-Z%]+)$/.exec(value);
    if(match) { return {value: +match[1], unit: match[2]}; }
    return {value: +value, raw: value, unit: ''};
};

ComponentManager.prototype._convertUnit = function _convertUnit (rawValue    ){
    rawValue = convertEscapeCharacters(rawValue);
    var ref = this._extractUnit(rawValue);
        var value = ref.value;
        var unit = ref.unit;
        var raw = ref.raw;

    return {value: this._calcUnit(value, unit, raw), unit: unit};
};

ComponentManager.prototype._calcUnit = function _calcUnit (value    , unit    , raw    ){
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
            return isNaN(value)? raw: value;
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

ComponentManager.prototype._createComponent = function _createComponent (type , parent      )        {
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

ComponentManager.prototype.getEmulateEventName = function getEmulateEventName (){
        var this$1 = this;

    var name;
    Object.keys(this._handlers.emulation).forEach(function (key){
        if(Input.isPressed(key)){
            name = this$1._getEmulatedName(key, 'press') || name;
            this$1._keys[key] = true;
        }else if(this$1._keys[key]){
            name = this$1._getEmulatedName(key, 'release') || name;
            this$1._keys[key] = false;
        }
        if(Input.isTriggered(key)) { name = this$1._getEmulatedName(key, 'trigger') || name; }
        if(Input.isLongPressed(key)) { name = this$1._getEmulatedName(key, 'longPress') || name; }
    });

    return name;
};

ComponentManager.prototype._getEmulatedName = function _getEmulatedName (key    , type    ){
    return this._handlers[type][this._handlers.emulation[key]];
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

    this._animators[id].setSpring(this._stiffness, this._damping);
    this._animators[id].animate(this._convertNumbers(fields, true));
};

ComponentManager.prototype.emulateEvent = function emulateEvent (key    , id    ){
    this._handlers.emulation[key] = id;
};

ComponentManager.prototype.removeEventEmulation = function removeEventEmulation (key    ){
    delete this._handlers.emulation[key];
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
    this._keys = {};
    this._components = {stage: this._stage};
    this._animators = {};
    this._handlers = { release: {}, trigger: {}, emulation: {}, press: {}, longPress: {}} ;
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

    draw: function draw(type, id, param1st){
        var params = [], len = arguments.length - 3;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 3 ];

        getComponentManager().addCommand(type, id, Object.assign({}, arr2obj(params),
            {picture: param1st,
            text: param1st}));
    },

    emulate: function emulate(key, id){
        getComponentManager().emulateEvent(key ,id);
    },

    removeEmulation: function removeEmulation(key){
        getComponentManager().removeEventEmulation(key);
    },

    clear: function clear(id){
        getComponentManager().clearCommands(id);
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

    spring: function spring(stiffness, damping){
        getComponentManager().setSpringParams(+stiffness, +damping);
    },

    springDefault: function springDefault(){
        getComponentManager().setDefaultSpringParams();
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
    },

    setLongPress: function setLongPress(id, name){
        getComponentManager().setHandler(id, 'longPress', name);
    },

    removeLongPress: function removeLongPress(id){
        getComponentManager().removeHandler(id, 'longPress');
    },

    setPress: function setPress(id, name){
        getComponentManager().setHandler(id, 'press', name);
    },

    removePress: function removePress(id){
        getComponentManager().removeHandler(id, 'press');
    },

    setRelease: function setRelease(id, name){
        getComponentManager().setHandler(id, 'release', name);
    },

    removeRelease: function removeRelease(id){
        getComponentManager().removeHandler(id, 'release');
    }
});

function findEventByName$1(name){
    return $gameMap.events().find(function (ev){ return (ev && (ev.event().name === name)); });
}

function findCommonEventIdByName$1(name){
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

function startEvent(name){
    var event = findEventByName$1(name);
    if(event){
        event.start();
        return true;
    }else{
        var id = findCommonEventIdByName$1(name);
        if(id){
            $gameTemp.reserveCommonEvent(id);
            return true;
        }
    }

    return false;
}

wrapPrototype(Scene_Map, 'update', function (old){ return function(){
    this._componentManager.update();

    var eventRunning = $gameMap.isEventRunning();

    if(TouchInput.isTriggered() && !eventRunning){
        var name = this._componentManager.getHandler('trigger', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name) || eventRunning;
    }
    if(TouchInput.isPressed() && !eventRunning){
        var name$1 = this._componentManager.getHandler('press', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name$1) || eventRunning;
    }
    if(TouchInput.isLongPressed() && !eventRunning){
        var name$2 = this._componentManager.getHandler('longPress', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name$2) || eventRunning;
    }
    if(TouchInput.isReleased() && !eventRunning){
        var name$3 = this._componentManager.getHandler('release', TouchInput.x, TouchInput.y);
        eventRunning = startEvent(name$3) || eventRunning;
    }

    if(!eventRunning){
        var name$4 = this._componentManager.getEmulateEventName();
        startEvent(name$4);
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
