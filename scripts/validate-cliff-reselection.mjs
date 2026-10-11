// Changed audio gains and new audition files only; no map/AI/gameplay regression.
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
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const report={candidates:[],gains:[],checks:[],errors:[]},sha=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{const NativeAudio=window.Audio;window.__media=[];window.Audio=function(src){const a=new NativeAudio(src),record={src,events:[],node:a};__media.push(record);for(const e of ['loadeddata','playing','ended','error'])a.addEventListener(e,()=>{record.events.push(e);record.seconds=a.duration;record.volume=a.volume;});return a;};});
 await page.goto('http://127.0.0.1:4173/validation/2026-10-11/audio-maps/cliff-reselection/index.html');
 const candidates=JSON.parse(await fs.readFile(path.join(out,'candidates.json'),'utf8'));
 for(let i=0;i<8;i++){
  const n=await page.evaluate(()=>__media.length);await page.locator('.listen').nth(i).click();
  await page.waitForFunction(n=>__media[n]?.events.includes('ended'),n,{timeout:4000,polling:25});
  const actual=await page.evaluate(n=>{const {node,...a}=__media[n];return a;},n);
  assert.deepEqual(actual.events,['loadeddata','playing','ended']);assert.equal(actual.volume,candidates[i].volume);assert.equal(actual.seconds,candidates[i].seconds);
  assert.equal(sha(await fs.readFile(path.join(out,candidates[i].file))),candidates[i].sha256);report.candidates.push({...actual,id:candidates[i].id,choice:candidates[i].candidate});
 }
 await page.locator('#warning').click();await page.waitForFunction(()=>__media.at(-1).events.includes('ended'),null,{timeout:4000,polling:25});
 assert.equal(await page.evaluate(()=>__media.at(-1).volume),.40);
 // Import deployed manager; verify actual runtime gains and live native nodes.
 await page.evaluate(async()=>{const {audio}=await import('/dist/audio-manager.mjs');window.__gainQA=audio;});
 for(const [id,e]of Object.entries(AUDIO_MANIFEST).filter(([,e])=>e.channel==='environment'&&e.src)){
  const n=await page.evaluate(()=>{__gainQA.stopAll();return __media.length;});assert.ok(await page.evaluate(id=>__gainQA.play(id),id));
  await page.waitForFunction(n=>__media[n]?.events.includes('ended'),n,{timeout:4000,polling:25});
  const actual=await page.evaluate(n=>{const {node,...a}=__media[n];return a;},n);assert.equal(actual.volume,e.volume);assert.ok(actual.events.includes('playing'));report.gains.push({id,volume:actual.volume,seconds:actual.seconds});
 }
 const duck=await page.evaluate(()=>{__gainQA.stopAll();__gainQA.play('ruins.activate');const env=[...__gainQA.active][0],before=env.node.volume;__gainQA.play('block.match3');return {before,during:env.node.volume,core:[...__gainQA.active].find(v=>v.entry.channel==='effect').node.volume};});
 assert.equal(duck.before,.39);assert.equal(duck.during,.195);assert.equal(duck.core,.46);
 await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>[...__gainQA.active].find(v=>v.entry.channel==='environment').node.volume),.39);
 await page.evaluate(()=>__gainQA.stopAll());report.duck=duck;
 const before=JSON.parse(await fs.readFile(path.join(root,'references/audio-stage3/cliff-reselection/before.json'),'utf8'));
 const changed=[];for(const [file,checksum]of Object.entries(before))if(sha(await fs.readFile(path.join(root,file)))!==checksum)changed.push(file);
 assert.deepEqual(changed.sort(),['dist/audio-manifest.mjs','dist/audio-manager.mjs','dist/assets/audio/CREDITS.md'].sort());
 report.changedExistingFiles=changed;report.checks.push('All 8 new auditions played and ended; A warning retained at gain .40.','8 runtime environment gains increased; native media confirms 50% duck and restoration, unchanged core gain.','All existing WAV bytes, rules, AI, scoring, animation and business event mapping unchanged; new candidates remain outside dist.');
 await page.locator('#fall').selectOption('F');await page.locator('#impact').selectOption('D');
 const start=await page.evaluate(()=>__media.length);await page.locator('#sequence').click();await page.waitForFunction(n=>__media.length===n+3&&__media.at(-1).events.includes('ended'),start,{timeout:5000,polling:25});
 const sequence=await page.evaluate(n=>__media.slice(n).map(a=>a.src),start);assert.ok(sequence[1].includes('cliff-fall-F-v2'));assert.ok(sequence[2].includes('cliff-impact-D-v2'));report.sequence={testOnly:true,warning:'A',fall:'F',impact:'D',installed:false};
 await page.locator('#fall').selectOption('D');await page.locator('#impact').selectOption('D');await page.locator('#stop').click();
 await page.screenshot({path:path.join(out,'review.png'),fullPage:true});assert.deepEqual(report.errors,[]);report.success=true;
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('Cliff review passed: 8 auditions, 8 updated runtime gains, core priority/restoration, unchanged recordings. New replacements not adopted.');
}catch(error){report.success=false;report.failure=error.stack;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));throw error;
}finally{await browser.close();}
