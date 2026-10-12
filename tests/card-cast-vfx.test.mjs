import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {CardCastPlayback,castFrame,CAST_TIMING} from '../dist/card-cast-vfx.mjs';
import {CAST_ASSETS,CARD_ART} from '../dist/card-cast-assets.mjs';
const event=(id='fire',extra={})=>({kind:'cast',side:'player',targetSide:'opponent',card:{id,uid:1},index:12,landing:12,cells:[11,12,13],now:1000,...extra});
test('successful release consumes the captured hand origin, not the drop location',()=>{
  const p=new CardCastPlayback();p.prepare({id:'fire',uid:1},{x:300,y:800},[116,153],500);p.cast(event(),{x:800,y:200});
  assert.deepEqual(p.casts[0].origin,{x:300,y:800});assert.equal(p.prepared.size,0);assert.equal(p.casts[0].type,'attack');
  assert.equal(p.at(1959).casts.length,1);assert.equal(p.at(1960).casts.length,0);assert.equal(CAST_TIMING.flightStart+CAST_TIMING.flight+CAST_TIMING.impact,960);
});
test('all types animate every painted phase with exact row-major loop and terminal behavior',()=>{
  for(const type of ['attack','control','buff'])for(const [stage,a] of Object.entries(CAST_ASSETS[type])){
    assert.deepEqual(Array.from({length:a.frameCount},(_,i)=>castFrame(type,stage,i*a.frameMs)),Array.from({length:a.frameCount},(_,i)=>i));
    assert.equal(castFrame(type,stage,a.frameCount*a.frameMs),a.loop?0:a.frameCount-1);
  }
});
test('meteor landing and quake bottom-row target use the committed cast plan',()=>{
  const p=new CardCastPlayback();p.cast(event('meteor',{index:4,landing:52}),{x:0,y:0});p.cast(event('quake',{cells:[56,57,58,59,60,61,62,63],landing:4}),{x:0,y:0});
  assert.equal(p.casts[0].index,52);assert.equal(p.casts[1].index,60);
});
test('rainbow observes the real engine target and can wait without a fabricated impact',()=>{
  const p=new CardCastPlayback();p.cast(event('rainbow',{targetSide:'player'}),{x:300,y:800});
  assert.equal(p.at(4000).casts.length,1);assert.equal(p.casts[0].resolved,false);
  p.boardEvent('opponent',{kind:'card-change',card:'rainbow',index:39},4000);assert.equal(p.casts[0].resolved,false);
  p.boardEvent('player',{kind:'card-change',card:'rainbow',index:39},4000);
  assert.equal(p.casts[0].index,39);assert.equal(p.casts[0].flightEnd,4180);assert.equal(p.at(4579).casts.length,1);assert.equal(p.at(4580).casts.length,0);
});
test('simultaneous opposite-side rainbow casts resolve independently in cast order',()=>{
  const p=new CardCastPlayback();p.cast(event('rainbow',{targetSide:'player'}),{x:0,y:0});p.cast(event('rainbow',{side:'opponent',targetSide:'opponent',card:{id:'rainbow',uid:2}}),{x:1,y:1});
  p.boardEvent('opponent',{kind:'card-change',card:'rainbow',index:40},1100);p.boardEvent('player',{kind:'card-change',card:'rainbow',index:18},1100);
  assert.deepEqual(p.casts.map(c=>[c.type,c.index,c.targetSide]),[['buff',18,'player'],['buff',40,'opponent']]);
});
test('cancel and reset release all transient state without producing a cast',()=>{
  const p=new CardCastPlayback();p.prepare({id:'freeze',uid:9},{x:0,y:0},[116,153],0);p.cancel(9);assert.equal(p.at(100).prepared.length,0);assert.equal(p.casts.length,0);
  p.cast(event(),{x:0,y:0});p.reset();assert.deepEqual(p.at(10000),{prepared:[],casts:[]});
});
test('a completed rainbow action with no eligible ordinary tile leaves no waiting orb',()=>{
  const p=new CardCastPlayback();p.cast(event('rainbow',{targetSide:'player'}),{x:0,y:0});p.effect({kind:'effect',id:'rainbow',side:'player',targetSide:'player'});assert.equal(p.at(1100).casts[0].noTarget,true);assert.equal(p.at(1200).casts.length,0);
});
test('runtime atlases are exact copies of the approved sheets and all twelve card faces are present',async()=>{
  for(const [type,stages] of Object.entries(CAST_ASSETS))for(const [stage,a] of Object.entries(stages)){
    const runtime=await fs.readFile(new URL('../dist/'+a.url.slice(2),import.meta.url));
    const approved=await fs.readFile(new URL('../art-preproduction/cast-fx-stage3/atlases/'+type+'-'+stage+'.webp',import.meta.url));assert.ok(runtime.equals(approved));
  }
  assert.equal(Object.keys(CARD_ART).length,12);for(const url of Object.values(CARD_ART))assert.ok((await fs.stat(new URL('../dist/'+url.slice(2),import.meta.url))).size>0);
});
