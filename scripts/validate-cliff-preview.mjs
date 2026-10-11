import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {REVEAL_STEPS} from '../dist/map-reveal.mjs';
import {mapPreview} from './map-preview-art.mjs';
import {TEST_TERRAINS} from '../dist/terrain.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/cliff-preview');await fs.mkdir(out,{recursive:true});
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[deps]})),sharp=require(require.resolve('sharp',{paths:[deps]}));
const stage=await fs.readFile(path.join(root,'dist/assets/maps/cliff-stage-left.svg'),'utf8'),preview=await fs.readFile(path.join(root,'dist/assets/maps/cliff-preview.svg'),'utf8');
assert.equal(preview,mapPreview(stage,TEST_TERRAINS.cliff,'#b5b4a1'));
const {data,info}=await sharp(Buffer.from(preview)).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.ok(Array.from({length:info.height},(_,y)=>data[y*info.width*4+3]).every(a=>a===0));
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.blockBrawl?.snapshot().art.ready===2);await page.locator('#open-arena').click();await page.evaluate(()=>{window.__originalRandom=Math.random;Math.random=()=>.3;});await page.locator('[data-difficulty="easy"]').click();await page.evaluate(()=>{Math.random=__originalRandom;});
 for(const [name,time] of [['cycling',REVEAL_STEPS[1]+1],['locked',2100]]){
  await page.evaluate(t=>__clock.advance(t),time);assert.match(await page.locator('#map-reveal-name').textContent(),/悬崖断层/);
  await page.evaluate(()=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src='./assets/maps/cliff-preview.svg';}));
  await page.screenshot({path:path.join(out,'cliff-'+name+'.png')});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({previewMatchesCurrentPlatform:true,clippedWallRemoved:true,cyclingAndLockedVerified:true,errors},null,2));console.log('Cliff preview: current platform, transparent edge, cycling and locked screenshots passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
