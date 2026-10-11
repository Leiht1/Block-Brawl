import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),file=path.join(root,'方块乱斗-最新版.html'),out=path.join(root,'validation/2026-10-11/offline');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[],requests:[]};
const check=name=>{report.checks.push(name);console.log('PASS',name);};
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.addInitScript(()=>{
  window.__offlineMedia=[];window.__offlineContexts=[];
  const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(src){super(src);const row={src,events:[]};__offlineMedia.push(row);for(const event of ['loadeddata','playing','ended','error'])this.addEventListener(event,()=>row.events.push(event));}};
  const NativeContext=window.AudioContext;window.AudioContext=class extends NativeContext{constructor(...args){super(...args);this.qaSources=[];this.qaGains=[];__offlineContexts.push(this);}createBufferSource(){const node=super.createBufferSource();this.qaSources.push(node);return node;}createGain(){const node=super.createGain();this.qaGains.push(node);return node;}};
 });
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>report.requests.push(r.url()));
 await page.goto(pathToFileURL(file).href);await page.waitForTimeout(300);
 const meta=await page.evaluate(()=>JSON.parse(document.querySelector('#offline-build').textContent));
 for(const [p,sha]of Object.entries(meta.sources)){
  const disk=p.startsWith('./assets/')?path.join(root,'dist',p):path.join(root,p);
  assert.equal(createHash('sha256').update(await fs.readFile(disk)).digest('hex'),sha,p);
 }
 assert.deepEqual(meta.musicVolumes,{lobby:.66,battle:.60});check('Embedded sources match the latest files and music gains');
 assert.equal(await page.locator('[data-audio-setting]').count(),2);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));check('Direct file opening shows one-page home and shared controls');
 await page.click('#open-tutorial');await page.waitForFunction(()=>__offlineContexts.some(c=>c.qaSources.some(s=>s.buffer?.duration>150)));
 await page.waitForTimeout(1100);assert.ok(await page.evaluate(()=>__offlineContexts.some(c=>c.qaGains.some(g=>Math.abs(g.gain.value-.66)<.001))));check('Trusted input starts embedded lobby music at the latest gain');
 await page.click('[data-level="0"]');await page.waitForSelector('#tutorial-panel',{state:'visible'});
 await page.screenshot({path:path.join(out,'tutorial.png')});await page.click('#exit-game');await page.click('#level-back');
 await page.click('#open-arena');await page.click('[data-difficulty="easy"]');await page.waitForSelector('#arena-panel',{state:'visible'});
 await page.waitForFunction(()=>__offlineContexts.some(c=>c.qaSources.some(s=>s.loop&&s.buffer?.duration===120)));
 await page.waitForTimeout(1100);assert.ok(await page.evaluate(()=>__offlineContexts.some(c=>c.qaGains.some(g=>Math.abs(g.gain.value-.60)<.001))));
 await page.screenshot({path:path.join(out,'battle.png')});check('Tutorial and actual battle work offline; battle BGM loops at the latest gain');
 await page.click('#music');assert.equal(await page.getAttribute('#sound','aria-pressed'),'true');await page.click('#music');
 await page.click('#sound');assert.equal(await page.getAttribute('#music','aria-pressed'),'true');await page.click('#sound');check('Music and effects toggles remain independent');
 await page.click('#exit-game');await page.click('#open-sandbox');await page.click('[data-mode="three"]');await page.screenshot({path:path.join(out,'sandbox.png')});
 report.assets=await page.evaluate(async()=>{
  const context=new AudioContext(),rows=[];
  for(const [src,a]of Object.entries(__blockFiles)){
   const url=__blockAsset(src);
   if(a.mime.startsWith('audio/')){const buffer=await context.decodeAudioData(await (await fetch(url)).arrayBuffer());rows.push({src,type:'audio',seconds:buffer.duration});}
   else{const img=new Image();img.src=url;await img.decode();rows.push({src,type:'image',width:img.naturalWidth,height:img.naturalHeight});}
  }await context.close();return rows;
 });assert.equal(report.assets.length,68);check('All 68 embedded images and recordings decode without local side files');
 report.media=await page.evaluate(()=>__offlineMedia);assert.ok(report.media.some(r=>r.events.includes('playing')));assert.ok(report.media.every(r=>!r.events.includes('error')));
 assert.deepEqual(report.errors,[]);assert.ok(report.requests.every(url=>url===pathToFileURL(file).href||/^(blob:|data:)/.test(url)));check('No missing resources, external requests, page errors or audio errors');
 await page.setViewportSize({width:390,height:844});await page.reload();assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
 await page.screenshot({path:path.join(out,'mobile-home.png')});check('Offline mobile home remains one viewport tall');
}catch(e){report.failure=e.stack;throw e;}finally{await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));await browser.close();}
