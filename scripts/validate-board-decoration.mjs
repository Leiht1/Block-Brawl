// Local browser regression for stage art overlapping UI or moving its frame.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const out=path.join(root,'validation/2026-10-12/board-decoration');
await fs.mkdir(out,{recursive:true});
const injection=`
window.__decorationQA={
 async enter(id){
  const {MAPS}=await import('./maps.mjs');
  flow.arena?.dispose();flow.enterArena(MAPS.find(m=>m.id===id),__clock.time);
  flow.selection.update(__clock.time+60000);flow.update(__clock.time);
 },
 advance(ms){for(let n=0;n<ms;n+=20)__clock.advance(__clock.time+Math.min(20,ms-n));}
};`;
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  const file=path.resolve(root,'dist',name);
  assert.ok(file.startsWith(path.join(root,'dist')+path.sep));
  let body=await fs.readFile(file);if(name==='app.mjs')body=body.toString()+injection;
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'});
const report={checks:[],errors:[]};
const selectors=['#board','#opponent-board','#arena-scoreboard','.menu .tools'];
try{
 for(const viewport of [{width:1920,height:945},{width:1366,height:768},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{
   let seed=1729;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};
   Object.defineProperty(performance,'now',{value:()=>__clock.time});
   requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.__decorationQA&&blockBrawl.snapshot().art.ready===2);
  const geometry=()=>page.evaluate(selectors=>Object.fromEntries(selectors.map(s=>{
   const b=document.querySelector(s).getBoundingClientRect();return [s,[b.x,b.y,b.width,b.height]];
  })),selectors);
  for(const id of ['forest','cliff','crystal','ruins','furnace']){
   await page.evaluate(id=>__decorationQA.enter(id),id);
   await page.evaluate(()=>__decorationQA.advance(3200));
   await page.evaluate(async()=>{
    const {MAPS}=await import('./maps.mjs');
    const map=MAPS.find(m=>m.id===document.documentElement.dataset.map);
    await Promise.all([map.assets.frame,map.assets.stageRight].filter(Boolean).map(async src=>{
     const img=new Image();img.src=src;await img.decode();
    }));
   });
   const baseline=await geometry();
   // Sample both warnings and impacts, including the cliff's camera shake.
   for(let n=0;n<135;n++){
    await page.evaluate(()=>__decorationQA.advance(200));
    assert.deepEqual(await geometry(),baseline,`${id}: UI geometry changed`);
    const transforms=await page.locator('.board-wrap').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n,'::before').transform));
    assert.deepEqual(transforms,['none','none'],`${id}: stage frame moved`);
   }
   // If stage art reaches these UI boxes, hiding it changes their rendered pixels.
   const protectedUI=['#arena-scoreboard','.menu .tools'];
   const before=[];for(const s of protectedUI)before.push(await page.locator(s).screenshot());
   const hide=await page.addStyleTag({content:'.board-wrap::before{visibility:hidden!important}'});
   for(const [n,s] of protectedUI.entries()){
    const after=await page.locator(s).screenshot();
    const maxDifference=await page.evaluate(async images=>{
     const pixels=[];
     for(const src of images){
      const img=new Image();img.src='data:image/png;base64,'+src;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);pixels.push(ctx.getImageData(0,0,img.width,img.height).data);
     }
     let max=0;for(let i=0;i<pixels[0].length;i++)max=Math.max(max,Math.abs(pixels[0][i]-pixels[1][i]));
     return max;
    },[before[n].toString('base64'),after.toString('base64')]);
    // Allow faint shadows at translucent rounded edges, never solid stage art.
    if(maxDifference>8){
     await fs.writeFile(path.join(out,'ui-before.png'),before[n]);
     await fs.writeFile(path.join(out,'ui-after.png'),after);
    }
    assert.ok(maxDifference<=8,`${id}: decoration overlaps ${s} (pixel difference ${maxDifference})`);
   }
   await hide.evaluate(n=>n.remove());
   await page.screenshot({path:path.join(out,`${id}-${viewport.width}.png`)});
   report.checks.push({map:id,viewport,stableGeometry:true,fixedFrame:true,unobscuredUI:true});
  }
  await page.close();
 }
 assert.deepEqual(report.errors,[]);
 console.log(JSON.stringify({checks:report.checks.length,errors:report.errors},null,2));
}catch(e){report.failure=e.stack;throw e;}
finally{
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
 await browser.close();await new Promise(r=>server.close(r));
}
