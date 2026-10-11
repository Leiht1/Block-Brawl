import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,TIMING,findMatches,legalMoves,seeded} from '../dist/engine.mjs';
import {LEVELS,LevelSession,TutorialProgress,PROGRESS_KEY} from '../dist/levels.mjs';

function game(config){let session;const events=[];const engine=new MatchEngine({random:seeded(9),onEvent:e=>{events.push(e);session?.event(e);}});session=new LevelSession(engine,config);return {engine,session,events};}
function settle(g){for(let i=0;i<3000;i++){g.engine.tick(g.engine.now+10);g.session.update();if(g.engine.stableChecked&&!g.engine.transactions.length)return;}assert.fail('did not settle');}
for(const [index,level] of LEVELS.entries())test(`tutorial ${index+1} has a real playable completion path and exact goals`,()=>{
  const g=game(level);assert.equal(findMatches(g.engine.board).length,0);assert.ok(legalMoves(g.engine.board).length);
  for(let i=0;i<20&&g.session.status==='playing';i++){
    const move=index===5&&i===0?[26,27]:g.session.hint();assert.ok(move);assert.ok(g.session.swap(...move));settle(g);
  }
  assert.equal(g.session.status,'won');assert.ok(g.session.complete);assert.equal(g.session.canAct,false);
  assert.equal(g.session.moves,g.events.filter(e=>e.kind==='action-accepted').length);
  if(index===0)assert.equal(g.session.counts.triples,3);
  if(index===1)assert.equal(g.session.counts.lineActivated,1);
  if(index===2)assert.equal(g.session.counts.blastActivated,1);
  if(index===3)assert.equal(g.session.counts.active,2);
  if(index===4)assert.equal(g.session.counts.combos,1);
  if(index===5){assert.ok(g.session.moves<=level.moveLimit);assert.ok(g.session.moves>=2);}
});
test('preset specials cannot satisfy the manufacture-and-trigger objective',()=>{
  const board=structuredClone(LEVELS[1].board);board[63].special='column';
  const g=game({...LEVELS[1],board});g.session.swap(63,55);settle(g);
  assert.equal(g.session.counts.lineCreated,0);assert.equal(g.session.counts.lineActivated,0);assert.equal(g.session.status,'playing');
});
test('active goal counts player exchanges rather than all secondary explosions',()=>{
  const board=structuredClone(LEVELS[3].board);board[34].special='blast';
  const g=game({...LEVELS[3],board});g.session.swap(26,18);settle(g);
  assert.ok(g.events.filter(e=>e.kind==='special-trigger').length>=2);
  assert.equal(g.session.counts.active,1);assert.equal(g.session.moves,1);assert.equal(g.session.status,'playing');
});
test('invalid, rejected and conflicting exchanges never spend a move',()=>{
  const g=game({...LEVELS[5],moveLimit:3,targetScore:99999,goals:[{kind:'score',target:99999}]});
  assert.equal(g.session.swap(-1,0),false);assert.equal(g.session.swap(0,9),false);
  assert.ok(g.session.swap(0,1));settle(g);assert.equal(g.session.moves,0);
  assert.ok(g.session.swap(26,27));assert.ok(g.session.swap(1,9));settle(g);
  assert.ok(g.events.some(e=>e.kind==='revert'&&e.conflict));assert.equal(g.session.moves,0);assert.equal(g.engine.score,0);
});
test('independent columns remain concurrent and each accepted action spends one step',()=>{
  const g=game({...LEVELS[3],moveLimit:3});
  assert.ok(g.session.swap(26,18));assert.ok(g.session.swap(30,22));assert.equal(g.engine.transactions.length,2);
  settle(g);assert.equal(g.session.moves,2);assert.equal(g.session.counts.active,2);assert.equal(g.session.status,'won');
});
test('pending swaps reserve the last step; reversal releases it',()=>{
  const g=game({...LEVELS[3],moveLimit:1});
  assert.ok(g.session.swap(0,1));assert.equal(g.session.swap(26,18),false);settle(g);
  assert.equal(g.session.remaining,1);assert.ok(g.session.swap(26,18));assert.equal(g.session.swap(30,22),false);settle(g);
  assert.equal(g.session.moves,1);assert.equal(g.session.status,'lost');
});
test('last-step success waits for cascades; failure and retry clear old transactions',()=>{
  const config={...LEVELS[4],moveLimit:1,goals:[{kind:'score',target:500}],targetScore:500};
  const g=game(config);g.session.swap(26,27);g.engine.tick(100);g.session.update();
  assert.equal(g.session.status,'playing');assert.equal(g.session.remaining,0);assert.equal(g.session.canAct,false);
  settle(g);assert.equal(g.session.status,'won');assert.equal(g.session.moves,1);assert.ok(g.engine.score>=500);
  const retry=new LevelSession(g.engine,LEVELS[5]);assert.equal(retry.moves,0);assert.equal(g.engine.score,0);assert.equal(g.engine.transactions.length,0);assert.equal(g.engine.refills.size,0);
});
test('preset and per-column refill sequences are reusable, copied, and validated',()=>{
  const config={...LEVELS[0],refills:{1:[4],2:[3],3:[2]}};const g=game(config);
  g.session.swap(11,3);g.engine.tick(100);g.engine.tick(TIMING.swap+TIMING.clear);
  assert.equal(g.engine.board[1].type,4);assert.equal(g.engine.board[2].type,3);assert.equal(g.engine.board[3].type,2);
  assert.deepEqual(config.refills,{1:[4],2:[3],3:[2]});
  assert.throws(()=>g.engine.loadLevel({...config,board:[0]}));assert.throws(()=>g.engine.loadLevel({...config,refills:{8:[0]}}));
});
test('progress unlocks in sequence, reloads, permits replays and grants qualification only after six wins',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  let p=new TutorialProgress(storage);assert.equal(p.finish(4),false);assert.equal(p.qualified,false);
  for(let i=0;i<6;i++){assert.equal(p.unlocked(i),true);assert.equal(p.finish(i),true);p=new TutorialProgress(storage);assert.equal(p.completed,i+1);assert.equal(p.qualified,i===5);}
  p.finish(0);assert.equal(new TutorialProgress(storage).completed,6);assert.equal(p.unlocked(6),false);
});
test('corrupt or unavailable storage degrades safely without phantom unlocks',()=>{
  for(const raw of ['bad','{"version":1,"completed":99}','{"version":1,"completed":2.5}','{"version":2,"completed":6}']){
    const p=new TutorialProgress({getItem:()=>raw});assert.equal(p.completed,0);assert.equal(p.qualified,false);
  }
  const p=new TutorialProgress({getItem(){throw Error('blocked');},setItem(){throw Error('full');}});
  assert.equal(p.finish(0),true);assert.equal(p.completed,1);assert.equal(p.saved,false);assert.equal(PROGRESS_KEY,'block-brawl.tutorial.v1');
});
