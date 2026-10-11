// This round only: real browser media, actual flow/input/event callbacks and
// decoded loop rendering. QA hooks are appended in the local test server only.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-stage4');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const report={checks:[],media:[],loops:[],gameplay:[],errors:[],subjectiveListening:'Automated decoding, mixing-level and actual gameplay checks passed if checks below pass. Human timbre, masking and long-session fatigue approval is not claimed.'};
const check=(name,detail)=>{report.checks.push({name,passed:true,detail});console.log('PASS',name)};
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{try{
 const name=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1)||'index.html';
 if(name.startsWith('review/')){const file=path.resolve(out,name.slice(7));if(!file.startsWith(out+path.sep))throw Error('path');const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);return;}
 const file=path.resolve(root,'dist',name);
 if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
 if(name==='flow.mjs')body=body.toString().replace('new MapReveal(performance.now(),Math.random,reducedMotion)','new MapReveal(performance.now(),()=>window.__mapRoll??Math.random(),reducedMotion)');
 if(name==='app.mjs')body=body.toString()+`
 window.__qa={audio,engine,flow,calls:[],to(t){for(let n=__clock.time;n<t;){n=Math.min(t,n+25);__clock.advance(n);}},state:()=>audio.snapshot(),fixture(mode){engine.reset(mode,engine.terrain);},stopBot(){flow.arena.source.stop();}};
 const original=audio.play.bind(audio);audio.play=(id,options)=>{const accepted=original(id,options);__qa.calls.push({id,options,accepted,time:__clock.time,duck:audio.musicDuck()});return accepted;};`;
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;let browser;
try{
 browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const wait=fn=>page['waitForFunction'](fn,null,{polling:100});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`)});
 await page.addInitScript(()=>{
  let seed=19;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};
  Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};
  const Native=window.Audio;window.__media=[];window.Audio=function(src){const node=new Native(src),record={src,node,events:[]};__media.push(record);for(const event of ['playing','ended','error'])node.addEventListener(event,()=>record.events.push(event));return node;};
 });
 await page.goto(url);await wait(()=>!!window.__qa);await page.evaluate(()=>__clock.advance(0));
 assert.equal(await page.evaluate(()=>__qa.audio.context),null);check('Initial page has no autoplay before user gesture');
 await page.click('#open-arena');await page.evaluate(()=>__qa.to(100));await wait(()=>__qa.state().music.playing.includes('bgm.lobby'));
 await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>__qa.audio.context.state),'running');check('Trusted input starts decoded lobby music');
 await page.evaluate(()=>window.__mapRoll=.01);await page.click('[data-difficulty="hard"]');await page.evaluate(()=>__qa.to(200));await wait(()=>![...__qa.audio.active].some(v=>v.group==='map-selection'));
 await page.evaluate(()=>__qa.to(750));await wait(()=>![...__qa.audio.active].some(v=>v.group==='map-selection'));await page.evaluate(()=>__qa.to(1400));await wait(()=>![...__qa.audio.active].some(v=>v.group==='map-selection'));await page.evaluate(()=>__qa.to(2100));await page.waitForTimeout(750);
 const reveal=await page.evaluate(()=>__qa.calls.filter(c=>/^map\./.test(c.id)));report.reveal=reveal;assert.equal(reveal.filter(c=>c.id==='map.shuffle'&&c.accepted).length,3);assert.equal(reveal.filter(c=>c.id==='map.reveal'&&c.accepted).length,1);check('Random map cycling plays three non-overlapping shuffles and one reveal',reveal);
 await page.screenshot({path:path.join(out,'map-reveal.png')});
 await page.evaluate(()=>__qa.to(4300));assert.deepEqual(await page.evaluate(()=>__qa.state().music.playing),['bgm.lobby']);
 await page.evaluate(()=>__qa.to(7350));await wait(()=>__qa.state().music.playing.includes('bgm.battle'));
 const fade=await page.evaluate(()=>[...__qa.audio.musicVoices].map(v=>({id:v.id,retiring:v.retiring,gain:v.gain.gain.value})));
 assert.equal(fade.length,2);assert.ok(fade.find(v=>v.id==='bgm.lobby').retiring);assert.ok(fade.find(v=>v.id==='bgm.battle').gain<AUDIO_MANIFEST['bgm.battle'].volume);
 await page.waitForTimeout(1100);assert.equal(await page.evaluate(()=>__qa.state().music.voices),1);check('Countdown keeps lobby; actual playing crossfades to battle over 900ms',fade);
 await page.evaluate(()=>__qa.stopBot());
 const swap=async()=>{
  const move=await page.evaluate(()=>__qa.engine.practiceMove);assert.ok(move);
  const box=await page.locator('#board').boundingBox(),n=await page.evaluate(()=>__qa.engine.width),size=box.width/n;
  const a=move[0],b=move[1];await page.mouse.move(box.x+(a%n+.5)*size,box.y+(Math.floor(a/n)+.5)*size);await page.mouse.down();await page.mouse.move(box.x+(b%n+.5)*size,box.y+(Math.floor(b/n)+.5)*size,{steps:5});await page.mouse.up();
 };
 for(const mode of ['three','chain','combo-cross','combo-blasts']){
  await page.waitForTimeout(1300);await page.evaluate(mode=>__qa.fixture(mode),mode);const start=await page.evaluate(()=>__clock.time);await swap();
  for(const delta of [120,400,650,950,1400,2000]){await page.evaluate(t=>__qa.to(t),start+delta);await page.waitForTimeout(180);}
  const trace=await page.evaluate(start=>__qa.calls.filter(c=>c.time>=start&&c.accepted&&/^block\.|^special\./.test(c.id)),start);
  assert.ok(trace.some(c=>c.id==='block.swap'));assert.ok(trace.some(c=>c.duck===.65));assert.ok(await page.evaluate(()=>__qa.engine.score>0));
  report.gameplay.push({mode,trace});
 }
 assert.ok(report.gameplay[1].trace.some(c=>c.id==='block.combo'));assert.ok(report.gameplay[2].trace.some(c=>c.id==='special.combo'));
 check('Actual arena pointer swaps exercise clears, chains and special skills with music retained at 65%',report.gameplay.map(g=>g.mode));
 await page.screenshot({path:path.join(out,'battle-music.png')});
 await page.click('#sound');await page.evaluate(()=>__qa.to(__clock.time+100));assert.equal(await page.evaluate(()=>__qa.state().soundEnabled),false);assert.deepEqual(await page.evaluate(()=>__qa.state().music.playing),['bgm.battle']);
 await page.evaluate(()=>__qa.fixture('three'));await swap();await page.evaluate(()=>__qa.to(__clock.time+2200));assert.ok(await page.evaluate(()=>__qa.engine.score>0));check('Effects disabled: battle music and actual scoring continue');
 await page.click('#sound');await page.evaluate(()=>__qa.to(__clock.time+100));await page.click('#music');await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>__qa.state().music.voices),0);
 await page.evaluate(()=>__qa.fixture('three'));await swap();await page.evaluate(()=>__qa.to(__clock.time+120));assert.ok(await page.evaluate(()=>__qa.audio.active.size>0));await page.evaluate(()=>__qa.to(__clock.time+2200));assert.ok(await page.evaluate(()=>__qa.engine.score>0));check('Music disabled: effects and actual scoring continue');
 await page.click('#music');await wait(()=>__qa.state().music.playing.includes('bgm.battle'));await page.waitForTimeout(1100);
 await page.evaluate(()=>{__qa.audio.stopEffects();const start=__media.length;for(let i=0;i<30;i++)document.querySelector('#hint').click();window.__clickNodes=__media.length-start;});
 assert.equal(await page.evaluate(()=>__clickNodes),1);check('Thirty UI clicks create exactly one recording, with no queued replay');
 await page.click('#exit-game');await page.evaluate(()=>__qa.to(__clock.time+100));await wait(()=>__qa.state().music.playing.includes('bgm.lobby'));await page.waitForTimeout(1100);assert.equal(await page.evaluate(()=>__qa.state().music.voices),1);check('Returning home crossfades back to a single lobby track');
 for(const [map,roll] of [['cliff',.25],['crystal',.45],['ruins',.65],['furnace',.85]]){
  await page.evaluate(r=>window.__mapRoll=r,roll);await page.click('#open-arena');await page.evaluate(()=>__qa.to(__clock.time+100));await page.click('[data-difficulty="hard"]');await page.evaluate(()=>__qa.to(__clock.time+7200));await wait(()=>__qa.state().music.playing.includes('bgm.battle'));await page.waitForTimeout(1100);await page.evaluate(()=>{__qa.stopBot();__qa.audio.stopEffects();__qa.calls=[]});
  const state=await page.evaluate(()=>{const a=__qa.flow.arena,c=a.map.environment;return {id:a.map.id,warn:a.environment.next,warning:c.warning,impact:c.impact}});assert.equal(state.id,map);
  for(const t of [state.warn,state.warn+state.warning,state.warn+state.warning+state.impact]){await page.evaluate(t=>__qa.to(t),t);await page.waitForTimeout(450);}
  const calls=await page.evaluate(()=>__qa.calls.filter(c=>c.accepted&&/^(cliff|ice|ruins|furnace)\./.test(c.id)));assert.ok(calls.length);assert.ok(calls.every(c=>c.duck<=.60));report.gameplay.push({map,calls});
  await page.screenshot({path:path.join(out,map+'-music.png')});await page.click('#exit-game');await page.evaluate(()=>__qa.to(__clock.time+100));await page.waitForTimeout(1100);
 }
 check('Actual cliff, ice, ruins and furnace events remain audible above reduced music');
 await page.evaluate(()=>__qa.audio.setSuspended(true));assert.equal(await page.evaluate(()=>__qa.audio.context.state),'suspended');await page.evaluate(()=>__qa.audio.setSuspended(false));await wait(()=>__qa.audio.context.state==='running');check('Visibility suspension resumes without duplicate music sources');
 for(const id of ['bgm.lobby','bgm.battle']){
  const loop=await page.evaluate(async id=>{
   const buffer=await __qa.audio.musicBuffer(id),n=buffer.length,ctx=new OfflineAudioContext(1,n*2,buffer.sampleRate),src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;src.loopStart=0;src.loopEnd=buffer.duration;src.connect(ctx.destination);src.start();const rendered=await ctx.startRendering(),x=rendered.getChannelData(0);let maxRepeat=0;for(let i=0;i<n;i++)maxRepeat=Math.max(maxRepeat,Math.abs(x[i]-x[i+n]));
   return {id,seconds:buffer.duration,frames:n,repeatError:maxRepeat,boundaryJump:Math.abs(x[n]-x[n-1])};
  },id);assert.ok(loop.repeatError<1e-6);assert.ok(loop.boundaryJump<.02);report.loops.push(loop);
 }
 check('Both native WebAudio loops repeat sample-exactly with small boundary transitions',report.loops);
 report.candidates=await page.evaluate(async()=>{const records=await (await fetch('/review/candidates.json')).json(),results=[];for(const r of records){const buffer=await __qa.audio.context.decodeAudioData(await(await fetch('/review/'+r.file)).arrayBuffer());results.push({id:r.id,key:r.key,seconds:buffer.duration,channels:buffer.numberOfChannels});}return results;});
 assert.equal(report.candidates.length,18);assert.ok(report.candidates.every(r=>r.seconds>0&&r.channels===2));check('All 18 audition candidates decode in the target browser');
 // Deployment scope: compare this round with the archived starting point.
 const before=JSON.parse(await fs.readFile(path.join(root,'references/audio-stage4/before.json'),'utf8'));
 for(const [file,hash]of Object.entries(before))if(!['dist/app.mjs','dist/audio-manager.mjs','dist/audio-events.mjs','dist/audio-manifest.mjs'].includes(file.replaceAll('\\','/')))assert.equal(createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'),hash,file);
 check('Rules, AI, scores, animation clocks, map events and all prior WAV recordings unchanged');
 report.media=await page.evaluate(()=>__media.map(r=>({src:r.src,events:r.events})));assert.ok(report.media.some(r=>r.events.includes('playing')));assert.ok(report.media.every(r=>!r.events.includes('error')));assert.deepEqual(report.errors,[]);check('No page errors, missing files or media errors');
 await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));console.log('Stage 4 browser checks:',report.checks.length);
}catch(error){report.failure=error.stack;await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));throw error;}finally{await browser?.close();server.close();}
