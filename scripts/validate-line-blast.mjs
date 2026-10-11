// Focused stage 2 validation: real browser media, real pointer swaps, no full regression.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-selected');
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[deps]}));
await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{try{
  const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);
  if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');
  let body=await fs.readFile(file);
  // Instrumentation is appended only by this validation server, never deployed.
  if(name==='app.mjs')body=body.toString()+`
    window.__audioQA={audio,engine,flow,events:audioEvents,calls:[]};
    const originalAudioPlay=audio.play.bind(audio);
    audio.play=(id,options)=>{const accepted=originalAudioPlay(id,options);__audioQA.calls.push({id,options,accepted,at:performance.now()});return accepted;};`;
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const report={checks:[],files:[],gameplay:[],errors:[],mediaErrors:[],audioRequests:[],subjectiveListening:'Pending human listening; browser playing/ended and numerical headroom are not an audible style/fatigue verdict.'};

const selectedRef=path.join(root,'references/audio-stage2/choices/selected');
const sha=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
const beforeManifest=(await import(new URL('../references/audio-stage2/choices/selected/before-manifest.mjs',import.meta.url))).AUDIO_MANIFEST;
const expected=JSON.parse(JSON.stringify(beforeManifest));
expected['special.combo'].variants['line-blast'].src='./assets/audio/special/special-combo-line-blast-v5.wav';
assert.deepEqual(JSON.parse(JSON.stringify(AUDIO_MANIFEST)),expected);
const oldEdits=JSON.parse(await fs.readFile(path.join(selectedRef,'before-derivatives.json'),'utf8'));
for(const a of oldEdits)if(a.file!=='special/special-combo-line-blast-v4.wav')assert.equal(await sha(path.join(root,'dist/assets/audio',a.file)),a.sha256);
const beforeGameplay=JSON.parse((await fs.readFile(path.join(selectedRef,'before-gameplay.json'),'utf8')).replace(/^\uFEFF/,''));
for(const a of beforeGameplay)assert.equal(await sha(a.Path),a.Hash.toLowerCase());
const selection=JSON.parse(await fs.readFile(path.join(root,'references/audio-stage2/choices/selection.json'),'utf8'));
assert.equal(selection.key,'D');assert.equal(await sha(path.join(root,'dist/assets/audio',selection.targetFile)),selection.sha256);
assert.equal(await sha(path.join(root,'validation/2026-10-11/audio-choices/clips/d.wav')),selection.sha256);
report.checks.push('Only line+blast source changes; deployed cue exactly equals selected D; all other 15 WAVs/configuration and 11 gameplay/presentation/manager files unchanged');

let browser;
try{
 browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>{
  let seed=19;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};
  Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};
  const NativeAudio=window.Audio;window.__media=[];
  window.Audio=function(src){const node=new NativeAudio(src),record={src,events:[],volume:0,duration:0};__media.push(record);
   for(const event of ['loadeddata','playing','ended','error'])node.addEventListener(event,()=>{record.events.push(event);record.duration=node.duration;record.volume=node.volume;});return node;};
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.waitForFunction(()=>window.__audioQA&&blockBrawl.snapshot().art.ready===2);
 assert.equal(await page.evaluate(()=>__audioQA.audio.soundEnabled),true);
 await page.locator('#open-sandbox').click();await page.evaluate(()=>__clock.advance(0));
 const advance=t=>page.evaluate(t=>__clock.advance(t),t);
 const reset=async mode=>{await page.evaluate(()=>{__audioQA.audio.stopAll();__clock.time=0;__audioQA.engine.now=0;__audioQA.calls.length=0;});await page.locator(`[data-mode="${mode}"]`).click();await advance(0);};
 const swap=async()=>{const cells=await page.evaluate(()=>__audioQA.engine.practiceMove),box=await page.locator('#board').boundingBox();for(const i of cells)await page.mouse.click(box.x+(i%8+.5)*box.width/8,box.y+(Math.floor(i/8)+.5)*box.height/8);};
 for(const mode of ['combo-cross','combo-column']){
  await reset(mode);const start=await page.evaluate(()=>__media.length);await swap();await advance(100);
  await page.waitForFunction(start=>__media.slice(start).some(m=>m.src.endsWith('special-combo-line-blast-v5.wav')&&m.events.includes('playing')),start,{polling:50});
  await advance(185);await page.screenshot({path:path.join(out,mode+'.png')});
  for(let t=200;t<=6000;t+=50){await advance(t);await page.waitForTimeout(12);if(await page.evaluate(()=>__audioQA.engine.transactions.length===0))break;}
  await page.waitForFunction(()=>__audioQA.audio.snapshot().active===0,{},{timeout:2500,polling:50});
  const run=await page.evaluate(start=>({calls:__audioQA.calls,score:__audioQA.engine.score,transactions:__audioQA.engine.transactions.length,media:__media.slice(start)}),start);
  const cues=run.calls.filter(c=>c.id==='special.combo'&&c.options?.variant==='line-blast'&&c.accepted);assert.equal(cues.length,1);
  const clip=run.media.find(m=>m.src.endsWith('special-combo-line-blast-v5.wav'));
  assert.ok(['loadeddata','playing','ended'].every(e=>clip.events.includes(e)));assert.equal(clip.duration,1.2);assert.equal(clip.volume,.78);
  assert.ok(run.score>0);assert.equal(run.transactions,0);report.gameplay.push({mode,...run});
 }
 report.checks.push('Actual horizontal and vertical line+blast swaps play selected D/v5 once, load/play/end at 1.2s/.78 gain and settle unchanged transactions');
 const stress=await page.evaluate(()=>{const q=__audioQA.audio;q.stopAll();__clock.time=10000;const start=__media.length;let accepted=0;for(let n=0;n<100;n++)accepted+=q.play('special.combo',{variant:'line-blast'})?1:0;__clock.time+=160;return {start,accepted,overlap:q.play('special.combo',{variant:'blast-blast'})};});
 assert.equal(stress.accepted,1);assert.equal(stress.overlap,false);
 await page.waitForFunction(i=>__media[i].events.includes('ended'),stress.start,{polling:50});assert.equal(await page.evaluate(()=>__media.length),stress.start+1);
 report.checks.push('100 rapid line+blast requests accept one; subsequent stronger combo cannot interrupt it; no queued replay');
 await page.locator('#sound').click();await reset('combo-cross');const silentStart=await page.evaluate(()=>__media.length);await swap();for(let t=100;t<=6000;t+=50){await advance(t);if(await page.evaluate(()=>__audioQA.engine.transactions.length===0))break;}
 assert.ok(await page.evaluate(()=>__audioQA.engine.score>0));assert.equal(await page.evaluate(()=>__media.length),silentStart);
 report.checks.push('Muted line+blast still settles and scores without constructing sound objects');
 const live=await browser.newPage();live.on('pageerror',e=>report.errors.push(e.message));await live.goto(`http://127.0.0.1:${server.address().port}/`);await live.waitForFunction(()=>window.__audioQA&&blockBrawl.snapshot().art.ready===2);await live.locator('#open-sandbox').click();await live.locator('[data-mode="combo-cross"]').click();await live.evaluate(()=>__audioQA.calls.length=0);
 const cells=await live.evaluate(()=>__audioQA.engine.practiceMove),box=await live.locator('#board').boundingBox();for(const i of cells)await live.mouse.click(box.x+(i%8+.5)*box.width/8,box.y+(Math.floor(i/8)+.5)*box.height/8);
 await live.waitForFunction(()=>__audioQA.engine.score>0&&__audioQA.engine.transactions.length===0&&__audioQA.audio.snapshot().active===0,{},{timeout:6000});
 const realtime=await live.evaluate(()=>__audioQA.calls);assert.ok(realtime.some(c=>c.id==='special.combo'&&c.options?.variant==='line-blast'&&c.accepted));report.checks.push({nativeClockPlay:realtime});await live.close();
 report.mediaErrors=await page.evaluate(()=>__media.filter(m=>m.events.includes('error')));assert.deepEqual(report.mediaErrors,[]);assert.deepEqual(report.errors,[]);
 report.success=true;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('Line+blast passed: horizontal/vertical/native play, rapid merge, mute, no media/page errors.');
}catch(error){report.success=false;report.failure=error.stack;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));throw error;}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
