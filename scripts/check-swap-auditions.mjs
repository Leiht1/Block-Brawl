import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-swap');
const hash=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const candidates=JSON.parse(await fs.readFile(path.join(out,'candidates.json'),'utf8'));
const report={files:[],errors:[],audibleVerdict:'Playback verification only; final preference awaits user listening.'};
for(const c of candidates){assert.equal(await hash(path.join(out,c.file)),c.sha256);assert.equal(await hash(path.join(root,c.source.recording)),c.source.recordingSha256);assert.equal(c.installed,false);}
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/validation/2026-10-11/audio-swap/index.html');
 await page.evaluate(()=>{window.mediaEvents=[];for(const a of document.querySelectorAll('audio'))for(const name of ['loadeddata','playing','ended','error'])a.addEventListener(name,()=>window.mediaEvents.push({id:a.id,name,volume:a.volume,active:[...document.querySelectorAll('audio')].filter(a=>!a.paused).length}));});
 for(const letter of [...candidates.map(c=>c.candidate),'current']){
  await page.locator(`[data-choice="${letter}"][data-count="1"]`).click();
  await page.locator('#status').filter({hasText:'播放完成'}).waitFor();
  const media=await page.evaluate(letter=>{const a=document.querySelector('#audio-'+letter);return {choice:letter,file:a.getAttribute('src'),seconds:a.duration,volume:a.volume,events:window.mediaEvents.filter(e=>e.id===a.id).map(e=>e.name)};},letter);
  assert.deepEqual(media.events,['loadeddata','playing','ended']);assert.equal(media.volume,.58);report.files.push(media);
 }
 await page.evaluate(()=>{window.mediaEvents=[];});
 await page.locator('[data-choice="D"][data-count="6"]').click();
 await page.locator('#status').filter({hasText:'播放完成'}).waitFor();
 const repeated=await page.evaluate(()=>window.mediaEvents);assert.equal(repeated.filter(e=>e.name==='playing').length,6);assert.equal(repeated.filter(e=>e.name==='ended').length,6);assert.ok(repeated.every(e=>e.active<=1));report.repeated={plays:6,ends:6,maxActive:Math.max(...repeated.map(e=>e.active))};
 await page.evaluate(()=>{window.mediaEvents=[];document.querySelector('[data-choice="E"][data-count="6"]').click();document.querySelector('[data-choice="F"][data-count="1"]').click();});
 await page.locator('#status').filter({hasText:'F · 布料滑动 · 播放完成'}).waitFor();
 await page.waitForTimeout(1900);
 const switched=await page.evaluate(()=>window.mediaEvents);assert.equal(switched.filter(e=>e.name==='playing'&&e.id==='audio-F').length,1);assert.ok(!switched.some(e=>e.name==='playing'&&e.id==='audio-E'));report.switchCancelsPreviousSequence=true;
 await page.locator('[data-choice="A"][data-count="6"]').click();await page.locator('#stop').click();await page.waitForTimeout(1900);
 assert.ok(await page.evaluate(()=>[...document.querySelectorAll('audio')].every(a=>a.paused)));assert.equal(await page.locator('#status').textContent(),'已停止');report.stopCancelsSequence=true;
 await page.screenshot({path:path.join(out,'audition-page.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.mobileNoOverflow=true;
 assert.deepEqual(report.errors,[]);
 const before=JSON.parse(await fs.readFile(path.join(out,'game-before.json'),'utf8'));
 for(const [file,digest] of Object.entries(before))assert.equal(await hash(path.join(root,file)),digest,file+' changed');
 const deployed=await fs.readdir(path.join(root,'dist'),{recursive:true,withFileTypes:true});assert.equal(deployed.filter(e=>e.isFile()).length,Object.keys(before).length);report.gameFilesUnchanged=Object.keys(before).length;
 report.success=true;await fs.writeFile(path.join(out,'playback-report.json'),JSON.stringify(report,null,2));console.log('6 candidates and reference played; repeats, cancellation, mobile layout passed. All deployed game files unchanged.');
}finally{await browser.close();}
