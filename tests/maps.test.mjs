import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MatchEngine,seeded,findMatches,legalMoves} from '../dist/engine.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {MAPS} from '../dist/maps.mjs';
import {createTerrain,columnSegments} from '../dist/terrain.mjs';
import {BotSource} from '../dist/bot.mjs';
// Explicit legacy tuning proves the framework remains configuration driven.
const legacyCliff={...MAPS[1],environment:{...MAPS[1].environment,footprints:null,count:1,firstDelay:20000,intervalMin:20000,intervalMax:30000,impact:300}};
const setup=(map=legacyCliff,extra={})=>{const events={player:[],opponent:[]};const engines=Object.fromEntries(Object.keys(events).map(side=>[side,new MatchEngine({onEvent:e=>events[side].push(e)})]));const session=new ArenaSession({...engines,map,target:999999,...extra});session.start(0,37);session.ready('player',0);session.ready('opponent',0);session.update(3000);return {session,...engines,events};};
const records=(events,kind)=>Object.values(events).map(list=>list.filter(e=>e.kind===kind));
const advance=s=>{s.session.update(23000);s.session.update(24500);s.session.update(24800);};
const assertPaired=(events,kind)=>{const [a,b]=records(events,kind);assert.equal(a.length,b.length);assert.deepEqual(a.map(e=>[e.time,e.duration,e.round]),b.map(e=>[e.time,e.duration,e.round]));};
test('five map bindings have unique offline material sets and exact permanent footprints',()=>{
  assert.deepEqual(MAPS.map(m=>m.terrain.cells.filter(s=>s==='cell').length),[64,48,40,54,52]);assert.deepEqual(MAPS.map(m=>m.terrain.cells.filter(s=>s==='obstacle').length),[0,0,0,10,0]);
  for(const key of ['backdrop','board','frame'])assert.equal(new Set(MAPS.map(m=>m.assets[key])).size,5);
  for(const map of MAPS){assert.equal(map.terrain.width,8);assert.equal(map.terrain.height,8);assert.ok(map.name&&map.description);for(const asset of Object.values(map.assets).filter(Boolean)){assert.ok(fs.existsSync(new URL('../dist/'+asset,import.meta.url)));assert.ok(asset.startsWith('./assets/'));}}
  assert.deepEqual(MAPS.filter(m=>m.environment).map(m=>m.id),['cliff','crystal','ruins','furnace']);
});
test('random map selection is repeated per match and both engines receive the same theme and initial content',()=>{
  const player=new MatchEngine(),rolls=[.26,.51,.65,.99,0],seen=[];const s=new ArenaSession({player,randomMap:true,mapRandom:()=>rolls.shift(),onMapChange:m=>seen.push(m.id)});
  for(const id of ['cliff','crystal','ruins','furnace','forest']){s.start(0,19);assert.equal(s.map.id,id);assert.deepEqual(player.terrain,s.engines.opponent.terrain);assert.deepEqual(player.board.map(t=>t?.type),s.engines.opponent.board.map(t=>t?.type));}assert.deepEqual(seen,['cliff','crystal','ruins','furnace','forest']);s.dispose();
});
test('no environmental clock during countdown or disabled maps',()=>{
  for(const map of MAPS.filter(m=>!m.environment)){const s=setup(map);s.session.update(90000);assert.equal(s.session.environment,null);assert.equal(records(s.events,'rock-warning')[0].length,0);s.session.dispose();}
  const player=new MatchEngine(),s=new ArenaSession({player,map:MAPS[1]});s.start(0,3);assert.equal(s.environment.deadline,Infinity);s.ready('player',100);s.ready('opponent',100);s.update(3099);assert.equal(s.environment.deadline,Infinity);s.dispose();
});
test('shared 20s start, 1.5s warning, 0.3s fall, 5s blockage and identical restore times',()=>{
  const s=setup();s.session.update(22999);assert.equal(records(s.events,'rock-warning')[0].length,0);s.session.update(23000);assertPaired(s.events,'rock-warning');assert.equal(s.session.environment.state.phase,'warning');assert.equal(s.session.environment.next>=43000&&s.session.environment.next<=53000,true);
  s.session.update(24499);assert.equal(records(s.events,'rock-fall')[0].length,0);s.session.update(24500);assertPaired(s.events,'rock-fall');assert.ok(s.player.locks.some(l=>typeof l==='string'));s.session.update(24800);assertPaired(s.events,'rock-blocked');assert.equal(s.player.temporaryBlocks.size,1);s.session.update(29799);assert.equal(s.player.temporaryBlocks.size,1);s.session.update(29800);assertPaired(s.events,'rock-restored');assert.equal(s.player.temporaryBlocks.size,0);assert.equal(s.opponent.temporaryBlocks.size,0);assert.equal(s.player.score,0);s.session.dispose();
});
test('each round shares a 20–30s interval and equal event counts over a delayed clock',()=>{
  const s=setup();s.session.update(150000);const [a,b]=records(s.events,'rock-warning');assert.ok(a.length>=4);assertPaired(s.events,'rock-warning');assertPaired(s.events,'rock-blocked');assertPaired(s.events,'rock-restored');for(let n=1;n<a.length;n++)assert.ok(a[n].time-a[n-1].time>=20000&&a[n].time-a[n-1].time<=30000);assert.equal(a[0].time,23000);s.session.dispose();
});
test('map parameters drive timing rather than engine constants',()=>{
  const map={...MAPS[1],environment:{...legacyCliff.environment,firstDelay:100,warning:80,impact:40,duration:120,intervalMin:500,intervalMax:500}};const s=setup(map);s.session.update(3100);s.session.update(3180);s.session.update(3220);s.session.update(3340);assert.equal(records(s.events,'rock-warning')[0][0].time,3100);assert.equal(records(s.events,'rock-restored')[0][0].time,3340);assert.equal(s.session.environment.next,3600);s.session.dispose();
});
test('seal retains exact original tile identity, metadata and permanent terrain without scoring',()=>{
  const s=setup(),permanent=s.player.terrain;s.session.update(23000);const i=s.session.environment.state.indexes[0],tile=s.player.board[i];tile.custom='retained';s.session.update(24500);s.session.update(24800);assert.equal(s.player.terrain,permanent);assert.equal(s.player.board[i],null);assert.equal(s.player.temporaryBlocks.get(i).tile,tile);assert.equal(s.player.ruleTerrain.cells[i],'obstacle');assert.equal(s.player.canSwap(i,s.player.width+i),false);assert.equal(s.player.score,0);s.session.update(29800);assert.equal(s.player.board[i],tile);assert.equal(s.player.board[i].custom,'retained');assert.equal(s.player.ruleTerrain,permanent);s.session.dispose();
});
test('candidate selection excludes holes, fixed obstacles, special tiles, busy columns and unsafe deadlocks',()=>{
  const s=setup(),env=s.session.environment;const specials=s.player.board.findIndex(Boolean);s.player.board[specials].special='blast';s.player.locks[7]=123;
  const candidates=env.candidates(s.player);assert.ok(candidates.length);assert.ok(candidates.every(i=>s.player.terrain.cells[i]==='cell'&&!s.player.board[i].special&&i%8!==7));s.player.locks[7]=null;s.session.dispose();
});
test('unsafe selection delays both sides and skips together after bounded wait, never compensates one side',()=>{
  const s=setup();s.player.locks.fill(123);s.session.update(23000);assert.equal(records(s.events,'rock-warning')[0].length,0);s.session.update(27999);assert.equal(records(s.events,'rock-skip')[0].length,0);s.session.update(28000);assertPaired(s.events,'rock-skip');assert.equal(s.session.environment.counts.skipped,1);s.player.locks.fill(null);s.session.update(s.session.environment.next);assertPaired(s.events,'rock-warning');s.session.dispose();
});
test('transactions started during warning delay both falls, then reserve only the two target columns',()=>{
  const s=setup();s.session.update(23000);const i=s.session.environment.state.indexes[0],c=i%8;s.player.locks[c]=123;s.session.update(24500);assert.equal(records(s.events,'rock-fall')[0].length,0);assert.equal(s.opponent.locks.some(l=>typeof l==='string'),false);s.player.locks[c]=null;s.session.update(24525);assertPaired(s.events,'rock-fall');assert.equal(s.player.locks.filter(l=>l!==null).length,1);assert.equal(s.player.canSwap(i,i+8),false);s.session.dispose();
});
test('busy expiry holds restoration for both sides until safe and gates fresh operations in recovery columns',()=>{
  const s=setup();advance(s);const [a,b]=s.session.environment.state.indexes;s.player.locks[a%8]=123;s.session.update(29800);assert.equal(s.player.temporaryBlocks.size,1);assert.equal(s.opponent.temporaryBlocks.size,1);assert.ok(s.opponent.isBusy(b));s.player.locks[a%8]=null;s.session.update(29825);assertPaired(s.events,'rock-restored');assert.equal(records(s.events,'rock-restored')[0][0].time,29825);s.session.dispose();
});
test('temporary obstruction splits matches and gravity, blocks special scoring, and defers deadlock reshuffle',()=>{
  const e=new MatchEngine({random:seeded(11)}),permanent=e.terrain,index=27,original=e.board[index];assert.ok(e.reserveTerrain(index,'r'));assert.ok(e.sealTerrain(index,'r',1,5000));
  assert.deepEqual(columnSegments(e.ruleTerrain,3).map(s=>s.indices),[[3,11,19],[35,43,51,59]]);
  for(const i of [11,19,35,43])e.board[i].type=0;assert.equal(findMatches(e.board,e.ruleTerrain).some(g=>g.cells.includes(index)),false);
  e.board[26].special='row';const plan=e.resolution({},[],[26]);assert.equal(plan.cells.includes(index),false);assert.ok(plan.cells.includes(28));assert.equal(e.temporaryBlocks.get(index).tile,original);
  e.board=e.terrain.cells.map((_,i)=>i===index?null:e.tile((Math.floor(i/8)+i%8)%5));assert.equal(legalMoves(e.board,e.ruleTerrain).length,0);const board=e.board;e.tick(1);assert.equal(e.board,board);assert.equal(e.terrain,permanent);assert.ok(e.restoreTerrain(index));e.tick(2);assert.equal(e.temporaryBlocks.size,0);assert.equal(e.board.filter(Boolean).some(t=>t.id===original.id),true);
});
test('restoration submits a newly completed match through the existing score transaction exactly once',()=>{
  const events=[],e=new MatchEngine({random:seeded(12),onEvent:event=>events.push(event)});
  e.board=e.board.map((_,i)=>e.tile((Math.floor(i/8)+i%8)%5));e.board[26].type=e.board[28].type=1;
  const original=e.board[27];e.reserveTerrain(27,'r');e.sealTerrain(27,'r',1,5000);e.tick(0);assert.equal(e.score,0);
  assert.ok(e.restoreTerrain(27));assert.equal(e.board[27],original);e.tick(5000);
  const scores=events.filter(event=>event.kind==='score');assert.equal(scores.length,1);assert.equal(scores[0].points,30);
  for(let t=5010;t<8000;t+=10)e.tick(t);assert.equal(e.score,events.filter(event=>event.kind==='score').reduce((n,event)=>n+event.points,0));
  const committed=e.score;e.tick(9000);e.tick(9000);assert.equal(e.score,committed);assert.ok(!e.board.some(t=>t?.id===original.id));
});

