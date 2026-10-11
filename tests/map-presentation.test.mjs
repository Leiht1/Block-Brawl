import test from 'node:test';
import assert from 'node:assert/strict';
import {MapEventPresentation,EVENT_SEQUENCES,mapMotion} from '../dist/map-presentation.mjs';
for(const type of Object.keys(EVENT_SEQUENCES))test(`${type}: optional stages and motion follow its environment`,()=>{
 const p=new MapEventPresentation(),prefix=type==='rockfall'?'rock':'map',event=(phase,time,duration)=>p.event({kind:`${prefix}-${phase}`,index:19,cells:[19,20],type,round:1,time,duration});
 event('warning',100,1500);const stages=[p.at(100).stage];
 if(type==='rockfall'){stages.push(p.at(900).stage);assert.notEqual(mapMotion(p.at(900),900).camera,0);}
 else for(const time of [100,600,900,1200,1550])assert.deepEqual(mapMotion(p.at(time),time),{camera:0,board:0});
 stages.push(p.at(1400).stage);event('fall',1600,700);assert.equal(p.at(2000).stage,'Board');event('blocked',2300,1400);stages.push(p.at(2400).stage);assert.deepEqual(stages,EVENT_SEQUENCES[type]);
 if(['freeze','mechanism'].includes(type))assert.equal(p.at(4000),null);
 else {event('restored',7300,650);assert.equal(p.at(7400).stage,'Recovery');assert.equal(p.at(7950),null);}
 event('warning',9000,1500);assert.deepEqual(mapMotion(p.at(9900),9900,true),{camera:0,board:0});event('cancel',10000);assert.equal(p.at(10000),null);
});
test('duplicate cells share a cue and earned ice breaks do not replay the weather',()=>{
 const p=new MapEventPresentation();p.event({kind:'map-warning',type:'freeze',index:4,cells:[4,5],round:1,time:0,duration:2100});assert.equal(p.at(4000).stage,'Board');
 p.event({kind:'map-blocked',type:'freeze',index:4,round:1,time:4000,duration:1400});p.event({kind:'map-blocked',type:'freeze',index:5,round:1,time:4000,duration:1400});assert.deepEqual(p.at(4200).cells,[4,5]);
 p.event({kind:'map-restored',type:'freeze',index:4,reason:'clear',time:4500,duration:650});assert.equal(p.at(4600).stage,'Gameplay');assert.equal(p.at(5500),null);
});
