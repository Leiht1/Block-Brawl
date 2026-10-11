import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,seeded,legalMoves,findMatches} from '../dist/engine.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {MAPS} from '../dist/maps.mjs';
import {columnSegments} from '../dist/terrain.mjs';
import {MapEventFramework} from '../dist/environment.mjs';
const setup=id=>{
 const map=MAPS.find(m=>m.id===id),events=[[],[]],player=new MatchEngine({onEvent:e=>events[0].push(e)}),opponent=new MatchEngine({onEvent:e=>events[1].push(e)});
 const arena=new ArenaSession({player,opponent,map,target:999999});arena.start(0,37);arena.ready('player',0);arena.ready('opponent',0);arena.update(3000);
 const c=map.environment,warn=3000+c.firstDelay,turn=warn+c.warning,land=turn+c.impact;
 return {arena,player,opponent,events,map,c,warn,turn,land};
};
test('cold fronts leave permanent ice across rounds; waiting never thaws and ordinary play stays possible',()=>{
 const s=setup('crystal');s.arena.update(s.land);const original=[...s.player.frozenCells].map(([i,b])=>[i,b.tile]);
 assert.equal(original.length,4);assert.equal(s.arena.environment.state,null);assert.equal(s.player.temporaryBlocks.size,0);
 s.arena.update(s.land+60000);
 for(const [i,tile] of original){assert.equal(s.player.frozenCells.get(i)?.tile,tile);assert.equal(s.player.board[i],tile);assert.equal(s.player.thawTerrain(i,'timeout'),false);}
 assert.ok(s.player.hint());assert.equal(s.player.frozenCells.size,s.opponent.frozenCells.size);
 assert.ok(s.events[0].filter(e=>e.kind==='map-blocked').length>4);assert.equal(s.events[0].filter(e=>e.kind==='map-restored').length,0);
 s.arena.dispose();assert.ok(s.arena.environment.clean);
});
for(const [label,random] of [['seeded',seeded(19)],['constant',()=>0]])test(`ice-induced deadlock rearranges unfrozen tiles without thawing or relocating anchors (${label})`,()=>{
 const events=[],e=new MatchEngine({onEvent:event=>events.push(event)});e.board=e.board.map((t,i)=>({...t,type:(Math.floor(i/8)+i%8)%5}));
 e.random=random;const originals=[19,27,35].map(i=>[i,e.board[i]]),ids=e.board.map(t=>t.id).sort((a,b)=>a-b);
 for(const [i] of originals){e.reserveTerrain(i,'cold');assert.ok(e.freezeTerrain(i,'cold',1,1400,{}));}
 assert.equal(e.hint(),undefined);e.tick(1);assert.ok(e.hint());assert.equal(findMatches(e.board,e.ruleTerrain).length,0);
 for(const [i,tile] of originals){assert.equal(e.board[i],tile);assert.equal(e.frozenCells.get(i).tile,tile);}
 assert.deepEqual(e.board.map(t=>t.id).sort((a,b)=>a-b),ids);assert.equal(e.score,0);assert.equal(events.filter(e=>e.kind==='map-restored').length,0);
});
test('persistent ice cleans on finish only at safe transaction boundaries',()=>{
 const s=setup('crystal');s.arena.update(s.land);const i=[...s.player.frozenCells.keys()][0];s.player.locks[i%8]=123;
 s.arena.event('player',{kind:'score',score:999999,time:s.land});s.arena.update(s.land+1);assert.equal(s.arena.status,'finishing');assert.equal(s.opponent.frozenCells.size,4);
 s.player.locks[i%8]=null;s.arena.update(s.land+26);assert.equal(s.arena.status,'finished');assert.ok(s.arena.environment.clean);assert.equal(s.arena.environment.deadline,Infinity);s.arena.dispose();
});
test('fire lasts nine seconds, rejects exchanges and skill destruction, then returns exact tile identities',()=>{
 const s=setup('furnace');s.arena.update(s.warn);const targets=s.arena.environment.state.targets,originals=targets.map((t,n)=>t.map(i=>[i,(n?s.opponent:s.player).board[i]]));s.arena.update(s.land);
 assert.equal(s.c.type,'fire');assert.equal(s.c.duration,9000);assert.equal(s.map.assets.obstacle,null);
 for(const [n,e] of [s.player,s.opponent].entries())for(const [i,tile] of originals[n]){
  assert.equal(e.temporaryBlocks.get(i).type,'fire');assert.equal(e.temporaryBlocks.get(i).tile,tile);assert.equal(e.board[i],null);assert.equal(e.canSwap(i,i+1),false);
  assert.equal(e.resolution({},[],e.board.flatMap((tile,j)=>tile?.special?[j]:[])).cells.includes(i),false);
 }
 s.arena.update(s.land+8999);assert.ok([s.player,s.opponent].every(e=>e.temporaryBlocks.size>3));s.arena.update(s.land+9000);
 for(const [n,e] of [s.player,s.opponent].entries())for(const [i,tile] of originals[n])assert.equal(e.board[i],tile);
 assert.ok(s.arena.environment.clean);s.arena.dispose();
});
test('fire simultaneously warns all safe orthogonal neighbours, deduplicates fronts and preserves tile identities',()=>{
 const s=setup('furnace');s.arena.update(s.land);let previous=[s.player,s.opponent].map(e=>[...e.temporaryBlocks.keys()]);const saved=[[],[]];
 for(const elapsed of [3000,6000]){
  s.arena.update(s.land+elapsed-s.c.spreadWarning-1);
  const expected=[s.player,s.opponent].map((e,n)=>{const adjacent=new Set();for(const i of previous[n])for(const j of [i-1,i+1,i-8,i+8])if(j>=0&&j<64&&Math.abs(i%8-j%8)+Math.abs(Math.floor(i/8)-Math.floor(j/8))===1&&e.canSeal(j))adjacent.add(j);const chosen=[];for(const j of adjacent)if(s.arena.environment.playable(e,[...chosen,j]))chosen.push(j);return chosen;});
  s.arena.update(s.land+elapsed-s.c.spreadWarning);const env=s.arena.environment,wave=env.state.spread;
  assert.ok(wave);assert.deepEqual(wave.targets,expected);assert.ok(wave.targets.every(t=>t.length>1));assert.equal(env.state.end,s.land+9000);assert.equal(wave.end,s.land+elapsed);
  for(const [n,e] of [s.player,s.opponent].entries())for(const i of wave.targets[n]){
   assert.ok(previous[n].some(j=>Math.abs(i%8-j%8)+Math.abs(Math.floor(i/8)-Math.floor(j/8))===1));assert.equal(e.terrain.cells[i],'cell');assert.ok(e.board[i]);assert.ok(!e.board[i].special);
   saved[n].push([i,e.board[i]]);assert.equal(e.canSwap(i,i+1),false);assert.ok(s.events[n].some(ev=>ev.kind==='map-spread-warning'&&ev.index===i&&ev.time===s.land+elapsed-s.c.spreadWarning));
  }
  s.arena.update(s.land+elapsed-1);assert.deepEqual([s.player.temporaryBlocks.size,s.opponent.temporaryBlocks.size],previous.map(t=>t.length));
  s.arena.update(s.land+elapsed);for(const [n,e] of [s.player,s.opponent].entries())assert.deepEqual([...e.temporaryBlocks.keys()],[...previous[n],...expected[n]]);
  previous=[s.player,s.opponent].map(e=>[...e.temporaryBlocks.keys()]);assert.ok([s.player,s.opponent].every(e=>e.locks.every(x=>x===null)&&e.hint()));
 }
 s.arena.update(s.land+9000);for(const [n,e] of [s.player,s.opponent].entries())for(const [i,tile] of saved[n])assert.equal(e.board[i],tile);assert.ok(s.arena.environment.clean);s.arena.dispose();
});
test('ending a match during spread warning releases reservations and restores the burning tiles',()=>{
 for(const action of ['finish','restart','dispose']){
  const s=setup('furnace');s.arena.update(s.land+2350);const old=s.arena.environment;assert.ok(old.state.spread);
  if(action==='finish'){s.arena.event('player',{kind:'score',score:999999,time:s.land+2400});s.arena.update(s.land+2500);assert.equal(s.arena.status,'finished');}
  else if(action==='restart')s.arena.start(s.land+2500,99);else s.arena.dispose();
  assert.ok(old.clean);assert.ok([s.player,s.opponent].every(e=>e.locks.every(x=>x===null)));s.arena.dispose();
 }
});
test('an isolated central flame ignites exactly its left, right, top and bottom neighbours together',()=>{
 const engines=[new MatchEngine({terrain:MAPS[4].terrain,random:seeded(37)}),new MatchEngine({terrain:MAPS[4].terrain,random:seeded(37)})],c={...MAPS[4].environment,count:1},env=new MapEventFramework(engines,c,seeded(1));
 env.start(0);env.trigger(c.firstDelay);env.state.targets=[[27],[27]];
 let now=c.firstDelay+c.warning;engines.forEach(e=>e.now=now);env.execute(now);now+=c.impact;engines.forEach(e=>e.now=now);env.duration(now);const land=now;
 now=land+3000-c.spreadWarning;engines.forEach(e=>e.now=now);env.update(now);assert.deepEqual(env.state.spread.targets,[[26,28,19,35],[26,28,19,35]]);
 now=land+3000;engines.forEach(e=>e.now=now);env.update(now);for(const e of engines){assert.deepEqual([...e.temporaryBlocks.keys()],[27,26,28,19,35]);assert.ok(e.locks.every(x=>x===null));}
 env.dispose();assert.ok(env.clean);
});
test('spread skips both boards when one has no safe adjacent destination',()=>{
 const s=setup('furnace');s.arena.update(s.land);const original=s.player.canSeal;s.player.canSeal=()=>false;
 s.arena.update(s.land+2350);assert.equal(s.arena.environment.state.spread,undefined);assert.deepEqual([s.player.temporaryBlocks.size,s.opponent.temporaryBlocks.size],[3,3]);
 assert.ok([s.player,s.opponent].every(e=>e.locks.every(x=>x===null)));s.player.canSeal=original;
 s.arena.update(s.land+6000);assert.ok([s.player,s.opponent].every(e=>e.temporaryBlocks.size>3));
 s.arena.update(s.land+9000);assert.ok(s.arena.environment.clean);s.arena.dispose();
});
test('the ancient turntable rotates existing slabs and tiles, changing gravity without creating obstacles',()=>{
 const e=new MatchEngine({terrain:MAPS[3].terrain,random:seeded(37)}),cells=[9,10,17,18],before=e.terrain,tiles=cells.map(i=>e.board[i]),ids=e.board.filter(Boolean).map(t=>t.id).sort((a,b)=>a-b);
 assert.ok(e.canTurnMechanism(cells));const plan=e.mechanismPlan(cells),segments=columnSegments(before,2);
 assert.ok(e.reserveMechanism(cells,'turn'));assert.equal(e.canSwap(9,8),false);assert.ok(e.turnMechanism(cells,'turn',1,900,{}));
 assert.equal(e.temporaryBlocks.size,0);assert.equal(e.frozenCells.size,0);assert.deepEqual(e.terrain,plan.terrain);
 cells.forEach((i,n)=>assert.equal(e.board[plan.destination[n]],tiles[n]));
 assert.deepEqual(e.board.filter(Boolean).map(t=>t.id).sort((a,b)=>a-b),ids);assert.notDeepEqual(columnSegments(e.terrain,2),segments);
 assert.equal(e.terrain.cells.filter(s=>s==='obstacle').length,10);assert.equal(e.score,0);assert.ok(legalMoves(e.board,e.ruleTerrain).length);
 assert.equal(before.cells[10],'obstacle');assert.notEqual(e.terrain,before);assert.ok(e.locks.every(x=>x===null));
});
test('paired turntables share the same patch, hold only its columns, and never revert topology on a timer',()=>{
 const s=setup('ruins');s.arena.update(s.warn);const targets=s.arena.environment.state.targets;assert.deepEqual(targets[0],targets[1]);const plan=s.player.mechanismPlan(targets[0]);
 s.arena.update(s.turn);assert.equal(s.player.locks.filter(x=>typeof x==='string').length,2);s.arena.update(s.land);
 assert.deepEqual(s.player.terrain,plan.terrain);assert.deepEqual(s.opponent.terrain,plan.terrain);assert.equal(s.player.temporaryBlocks.size,0);
 assert.ok(s.events[0].some(e=>e.kind==='map-blocked'&&e.structureChanged));s.arena.update(s.land+1200);assert.deepEqual(s.player.terrain,plan.terrain);s.arena.dispose();assert.ok(s.arena.environment.clean);
});
test('turntable commit remains safe while other columns change during its animation',()=>{
 const e=new MatchEngine({terrain:MAPS[3].terrain,random:seeded(37)}),cells=[9,10,17,18];assert.ok(e.reserveMechanism(cells,'turn'));
 e.board=e.board.map((t,i)=>t&&(cells.includes(i)?t:{...t,type:(Math.floor(i/8)+i%8)%5}));e.locks[6]=123;
 assert.ok(e.turnMechanism(cells,'turn',1,900,{}));assert.equal(e.locks[6],123);assert.equal(e.temporaryBlocks.size,0);
});
test('a multi-cell cold front retains its column reservation until all ice has committed',()=>{
 const player=new MatchEngine({random:seeded(37)}),opponent=new MatchEngine({random:seeded(37)}),c={...MAPS[2].environment,count:2},env=new MapEventFramework({player,opponent},c,seeded(1));
 env.start(0);assert.ok(env.trigger(c.firstDelay));env.state.targets=[[19,27],[19,27]];env.state.indexes=[19,19];
 player.now=opponent.now=c.firstDelay+c.warning;env.execute(player.now);assert.equal(env.state.phase,'fall');
 // A cascade in another column may now be waiting for the reserved column.
 player.pendingColumns.add(3);opponent.pendingColumns.add(3);player.now=opponent.now=player.now+c.impact;
 assert.doesNotThrow(()=>env.duration(player.now));assert.deepEqual([player.frozenCells.size,opponent.frozenCells.size],[2,2]);assert.equal(player.locks[3],null);env.dispose();
});
for(const id of ['crystal','ruins','furnace'])test(`${id}: restart and exit clear presentation reservations and stored environment state`,()=>{
 for(const phase of ['warning','fall','active'])for(const action of ['restart','dispose']){
  const s=setup(id);s.arena.update(phase==='warning'?s.warn:phase==='fall'?s.turn:s.land);const old=s.arena.environment;
  if(action==='restart')s.arena.start(s.land+1,99);else s.arena.dispose();
  assert.ok(old.clean);assert.equal(old.deadline,Infinity);assert.ok([s.player,s.opponent].every(e=>!e.locks.some(x=>typeof x==='string')&&!e.recoveryColumns.size));s.arena.dispose();
 }
});
