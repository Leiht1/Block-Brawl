import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../dist/audio-manager.mjs';
import {AUDIO_MANIFEST,canonicalAudioId} from '../dist/audio-manifest.mjs';
import {createAudioEvents,resolveEngineAudioEvent} from '../dist/audio-events.mjs';
import {MatchEngine,seeded} from '../dist/engine.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {MAPS} from '../dist/maps.mjs';

// Unit transports are inert lifecycle doubles; real files are checked in the browser.
function transport({play=()=>Promise.resolve(),maxConcurrent=8,maxPerChannel=3}={}){
  let now=0;const nodes=[];
  const audio=new AudioManager({manifest:{},soundEnabled:true,development:false,maxConcurrent,maxPerChannel,now:()=>now,createAudio:src=>{
    const handlers=new Map(),node={src,volume:0,pauses:0,play,pause(){this.pauses++;},load(){},removeAttribute(){},addEventListener(k,fn){handlers.set(k,fn);},removeEventListener(k){handlers.delete(k);},fire(k){handlers.get(k)?.();}};nodes.push(node);return node;
  }});
  const register=(id,options={})=>audio.register(id,{src:'./assets/audio/block/approved-v1.ogg',channel:'effect',...options});
  return {audio,nodes,register,at:t=>{now=t;}};
}

test('empty resources and unknown IDs stay silent without constructing audio; development notice is bounded',()=>{
  const notices=[];let constructs=0;
  const manifest=Object.fromEntries(Object.entries(AUDIO_MANIFEST).map(([id,e])=>[id,{...e,src:null,variants:undefined}]));
  const audio=new AudioManager({manifest,soundEnabled:true,development:true,logger:line=>notices.push(line),createAudio:()=>{constructs++;throw Error('must not construct');}});
  const count=Object.keys(AUDIO_MANIFEST).length;assert.equal(audio.snapshot().reserved,count);assert.equal(audio.snapshot().configured,0);
  for(let n=0;n<10;n++)for(const id of [...Object.keys(AUDIO_MANIFEST),'unknown.event'])assert.equal(audio.play(id),false);
  assert.equal(constructs,0);assert.equal(audio.snapshot().active,0);assert.equal(notices.length,count+1);
  assert.equal(canonicalAudioId('maps.cliff.warning'),'cliff.warning');
  assert.equal(canonicalAudioId('map.cliff.rockfall'),'cliff.fall');
  assert.equal(canonicalAudioId('combo.match3'),'block.match3');
  const production=[];new AudioManager({soundEnabled:true,development:false,logger:x=>production.push(x)}).play('block.swap');assert.deepEqual(production,[]);
});

test('disabling stops active sounds and new requests; zero volume never constructs a transport',()=>{
  const p=transport();p.register('block.swap');assert.equal(p.audio.play('block.swap'),true);
  p.audio.soundEnabled=false;assert.equal(p.nodes[0].pauses,1);assert.equal(p.audio.snapshot().active,0);assert.equal(p.audio.play('block.swap'),false);
  p.audio.soundEnabled=true;p.audio.masterVolume=0;assert.equal(p.audio.play('block.swap'),false);assert.equal(p.nodes.length,1);
  p.audio.masterVolume=1;assert.equal(p.audio.play('block.swap'),true);p.audio.stopAll();
});

test('master, category and resource gains multiply and update active voices',()=>{
  const p=transport();p.register('block.swap',{volume:0.5});p.audio.masterVolume=0.8;p.audio.effectVolume=0.5;
  p.audio.play('block.swap');assert.equal(p.nodes[0].volume,0.2);
  p.audio.masterVolume=0.4;assert.equal(p.nodes[0].volume,0.1);p.audio.effectVolume=2;assert.equal(p.audio.effectVolume,1);assert.equal(p.nodes[0].volume,0.2);
  p.audio.setChannelVolume('missing',0);assert.equal(p.nodes[0].volume,0.2);p.audio.stopAll();
});

test('ten quick clears merge without queued replay; the next window accepts one',()=>{
  const p=transport();p.register('block.match3',{mergeGroup:'match',cooldownMs:120});p.register('block.combo',{mergeGroup:'match',cooldownMs:120});
  for(let n=0;n<10;n++){p.at(n*10);assert.equal(p.audio.play(n%2?'block.combo':'block.match3'),n===0);}
  assert.equal(p.nodes.length,1);p.at(120);assert.equal(p.audio.play('block.combo'),true);assert.equal(p.nodes.length,2);p.audio.stopAll();
});

