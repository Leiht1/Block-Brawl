import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS} from '../dist/maps.mjs';
import {MatchEngine,seeded,legalMoves} from '../dist/engine.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {BotSource} from '../dist/bot.mjs';
const setup=(map,seed=37,source=null)=>{const events=[[],[]],player=new MatchEngine({onEvent:e=>events[0].push(e)}),opponent=new MatchEngine({onEvent:e=>events[1].push(e)}),arena=new ArenaSession({player,opponent,map,source,target:999999});arena.start(0,seed);arena.ready('player',0);arena.ready('opponent',0);arena.update(3000);return {arena,player,opponent,events};};
const amount=e=>e.temporaryBlocks.size+e.frozenCells.size;
const cliffWarn=3000+MAPS[1].environment.firstDelay,cliffLand=cliffWarn+MAPS[1].environment.warning+MAPS[1].environment.impact,cliffEnd=cliffLand+MAPS[1].environment.duration;
test('production event frequency is halved by doubling first delay and interval bounds',()=>{
 const old={cliff:[6000,10000,13000],crystal:[5000,9000,12000],ruins:[7000,11000,14000],furnace:[6500,14000,17000]};
 for(const map of MAPS.filter(m=>m.environment)){const c=map.environment;assert.deepEqual([c.firstDelay,c.intervalMin,c.intervalMax],old[map.id].map(n=>n*2));}
 assert.equal(MAPS[0].environment,null);assert.equal(MAPS[4].environment.spreadInterval,3000);assert.equal(MAPS[4].environment.duration,9000);
});
for(const map of MAPS.filter(m=>m.environment&&!m.environment.persistent&&m.environment.type!=='mechanism'))test(`${map.id}: production cadence, scale and configured lifetime are paired`,()=>{
 const {arena,player,opponent,events}=setup(map),c=map.environment,warn=3000+c.firstDelay,land=warn+c.warning+c.impact;
 assert.ok(c.firstDelay<=14000&&c.intervalMax<=34000);arena.update(warn-1);assert.equal(arena.environment.state,null);arena.update(warn);
 const s=arena.environment.state;assert.equal(s.phase,'warning');assert.equal(s.targets[0].length,s.targets[1].length);const count=s.targets[0].length;
 assert.ok(map.id==='cliff'?[1,2,4].includes(count):count===c.count);assert.ok(arena.environment.next-warn>=c.intervalMin&&arena.environment.next-warn<=c.intervalMax);
 const originals=s.targets.map((cells,n)=>cells.map(i=>arena.engines[n?'opponent':'player'].board[i]));arena.update(land);assert.deepEqual([amount(player),amount(opponent)],[count,count]);
 for(const [n,e] of [player,opponent].entries())for(const [k,i] of s.targets[n].entries()){
  assert.equal(e.canSwap(i,i+1),false);assert.equal(map.id==='crystal'?e.board[i]:e.temporaryBlocks.get(i).tile,originals[n][k]);
  if(map.id==='cliff')assert.deepEqual(e.temporaryBlocks.get(i).cells,s.targets[n]);
 }
 arena.update(land+c.duration-1);if(c.spreadInterval)assert.ok([amount(player),amount(opponent)].every(n=>n>count));else assert.deepEqual([amount(player),amount(opponent)],[count,count]);arena.update(land+c.duration);assert.ok(arena.environment.clean);
 const prefix=map.id==='cliff'?'rock':'map';assert.deepEqual(...events.map(list=>list.filter(e=>e.kind===`${prefix}-blocked`&&!e.spread).map(e=>[e.time,e.round,e.duration])));arena.dispose();
});
for(const pattern of MAPS[1].environment.footprints)test(`rock ${pattern.name}: exact contiguous footprint, atomic preservation and no hole/wrap`,()=>{
 const map={...MAPS[1],environment:{...MAPS[1].environment,footprints:[pattern]}},s=setup(map);s.arena.update(cliffWarn);const state=s.arena.environment.state;assert.ok(state);assert.equal(state.count,pattern.cells.length);
 for(const [n,e] of [s.player,s.opponent].entries()){
  const targets=state.targets[n],anchor=targets[0];assert.deepEqual(targets,pattern.cells.map(([x,y])=>anchor+y*8+x));assert.ok(targets.every(i=>e.terrain.cells[i]==='cell'));
  const temp={...e.ruleTerrain,cells:e.ruleTerrain.cells.map((v,i)=>targets.includes(i)?'obstacle':v)};assert.ok(legalMoves([...e.board],temp).some(([a,b])=>e.canSwap(a,b)));
 }
 const originals=state.targets.map((cells,n)=>cells.map(i=>[i,(n?s.opponent:s.player).board[i]]));s.arena.update(cliffLand);assert.deepEqual([amount(s.player),amount(s.opponent)],[pattern.cells.length,pattern.cells.length]);
 s.arena.update(cliffEnd);for(const [n,e] of [s.player,s.opponent].entries())for(const [i,tile] of originals[n])assert.equal(e.board[i],tile);
 const restores=s.events[0].filter(e=>e.kind==='rock-restored');assert.equal(restores.length,pattern.cells.length);assert.ok(restores.every(e=>e.cells.length===pattern.cells.length));s.arena.dispose();
});
test('footprint roulette is shared and retains its chosen size while waiting for safety',()=>{
 const s=setup(MAPS[1]);s.arena.environment.random=()=>.9;s.player.locks.fill(3);s.arena.update(cliffWarn);assert.equal(s.arena.environment.pendingFootprint.name,'massive');assert.equal(s.arena.environment.state,null);
 s.arena.environment.random=()=>0;s.player.locks.fill(null);s.arena.update(cliffWarn+25);assert.equal(s.arena.environment.state.count,4);assert.deepEqual(s.arena.environment.state.targets.map(t=>t.length),[4,4]);s.arena.dispose();
});
test('whole rock waits together if one footprint column becomes busy; finish/restart/exit release all cells',()=>{
 const map={...MAPS[1],environment:{...MAPS[1].environment,footprints:[MAPS[1].environment.footprints[3]]}};
 for(const action of ['recover','finish','restart','dispose']){const s=setup(map);s.arena.update(cliffLand);const old=s.arena.environment,i=old.state.targets[0][1];
  if(action==='recover'){s.player.locks[i%8]=123;s.arena.update(cliffEnd);assert.deepEqual([amount(s.player),amount(s.opponent)],[4,4]);s.player.locks[i%8]=null;s.arena.update(cliffEnd+25);}
  if(action==='finish'){s.arena.event('player',{kind:'score',score:999999,time:cliffLand});s.arena.update(cliffEnd+2000);assert.equal(s.arena.status,'finished');}
  if(action==='restart')s.arena.start(cliffLand+50,91);if(action==='dispose')s.arena.dispose();
  assert.ok(old.clean);assert.deepEqual([amount(s.player),amount(s.opponent)],[0,0]);s.arena.dispose();
 }
});
test('less frequent events retain hard bot activity, scoring and cleanup on every map',()=>{
 for(const map of MAPS.filter(m=>m.environment)){
  const s=setup(map,71,new BotSource('hard',seeded(71)));for(let t=3000;t<=90000;t+=50)s.arena.update(t);
  assert.ok(s.opponent.score>0);const prefix=map.id==='cliff'?'rock':'map';assert.ok(s.events[0].filter(e=>e.kind===`${prefix}-blocked`).length>=2);
  assert.equal(s.opponent.score,s.events[1].filter(e=>e.kind==='score').reduce((n,e)=>n+e.points,0));s.arena.dispose();assert.ok(s.arena.environment.clean);
 }
});
