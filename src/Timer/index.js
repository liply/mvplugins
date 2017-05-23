/*:
 *
 * @author liply
 *
 * @help
 * 一定間隔でスイッチをONにするタイマーを作成・破棄します。
 * ゲームが起動していない場合も時間が進行します。
 * 例として、20分のタイマーを作成し、70分ゲームを閉じ、起動した場合、
 * スイッチは3回、ONになります。
 *
 * CreateTimer スイッチID 間隔（分）
 * DestroyTimer スイッチID
 *
 * スイッチIDにはセルフスイッチ（A,B,C,D）も利用できます。
 *
 * 例：
 *
 * CreateTimer 10 20
 * 20分間隔でスイッチ10番をONにします。
 *
 * DestroyTimer 10
 * スイッチ10番をONにしようとしているタイマーを破棄します。
 *
 * v1.1(2017/05/23)
 * Eventが走ってる最中はTickしないように修正
 *
 */

import {wrapPrototype, registerPluginCommands} from '../lib/util'
import PersistentField from '../lib/PersistentField'

let field = new PersistentField('liply_KitchenTimer');
field.register('timers', {});
field.register('currentTime', Date.now());

function createTimer(id, minutes){
    const interval = minutes * 60 * 1000;
    field.timers[id] = {id, next: Date.now()+interval, interval};
}

function createSelfTimer(eventId, id, minutes){
    const interval = minutes * 60 * 1000;
    let event = $gameMap.event(eventId);
    event.timers = event.timers || {};
    event.timers[id] = {next: Date.now()+interval, interval, id};
}

function tickTimer(current, timer){
    if(!$gameSwitches.value(timer.id) && timer.next < current){
        $gameSwitches.setValue(timer.id, true);
        timer.next += timer.interval;
    }
}

function tickSelfTimers(current, ev){
    if(ev.timers){
        Object.keys(ev.timers)
            .map(key=>ev.timers[key])
            .forEach(timer=>tickSelfTimer(current, ev, timer));
    }
}

function tickSelfTimer(current, ev, timer){
    const key = [ev._mapId, ev.eventId(), timer.id];
    if(!$gameSelfSwitches.value(key) && timer.next < current){
        $gameSelfSwitches.setValue(key, true);
        timer.next += timer.interval;
    }
}

wrapPrototype(Scene_Map, 'update', old=>function(){
    const current = Date.now();

    if(!$gameMap.isEventRunning()){
        Object.keys(field.timers).forEach(key=>{
            let timer = field.timers[key];

            tickTimer(current, timer);
        });

        $gameMap.events().filter(ev=>ev.timers).forEach(ev=>{
            tickSelfTimers(ev);
        });
    }

    old.apply(this, arguments);
});

registerPluginCommands({
    createTimer(switchId, minutes){
        if(switchId.match(/[abcdABCD]/)){
            createSelfTimer(this.eventId(), switchId.toUpperCase(), minutes);
        }else{
            createTimer(switchId, minutes);
        }
    },

    destroyTimer(switchId){
        if(switchId.match(/[abcdABCD]/)){
            delete $gameMap.event(this.eventId()).timers[switchId];
        }else{
            delete field.timers[switchId];
        }

    }
});