import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine} from '../dist/engine.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {MAPS} from '../dist/maps.mjs';
import {SkillBodyPlayback} from '../dist/skill-body-vfx.mjs';
import {fogCoverage} from '../dist/effect_skill_body_soft_v1_final.mjs';
const decks={player:['fire','quake','fog','rainbow','overload','luck'],opponent:['fire','quake','fog','rainbow','overload','luck']};
function setup(map){const events=[],changes=[],s=new ArenaSession({player:new MatchEngine(),opponent:new MatchEngine({onEvent:e=>events.push(e)}),map,decks,onCardChange:e=>changes.push(e)});s.start(-3000,913);s.ready('player',-3000);s.ready('opponent',-3000);s.update(0);s.environment?.stop(0);s.cards.aiDue=Infinity;return {s,b:s.cards,e:s.engines.opponent,events,changes};}
function cast(b,id,index,now=0,side='player'){const c={id,uid:++b.serial};b.sides[side].hand.push(c);return b.cast(side,c.uid,id==='rainbow'?side:side==='player'?'opponent':'player',index,now);}
for(const map of MAPS)test(`4×4 fog uses identical clipped geometry at every legal target on ${map.id}`,()=>{
 const {s,b,e}=setup(map);
 for(let index=0;index<e.board.length;index++)if(e.board[index]&&e.ruleTerrain.cells[index]==='cell'){
  const p=b.previewTarget('opponent','fog',index),col=Math.max(0,Math.min(4,index%8-1)),row=Math.max(0,Math.min(4,Math.floor(index/8)-1)),expected=[];
  for(let y=row;y<row+4;y++)for(let x=col;x<col+4;x++)if(e.ruleTerrain.cells[y*8+x]!=='hole')expected.push(y*8+x);
  assert.deepEqual(p.cells,expected);assert.deepEqual(p.region,{col,row,width:4,height:4});
 }
 const index=e.board.findIndex(Boolean),p=b.previewTarget('opponent','fog',index);assert.ok(cast(b,'fog',index).ok);assert.deepEqual(b.sides.opponent.fogs[0].cells,p.cells);s.dispose();
});
for(const second of [27,18,63])test(`independent fog expiry and overlap at target ${second}`,()=>{
 const {s,b,e}=setup(),a=b.previewTarget('opponent','fog',18),z=b.previewTarget('opponent','fog',second);
 cast(b,'fog',18);s.update(1000);cast(b,'fog',second,1000);
 assert.equal(b.sides.opponent.fogs.length,2);assert.deepEqual(new Set(b.sides.opponent.fogCells),new Set([...a.cells,...z.cells]));
 s.update(6000);assert.equal(b.sides.opponent.fogs.length,1);assert.deepEqual(b.sides.opponent.fogCells,z.cells);
 const i=z.cells[0];assert.equal(b.allowed('opponent',{a:i,b:i+1}),false);
 s.update(7000);assert.deepEqual(b.sides.opponent.fogs,[]);assert.deepEqual(b.sides.opponent.fogCells,[]);assert.equal(b.allowed('opponent',{a:i,b:i+1}),true);
 s.dispose();
});
test('overlapping fog paints each cell once while preserving independent visual tails',()=>{
 const p=new SkillBodyPlayback();for(const [uid,now,cells] of [[1,0,[0,1,2]],[2,1000,[1,2,3]]])p.event({kind:'cast',side:'player',targetSide:'opponent',card:{id:'fog',uid},index:1,cells,now});
 assert.equal(p.records.length,2);assert.equal(fogCoverage(p.at(2000),2000).size,4);
 assert.equal(fogCoverage(p.at(6000),6000).get(1).card.uid,2);
 assert.equal(p.at(7200).length,1);assert.equal(p.at(8200).length,0);
});
for(const busy of [false,true])test(`quake clear order follows its committed start, busy=${busy}`,()=>{
 const {s,b,e,events,changes}=setup(),row=Array.from({length:8},(_,n)=>24+n),before=[...e.board];
 row.forEach((i,n)=>e.board[i]={...e.board[i],...(n===7?{wild:true}:{special:['row','column','blast'][n%3]})});
 const held=e.board.findIndex((t,i)=>t&&!t.special&&!t.wild&&!row.includes(i));
 if(busy)assert.ok(e.reserveTerrain(held,'qa'));cast(b,'quake',27);
 if(busy){s.update(1000);assert.ok(row.every(i=>e.board[i]));assert.equal(changes.some(e=>e.kind==='quake-start'),false);e.releaseTerrain(held,'qa');s.update(1020);}
 const start=busy?1000:0,started=changes.find(e=>e.kind==='quake-start');assert.equal(started.now,start);
 for(let n=0;n<8;n++){s.update(start+n*44);assert.ok(row.slice(0,n+1).every(i=>e.board[i]===null));assert.ok(row.slice(n+1).every(i=>e.board[i]));}
 assert.deepEqual(events.filter(e=>e.kind==='clear'&&e.card).map(e=>[e.time,e.tiles[0].index]),row.map((i,n)=>[start+n*44,i]));
 assert.ok(before.every((t,i)=>row.includes(i)||e.board[i]===t));assert.equal(events.some(e=>e.kind==='special-trigger'),false);
 s.update(start+4000);assert.equal(b.queue.length,0);assert.equal(e.transactions.length,0);assert.ok(e.locks.every(l=>l===null));assert.ok(e.board.every(Boolean));s.dispose();
});
test('queued quake playback starts on the real event and never reverts to the flight clock',()=>{
 const p=new SkillBodyPlayback();p.event({kind:'cast',side:'player',targetSide:'opponent',card:{id:'quake',uid:1},index:27,cells:[24,25],now:0});
 p.event({kind:'quake-start',uid:1,now:2000,cells:[24,25],hitDelays:[0,44]});p.event({kind:'effect',id:'quake',uid:1,side:'player',targetSide:'opponent',cells:[24,25],now:2044});
 p.sync([{uid:1,flightEnd:560,resolved:true}]);assert.equal(p.records[0].bodyAt,2000);assert.deepEqual(p.records[0].hitDelays,[0,44]);
});
for(const map of MAPS)test(`rainbow preserves every legal selected index and tile identity on ${map.id}`,()=>{
 const {s,b}=setup(map),e=s.engines.player;
 for(let index=0;index<e.board.length;index++)if(b.previewTarget('player','rainbow',index).valid){
  const before=e.board[index];b.sides.player.used.rainbow=0;assert.ok(cast(b,'rainbow',index,0).ok);assert.equal(e.board[index].id,before.id);assert.equal(e.board[index].wild,true);assert.equal(e.board.filter(t=>t?.wild).length,1);e.board[index]=before;
 }
 s.dispose();
});
for(const changed of [false,true])test(`busy rainbow validates original identity without random replacement, changed=${changed}`,()=>{
 const {s,b,changes}=setup(),e=s.engines.player,index=e.board.findIndex(t=>t&&!t.special),before=e.board[index];e.reserveTerrain(index,'qa');
 assert.ok(cast(b,'rainbow',index).ok);assert.equal(e.board.some(t=>t?.wild),false);
 if(changed)e.board[index]=e.tile(before.type);e.releaseTerrain(index,'qa');s.update(20);
 const effect=changes.find(e=>e.kind==='effect'&&e.id==='rainbow');
 assert.deepEqual(effect.cells,changed?[]:[index]);assert.equal(e.board.some(t=>t?.wild),!changed);
 if(changed)assert.match(effect.reason,/目标已变化/);else assert.equal(e.board[index].id,before.id);s.dispose();
});
test('AI rainbow commits its chosen target and finish/restart clear all fog instances',()=>{
 const {s,b,e}=setup(),index=e.board.findIndex(t=>t&&!t.special);assert.ok(cast(b,'rainbow',index,0,'opponent').ok);assert.equal(e.board[index].wild,true);
 cast(b,'fog',18);cast(b,'fog',27);s.event('player',{kind:'score',score:15000,time:0});assert.deepEqual(b.sides.opponent.fogs,[]);assert.deepEqual(b.queue,[]);
 s.start(100);assert.deepEqual(s.cards.sides.opponent.fogs,[]);s.dispose();
});
