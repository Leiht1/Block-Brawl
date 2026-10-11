import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,findMatches,legalMoves,seeded,TIMING} from '../dist/engine.mjs';
import {createTerrain,TEST_TERRAINS,columnSegments} from '../dist/terrain.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {BotSource,chooseMove,evaluateMove} from '../dist/bot.mjs';
import {createBoardPainter} from '../dist/board-painter.mjs';
const setup=(terrain,seed=12)=>{const events=[];const game=new MatchEngine({terrain,random:seeded(seed),onEvent:e=>events.push(e)});return {game,events};};
const settle=game=>{for(let n=0;n<1500&&(!game.stableChecked||game.transactions.length);n++)game.tick(game.now+25);assert.equal(game.transactions.length,0);assert.ok(game.stableChecked);assert.equal(findMatches(game.board,game.terrain).length,0);assert.ok(legalMoves(game.board,game.terrain).length);assert.ok(game.locks.every(l=>l===null));game.terrain.cells.forEach((s,i)=>assert.equal(!!game.board[i],s==='cell'));assert.equal(new Set(game.board.filter(Boolean).map(t=>t.id)).size,game.board.filter(Boolean).length);};
const patterned=game=>{game.board=game.terrain.cells.map((s,i)=>s==='cell'?game.tile((Math.floor(i/game.width)+i%game.width)%5):null);game.stableChecked=false;};
const map=(width,height,changes={})=>createTerrain({width,height,cells:Array.from({length:width*height},(_,i)=>changes[i]||'cell')});
for(const [name,terrain] of Object.entries(TEST_TERRAINS))test(`${name}: fresh terrain and repeated bot moves preserve topology, scoring and IDs`,()=>{
  const {game,events}=setup(terrain);settle(game);
  for(let n=0;n<12;n++){const before=JSON.stringify(game.board);const pair=chooseMove(game.board,['easy','normal','hard'][n%3],seeded(n+1),game.terrain);assert.ok(game.canSwap(...pair));assert.equal(JSON.stringify(game.board),before);const expected=evaluateMove(game.board,pair,game.terrain).points;assert.ok(game.swap(...pair));game.tick(game.now+100);assert.equal(events.findLast(e=>e.kind==='clear').points,expected);settle(game);}
  assert.equal(game.score,events.filter(e=>e.kind==='score').reduce((s,e)=>s+e.points,0));
});
test('invalid dimensions, holes-only, isolated triple and obstacle-fragmented maps fail before mutation',()=>{
  for(const config of [{width:0},{width:4,height:4,cells:['cell']},{width:2,height:2},{width:3,height:1},{width:4,height:1,cells:['cell','cell','obstacle','cell']},{width:4,height:4,cells:Array(16).fill('hole')}])assert.throws(()=>createTerrain(config));
  const {game}=setup(TEST_TERRAINS.standard),board=game.board;assert.throws(()=>game.configureTerrain({width:2,height:2}));assert.equal(game.board,board);
  for(const terrain of [map(1,4),map(4,1)]){const g=setup(terrain).game;settle(g);}
});
test('terrain cells split matching and prevent exchanges even if stale tile data is present',()=>{
  const terrain=map(6,6,{14:'hole',20:'obstacle'}),{game}=setup(terrain);patterned(game);
  for(const i of [2,8,14,20,26])game.board[i]=game.tile(1);
  assert.equal(findMatches(game.board,terrain).some(g=>g.cells.includes(14)||g.cells.includes(20)),false);
  for(const pair of [[8,14],[14,15],[20,21],[5,6]])assert.equal(game.canSwap(...pair),false);
  assert.ok(legalMoves(game.board,terrain).every(pair=>pair.every(i=>terrain.cells[i]==='cell')));
});
test('hole traversal compacts vertically with true source coordinates and unchanged fall duration',()=>{
  const {game,events}=setup(map(5,7,{11:'hole',16:'hole'}));patterned(game);
  const ids=[1,6,21,26,31].map(i=>game.board[i].id);game.board[26]=null;game.board[31]=null;
  const tx={id:1,phase:'clear',columns:[1],depth:1};game.advance(tx);
  assert.deepEqual([21,26,31].map(i=>game.board[i].id),ids.slice(0,3));
  assert.equal(game.board[11],null);assert.equal(game.board[16],null);
  const fall=events.at(-1);assert.equal(fall.duration,TIMING.fall);assert.ok(fall.moves.some(m=>m.from===6&&m.to===26));
  assert.ok(fall.moves.every(m=>((m.from%5)+5)%5===m.to%5));
});
test('multiple obstacles segment refills, retain survivor order and clip new tile inlets',()=>{
  const terrain=map(5,9,{11:'obstacle',21:'hole',31:'obstacle'}),{game,events}=setup(terrain);patterned(game);
  assert.deepEqual(columnSegments(terrain,1).map(s=>s.indices),[[1,6],[16,26],[36,41]]);
  const keep=[1,16,36].map(i=>game.board[i]);for(const i of [6,26,41])game.board[i]=null;
  game.refills.set(1,[2,3,4]);game.advance({id:1,phase:'clear',columns:[1],depth:1});
  assert.deepEqual([6,26,41].map(i=>game.board[i]),keep);
  assert.deepEqual([1,16,36].map(i=>game.board[i].type),[2,3,4]);
  const fills=events.at(-1).moves.filter(m=>m.refill);assert.deepEqual(fills.map(m=>m.segmentTop),[0,3,7]);assert.deepEqual(fills.map(m=>Math.floor(m.from/5)),[-1,2,6]);
  for(const i of [11,21,31])assert.equal(game.board[i],null);
});
for(const special of ['row','column','blast'])test(`${special}: range crosses terrain but only movable tiles clear and score`,()=>{
  const {game,events}=setup(map(7,7,{23:'obstacle',25:'hole',17:'obstacle',31:'hole'}));patterned(game);game.board[24].special=special;
  const plan=game.resolution({a:24,b:24},[],[24]);assert.ok(plan.cells.every(i=>game.terrain.cells[i]==='cell'));assert.equal(plan.blasts.length,1);
  if(special==='row')assert.ok(plan.cells.includes(26));if(special==='column')assert.ok(plan.cells.includes(38));
  assert.ok(game.claim({id:1,columns:[],depth:1},[],[24]));assert.equal(game.score,plan.cells.length*10);assert.equal(events.filter(e=>e.kind==='score').length,1);
  for(const i of [23,25,17,31])assert.equal(game.board[i],null);
});
test('all combo ranges and four/five/T/L rewards respect terrain',()=>{
  const {game}=setup(map(7,7,{23:'obstacle',25:'hole'}));
  for(const [a,b] of [['row','column'],['row','blast'],['column','blast'],['blast','blast']]){patterned(game);game.board[16].special=a;game.board[17].special=b;const combo=game.combination(16,17);const plan=game.resolution({a:16,b:17},[],[],combo);assert.ok(plan.cells.every(i=>game.terrain.cells[i]==='cell'));assert.equal(plan.cells.length,new Set(plan.cells).size);}
  for(const shape of [[0,1,2,3],[0,1,2,3,4],[1,8,15,14,16],[1,8,15,16,17]]){patterned(game);shape.forEach(i=>game.board[i].type=shape.length===4?0:4);const groups=findMatches(game.board,game.terrain);assert.ok(groups.some(g=>g.strength>=4));const plan=game.resolution({},groups);assert.equal(plan.rewards.length,1);assert.equal(plan.rewards[0].tile.special,shape.length===4?'row':'blast');}
});
test('deadlock reshuffles keep exact inventory, topology, obstacles and score on all test shapes',()=>{
  for(const terrain of Object.values(TEST_TERRAINS)){const {game,events}=setup(terrain);patterned(game);assert.equal(legalMoves(game.board,terrain).length,0);const before=game.board.filter(Boolean).map(t=>[t.id,t.type,t.special]).sort((a,b)=>a[0]-b[0]);game.score=123;game.tick(0);settle(game);assert.equal(game.score,123);assert.deepEqual(game.board.filter(Boolean).map(t=>[t.id,t.type,t.special]).sort((a,b)=>a[0]-b[0]),before);assert.equal(events.at(-1).kind,'reshuffle');assert.ok(events.at(-1).preservedInventory);}
});
test('constant RNG cannot cause infinite board generation or reshuffling; tiny inventory redeals safely',()=>{
  const game=new MatchEngine({random:()=>0,terrain:map(4,1)});settle(game);game.board=[0,1,2,3].map(t=>game.tile(t));game.stableChecked=false;const ids=game.board.map(t=>t.id).sort();game.tick(1);settle(game);assert.deepEqual(game.board.map(t=>t.id).sort(),ids);
});
test('obstacle-adjacent expansion conflicts revert atomically and independent columns stay operable',()=>{
  const {game,events}=setup(map(9,8,{21:'obstacle',30:'hole'}));patterned(game);game.board[28].special='blast';
  game.swap(28,29);game.swap(31,40);game.tick(100);
  assert.equal(game.score,0);assert.ok(events.some(e=>e.kind==='revert'&&e.conflict));assert.equal(events.some(e=>e.kind==='special-trigger'),false);
  for(const tx of game.transactions)for(const c of tx.columns)assert.equal(game.locks[c],tx.id);
  assert.ok(game.canSwap(7,16));game.tick(190);settle(game);
});
test('busy terrain replacement is rejected; explicit reset cancels transactions and invalid load is atomic',()=>{
  const {game}=setup(TEST_TERRAINS.cliff);game.swap(...game.hint());const before=game.board;assert.throws(()=>game.configureTerrain(TEST_TERRAINS.ruins));assert.equal(game.board,before);game.reset('free',TEST_TERRAINS.ruins);settle(game);assert.equal(game.width,8);assert.equal(game.transactions.length,0);
  const stable=game.board;assert.throws(()=>game.loadLevel({board:Array(64).fill(0),terrain:TEST_TERRAINS.ruins}));assert.equal(game.board,stable);
});
test('arena uses identical nonrectangular structure and real bot commands without future refill access',()=>{
  for(const terrain of [TEST_TERRAINS.cliff,TEST_TERRAINS.ruins]){const player=new MatchEngine(),source=new BotSource('hard',()=>0),session=new ArenaSession({player,terrain,source,target:999999});session.start(0,17);assert.deepEqual(player.terrain,session.engines.opponent.terrain);assert.deepEqual(player.board.map(t=>t?.type),session.engines.opponent.board.map(t=>t?.type));session.ready('player',0);session.ready('opponent',0);for(let now=3000;now<10000;now+=50)session.update(now);assert.ok(session.engines.opponent.score>0);session.dispose();}
});
test('painter derives rectangular coordinates and terrain wells from configuration',()=>{
  const rects=[];const ctx=new Proxy({}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});ctx.roundRect=(...r)=>rects.push(r);
  const painter=createBoardPainter({ctx,art:{board(){throw Error('must not use 8×8 artwork');}}});const terrain=map(7,9);painter.configure({width:420,cell:60,pixelRatio:1,visualNow:0,formations:[],terrain});painter.drawTerrain(terrain);assert.equal(rects.length,terrain.cells.filter(s=>s==='cell').length);rects.length=0;painter.outline(62);assert.equal(rects[0][0],390-27);assert.equal(rects[0][1],510-27);
});

