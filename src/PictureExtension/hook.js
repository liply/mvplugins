import Tween from './Tween.js'
import p from './parameters.js'
import PersistentField from '../lib/PersistentField.js'
import {registerPluginCommands, wrapPrototype} from '../lib/util.js'

let field = new PersistentField(p.PLUGIN_NAME);
let tweens = [];

field.register('grid', []);
field.register('stand', []);


registerPluginCommands({
    tween(target, ...params){
        let tween = new Tween();
        tween.add(target, params);
        tweens.push(tween);
    },

    grid(toggle, id){
        switch(toggle){
            case 'on':
                field.grid[+id] = true;
                break;

            case 'off':
                field.grid[+id] = false;
                break;
        }
    },

    stand(toggle, id){
        switch(toggle){
            case 'on':
                field.stand[+id] = true;
                break;

            case 'off':
                field.stand[+id] = false;
                break;
        }
    }
});

wrapPrototype(Game_Screen, 'update',old=>function(){
    old.call(this);
    
    tweens.forEach(function(tween){
        tween.update(id=>$gameScreen.picture(id));
    });

    tweens = tweens.filter(function(tween){
        return !tween.isEnd();
    });

});

wrapPrototype(Sprite_Picture, 'updateOrigin', old=>function(){
    old.call(this);

    if(field.stand[this._pictureId]){
        this.anchor.x = 0.5;
        this.anchor.y = 1;
    }
});

wrapPrototype(Sprite_Picture, 'updatePosition', old=>function(){
    let picture = this.picture();

    if(field.grid[this._pictureId]){
        this.x = Math.floor(picture.x()*Graphics.width/p.column);
        this.y = Math.floor(picture.y()*Graphics.height/p.row);
    }else{
        old.call(this);
    }
    
});
