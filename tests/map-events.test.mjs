import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,seeded,legalMoves} from '../dist/engine.mjs';
import {MapEventFramework} from '../dist/environment.mjs';
import {MAPS} from '../dist/maps.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {BotSource} from '../dist/bot.mjs';
import {columnSegments} from '../dist/terrain.mjs';
const setup=(map,extra={})=>{const events=[[],[]],player=new MatchEngine({onEvent:e=>events[0].push(e)}),opponent=new MatchEngine({onEvent:e=>events[1].push(e)});const arena=new ArenaSession({player,opponent,map,target:999999,...extra});arena.start(0,37);arena.ready('player',0);arena.ready('opponent',0);arena.update(3000);return {arena,player,opponent,events};};
// Fixed single-cell tuning isolates lifecycle tests from production balancing.
const lifecycleMaps=MAPS.filter(m=>m.environment&&!m.environment.persistent&&m.environment.type!=='mechanism').map(m=>({...m,environment:{...m.environment,footprints:null,spreadInterval:0,count:1,firstDelay:20000,intervalMin:20000,intervalMax:30000,warning:1500,impact:300,duration:5000}}));
const size=e=>e.temporaryBlocks.size+e.frozenCells.size;
for(const map of lifecycleMaps){
 const prefix=map.environment.type==='rockfall'?'rock':'map';
 test(`${map.id}: complete paired lifecycle, preserved originals, identical limits`,()=>{
  const {arena,player,opponent,events}=setup(map);assert.ok(arena.environment instanceof MapEventFramework);
  arena.update(23000);assert.equal(arena.environment.state.phase,'warning');const indices=arena.environment.state.indexes,tiles=[player.board[indices[0]],opponent.board[indices[1]]];
  arena.update(24500);assert.equal(arena.environment.state.phase,'fall');arena.update(24800);assert.deepEqual([size(player),size(opponent)],[1,1]);
  for(const [n,e] of [player,opponent].entries()){assert.equal(e.canSwap(indices[n],indices[n]+8),false);assert.equal(map.id==='crystal'?e.board[indices[n]]:e.temporaryBlocks.get(indices[n]).tile,tiles[n]);}
  arena.update(29799);assert.deepEqual([size(player),size(opponent)],[1,1]);arena.update(29800);assert.equal(arena.environment.state,null);assert.deepEqual([size(player),size(opponent)],[0,0]);assert.equal(player.board[indices[0]],tiles[0]);
  for(const suffix of ['warning','fall','blocked','restored'])assert.deepEqual(...events.map(list=>list.filter(e=>e.kind===`${prefix}-${suffix}`).map(e=>[e.time,e.duration,e.type,e.round])));
  arena.dispose();
 });
 test(`${map.id}: configured multi-cell fairness and safe warning cancellation`,()=>{
  const multi={...map,environment:{...map.environment,count:3}};const {arena,player,opponent,events}=setup(multi);arena.update(23000);assert.deepEqual(arena.environment.state.targets.map(t=>t.length),[3,3]);
  for(const [n,e] of [player,opponent].entries()){const targets=arena.environment.state.targets[n];assert.equal(new Set(targets).size,3);assert.ok(targets.every(i=>!e.board[i].special));}
  arena.update(24800);assert.deepEqual([size(player),size(opponent)],[3,3]);arena.update(29800);assert.ok(arena.environment.clean);arena.dispose();
  const s=setup(map);s.arena.update(23000);const i=s.arena.environment.state.indexes[0];s.player.board[i].special='blast';s.arena.update(29500);assert.equal(s.arena.environment.state,null);assert.deepEqual([size(s.player),size(s.opponent)],[0,0]);assert.equal(s.player.board[i].special,'blast');assert.ok(s.events.every(list=>list.some(e=>e.kind===`${prefix}-cancel`)));s.arena.dispose();
 });
 test(`${map.id}: finish, restart and dispose in every phase leave no event state`,()=>{
  for(const t of [23000,24500,24800])for(const action of ['finish','restart','dispose']){
   const s=setup(map);s.arena.update(t);const old=s.arena.environment;
   if(action==='finish'){s.arena.event('player',{kind:'score',score:999999,time:t});s.arena.update(t+10000);assert.equal(s.arena.status,'finished');}
   if(action==='restart')s.arena.start(t+10,88);
   if(action==='dispose')s.arena.dispose();
   assert.ok(old.clean);assert.equal(old.deadline,Infinity);assert.deepEqual([size(s.player),size(s.opponent)],[0,0]);assert.ok([s.player,s.opponent].every(e=>!e.locks.some(v=>typeof v==='string')&&!e.recoveryColumns.size));s.arena.dispose();
  }
 });
 test(`${map.id}: hard bot, chains, specials and scoring continue during events`,()=>{
  const s=setup(map,{source:new BotSource('hard',seeded(71))});for(let t=3000;t<=90000;t+=50)s.arena.update(t);
  assert.ok(s.opponent.score>0);assert.ok(s.events[1].some(e=>e.kind==='special-trigger'));assert.ok(s.events[1].some(e=>e.kind==='clear'&&e.depth>1));
  assert.ok(s.events[0].some(e=>e.kind===`${prefix}-blocked`));assert.ok(s.events[1].some(e=>e.kind===`${prefix}-restored`));assert.equal(s.opponent.score,s.events[1].filter(e=>e.kind==='score').reduce((n,e)=>n+e.points,0));s.arena.dispose();
 });
}
test('level-one ice: rejected clear cannot thaw; adjacent committed clear thaws without changing identity or special',()=>{
 const events=[],e=new MatchEngine({random:seeded(15),onEvent:x=>events.push(x)});e.board=e.board.map((_,i)=>e.tile((Math.floor(i/8)+i%8)%5));
 const tile=e.board[27];e.reserveTerrain(27,'ice');assert.ok(e.freezeTerrain(27,'ice',1,5000));tile.special='blast';assert.equal(e.board[27],tile);assert.equal(e.canSwap(27,28),false);
 const plan=[{strength:3,cells:[19,20,21],runs:[{axis:'row',cells:[19,20,21]}],columns:[3,4,5]}];e.locks[4]=123;
 const tx={id:42,columns:[],depth:1};assert.equal(e.claim(tx,plan),false);assert.equal(e.frozenCells.size,1);e.locks[4]=null;
 assert.ok(e.claim(tx,plan));assert.equal(e.frozenCells.size,0);assert.equal(e.board[27],tile);assert.equal(e.board[27].special,'blast');assert.equal(events.filter(x=>x.kind==='map-restored').length,1);assert.equal(events.find(x=>x.kind==='map-restored').reason,'clear');
});
test('ice anchors its tile during gravity until thaw, pillar divides gravity and shields original from special plans',()=>{
 const e=new MatchEngine({random:seeded(12)});e.board=e.board.map((_,i)=>e.tile((Math.floor(i/8)+i%8)%5));const tile=e.board[27];e.reserveTerrain(27,'ice');e.freezeTerrain(27,'ice',1,5000);
 assert.deepEqual(columnSegments(e.gravityTerrain,3).map(s=>s.indices),[[3,11,19],[35,43,51,59]]);e.board[51]=null;e.board[59]=null;
 const tx={id:2,phase:'clear',columns:[3],depth:1};e.locks[3]=2;e.transactions.push(tx);e.advance(tx);assert.equal(e.board[27],tile);assert.equal(e.frozenCells.size,1);e.release(tx);e.thawTerrain(27,'clear');assert.equal(columnSegments(e.gravityTerrain,3).length,1);
 e.reserveTerrain(27,'pillar');assert.ok(e.sealTerrain(27,'pillar',2,5000,'pillar'));e.board[26].special='row';assert.equal(e.resolution({},[],[26]).cells.includes(27),false);assert.equal(e.temporaryBlocks.get(27).tile,tile);assert.equal(columnSegments(e.gravityTerrain,3).length,2);e.restoreTerrain(27);assert.equal(e.board[27],tile);
});
test('disabled map tuning creates no clock and framework exposes lifecycle interface',()=>{
 const s=setup({...MAPS[2],environment:{...MAPS[2].environment,enabled:false}});assert.equal(s.arena.environment,null);s.arena.dispose();
 for(const name of ['trigger','warning','execute','duration','recover'])assert.equal(typeof MapEventFramework.prototype[name],'function');
});
test('warning rechecks playable commands and expiry waits for both transaction boundaries',()=>{
 for(const map of lifecycleMaps){
  const s=setup(map);s.arena.update(23000);s.player.board=s.player.board.map((t,i)=>t?{...t,type:(Math.floor(i/8)+i%8)%5}:null);assert.equal(legalMoves(s.player.board,s.player.ruleTerrain).length,0);
  s.arena.update(29500);assert.equal(s.arena.environment.state,null);assert.equal(s.arena.environment.counts.skipped,1);assert.deepEqual([size(s.player),size(s.opponent)],[0,0]);s.arena.dispose();
  const a=setup(map);a.arena.update(24800);const [i,j]=a.arena.environment.state.indexes;a.player.locks[i%8]=123;a.arena.update(29800);assert.deepEqual([size(a.player),size(a.opponent)],[1,1]);assert.ok(a.opponent.isBusy(j));a.player.locks[i%8]=null;a.arena.update(29825);assert.ok(a.arena.environment.clean);assert.deepEqual([size(a.player),size(a.opponent)],[0,0]);a.arena.dispose();
 }
});