test('pending requests count toward global/channel limits and ended releases a slot',()=>{
  const p=transport({play:()=>new Promise(()=>{}),maxConcurrent:3,maxPerChannel:2});
  for(const id of ['a','b','c'])p.register(id);p.register('d',{channel:'ui'});p.register('e',{channel:'environment'});
  assert.equal(p.audio.play('a'),true);assert.equal(p.audio.play('b'),true);assert.equal(p.audio.play('c'),false);
  assert.equal(p.audio.play('d'),true);assert.equal(p.audio.play('e'),false);assert.equal(p.audio.snapshot().active,3);
  p.nodes[0].fire('ended');assert.equal(p.audio.snapshot().active,2);assert.equal(p.audio.play('e'),true);p.audio.stopAll();
});

test('media errors, play rejection, construction failure and late rejection do not escape',async()=>{
  const p=transport({play:()=>Promise.reject(Error('autoplay denied'))});p.register('a');assert.equal(p.audio.play('a'),true);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(p.audio.snapshot().active,0);
  const q=transport();q.register('a');q.audio.play('a');q.nodes[0].fire('error');assert.equal(q.audio.snapshot().active,0);
  const r=transport({play:()=>{throw Error('synchronous error');}});r.register('a');assert.equal(r.audio.play('a'),false);assert.equal(r.audio.snapshot().active,0);
  const broken=new AudioManager({manifest:{a:{src:'./assets/audio/ui/approved-v1.ogg',channel:'ui'}},soundEnabled:true,development:false,createAudio:()=>{throw Error('no device');}});assert.equal(broken.play('a'),false);assert.equal(broken.snapshot().active,0);
  let reject;const late=transport({play:()=>new Promise((_,r)=>{reject=r;})});late.register('a');late.audio.play('a');late.audio.soundEnabled=false;reject(Error('late rejection'));
  await new Promise(resolve=>setImmediate(resolve));assert.equal(late.audio.snapshot().active,0);assert.equal(late.nodes[0].pauses,1);
});

test('hung playback times out and frees capacity',async()=>{
  const p=transport({play:()=>new Promise(()=>{})});p.register('a',{maxDurationMs:15});p.audio.play('a');
  await new Promise(resolve=>setTimeout(resolve,30));assert.equal(p.audio.snapshot().active,0);assert.equal(p.nodes[0].pauses,1);
});

test('formal registration rejects external/traversal paths and invalid configuration without reading files',()=>{
  const p=transport();for(const src of ['https://example.com/a.ogg','./assets/audio/block/../a.ogg','./assets/audio/test.wav'])assert.equal(p.audio.register('x',{src,channel:'effect'}),false);
  assert.equal(p.register('x',{cooldownMs:NaN}),false);assert.equal(p.register('x',{maxDurationMs:0}),false);assert.equal(p.register('x',{channel:'bad'}),false);
  assert.equal(p.register('block.swap'),true);assert.equal(p.audio.snapshot().configured,1);assert.equal(p.nodes.length,0);
});

test('engine translation distinguishes chain, combo, special type and real ice break; cleanup stays silent',()=>{
  const calls=[],events=createAudioEvents({play:id=>{calls.push(id);return true;},stopAll(){}});
  for(const e of [{kind:'swap'},{kind:'revert'},{kind:'clear',depth:1},{kind:'clear',depth:2},{kind:'fall'},{kind:'special-create'},{kind:'special-trigger',tile:{special:'row'}},{kind:'special-trigger',tile:{special:'blast'}},{kind:'combo-trigger'},{kind:'map-restored',type:'freeze',reason:'clear',round:1,time:0}])events.engine(Object.freeze(e));
  assert.deepEqual(calls,['block.swap','block.invalid','block.match3','block.combo','block.fall','special.create','special.line','special.bomb','special.combo','ice.break']);
  for(const e of [{kind:'clear',comboType:'line-line'},{kind:'score'},{kind:'map-restored',type:'freeze',reason:'cleanup'},{kind:'map-blocked',type:'mechanism'},{kind:'map-cancel',type:'fire'}])assert.equal(resolveEngineAudioEvent(e),null);
});

