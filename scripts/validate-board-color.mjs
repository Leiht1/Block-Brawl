import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/board-color');await fs.mkdir(out,{recursive:true});
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),{chromium}=require(require.resolve('playwright',{paths:[deps]}));
const server=http.createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
 if(name==='flow.mjs')body=body.toString().replace('randomMap:true,onMapChange','randomMap:true,mapRandom:()=>window.__mapRoll,onMapChange');
 if(name==='app.mjs')body=body.toString()+`\nlet colorLayer,captureColor=false;const terrainDraw=painter.drawTerrain;painter.drawTerrain=(...args)=>{terrainDraw(...args);if(captureColor){colorLayer=canvas.toDataURL();captureColor=false;}};window.__colorQA={advance(ms){for(let n=0;n<ms;n+=10){captureColor=n+10>=ms;__clock.advance(__clock.time+Math.min(10,ms-n));}},layer:()=>colorLayer,state:()=>({pair:engine.hint(),busy:engine.locks.some(l=>l!==null),tx:engine.transactions.length,score:engine.score}),stopBot:()=>flow.arena.source.stop()};`;
 res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:false,channel:'msedge'}),errors=[],report={checks:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=f=>{__clock.raf=f;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__colorQA&&blockBrawl.snapshot().art.ready===2);await page.locator('#open-arena').click();
 const advance=ms=>page.evaluate(ms=>__colorQA.advance(ms),ms),state=()=>page.evaluate(()=>__colorQA.state()),layer=()=>page.evaluate(()=>__colorQA.layer());
 for(const [n,id] of ['forest','cliff','crystal','ruins'].entries()){
  await page.evaluate(n=>window.__mapRoll=(n+.1)/4,n);await page.locator(n?'#restart':'[data-difficulty="easy"]').click();
  await page.evaluate(async id=>{const urls=id==='forest'?['assets/toy-board.svg']:['assets/maps/'+id+'-board.svg',...(id==='ruins'?['assets/maps/ruins-pillar.svg']:[])];await Promise.all(urls.map(url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=url;})));},id);
  await page.locator('#arena-ready').click();await advance(3000);await page.evaluate(()=>__colorQA.stopBot());const baseline=await layer(),before=await state(),box=await page.locator('#board').boundingBox();
  if(id==='cliff')await page.screenshot({path:path.join(out,'before.png')});
  for(const i of before.pair)await page.mouse.click(box.x+(i%8+.5)*60,box.y+(Math.floor(i/8)+.5)*60);
  for(const ms of [50,60,150]){await advance(ms);assert.equal(await layer(),baseline,`${id}: terrain pixels changed during swap/clear`);}
  assert.ok((await state()).busy);assert.ok((await state()).score>before.score);if(id==='cliff')await page.screenshot({path:path.join(out,'during-clear.png')});
  await advance(4000);assert.equal((await state()).tx,0);assert.equal(await layer(),baseline,`${id}: settled terrain differs`);if(id==='cliff')await page.screenshot({path:path.join(out,'after.png')});report.checks.push({map:id,terrainPixelsIdentical:true,acceptedSwap:true,score:(await state()).score});
 }
 assert.deepEqual(errors,[]);report.errors=errors;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
