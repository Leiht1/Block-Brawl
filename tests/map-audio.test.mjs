import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../dist/audio-manager.mjs';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
import {createAudioEvents} from '../dist/audio-events.mjs';
import {MatchEngine,legalMoves} from '../dist/engine.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {MAPS} from '../dist/maps.mjs';

function transport(options={}){
 let now=0;const nodes=[];
 const audio=new AudioManager({manifest:AUDIO_MANIFEST,development:false,now:()=>now,...options,createAudio:src=>{
  const events=new Map(),node={src,volume:0,paused:0,play:()=>Promise.resolve(),pause(){this.paused++;},removeAttribute(){},load(){},addEventListener(k,fn){events.set(k,fn);},removeEventListener(k){events.delete(k);},end(){events.get('ended')?.();}};
  nodes.push(node);return node;
 }});
 return {audio,nodes,at(t){now=t;}};
}

function run(mapId,channel=1,attached=true){
 const p=transport();p.audio.environmentVolume=channel;
 const events=createAudioEvents(p.audio),trace=[],calls=[];
 const play=p.audio.play.bind(p.audio);p.audio.play=(id,options)=>{const accepted=play(id,options);calls.push({id,accepted});return accepted;};
 const engines=Object.fromEntries(['player','opponent'].map(side=>[side,new MatchEngine({onEvent:e=>{trace.push({side,...e});if(attached)events.engine(e,side);}})]));
 const map=MAPS.find(m=>m.id===mapId),arena=new ArenaSession({...engines,map});
 arena.start(0,19);arena.ready('player',0);arena.ready('opponent',0);arena.update(3000);calls.length=0;
 const c=map.environment,warn=3000+c.firstDelay,fall=warn+c.warning,land=fall+c.impact;
 function update(t){p.nodes.forEach(n=>n.end());p.at(t);arena.update(t);}
 update(warn);update(fall);update(land);
 if(mapId==='crystal'){
  // A real legal swap beside frozen terrain must produce the clear-reason thaw.
  const e=engines.player,moves=legalMoves(e.board,e.ruleTerrain).filter(([a,b])=>e.canSwap(a,b));
  for(const [a,b] of moves){
   if(!e.frozenCells.size)break;
   arena.command('player',{kind:'swap',a,b});for(let t=e.now+25,end=e.now+2000;t<=end;t+=25)update(t);
   if(trace.some(e=>e.kind==='map-restored'&&e.type==='freeze'&&e.reason==='clear'))break;
  }
  assert.ok(trace.some(e=>e.kind==='map-restored'&&e.type==='freeze'&&e.reason==='clear'),'existing valid clears reach frozen cells');
 }
 if(mapId==='furnace'){update(land+c.spreadInterval-c.spreadWarning);update(land+c.spreadInterval);}
 const snapshot=()=>JSON.parse(JSON.stringify({status:arena.status,environment:arena.environment.state,counts:arena.environment.counts,boards:Object.fromEntries(Object.entries(engines).map(([side,e])=>[side,{board:e.board,score:e.score,locks:e.locks,transactions:e.transactions,freeze:[...e.frozenCells],blocks:[...e.temporaryBlocks],random:e.random.state}]))}));
 const state=snapshot();arena.dispose();p.audio.stopAll();return {calls,trace,state,nodes:p.nodes};
}

test('stage 3 real map phases map to 8 distinct recordings; cell and board fanout merge',()=>{
 const expected={cliff:['cliff.warning','cliff.fall','cliff.impact'],crystal:['ice.freeze','ice.break'],ruins:['ruins.activate'],furnace:['furnace.warning','furnace.spread']};
 const files=[];
 for(const [map,ids] of Object.entries(expected)){
  const r=run(map);const environment=r.calls.filter(c=>c.id.match(/^(cliff|ice|ruins|furnace)\./));
  for(const id of ids){assert.ok(environment.some(c=>c.id===id&&c.accepted),id);files.push(AUDIO_MANIFEST[id].src);}
  if(map!=='crystal')assert.deepEqual(environment.map(c=>c.id),map==='furnace'?[...ids,...ids]:ids);
 }
 assert.equal(new Set(files).size,8);
});

test('stage 3 rapid map requests stay bounded, never queue; later legitimate phase plays',()=>{
 const p=transport(),ids=['cliff.warning','cliff.fall','cliff.impact','ice.freeze','ice.break','ruins.activate','furnace.warning','furnace.spread'];
 for(let i=0;i<200;i++){p.at(i*5);p.audio.play(ids[i%ids.length]);}
 assert.equal(p.nodes.length,2);assert.equal(p.audio.snapshot().active,2);
 p.nodes.forEach(n=>n.end());assert.equal(p.audio.snapshot().active,0);assert.equal(p.nodes.length,2);
 p.at(4000);assert.equal(p.audio.play('cliff.impact'),true);p.audio.stopAll();
});

test('stage 3 environment ducks under clear/chain/skill and releases capacity to core',()=>{
 for(const id of ['block.match3','block.combo','special.line','special.bomb','special.combo']){
  const p=transport();assert.ok(p.audio.play('cliff.warning'));const original=p.nodes[0].volume;
  assert.ok(p.audio.play(id));assert.equal(p.nodes[0].volume,original*.50);assert.equal(p.nodes[1].volume,AUDIO_MANIFEST[id].volume);
  p.nodes[1].end();assert.equal(p.nodes[0].volume,original);
  p.audio.environmentVolume=0;assert.equal(p.audio.snapshot().active,0);assert.equal(p.audio.play('ice.freeze'),false);
  p.at(3000);assert.ok(p.audio.play(id));assert.equal(p.nodes.at(-1).volume,AUDIO_MANIFEST[id].volume);p.audio.stopAll();
 }
 const p=transport({maxConcurrent:2});p.audio.play('cliff.warning');p.audio.play('ice.freeze');
 assert.ok(p.audio.play('special.line'));assert.equal(p.audio.snapshot().active,2);assert.equal(p.nodes[0].paused,1);p.audio.stopAll();
});

test('stage 3 all four maps have identical actual boards, scores, phases and traces when environment muted or audio detached',()=>{
 for(const map of ['cliff','crystal','ruins','furnace']){
  const on=run(map),muted=run(map,0),detached=run(map,0,false);
  assert.deepEqual(muted.state,on.state);assert.deepEqual(detached.state,on.state);
  assert.deepEqual(muted.trace,on.trace);assert.deepEqual(detached.trace,on.trace);
  assert.ok(muted.calls.filter(c=>/^(cliff|ice|ruins|furnace)\./.test(c.id)).every(c=>!c.accepted));
 }
});
