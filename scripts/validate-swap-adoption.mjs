import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-swap');
const sha=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const selected=JSON.parse(await fs.readFile(path.join(root,'references/audio-swap/selection.json'),'utf8'));
const report={candidate:'A',checks:[],errors:[]};
assert.equal(sha(await fs.readFile(path.join(root,selected.targetFile))),selected.sha256);
assert.equal(sha(await fs.readFile(path.join(root,selected.auditionFile))),selected.sha256);
assert.equal(AUDIO_MANIFEST['block.swap'].src,'./assets/audio/block/block-swap-v2.wav');assert.equal(AUDIO_MANIFEST['block.swap'].volume,.58);
const before=JSON.parse(await fs.readFile(path.join(root,'references/audio-swap/before-adoption.json'),'utf8')),changed=[];
for(const [file,digest] of Object.entries(before))if(sha(await fs.readFile(path.join(root,file)))!==digest)changed.push(file);
assert.deepEqual(changed.sort(),['dist/assets/audio/CREDITS.md','dist/audio-manifest.mjs']);
const manifest=await fs.readFile(path.join(root,'dist/audio-manifest.mjs'),'utf8');assert.equal(sha(Buffer.from(manifest.replace("'block-swap-v2'","'block-swap-v1'"))),before['dist/audio-manifest.mjs']);
report.changedExistingGameFiles=changed;report.exactAuditionCopy=true;report.sha256=selected.sha256;
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{const NativeAudio=window.Audio;window.__media=[];window.Audio=function(src){const node=new NativeAudio(src),record={src,node,events:[]};__media.push(record);for(const e of ['loadeddata','playing','ended','error'])node.addEventListener(e,()=>{record.events.push(e);if(Number.isFinite(node.duration))record.seconds=node.duration;record.volume=node.volume;});return node;};});
 await page.goto('http://127.0.0.1:4173/dist/index.html?audio=swap-a');await page.waitForFunction(()=>window.blockBrawl?.snapshot().art.ready===2);await page.locator('body').click({position:{x:5,y:5}});
 const start=await page.evaluate(async()=>{
  const [{audio},{createAudioEvents},{MatchEngine,seeded}]=await Promise.all([import('/dist/audio-manager.mjs'),import('/dist/audio-events.mjs'),import('/dist/engine.mjs')]);
  audio.stopAll();audio.soundEnabled=true;const bridge=createAudioEvents(audio),trace=[],engine=new MatchEngine({random:seeded(19),onEvent:e=>{trace.push(e);bridge.engine(e);}});engine.reset('three');trace.length=0;const start=__media.length,accepted=engine.swap(...engine.practiceMove);
  window.__swap={audio,bridge,engine,trace,MatchEngine,seeded};return {start,accepted};
 });assert.equal(start.accepted,true);
 await page.waitForFunction(n=>__media[n]?.events.includes('ended'),start.start,{timeout:4000,polling:20});
 report.media=await page.evaluate(n=>{const {node,...r}=__media[n];return r;},start.start);
 assert.ok(report.media.src.endsWith('block-swap-v2.wav'));assert.deepEqual(report.media.events,['loadeddata','playing','ended']);assert.equal(report.media.volume,.58);assert.equal(report.media.seconds,.11);
 const emitted=await page.evaluate(()=>__swap.trace.map(e=>({kind:e.kind,duration:e.duration})));assert.deepEqual(emitted,[{kind:'swap',duration:100}]);report.swapAnimationMs=100;
 const stress=await page.evaluate(()=>{const a=__swap.audio;a.stopAll();const start=__media.length;let accepted=0;for(let i=0;i<200;i++)accepted+=a.play('block.swap')?1:0;return {start,accepted,active:a.snapshot().active};});
 assert.equal(stress.accepted,1);assert.equal(stress.active,1);await page.waitForFunction(()=>__swap.audio.snapshot().active===0,null,{timeout:4000,polling:20});assert.equal(await page.evaluate(()=>__media.length),stress.start+1);report.burst={requests:200,accepted:1,queuedReplay:false};
 report.mute=await page.evaluate(()=>{
  const {audio,MatchEngine,seeded}=__swap;
  function run(enabled){audio.stopAll();audio.soundEnabled=enabled;const bridge=__swap.bridge,trace=[],engine=new MatchEngine({random:seeded(19),onEvent:e=>{trace.push(e);bridge.engine(e);}});engine.reset('three');const start=__media.length;const accepted=engine.swap(...engine.practiceMove);for(let t=0;t<=1500;t+=25)engine.tick(t);audio.stopAll();return {media:__media.length-start,state:JSON.stringify({accepted,board:engine.board,score:engine.score,locks:engine.locks,transactions:engine.transactions,trace})};}
  const on=run(true),off=run(false);audio.soundEnabled=true;return {identicalGameplay:on.state===off.state,mutedNewAudio:off.media,score:JSON.parse(off.state).score};
 });assert.equal(report.mute.identicalGameplay,true);assert.equal(report.mute.mutedNewAudio,0);assert.ok(report.mute.score>0);
 await page.goto('http://127.0.0.1:4173/validation/2026-10-11/audio-swap/index.html');assert.ok((await page.locator('main').textContent()).includes('A 已正式接入'));assert.ok((await page.locator('.reference').textContent()).includes('历史对照'));assert.equal(await page.locator('audio').count(),7);
 await page.screenshot({path:path.join(out,'adopted.png'),fullPage:true});assert.deepEqual(report.errors,[]);
 report.checks=['Exact user-approved A bytes and .58 gain.','Real accepted swap event plays A through unchanged mapping and AudioManager.','200 requests merge without queued replay.','Sound off gives identical single-move board, scoring, locks, transactions and event trace; creates no audio.','Only manifest path, one new WAV and provenance changed in deployment; all other recordings, gameplay and animation files identical.'];
 report.success=true;await fs.writeFile(path.join(out,'adoption-report.json'),JSON.stringify(report,null,2));console.log('Swap A adoption passed: exact bytes, native gameplay event playback, burst/mute and unchanged gameplay files.');
}catch(e){report.success=false;report.failure=e.stack;await fs.writeFile(path.join(out,'adoption-report.json'),JSON.stringify(report,null,2));throw e;}finally{await browser.close();}