test('real dual-board map callbacks merge once per phase, while a new time and reset can trigger again',()=>{
  for(const id of ['cliff','crystal','ruins','furnace']){
    const calls=[],events=createAudioEvents({play:id=>calls.push(id),stopAll(){}}),map=MAPS.find(m=>m.id===id);
    const player=new MatchEngine({onEvent:e=>events.engine(e)}),opponent=new MatchEngine({onEvent:e=>events.engine(e,'opponent')});
    const arena=new ArenaSession({player,opponent,map});arena.start(0,19);arena.ready('player',0);arena.ready('opponent',0);arena.update(3000);
    const c=map.environment,warn=3000+c.firstDelay,fall=warn+c.warning,land=fall+c.impact;calls.length=0;
    arena.update(warn);arena.update(fall);arena.update(land);
    assert.deepEqual(calls,id==='cliff'?['cliff.warning','cliff.fall','cliff.impact']:id==='crystal'?['ice.freeze']:id==='ruins'?['ruins.activate']:['furnace.warning','furnace.spread']);
    if(id==='furnace'){arena.update(land+c.spreadInterval-c.spreadWarning);arena.update(land+c.spreadInterval);assert.deepEqual(calls.slice(2),['furnace.warning','furnace.spread']);}
    arena.dispose();
  }
  const calls=[],events=createAudioEvents({play:id=>calls.push(id),stopAll(){}}),e={kind:'rock-warning',time:100,round:1};
  events.engine(e);events.engine(e,'opponent');events.engine({...e,time:200});events.engine({kind:'reset'});events.engine(e);assert.equal(calls.length,3);
});

test('flow observer emits countdown/start/result on transitions without replays or state mutation',()=>{
  const calls=[],events=createAudioEvents({play:id=>calls.push(id),stopAll(){}}),arena={status:'countdown',winner:'player',countdown:now=>3-Math.floor(now/1000)},flow={screen:'arena',arena};
  events.observeFlow(flow,0);events.observeFlow(flow,100);events.observeFlow(flow,1000);events.observeFlow(flow,2000);
  arena.status='playing';events.observeFlow(flow,3000);events.observeFlow(flow,3100);arena.status='finished';events.observeFlow(flow,4000);events.observeFlow(flow,4100);
  assert.deepEqual(calls,['ui.countdown','ui.countdown','ui.countdown','ui.countdown','ui.win']);assert.equal(arena.status,'finished');
  flow.arena=null;flow.session={status:'lost'};flow.screen='tutorial';events.observeFlow(flow,5000);assert.equal(calls.at(-1),'ui.lose');
});

test('seeded actual gameplay produces identical boards, scores, locks and event traces with audio enabled, disabled or detached',()=>{
  function run(mode,enabled){
    const trace=[],p=transport(),audio=p.audio;audio.registerManifest(AUDIO_MANIFEST);audio.soundEnabled=enabled;const events=createAudioEvents(audio);
    const engine=new MatchEngine({random:seeded(19),onEvent:e=>{trace.push(e);if(enabled!==null)events.engine(e);}});
    engine.reset(mode);engine.swap(...engine.practiceMove);for(let t=0;t<=5000;t+=25)engine.tick(t);
    audio.stopAll();return {board:engine.board,score:engine.score,bestChain:engine.bestChain,locks:engine.locks,transactions:engine.transactions,trace};
  }
  for(const mode of ['chain','combo-blasts']){const baseline=run(mode,null);assert.ok(baseline.score>0);assert.deepEqual(run(mode,true),baseline);assert.deepEqual(run(mode,false),baseline);}
});

test('core manifest retains 10 enabled IDs and 16 core files; stage 3 adds 8 map files',()=>{
  const populated=Object.entries(AUDIO_MANIFEST).filter(([id,e])=>e.src&&(e.channel==='effect'||id==='ui.countdown'));
  assert.equal(populated.length,10);
  const files=new Set(populated.flatMap(([,e])=>[e.src,...Object.values(e.variants||{}).map(v=>v.src)]));
  assert.equal(files.size,16);
  for(const [id,e] of populated){assert.ok(e.volume>0&&e.volume<1);assert.ok(e.mergeGroup);assert.ok(e.voiceLimit);assert.equal(e.maxDurationMs,1600);}
  const maps=Object.entries(AUDIO_MANIFEST).filter(([,e])=>e.src&&e.channel==='environment');
  assert.equal(maps.length,8);assert.equal(new Set(maps.map(([,e])=>e.src)).size,8);
  for(const [id,e] of Object.entries(AUDIO_MANIFEST))if(['ruins.pillar','ui.win','ui.lose'].includes(id))assert.equal(e.src,null);
});

test('chain depth selects three distinct files; higher levels cap; engine event remains immutable',()=>{
  const calls=[],events=createAudioEvents({play:(id,options)=>{calls.push([id,options]);return true;},stopAll(){}});
  for(const depth of [2,3,4,8])events.engine(Object.freeze({kind:'clear',depth}));
  assert.deepEqual(calls.map(c=>c[1].variant),['combo1','combo2','combo3','combo3']);
  const p=transport();p.audio.registerManifest(AUDIO_MANIFEST);
  for(const [i,variant] of ['combo1','combo2','combo3'].entries()){
    p.at(i*1000);assert.ok(p.audio.play('block.combo',{variant}));assert.ok(p.nodes.at(-1).src.endsWith(`${variant}-v2.wav`));p.nodes.at(-1).fire('ended');
  }
  assert.deepEqual(p.nodes.map(n=>n.volume),[.48,.51,.54]);
});

