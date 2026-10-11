import test from 'node:test';
import assert from 'node:assert/strict';
import {MapReveal,REVEAL_STEPS} from '../dist/map-reveal.mjs';
import {MAPS} from '../dist/maps.mjs';
test('reveal draws once, cycles all five maps with deceleration for 2s and locks for 2s',()=>{
 let rolls=0;const r=new MapReveal(100,()=>{rolls++;return .53;});
 assert.deepEqual(REVEAL_STEPS.slice(0,5).map(t=>r.at(t+100).map.id),MAPS.map(m=>m.id));
 const intervals=REVEAL_STEPS.slice(1).map((t,n)=>t-REVEAL_STEPS[n]);assert.ok(intervals.every((t,n)=>n===0||t>intervals[n-1]));
 assert.equal(r.at(2099).phase,'cycling');assert.equal(r.at(2100).phase,'locked');assert.equal(r.at(4099).phase,'locked');assert.equal(r.at(4100).phase,'complete');assert.equal(r.at(99999).map,MAPS[2]);assert.equal(rolls,1);
});
test('cancelled reveals never complete; fresh matches draw afresh and reduced motion avoids rapid flips',()=>{
 const a=new MapReveal(0,()=>.3,true);assert.equal(a.at(0).map,MAPS[1]);assert.equal(a.at(2900).map,MAPS[1]);a.cancel();assert.equal(a.at(10000).phase,'cancelled');
 const b=new MapReveal(10000,()=>.8);assert.equal(b.at(14000).map,MAPS[4]);assert.equal(b.at(14000).phase,'complete');
});
