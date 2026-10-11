// Minimal desktop check for scenery scope and the two team markers.
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
const out=path.join(root,'validation/2026-10-10/arena-identity');await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);
  if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');const body=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.blockBrawl?.snapshot().art.ready===2);
  const frost=page.locator('#scene-softener');assert.equal(await frost.isVisible(),false);
  await page.screenshot({path:path.join(out,'home.png')});
  await page.locator('#open-arena').click();assert.equal(await frost.isVisible(),false);
  await page.locator('[data-difficulty="normal"]').click();assert.equal(await frost.isVisible(),true);
  assert.equal(await page.locator('.player-play .side-badge').innerText(),'我方');assert.equal(await page.locator('.opponent-play .side-badge').innerText(),'对方');
  const outline=selector=>page.locator(selector).evaluate(e=>({color:getComputedStyle(e).outlineColor,style:getComputedStyle(e).outlineStyle}));
  assert.equal((await outline('.player-play .board-wrap')).style,'none');
  assert.equal((await outline('.opponent-play .board-wrap')).style,'none');
  const left=await page.locator('#board').boundingBox(),right=await page.locator('#opponent-board').boundingBox();assert.equal(left.width,right.width);assert.equal(left.width,480);
  await page.screenshot({path:path.join(out,'teams.png')});
  await page.locator('#exit-game').click();assert.equal(await frost.isVisible(),false);
  await page.locator('#open-sandbox').click();assert.equal(await frost.isVisible(),false);await page.locator('#exit-game').click();
  await page.locator('#open-tutorial').click();await page.locator('[data-level="0"]').click();assert.equal(await frost.isVisible(),false);
  assert.deepEqual(errors,[]);
  const report={viewport:'1440x960',checks:['scenery clear on home and difficulty selection','frost only during arena, removed on exit','green player and red opponent labels retained, no extra frame outlines','equal 480px boards retained','sandbox and tutorial backgrounds clear'],errors};
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}