test('recorded match lane never overlaps or stops an accepted combo; rapid special cues merge; operation still plays',()=>{
  const p=transport();p.audio.registerManifest(AUDIO_MANIFEST);
  assert.ok(p.audio.play('block.combo',{variant:'combo1'}));
  p.at(130);assert.equal(p.audio.play('block.combo',{variant:'combo2'}),false);
  assert.equal(p.nodes[0].pauses,0);assert.equal(p.nodes.length,1);
  assert.ok(p.audio.play('special.bomb'));assert.ok(p.audio.play('block.swap'));
  p.at(280);assert.equal(p.audio.play('special.combo'),false);
  for(let n=0;n<50;n++)assert.equal(p.audio.play('block.match3'),false);
  assert.equal(p.audio.snapshot().active,3);p.nodes[0].fire('ended');
  assert.ok(p.audio.play('block.combo',{variant:'combo3'}));
  p.audio.stopAll();assert.equal(p.audio.snapshot().active,0);assert.equal(p.nodes.length,4);
});

test('countdown chooses ascending note variants 3/2/1 and start only on countdown -> playing',()=>{
  const calls=[],events=createAudioEvents({play:(id,options)=>calls.push({id,options}),stopAll(){}});
  const arena={status:'countdown',countdown:t=>3-Math.floor(t/1000)},flow={screen:'arena',arena};
  for(const t of [0,1000,2000])events.observeFlow(flow,t);
  arena.status='playing';events.observeFlow(flow,3000);events.observeFlow(flow,3100);
  assert.equal(calls.length,4);assert.ok(calls.every(c=>c.id==='ui.countdown'));
  assert.deepEqual(calls.map(c=>c.options.variant),['3','2','1','start']);
  assert.deepEqual(calls.at(-1).options,{variant:'start'});
});

test('sound starts enabled, stays silent before input, and can still be explicitly disabled',()=>{
  let constructs=0;
  const audio=new AudioManager({development:false,createAudio:()=>{constructs++;}});
  assert.equal(audio.soundEnabled,true);assert.equal(constructs,0);
  assert.equal(new AudioManager({soundEnabled:false}).soundEnabled,false);
});

test('actual special combinations select distinct releases and never add ordinary match pops',()=>{
  const selected=[];
  for(const [mode,type] of [['combo-lines','line-line'],['combo-cross','line-blast'],['combo-blasts','blast-blast']]){
    const p=transport();p.audio.registerManifest(AUDIO_MANIFEST);const events=createAudioEvents(p.audio),calls=[];
    const engine=new MatchEngine({random:seeded(19),onEvent:e=>{calls.push(e);events.engine(e);}});
    engine.reset(mode);engine.swap(...engine.practiceMove);p.at(100);engine.tick(100);
    const combo=calls.find(e=>e.kind==='combo-trigger');assert.equal(combo.type,type);
    assert.equal(resolveEngineAudioEvent(calls.find(e=>e.kind==='clear')),null);
    const expected=new URL(AUDIO_MANIFEST['special.combo'].variants[type].src,import.meta.url.replace('/tests/audio.test.mjs','/dist/audio-manager.mjs')).href;
    const node=p.nodes.find(n=>n.src===expected);
    assert.ok(node);assert.equal(node.src,expected);
    selected.push(node.src);p.audio.stopAll();
  }
  assert.equal(new Set(selected).size,3);
  const clear=Object.freeze({kind:'clear',depth:1,tiles:[{tile:{special:'row'}}]});
  assert.equal(resolveEngineAudioEvent(clear),null);
  assert.equal(resolveEngineAudioEvent({kind:'clear',depth:1,tiles:[{tile:{special:null}}]}),'match_complete');
});

test('variant registration rejects external files and invalid gain/voice bounds',()=>{
  const p=transport();
  for(const variants of [null,[],{bad:{src:'https://example.com/a.wav'}},{bad:{src:'./assets/audio/block/a.wav',volume:NaN}},{bad:{src:'./assets/audio/block/a.wav',channel:'ui'}}])assert.equal(p.register('x',{variants}),false);
  for(const voiceLimit of [0,-1,1.2,NaN])assert.equal(p.register('x',{voiceLimit}),false);
});