test('finish cancels warnings and landing reservations; blocked originals clean up before final result',()=>{
  for(const time of [23000,24500,24800]){const s=setup();s.session.update(time);s.session.event('player',{kind:'score',score:999999,time});s.session.update(time+10000);assert.equal(s.session.status,'finished');assert.equal(s.player.temporaryBlocks.size+s.opponent.temporaryBlocks.size,0);assert.equal(s.session.environment.deadline,Infinity);assert.equal(s.player.locks.some(l=>typeof l==='string'),false);s.session.dispose();}
});
test('restart and dispose clear old environment state, storage and future clock work',()=>{
  const s=setup();advance(s);const old=s.session.environment;s.session.start(25000,71);assert.equal(old.active,false);assert.equal(old.deadline,Infinity);assert.equal(s.player.temporaryBlocks.size,0);assert.equal(s.session.environment.deadline,Infinity);s.session.dispose();assert.equal(s.session.environment.deadline,Infinity);assert.equal(s.player.recoveryColumns.size,0);assert.equal(s.player.transactions.length,0);
});
test('real hard bot operates with rock blockage through engine legal commands',()=>{
  const s=setup(MAPS[1],{source:new BotSource('hard',seeded(41))});for(let time=3000;time<=40000;time+=50)s.session.update(time);assert.ok(s.opponent.score>0);assertPaired(s.events,'rock-blocked');assertPaired(s.events,'rock-restored');assert.ok(records(s.events,'rock-blocked')[0].length>=1);for(const side of ['player','opponent'])assert.equal(s[side].score,s.events[side].filter(e=>e.kind==='score').reduce((sum,e)=>sum+e.points,0));s.session.dispose();
});
