import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../dist/audio-manager.mjs';
import {AUDIO_MANIFEST,canonicalAudioId} from '../dist/audio-manifest.mjs';
import {createAudioEvents} from '../dist/audio-events.mjs';
const flush=()=>new Promise(r=>setImmediate(r));
function setup({pending=false,reject=false}={}){
  const sources=[],nodes=[],params=[],requests=[];let decode;
  const param=()=>{const p={value:0,events:[],setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);},linearRampToValueAtTime(v,t){this.value=v;this.events.push(['ramp',v,t]);},cancelScheduledValues(){},cancelAndHoldAtTime(){},setTargetAtTime(v,t,k){this.value=v;this.events.push(['target',v,t,k]);}};params.push(p);return p;};
  const ctx={currentTime:0,state:'running',destination:{},resume(){this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();},createGain(){return {gain:param(),connect(){},disconnect(){}};},createBufferSource(){const s={starts:0,stops:0,connect(){},disconnect(){},start(){this.starts++;},stop(){this.stops++;}};sources.push(s);return s;},decodeAudioData(){return pending?new Promise(r=>decode=r):Promise.resolve({duration:120});}};
  const audio=new AudioManager({development:false,createContext:()=>ctx,fetchAudio:async url=>{requests.push(url);if(reject)throw Error('offline');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};},createAudio:src=>{const n={src,volume:0,play:()=>Promise.resolve(),pause(){},removeAttribute(){},load(){},addEventListener(){},removeEventListener(){}};nodes.push(n);return n;}});
  return {audio,ctx,sources,nodes,params,requests,resolve:()=>decode({duration:120})};
}
test('music requires a gesture, loops full decoded buffer, has no SFX watchdog, caches decoding',async()=>{
  const p=setup();p.audio.setBgm('bgm.lobby');await flush();assert.equal(p.requests.length,0);
  p.audio.unlock();await flush();assert.equal(p.sources.length,1);const s=p.sources[0];assert.equal(s.loop,true);assert.equal(s.loopStart,0);assert.equal(s.loopEnd,120);
  assert.equal(p.audio.active.size,0);assert.equal(p.audio.musicVoices.size,1);assert.equal([...p.audio.musicVoices][0].timer,undefined);
  for(let i=0;i<20;i++){p.audio.setBgm('bgm.lobby');p.audio.unlock();}await flush();assert.equal(p.sources.length,1);assert.equal(p.requests.length,1);p.audio.stopAll();
});
test('crossfade starts at zero and ramps both tracks, rapid changes are bounded',async()=>{
  const p=setup();p.audio.unlock();p.audio.setBgm('bgm.lobby');await flush();p.ctx.currentTime=5;
  p.audio.setBgm('bgm.battle',{fadeMs:900});await flush();assert.equal(p.audio.musicVoices.size,2);
  assert.deepEqual(p.params[1].events.at(-1),['ramp',0,5.9]);assert.deepEqual(p.params[2].events.slice(-2),[['set',0,5],['ramp',AUDIO_MANIFEST['bgm.battle'].volume,5.9]]);
  p.audio.setBgm('bgm.lobby');await flush();assert.ok(p.audio.musicVoices.size<=2);assert.equal(p.sources[0].stops,1);p.audio.stopAll();assert.equal(p.audio.musicVoices.size,0);
});
test('late decoding after mute, cancellation and concurrent unlock cannot start stale music',async()=>{
  const p=setup({pending:true});p.audio.setBgm('bgm.lobby');p.audio.unlock();await flush();p.audio.setBgmEnabled(false);p.resolve();await flush();assert.equal(p.sources.length,0);
  p.audio.setBgmEnabled(true);p.audio.unlock();await flush();assert.equal(p.sources.length,1);p.audio.stopAll();
  const q=setup({pending:true});q.audio.unlock();q.audio.setBgm('bgm.battle');await flush();q.audio.setBgm(null);q.resolve();await flush();assert.equal(q.sources.length,0);
});
test('music and effects toggles are independent; core/environment ducks only music bus',async()=>{
  const p=setup();p.audio.unlock();p.audio.setBgm('bgm.battle');await flush();
  p.audio.play('block.combo');assert.equal(p.audio.snapshot().music.duck,.65);assert.equal(p.params[0].value,.65);
  p.audio.play('cliff.warning');assert.equal(p.audio.snapshot().music.duck,.60);
  p.audio.play('ice.freeze');assert.equal(p.audio.snapshot().music.duck,.18);
  p.audio.setSoundEnabled(false);assert.equal(p.audio.musicVoices.size,1);assert.deepEqual(p.audio.snapshot().music.playing,['bgm.battle']);assert.equal(p.audio.snapshot().music.duck,1);
  p.audio.setBgmEnabled(false);p.audio.setSoundEnabled(true);assert.equal(p.audio.play('ui.click'),true);assert.equal(p.audio.snapshot().bgmEnabled,false);p.audio.stopAll();
});
test('hidden-page suspension and unavailable music do not affect UI or gameplay',async()=>{
  const p=setup();p.audio.unlock();p.audio.setBgm('bgm.lobby');await flush();p.audio.setSuspended(true);assert.equal(p.ctx.state,'suspended');p.audio.setSuspended(false);await flush();assert.equal(p.ctx.state,'running');assert.equal(p.sources.length,1);p.audio.stopAll();
  const q=setup({reject:true});q.audio.unlock();q.audio.setBgm('bgm.battle');await flush();for(let i=0;i<10;i++)q.audio.setBgm('bgm.battle');assert.equal(q.requests.length,1);assert.ok(q.audio.play('ui.click'));q.audio.stopAll();
});
test('UI does not overlap rapid clicks; reserved aliases resolve to formal files',()=>{
  const p=setup();assert.equal(p.audio.play('ui.click'),true);for(let i=0;i<30;i++)assert.equal(p.audio.play('ui.back'),false);assert.equal(p.nodes.length,1);
  assert.equal(canonicalAudioId('ui.start'),'ui.confirm');assert.equal(canonicalAudioId('ui.mapReveal'),'map.reveal');p.audio.stopAll();
  for(const id of ['bgm.lobby','bgm.battle','ui.click','ui.confirm','map.shuffle','map.reveal']){const e=AUDIO_MANIFEST[id];assert.ok(e.src);assert.ok(e.source.url);assert.ok(e.license);assert.ok(e.volume>0&&e.volume<=1);assert.equal(e.loop,id.startsWith('bgm.'));}
});
test('observer follows reveal clock once per phase and chooses battle only for actual playing',()=>{
  const calls=[],music=[],a={play:id=>calls.push(id),stopEffects(){},setBgm:id=>music.push(id)},events=createAudioEvents(a);
  const reveal={start:0,at:t=>({phase:t<2000?'cycling':t<4000?'locked':'complete'})},flow={screen:'matching',reveal};
  for(const t of [0,1,650,651,1300,1301,1950,1975,2000,2001,3999])events.observeFlow(flow,t);
  assert.deepEqual(calls,['map.shuffle','map.shuffle','map.shuffle','map.reveal']);assert.deepEqual(music,['bgm.lobby']);
  flow.reveal=null;flow.screen='arena';flow.arena={status:'countdown',countdown:()=>3};events.observeFlow(flow,4000);assert.equal(music.length,1);
  flow.arena.status='playing';events.observeFlow(flow,7000);events.observeFlow(flow,7100);assert.equal(music.at(-1),'bgm.battle');
  flow.arena.status='finished';events.observeFlow(flow,9000);assert.equal(music.at(-1),'bgm.lobby');
  flow.screen='difficulty';flow.arena=null;events.observeFlow(flow,9100);assert.equal(calls.filter(c=>c==='map.reveal').length,1);
  const second={start:9200,at:t=>reveal.at(t-9200)};flow.reveal=second;flow.screen='matching';events.observeFlow(flow,9200);assert.equal(calls.at(-1),'map.shuffle');
  flow.reveal=null;flow.screen='difficulty';events.observeFlow(flow,9300);assert.equal(calls.filter(c=>c==='map.reveal').length,1); // cancellation never emits a late reveal
});