test('authored presets share an 8×8 footprint and have distinct deliberate silhouettes',()=>{
  assert.deepEqual(Object.keys(TEST_TERRAINS),['standard','cliff','crystal','ruins']);
  const counts=Object.fromEntries(Object.entries(TEST_TERRAINS).map(([name,t])=>{assert.equal(t.width,8);assert.equal(t.height,8);assert.equal(t.cells.length,64);return [name,t.cells.filter(s=>s==='cell').length];}));
  assert.deepEqual(counts,{standard:64,cliff:48,crystal:40,ruins:54});
  const ice=TEST_TERRAINS.crystal;for(let r=0;r<8;r++)for(let c=0;c<8;c++){assert.equal(ice.cells[r*8+c],ice.cells[r*8+7-c]);assert.equal(ice.cells[r*8+c],ice.cells[(7-r)*8+c]);}
  const ruin=TEST_TERRAINS.ruins;for(let i=0;i<64;i++)if(i<8||i>=56||i%8===0||i%8===7)assert.equal(ruin.cells[i],'cell');assert.ok(ruin.cells.includes('obstacle'));assert.equal(ruin.cells.includes('hole'),false);
});
test('shared well art is clipped to exactly the non-hole footprint on both shaped boards',()=>{
  for(const terrain of [TEST_TERRAINS.cliff,TEST_TERRAINS.crystal,TEST_TERRAINS.ruins]){
    const rects=[],clips=[];const ctx=new Proxy({}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});ctx.beginPath=()=>rects.length=0;ctx.rect=(...r)=>rects.push(r);ctx.clip=()=>clips.push([...rects]);
    let draws=0;const painter=createBoardPainter({ctx,art:{board(){draws++;return true;}}});painter.configure({width:480,cell:60,pixelRatio:1,visualNow:0,formations:[],terrain});painter.drawTerrain(terrain);assert.equal(draws,1);assert.deepEqual(clips[0],terrain.cells.flatMap((s,i)=>s==='hole'?[]:[[i%8*60,Math.floor(i/8)*60,60,60]]));
  }
});
