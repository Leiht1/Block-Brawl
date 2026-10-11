import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,seeded,legalMoves} from '../dist/engine.mjs';
import {ArenaSession,boardReady} from '../dist/arena.mjs';
import {BotSource,chooseMove,evaluateMove,DIFFICULTIES} from '../dist/bot.mjs';

function setup({difficulty='normal',target=undefined,combo=false,source=true}={}){
  const events={player:[],opponent:[]};
  const player=new MatchEngine({onEvent:e=>events.player.push(e)}),opponent=new MatchEngine({onEvent:e=>events.opponent.push(e)});
  const bot=source?new BotSource(difficulty,seeded(31)):null;
  const session=new ArenaSession({player,opponent,source:bot,target:target??DIFFICULTIES[difficulty].target});session.start(0,91);
  if(combo){const fixture=new MatchEngine();fixture.reset('combo-blasts');for(const e of [player,opponent]){e.loadLevel({id:'arena',board:fixture.board});e.tick(0);}}
  return {session,player,opponent,bot,events};
}
function play(s){s.ready('opponent',0);s.ready('player',0);s.update(3000);}
function drain(s,now){for(let i=0;i<400;i++){s.update(now+=10);if(Object.values(s.engines).every(boardReady))break;}return now;}

test('identical starting contents, distinct tiles and independent engine state',()=>{
  const {session,player,opponent}=setup({source:false});
  assert.deepEqual(player.board.map(t=>t.type),opponent.board.map(t=>t.type));
  player.board.forEach((t,i)=>assert.notEqual(t,opponent.board[i]));
  const before=JSON.stringify(opponent.board);play(session);
  const [a,b]=player.hint();assert.ok(session.command('player',{kind:'swap',a,b}));drain(session,3000);
  assert.ok(player.score>0);assert.equal(opponent.score,0);assert.equal(JSON.stringify(opponent.board),before);
  assert.notEqual(player.random,opponent.random);session.dispose();
});

for(const difficulty of Object.keys(DIFFICULTIES))test(`${difficulty}: real legal commands, correct points, ready-based cadence`,()=>{
  const {session,opponent,bot,events}=setup({difficulty});play(session);
  assert.equal(session.target,DIFFICULTIES[difficulty].target);
  let now=3000,actions=0;
  while(actions<4){
    assert.ok(bot.due-now>=DIFFICULTIES[difficulty].min&&bot.due-now<=DIFFICULTIES[difficulty].max);
    const due=bot.due,before=opponent.board.map(t=>t?{...t}:null),moves=legalMoves([...before]);
    session.update(due-.01);assert.equal(opponent.transactions.length,0);
    session.update(due);const swap=events.opponent.filter(e=>e.kind==='swap').at(-1);
    assert.ok(moves.some(([a,b])=>a===swap.a&&b===swap.b||b===swap.a&&a===swap.b));
    assert.equal(opponent.score,events.opponent.filter(e=>e.kind==='score').reduce((n,e)=>n+e.points,0));
    assert.equal(bot.due,null);session.update(due+50);assert.equal(bot.due,null);
    now=drain(session,due+50);actions++;
    assert.ok(opponent.score>0);assert.equal(events.opponent.filter(e=>e.kind==='action-accepted').length,actions);
    assert.equal(opponent.score,events.opponent.filter(e=>e.kind==='clear').reduce((n,e)=>n+e.points,0));
  }
  session.dispose();assert.equal(bot.active,false);assert.equal(bot.due,null);
});

test('bot decision sees only visible board; evaluation does not mutate it',()=>{
  const e=new MatchEngine({random:seeded(3)});const before=JSON.stringify(e.board);
  e.random=()=>{throw Error('future randomness accessed');};e.refills=new Proxy({}, {get(){throw Error('hidden refills accessed');}});
  for(const d of Object.keys(DIFFICULTIES)){const pair=chooseMove(e.board,d,()=>.5);assert.ok(pair);assert.ok(evaluateMove(e.board,pair).points>=30);}
  assert.equal(JSON.stringify(e.board),before);
});

