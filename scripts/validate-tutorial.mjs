// One desktop pass of the new flow; helpers only exist in this local response.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const deps=process.argv[2]||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[deps]}));
const out=path.join(root,'validation/2026-10-10/tutorial');await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';const file=path.resolve(root,'dist',name);
  if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
  if(name==='app.mjs')body=body.toString()+`\nwindow.__tutorialQA={hint:()=>flow.session.hint(),state:()=>({screen:flow.screen,index:flow.index,status:flow.session?.status,moves:flow.session?.moves,counts:flow.session?.counts}),advance:()=>{for(let i=0;i<1000;i++){window.__clock.advance(window.__clock.time+10);if(engine.stableChecked&&!engine.transactions.length)break;}}};`;
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'});const errors=[],report={viewport:'1440x960',levels:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
  const url=`http://127.0.0.1:${server.address().port}/`;await page.goto(url);await page.waitForFunction(()=>window.__tutorialQA&&window.blockBrawl.snapshot().art.ready===2);
  assert.ok(await page.locator('#home-screen').isVisible());assert.equal(await page.locator('#home-screen button:disabled').count(),2);
  await page.screenshot({path:path.join(out,'home.png')});await page.locator('#open-tutorial').click();
  assert.equal(await page.locator('[data-level]:disabled').count(),5);await page.locator('[data-level="0"]').click();
  await page.evaluate(()=>__clock.advance(10));await page.screenshot({path:path.join(out,'teaching.png')});
  async function swap(pair){const box=await page.locator('#board').boundingBox();for(const i of pair)await page.mouse.click(box.x+(i%8+.5)*box.width/8,box.y+(Math.floor(i/8)+.5)*box.height/8);}
  // Restart while the first exchange is in flight, without recording a win.
  await swap([11,3]);await page.evaluate(()=>__clock.advance(60));await page.locator('#restart').click();assert.equal((await page.evaluate(()=>__tutorialQA.state())).moves,0);assert.equal(await page.evaluate(()=>blockBrawl.snapshot().transactions),0);
  for(let index=0;index<6;index++){
    assert.equal((await page.evaluate(()=>__tutorialQA.state())).index,index);
    for(let action=0;action<20;action++){
      const state=await page.evaluate(()=>__tutorialQA.state());if(state.status==='won')break;
      const pair=index===5&&action===0?[26,27]:await page.evaluate(()=>__tutorialQA.hint());assert.ok(pair);await swap(pair);await page.evaluate(()=>__tutorialQA.advance());
    }
    const state=await page.evaluate(()=>__tutorialQA.state());assert.equal(state.status,'won');assert.ok(await page.locator('#result').isVisible());report.levels.push(state);
    if(index===0){await page.locator('#result-back').click();assert.equal(await page.locator('[data-level]:disabled').count(),4);await page.locator('[data-level="0"]').click();await page.locator('#exit-game').click();await page.locator('[data-level="1"]').click();}
    else await page.locator('#result-next').click();
  }
  assert.ok(await page.locator('#home-screen').isVisible());assert.match(await page.locator('#qualification').innerText(),/资格已获得/);
  await page.reload();await page.waitForFunction(()=>window.__tutorialQA);assert.match(await page.locator('#home-progress').innerText(),/6 \/ 6/);assert.match(await page.locator('#qualification').innerText(),/资格已获得/);
  await page.locator('#open-tutorial').click();assert.equal(await page.locator('[data-level]:disabled').count(),0);await page.locator('#level-back').click();
  await page.locator('#open-sandbox').click();assert.equal(await page.locator('[data-mode]').count(),16);await page.locator('[data-mode="five"]').click();await page.locator('#exit-game').click();await page.locator('#open-sandbox').click();await page.locator('#restart').click();assert.equal(await page.evaluate(()=>blockBrawl.snapshot().mode),'free');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
  assert.deepEqual(errors,[]);report.errors=errors;report.checks=['home and disabled future modes','six real pointer-driven completions','restart cancels pending exchange','return, sequential unlock and replay','refresh persistence and qualification','all 16 sandbox entries retained; reentry resets free mode'];
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}
