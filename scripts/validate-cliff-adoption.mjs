import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-maps/cliff-reselection');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]})),sha=b=>createHash('sha256').update(b).digest('hex');
const selected=JSON.parse(await fs.readFile(path.join(root,'references/audio-stage3/cliff-reselection/selection.json'),'utf8'));
const report={checks:[],events:[],files:[],errors:[]};
for(const a of selected.choices){
 const deployed=path.join(root,'dist/assets/audio',a.file),audition=path.join(out,path.basename(a.auditionFile));
 assert.equal(sha(await fs.readFile(deployed)),a.sha256);assert.equal(sha(await fs.readFile(audition)),a.sha256);
 assert.equal(AUDIO_MANIFEST[a.id].src,'./assets/audio/'+a.file);assert.equal(AUDIO_MANIFEST[a.id].volume,a.volume);
 report.files.push({id:a.id,candidate:a.candidate,file:a.file,sha256:a.sha256,exactAuditionCopy:true});
}
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{const NativeAudio=window.Audio;window.__media=[];window.Audio=function(src){const node=new NativeAudio(src),record={src,node,events:[]};__media.push(record);for(const e of ['loadeddata','playing','ended','error'])node.addEventListener(e,()=>{record.events.push(e);record.seconds=node.duration;record.volume=node.volume;});return node;};});
 await page.goto('http://127.0.0.1:4173/dist/index.html');await page.waitForFunction(()=>window.blockBrawl?.snapshot().art.ready===2);await page.locator('body').click({position:{x:5,y:5}});
 await page.evaluate(async()=>{
  const [{audio},{createAudioEvents},{MatchEngine},{ArenaSession},{MAPS}]=await Promise.all([import('/dist/audio-manager.mjs'),import('/dist/audio-events.mjs'),import('/dist/engine.mjs'),import('/dist/arena.mjs'),import('/dist/maps.mjs')]);
  const events=createAudioEvents(audio),calls=[],original=audio.play.bind(audio);audio.play=(id,options)=>{const accepted=original(id,options);calls.push({id,accepted});return accepted;};
  const player=new MatchEngine({onEvent:e=>events.engine(e)}),opponent=new MatchEngine({onEvent:e=>events.engine(e,'opponent')}),arena=new ArenaSession({player,opponent,map:MAPS.find(m=>m.id==='cliff')});
  arena.start(0,19);arena.ready('player',0);arena.ready('opponent',0);arena.update(3000);calls.length=0;window.__adopt={audio,arena,calls,player};
 });
 const expected=[['cliff.warning',9000,'cliff-warning-v1.wav',.40],['cliff.fall',10500,'cliff-fall-v2.wav',.44],['cliff.impact',11150,'cliff-impact-v2.wav',.33]];
 for(const [id,time,file,volume]of expected){
  const n=await page.evaluate(time=>{const n=__media.length;__adopt.arena.update(time);return n;},time);
  await page.waitForFunction(n=>__media[n]?.events.includes('ended'),n,{timeout:4000,polling:25});
  const media=await page.evaluate(n=>{const {node,...r}=__media[n];return r;},n);
  assert.ok(media.src.endsWith(file));assert.equal(media.volume,volume);assert.deepEqual(media.events,['loadeddata','playing','ended']);report.events.push({id,...media});
 }
 assert.deepEqual(await page.evaluate(()=>__adopt.calls.map(c=>c.id)),expected.map(c=>c[0]));assert.ok(await page.evaluate(()=>__adopt.calls.every(c=>c.accepted)));
 const stress=await page.evaluate(()=>{__adopt.audio.stopAll();const start=__media.length;let accepted=0;for(let i=0;i<200;i++)accepted+=__adopt.audio.play('cliff.fall')?1:0;return {start,accepted,active:__adopt.audio.snapshot().active};});
 assert.equal(stress.accepted,1);assert.equal(stress.active,1);await page.waitForFunction(()=>__adopt.audio.snapshot().active===0,null,{timeout:4000,polling:25});assert.equal(await page.evaluate(()=>__media.length),stress.start+1);
 const mute=await page.evaluate(()=>{const a=__adopt.audio,p=__adopt.player,before=JSON.stringify({board:p.board,locks:p.locks,score:p.score,transactions:p.transactions});a.environmentVolume=0;const fall=a.play('cliff.fall'),impact=a.play('cliff.impact'),core=a.play('block.match3');return {fall,impact,core,unchanged:before===JSON.stringify({board:p.board,locks:p.locks,score:p.score,transactions:p.transactions})};});
 assert.deepEqual(mute,{fall:false,impact:false,core:true,unchanged:true});await page.evaluate(()=>{__adopt.arena.dispose();__adopt.audio.stopAll();__adopt.audio.environmentVolume=1;});
 const baseline=JSON.parse(await fs.readFile(path.join(root,'references/audio-stage3/cliff-reselection/before-adoption.json'),'utf8'));
 const changed=[],archived=[];
 for(const [file,checksum]of Object.entries(baseline)){
  let body;try{body=await fs.readFile(path.join(root,file));}catch{const saved=path.join(root,'references/audio-stage3/cliff-reselection/superseded',path.basename(file));assert.equal(sha(await fs.readFile(saved)),checksum);archived.push(file);continue;}
  if(sha(body)!==checksum)changed.push(file);
 }
 assert.deepEqual(changed,['dist/assets/audio/CREDITS.md']);assert.deepEqual(archived.sort(),['dist/assets/audio/maps/cliff/cliff-fall-v1.wav','dist/assets/audio/maps/cliff/cliff-impact-v1.wav'].sort());
 report.checks.push('Selected F/D bytes match audition hashes and manifest paths; A warning retained.','Real cliff engine phases emit correct IDs once across paired boards/cells and native media plays v2 files at .44/.33.','200 repeated requests accept one with no queued replay; environment mute leaves core and board state intact.','Other recordings, manager, rules, AI, scores, animations and event mapping unchanged; previous two files archived.');
 await page.goto('http://127.0.0.1:4173/validation/2026-10-11/audio-maps/cliff-reselection/index.html');
 assert.equal(await page.locator('#fall').inputValue(),'F');assert.equal(await page.locator('#impact').inputValue(),'D');
 await page.screenshot({path:path.join(out,'adopted.png'),fullPage:true});assert.deepEqual(report.errors,[]);report.success=true;
 await fs.writeFile(path.join(out,'adoption-report.json'),JSON.stringify(report,null,2));console.log('A/F/D adoption passed: exact copies, real cliff event media, gains, burst/mute, unchanged gameplay.');
}catch(error){report.success=false;report.failure=error.stack;await fs.writeFile(path.join(out,'adoption-report.json'),JSON.stringify(report,null,2));throw error;
}finally{await browser.close();}
