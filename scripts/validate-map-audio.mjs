// Stage 3 only: actual app event audio and media, no full gameplay regression.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-maps');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.wav':'audio/wav'};
const sha=body=>createHash('sha256').update(body).digest('hex');
const report={checks:[],maps:[],files:[],errors:[],subjectiveListening:'Source semantics and structure selected by agent. Human audible timbre/masking/fatigue approval is not claimed.'};
const server=http.createServer(async(req,res)=>{try{
 const name=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1)||'index.html',file=path.resolve(root,'dist',name);
 if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
 // Validation-only selection of existing maps and read-only audio inspection.
 if(name==='flow.mjs')body=body.toString().replace('new MapReveal(performance.now(),Math.random,reducedMotion)','new MapReveal(performance.now(),()=>window.__mapRoll??Math.random(),reducedMotion)');
 if(name==='app.mjs')body=body.toString()+`
 window.__qa={audio,engine,flow,events:audioEvents,calls:[],
  to(t){for(let n=__clock.time;n<t;) {n=Math.min(t,n+25);__clock.advance(n);}},
  state(){const a=flow.arena;return {time:__clock.time,status:a?.status,map:a?.map.id,config:a?.map.environment,next:a?.environment?.next,phase:a?.environment?.state?.phase,end:a?.environment?.state?.end,targets:a?.environment?.state?.targets};},
  boardState(){return JSON.stringify(Object.values(flow.arena.engines).map(e=>({board:e.board,score:e.score,locks:e.locks,transactions:e.transactions,ice:[...e.frozenCells],blocks:[...e.temporaryBlocks]})));},
  pauseBot(){flow.arena.source.stop();},
  async breakIce(){const {legalMoves}=await import('./engine.mjs');const moves=legalMoves(engine.board,engine.ruleTerrain).filter(([a,b])=>engine.canSwap(a,b));for(const [a,b]of moves){if(!engine.frozenCells.size)break;flow.arena.command('player',{kind:'swap',a,b});this.to(__clock.time+2000);if(this.calls.some(c=>c.id==='ice.break'))return true;}return false;}
 };
 const originalPlay=audio.play.bind(audio);audio.play=(id,options)=>{const accepted=originalPlay(id,options);__qa.calls.push({id,accepted,at:__clock.time});return accepted;};`;
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>{
  let seed=19;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};
  Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};
  const NativeAudio=window.Audio;window.__media=[];window.Audio=function(src){
   const node=new NativeAudio(src),record={src,events:[],node};__media.push(record);
   for(const event of ['loadeddata','playing','ended','error'])node.addEventListener(event,()=>{record.events.push(event);record.seconds=node.duration;record.volume=node.volume;});return node;
  };
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__qa&&blockBrawl.snapshot().art.ready===2);
 const initial=await page.evaluate(()=>__qa.audio.snapshot());assert.equal(initial.configured,18);assert.equal(initial.channels.environment,1);
 await page.locator('#open-arena').click();
 const expected={cliff:['cliff.warning','cliff.fall','cliff.impact'],crystal:['ice.freeze','ice.break'],ruins:['ruins.activate'],furnace:['furnace.warning','furnace.spread','furnace.warning','furnace.spread']};
 const settle=()=>page.waitForFunction(()=>__qa.audio.snapshot().active===0,null,{timeout:5000,polling:50});
 const to=t=>page.evaluate(t=>__qa.to(t),t),state=()=>page.evaluate(()=>__qa.state());
 async function phase(t){await settle();await to(t);await settle();}
 let n=0;
 for(const [id,ids]of Object.entries(expected)){
  await page.evaluate(roll=>window.__mapRoll=roll,{cliff:.3,crystal:.5,ruins:.7,furnace:.9}[id]);
  if(!n++)await page.locator('[data-difficulty="easy"]').click();else await page.locator('#restart').click();
  await to((await state()).time+8000);await page.evaluate(()=>{__qa.pauseBot();__qa.calls.length=0;});await settle();
  const s=await state();assert.equal(s.map,id);assert.equal(s.status,'playing');const c=s.config;
  await phase(s.next);await phase(s.next+c.warning);await phase(s.next+c.warning+c.impact);
  if(id==='crystal'){assert.equal(await page.evaluate(()=>__qa.breakIce()),true);await settle();}
  if(id==='furnace'){const land=s.next+c.warning+c.impact;await phase(land+c.spreadInterval-c.spreadWarning);await phase(land+c.spreadInterval);}
  const calls=await page.evaluate(()=>__qa.calls.filter(c=>/^(cliff|ice|ruins|furnace)\./.test(c.id)));
  assert.deepEqual(calls.map(c=>c.id),ids);assert.ok(calls.every(c=>c.accepted));
  const before=await page.evaluate(()=>__qa.boardState());
  const mute=await page.evaluate(()=>{__qa.audio.stopAll();__qa.audio.play('furnace.warning');const active=__qa.audio.snapshot().active;__qa.audio.environmentVolume=0;return {active,after:__qa.audio.snapshot().active,blocked:__qa.audio.play('ice.freeze'),core:__qa.audio.play('block.match3')};});
  assert.equal(mute.active,1);assert.equal(mute.after,0);assert.equal(mute.blocked,false);assert.equal(mute.core,true);
  assert.equal(await page.evaluate(()=>__qa.boardState()),before);await settle();await page.evaluate(()=>__qa.audio.environmentVolume=1);
  await page.screenshot({path:path.join(out,id+'-game.png')});report.maps.push({id,calls,mute,boardUnchanged:true});
 }
 report.checks.push('Actual app callbacks: cliff warning/fall/impact; ice freeze and clear-reason break; ancient mechanism; furnace heat/spread and repeated spread. Paired boards/cells merge.');
 for(const [id,e]of Object.entries(AUDIO_MANIFEST).filter(([,e])=>e.src&&e.channel==='environment')){
  await settle();const index=await page.evaluate(()=>{__qa.audio.stopAll();__clock.time+=3000;return __media.length;});
  assert.equal(await page.evaluate(id=>__qa.audio.play(id),id),true);
  await page.waitForFunction(i=>__media[i]?.events.includes('ended'),index,{timeout:5000,polling:50});
  const media=await page.evaluate(i=>{const {node,...record}=__media[i];return record;},index);
  assert.deepEqual(media.events,['loadeddata','playing','ended']);assert.equal(media.volume,e.volume);report.files.push({id,file:e.src,...media});
 }
 assert.equal(new Set(report.files.map(f=>f.file)).size,8);report.checks.push('Eight distinct local map WAVs loaded, played and ended at configured environment gains.');
 const stress=await page.evaluate(()=>{
  __qa.audio.stopAll();__clock.time+=3000;const start=__media.length;
  const ids=['cliff.warning','cliff.fall','cliff.impact','ice.freeze','ice.break','ruins.activate','furnace.warning','furnace.spread'];
  let accepted=0;for(let n=0;n<200;n++)accepted+=__qa.audio.play(ids[n%8])?1:0;
  return {start,accepted,active:__qa.audio.snapshot().active};
 });assert.equal(stress.accepted,2);assert.equal(stress.active,2);await settle();
 assert.equal(await page.evaluate(()=>__media.length),stress.start+2);report.checks.push('200 fast mixed map cues accept at most two, finish without queued replay.');
 const duck=await page.evaluate(()=>{
  __qa.audio.stopAll();__clock.time+=3000;__qa.audio.play('ruins.activate');const environment=[...__qa.audio.active][0],original=environment.node.volume;
  __qa.audio.play('special.line');return {original,ducked:environment.node.volume,expected:original*.50};
 });assert.equal(duck.ducked,duck.expected);await settle();report.checks.push('Environment gain ducks to 50% when a core skill voice is active; channel mute stops only environment and leaves core playable.');
 const baseline=JSON.parse(await fs.readFile(path.join(root,'references/audio-stage3/before.json'),'utf8'));
 const changes=[];for(const [name,hash]of Object.entries(baseline)){const body=await fs.readFile(path.join(root,name));if(sha(body)!==hash)changes.push(name);}
 assert.deepEqual(changes.sort(),['dist/assets/audio/CREDITS.md','dist/audio-manager.mjs','dist/audio-manifest.mjs'].sort());
 report.unchangedFiles=Object.keys(baseline).length-changes.length;report.changedExistingFiles=changes;
 report.checks.push('Pre-task workspace hashes: rules, AI, scoring, animation clocks, business event mapping and all existing core recordings unchanged.');
 assert.deepEqual(report.errors,[]);report.success=true;
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('Stage 3 focused browser checks passed: 4 maps, 8 distinct media files, bounded bursts, independent mute, preserved gameplay files.');
}catch(error){report.success=false;report.failure=error.stack;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));throw error;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
