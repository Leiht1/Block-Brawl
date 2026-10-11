import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-maps');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={files:[],errors:[],audibleVerdict:'Not an ear-listening verdict; decode, playback, duration and gain inspection only.'};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/validation/2026-10-11/audio-maps/index.html');await page.locator('h1').click();
 for(let i=0;i<24;i++){
  const media=await page.evaluate(async i=>{
   const a=document.querySelectorAll('audio')[i],events=[];
   for(const event of ['loadeddata','playing','ended'])a.addEventListener(event,()=>events.push(event),{once:true});
   await new Promise((resolve,reject)=>{a.addEventListener('ended',resolve,{once:true});a.addEventListener('error',()=>reject(Error('Candidate media error')),{once:true});a.play().catch(reject);});
   return {file:a.getAttribute('src'),seconds:a.duration,volume:a.volume,events};
  },i);
  assert.deepEqual(media.events,['loadeddata','playing','ended']);assert.ok(media.seconds>0&&media.seconds<=1.1);report.files.push(media);
 }
 assert.deepEqual(report.errors,[]);await page.screenshot({path:path.join(out,'audition-candidates.png'),fullPage:true});report.success=true;
 await fs.writeFile(path.join(out,'candidate-playback.json'),JSON.stringify(report,null,2));
 console.log('24 candidate recordings decoded, played, ended; audition page has no script errors.');
}finally{await browser.close();}
