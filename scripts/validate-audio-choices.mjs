// Audition-only browser media verification, plus unchanged runtime/gameplay hashes.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),ref=path.join(root,'references/audio-stage2/choices'),out=path.join(root,'validation/2026-10-11/audio-choices');
const sha=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const report={unchangedGameplay:[],unchangedAudio:[],candidates:[],errors:[],selected:'D',subjectiveListening:'User selected D; actual browser playback is not a long-session comfort verdict.'};
const before=JSON.parse(await fs.readFile(path.join(ref,'before-gameplay.json'),'utf8'));
for(const f of before){assert.equal(await sha(f.Path),f.Hash.toLowerCase());report.unchangedGameplay.push(path.basename(f.Path));}
const previous=JSON.parse(await fs.readFile(path.join(ref,'previous-derivatives.json'),'utf8'));
for(const f of previous)if(!['special/special-combo-lines-v3.wav','special/special-combo-line-blast-v4.wav'].includes(f.file)){assert.equal(await sha(path.join(root,'dist/assets/audio',f.file)),f.sha256);report.unchangedAudio.push(f.file);}
const combo=AUDIO_MANIFEST['special.combo'];
assert.deepEqual(combo.variants['line-blast'],{src:'./assets/audio/special/special-combo-line-blast-v5.wav',volume:.78});
assert.deepEqual(combo.variants['line-line'],{src:AUDIO_MANIFEST['special.line'].src,volume:.72});
assert.equal(combo.src,AUDIO_MANIFEST['special.line'].src);
const choices=JSON.parse(await fs.readFile(path.join(out,'candidate-manifest.json'),'utf8'));assert.equal(choices.selected,'D');
for(const c of choices.candidates){assert.equal(c.implemented,c.key==='D');assert.equal(await sha(path.join(out,c.clip)),c.sha256);assert.ok(!JSON.stringify(AUDIO_MANIFEST).includes(c.clip));if(c.key==='D')assert.equal(await sha(path.join(root,'dist/assets/audio',c.deployedFile)),c.sha256);}
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1100,height:1100}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>{const NativeAudio=window.Audio;window.__media=[];window.Audio=function(src){const a=new NativeAudio(src),record={src,events:[],volume:0,duration:0};__media.push(record);for(const name of ['loadeddata','playing','ended','error'])a.addEventListener(name,()=>{record.events.push(name);record.volume=a.volume;record.duration=a.duration;});return a;};});
 await page.goto('http://127.0.0.1:5178/validation/2026-10-11/audio-choices/index.html');
 for(const c of choices.candidates){await page.locator(`[data-play="${c.key}"]`).click();await page.waitForFunction(key=>__media.find(m=>m.src.endsWith('clips/'+key.toLowerCase()+'.wav')).events.includes('ended'),c.key,{polling:50,timeout:4500});}
 for(const key of ['line','blasts']){await page.locator(`[data-play="${key}"]`).click();await page.waitForFunction(file=>__media.find(m=>m.src.endsWith(file)).events.includes('ended'),key==='line'?'special-line-v3.wav':'special-combo-blasts-v3.wav',{polling:50,timeout:4500});}
 await page.locator('[data-tier="A"]').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('试听结束'),{},{timeout:7000});
 report.media=await page.evaluate(()=>__media);
 for(const c of choices.candidates){const m=report.media.find(m=>m.src.endsWith(c.clip));assert.ok(['loadeddata','playing','ended'].every(e=>m.events.includes(e)));assert.equal(m.volume,.78);assert.equal(m.duration,c.seconds);report.candidates.push({key:c.key,seconds:m.duration,events:m.events,volume:m.volume});}
 assert.ok(report.media.every(m=>!m.events.includes('error')));assert.deepEqual(report.errors,[]);
 await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
 report.success=true;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('Four choices and tier/reference controls load/play/end. Only selected D integrated; other 15 clips and gameplay files unchanged.');
}catch(error){report.success=false;report.failure=error.stack;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));throw error;}
finally{await browser?.close();}
