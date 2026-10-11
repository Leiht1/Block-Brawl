// Focused stage 2 validation: real browser media, real pointer swaps, no full regression.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-magic');
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
let browser;
try{
  browser=await chromium.launch({headless:!process.argv.includes('--headed'),channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(r.url().includes('/assets/audio/'))report.audioRequests.push(r.url());});
  await page.addInitScript(()=>{
    let seed=19;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};
    Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};
    const NativeAudio=window.Audio;window.__media=[];
    window.Audio=function(src){
      const node=new NativeAudio(src),record={src,events:[],volume:0,duration:0};__media.push(record);
      for(const event of ['loadeddata','playing','ended','error'])node.addEventListener(event,()=>{
        record.events.push(event);if(Number.isFinite(node.duration))record.duration=node.duration;
        record.volume=node.volume;if(event==='error')record.error=node.error?.code;
      });return node;
    };
    window.AudioContext=window.webkitAudioContext=class {constructor(){throw Error('Runtime synthesis is prohibited');}};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.__audioQA&&blockBrawl.snapshot().art.ready===2);
  const initial=await page.evaluate(()=>__audioQA.audio.snapshot());assert.equal(initial.configured,10);assert.equal(initial.reserved,24);assert.equal(initial.soundEnabled,true);
  assert.equal(report.audioRequests.length,0);report.checks.push('Starts enabled with 10 configured core IDs, 24 reserved IDs and no initial audio requests');
  await page.locator('#open-sandbox').click();await page.evaluate(()=>__clock.advance(0));
  const seen=new Set();
  for(const [id,entry] of Object.entries(AUDIO_MANIFEST)){
    if(!entry.src)continue;
    for(const [variant,asset] of [[undefined,entry],...Object.entries(entry.variants||{})]){
      if(seen.has(asset.src))continue;seen.add(asset.src);
      const index=await page.evaluate(()=>{__audioQA.audio.stopAll();__clock.time+=2000;return __media.length;});
      assert.equal(await page.evaluate(({id,variant})=>__audioQA.audio.play(id,{variant}),{id,variant}),true);
      await page.waitForFunction(i=>__media[i]?.events.includes('playing'),index,{timeout:4000,polling:50});
      await page.waitForFunction(i=>__media[i]?.events.includes('ended'),index,{timeout:4000,polling:50});
      const media=await page.evaluate(i=>__media[i],index);
      assert.ok(media.events.includes('loadeddata'));assert.ok(media.duration>0&&media.duration<1.2);
      assert.equal(media.volume,asset.volume);assert.equal(await page.evaluate(()=>__audioQA.audio.snapshot().active),0);
      report.files.push({id,variant:variant||'default',file:asset.src,...media});
    }
  }
  assert.equal(report.files.length,17);report.checks.push('All 17 WAV files loaded, emitted playing and ended, respected per-file volume, and released their slots');
  const state=()=>page.evaluate(()=>JSON.stringify({board:__audioQA.engine.board,score:__audioQA.engine.score,locks:__audioQA.engine.locks,transactions:__audioQA.engine.transactions}));
  const advance=t=>page.evaluate(t=>__clock.advance(t),t);
  const reset=async(mode)=>{
    await page.evaluate(()=>{__audioQA.audio.stopAll();__clock.time=0;__audioQA.engine.now=0;__audioQA.calls.length=0;});
    await page.locator(`[data-mode="${mode}"]`).click();await advance(0);
  };
  const swap=async()=>{
    const cells=await page.evaluate(()=>__audioQA.engine.practiceMove),box=await page.locator('#board').boundingBox();
    for(const i of cells)await page.mouse.click(box.x+(i%8+.5)*box.width/8,box.y+(Math.floor(i/8)+.5)*box.height/8);
  };
  for(const mode of ['three','chain','four','row','blast','combo-lines','combo-cross','combo-column','combo-blasts']){
    await reset(mode);await swap();await advance(100);
    await page.waitForTimeout(450);
    await advance(185);await page.screenshot({path:path.join(out,mode+'.png')});
    for(let t=200;t<=6000;t+=50){
      await advance(t);await page.waitForTimeout(12);
      if(await page.evaluate(()=>__audioQA.engine.transactions.length===0))break;
    }
    await page.waitForFunction(()=>__audioQA.audio.snapshot().active===0,{},{timeout:2500,polling:50});
    const run=await page.evaluate(()=>({calls:__audioQA.calls,score:__audioQA.engine.score,bestChain:__audioQA.engine.bestChain,active:__audioQA.audio.snapshot().active,transactions:__audioQA.engine.transactions.length}));
    assert.ok(run.score>0);assert.equal(run.transactions,0);assert.equal(run.active,0);
    assert.ok(run.calls.some(c=>c.id==='block.swap'&&c.accepted));
    assert.ok(run.calls.some(c=>c.id==='block.fall'&&c.accepted));
    const expected={three:'block.match3',chain:'block.combo',four:'special.create',row:'special.line',blast:'special.bomb','combo-lines':'special.combo','combo-cross':'special.combo','combo-column':'special.combo','combo-blasts':'special.combo'}[mode];
    assert.ok(run.calls.some(c=>c.id===expected&&c.accepted));
    if(mode.startsWith('combo-'))assert.ok(run.calls.some(c=>c.id==='special.combo'&&c.accepted&&c.options.variant===({'combo-lines':'line-line','combo-cross':'line-blast','combo-column':'line-blast','combo-blasts':'blast-blast'}[mode])));
    if(mode==='row'||mode==='blast')assert.ok(!run.calls.some(c=>c.id==='block.match3'&&c.at===100));
    if(mode==='chain')assert.ok(run.calls.some(c=>c.id==='block.combo'&&c.accepted&&c.options.variant==='combo1'));
    report.gameplay.push({mode,...run});
  }
  report.checks.push('Actual pointer swaps in nine existing practice boards trigger match, chain, create, line, bomb, combo and fall; clear/fall transactions settle');
  await reset('row');
  const box=await page.locator('#board').boundingBox();
  for(const i of [0,1])await page.mouse.click(box.x+(i%8+.5)*box.width/8,box.y+.5*box.height/8);
  await advance(100);await page.waitForTimeout(250);await advance(190);await page.waitForTimeout(300);
  assert.ok(await page.evaluate(()=>__audioQA.calls.some(c=>c.id==='block.invalid'&&c.accepted)));
  assert.equal(await page.evaluate(()=>__audioQA.engine.score),0);report.checks.push('Actual invalid exchange reverts at unchanged 100+90ms and plays the soft rebound');
  const stress=await page.evaluate(()=>{
    const q=__audioQA.audio;q.stopAll();__clock.time=5000;
    const start=__media.length;let accepted=0;
    for(let n=0;n<100;n++)accepted+=q.play('block.combo',{variant:`combo${n%3+1}`})?1:0;
    __clock.time+=130;const overlapped=q.play('block.combo',{variant:'combo2'});
    return {accepted,overlapped,start,active:q.snapshot().active};
  });
  assert.equal(stress.accepted,1);assert.equal(stress.overlapped,false);assert.equal(stress.active,1);
  await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>__media.length),stress.start+1);
  assert.equal(await page.evaluate(()=>__audioQA.audio.snapshot().active),0);
  assert.ok(await page.evaluate(i=>__media[i].events.includes('ended'),stress.start));
  report.checks.push('100 fast clears accept one cue; another at 130ms cannot overlap/interrupt it; it ends normally with no queued replay');
  const before=await state();await page.locator('#sound').click();assert.equal(await state(),before);
  await reset('three');await swap();for(let t=100;t<=1500;t+=50)await advance(t);
  assert.ok(await page.evaluate(()=>__audioQA.engine.score>0));
  assert.equal(await page.evaluate(()=>__audioQA.audio.soundEnabled),false);
  assert.equal(await page.evaluate(()=>__audioQA.audio.snapshot().active),0);
  report.checks.push('Toggle preserves board/score/locks/transactions; actual three-match settles with sound off; seeded unit test compares complete enabled/disabled/detached traces');
  await page.locator('#sound').click();await page.locator('#exit-game').click();await page.locator('#open-arena').click();await page.locator('[data-difficulty="easy"]').click();
  await page.evaluate(()=>{__audioQA.calls.length=0;});
  for(const t of [3500,4500,5500,6500,7500,8500]){await advance(t);await page.waitForTimeout(300);}
  const countdown=await page.evaluate(()=>({calls:__audioQA.calls,status:__audioQA.flow.arena.status}));
  assert.equal(countdown.status,'playing');
  const cues=countdown.calls.filter(c=>c.id==='ui.countdown');assert.equal(cues.length,4);assert.ok(cues.every(c=>c.accepted));
  assert.deepEqual(cues.map(c=>c.options?.variant),['3','2','1','start']);report.checks.push({countdown:cues,status:countdown.status});
  await page.evaluate(()=>__audioQA.audio.stopAll());await page.waitForTimeout(50);
  report.mediaErrors=await page.evaluate(()=>__media.filter(m=>m.events.includes('error')));
  assert.deepEqual(report.mediaErrors,[]);assert.deepEqual(report.errors,[]);
  report.checks.push('No page errors, media errors or 404s; runtime AudioContext is prohibited throughout validation');
  // One short actual realtime play pass: native RAF, native media, pointer input.
  const live=await browser.newPage({viewport:{width:1440,height:1000}});
  live.on('pageerror',e=>report.errors.push(e.message));
  await live.goto(`http://127.0.0.1:${server.address().port}/`);
  await live.waitForFunction(()=>window.__audioQA&&blockBrawl.snapshot().art.ready===2);
  await live.locator('#open-sandbox').click();
  const realtime=[];
  for(const mode of ['three','chain','row','combo-lines','combo-cross','combo-blasts']){
    await live.locator(`[data-mode="${mode}"]`).click();
    await live.evaluate(()=>{__audioQA.calls.length=0;});
    const cells=await live.evaluate(()=>__audioQA.engine.practiceMove),box=await live.locator('#board').boundingBox();
    for(const i of cells)await live.mouse.click(box.x+(i%8+.5)*box.width/8,box.y+(Math.floor(i/8)+.5)*box.height/8);
    await live.waitForFunction(()=>__audioQA.engine.score>0&&__audioQA.engine.transactions.length===0&&__audioQA.audio.snapshot().active===0,{},{timeout:5000});
    const result=await live.evaluate(()=>({calls:__audioQA.calls,score:__audioQA.engine.score,bestChain:__audioQA.engine.bestChain}));
    assert.ok(result.calls.some(c=>c.id==='block.swap'&&c.accepted));
    const expected={three:'block.match3',chain:'block.combo',row:'special.line','combo-lines':'special.combo','combo-cross':'special.combo','combo-blasts':'special.combo'}[mode];
    assert.ok(result.calls.some(c=>c.id===expected&&c.accepted));realtime.push({mode,...result});
  }
  await live.screenshot({path:path.join(out,'realtime-play.png')});await live.close();
  report.checks.push({realtimePlay:'Native RAF/media; six actual pointer scenarios settle and accept expected core cues',runs:realtime});
  assert.deepEqual(report.errors,[]);
  report.success=true;
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(`Audio stage 2 passed: ${report.checks.length} browser checks, ${report.files.length} real media files, ${report.gameplay.length} pointer scenarios.`);
}catch(error){report.success=false;report.failure=error.stack;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));throw error;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