test('normal prefers visible specials; hard chooses high-yield combinations',()=>{
  const e=new MatchEngine();e.reset('combo-blasts');
  const hard=chooseMove(e.board,'hard',()=>0),normal=chooseMove(e.board,'normal',()=>0);
  assert.ok(evaluateMove(e.board,hard).combo);assert.ok(evaluateMove(e.board,normal).combo);
  const values=legalMoves([...e.board]).flatMap(pair=>[pair,[...pair].reverse()]).map(pair=>evaluateMove(e.board,pair));
  const value=m=>m.points+(m.combo?35:0)+m.rewards*15;
  assert.equal(value(evaluateMove(e.board,hard)),Math.max(...values.map(value)));
});

test('both ready, exact three-second countdown, command gate and difficulty target',()=>{
  const {session,player,bot}=setup();const [a,b]=player.hint(),cmd={kind:'swap',a,b};
  assert.equal(session.target,6000);assert.equal(session.command('player',cmd),false);
  session.ready('player',10);session.update(10000);assert.equal(session.status,'preparing');
  session.ready('opponent',10000);assert.equal(session.countdown(10000),3);assert.equal(session.command('player',cmd),false);
  session.update(12999);assert.equal(session.status,'countdown');assert.equal(bot.active,false);
  session.update(13000);assert.equal(session.status,'playing');assert.equal(session.command('player',cmd),true);
  assert.equal(session.command('remote',{kind:'swap',a,b}),false);assert.equal(session.command('player',{kind:'score',score:5000}),false);
  session.dispose();
});

test('first crossing locks winner; committed opponent action drains, final scores stay consistent',()=>{
  const {session,player,opponent,events}=setup({target:150,combo:true,source:false});play(session);
  session.command('player',{kind:'swap',a:26,b:27});session.update(3010);
  session.command('opponent',{kind:'swap',a:26,b:27});session.update(3100);
  assert.equal(session.status,'finishing');assert.equal(session.winner,'player');assert.equal(session.result,null);
  assert.equal(session.command('opponent',{kind:'swap',a:1,b:2}),false);
  drain(session,3100);assert.equal(session.status,'finished');assert.equal(session.result.winner,'player');assert.ok(opponent.score>=250);
  for(const [side,e] of Object.entries(session.engines))assert.equal(e.score,events[side].filter(e=>e.kind==='score').reduce((n,e)=>n+e.points,0));
  const result=session.result;session.update(99000);assert.equal(session.result,result);assert.equal(player.score,result.player);
  session.dispose();
});

test('delayed frame resolves earlier opponent crossing before later player action',()=>{
  const {session}=setup({target:150,combo:true,source:false});play(session);
  session.command('opponent',{kind:'swap',a:26,b:27});session.update(3020);
  session.command('player',{kind:'swap',a:26,b:27});session.update(4000);
  assert.equal(session.winner,'opponent');session.dispose();
});

test('same deadline is deterministic; local player score event wins equal-time crossings',()=>{
  const {session}=setup({target:150,combo:true,source:false});play(session);
  for(const side of ['opponent','player'])session.command(side,{kind:'swap',a:26,b:27});
  session.update(3100);assert.equal(session.winner,'player');session.dispose();
});

test('restart and disposal cancel bot, old transactions and restore event listener',()=>{
  const {session,player,opponent,bot,events}=setup();play(session);
  const cmd=e=>{const [a,b]=e.hint();return {kind:'swap',a,b};};
  session.command('player',cmd(player));session.command('opponent',cmd(opponent));
  session.start(3020,19);assert.equal(player.transactions.length+opponent.transactions.length,0);assert.equal(bot.active,false);assert.equal(bot.due,null);
  assert.equal(player.score+opponent.score,0);session.update(20000);assert.equal(player.score+opponent.score,0);
  play(session);session.command('player',cmd(player));const original=session.previous.player;session.dispose();
  assert.equal(player.onEvent,original);assert.equal(player.transactions.length+opponent.transactions.length,0);
  const count=events.opponent.length;session.update(90000);assert.equal(events.opponent.length,count);assert.equal(bot.active,false);
});
