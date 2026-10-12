import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),bundle='C:/Users/HT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const sharp=require(bundle+'sharp'),{chromium}=require(bundle+'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),project=path.resolve(root,'../..');
const M=JSON.parse(await fs.readFile(path.join(root,'spec/manifest.json'))),art=JSON.parse(await fs.readFile(path.join(root,'qa/assets.json')));
const report={date:'2026-10-12',scope:'cast-fx-stage3 only; no unrelated game regression',checks:[],assetStats:[],loopMetrics:[],browser:{errors:[],failedRequests:[],framesChecked:0},protectedFiles:{},status:'running'};
const check=s=>report.checks.push(s),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const browserOnly=process.argv.includes('--browser-only');
if(browserOnly){const previous=JSON.parse(await fs.readFile(path.join(root,'qa/verification.json')));assert.equal(previous.assetStats.length,15);report.assetStats=previous.assetStats;report.loopMetrics=previous.loopMetrics;report.checks=previous.checks.slice(0,3);report.reusedAssetVerification=true;}
function delta(a,b){let total=0;for(let i=0;i<a.length;i+=4)for(let c=0;c<3;c++)total+=Math.abs(a[i+c]*a[i+3]/255-b[i+c]*b[i+3]/255);return total/(a.length/4*3);}
if(!browserOnly){
for(const [type,phases] of Object.entries(M.animations))for(const [phase,a] of Object.entries(phases)){
  const png=await sharp(path.join(root,a.atlas)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),webp=await sharp(path.join(root,a.runtimeAtlas)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(png.info.width,a.atlasSize[0]);assert.equal(png.info.height,a.atlasSize[1]);assert.equal(webp.info.width,png.info.width);assert.equal(webp.info.height,png.info.height);
  let alphaErrors=0;for(let i=3;i<png.data.length;i+=4)if(png.data[i]!==webp.data[i])alphaErrors++;
  assert.equal(alphaErrors,0,`${type}/${phase} optimized alpha`);
  const frames=[],hashes=new Set();let maxBorderAlpha=0,visibleCount=0;
  for(const f of a.frames){
    const file=await fs.readFile(path.join(root,f.file));assert.equal(sha(file),f.sha256);
    const data=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(data.info.width,256);assert.equal(data.info.height,256);assert.equal(data.info.channels,4);
    const atlasFrame=await sharp(path.join(root,a.atlas)).extract({left:f.rect.x,top:f.rect.y,width:256,height:256}).ensureAlpha().raw().toBuffer();assert.deepEqual(data.data,atlasFrame,`${type}/${phase}/${f.order} atlas matches PNG`);
    assert.ok(f.rect.x+256<=png.info.width&&f.rect.y+256<=png.info.height);assert.equal(f.durationMs,a.frameDurationMs);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const v=data.data[(y*256+x)*4+3];if(x===0||y===0||x===255||y===255)maxBorderAlpha=Math.max(maxBorderAlpha,v);if(v>0)visibleCount++;}
    const h=sha(data.data);assert.ok(!hashes.has(h),`${type}/${phase} duplicate frame`);hashes.add(h);frames.push(data.data);
    if(f.terminal)assert.equal(data.data.filter((_,i)=>i%4===3&&data.data[i]>0).length,0);
  }
  assert.equal(maxBorderAlpha,0,`${type}/${phase} nonzero outer border`);
  if(a.loop){const diffs=frames.slice(1).map((f,n)=>delta(f,frames[n])),seam=delta(frames.at(-1),frames[0]);report.loopMetrics.push({type,phase,meanStep:diffs.reduce((a,b)=>a+b,0)/diffs.length,maxStep:Math.max(...diffs),lastToFirst:seam});assert.ok(seam<=Math.max(...diffs)*1.8,`${type}/${phase} excessive loop seam`);}
  report.assetStats.push({type,phase,frames:a.frameCount,pngBytes:a.atlasBytes,runtimeBytes:a.runtimeBytes,alphaErrors,maxBorderAlpha,visibleCount});
}
assert.equal(report.assetStats.reduce((sum,s)=>sum+s.frames,0),144);assert.equal(art.duplicates.length,0);
check('144 RGBA frames; exact pixel matches to 15 PNG atlases; ordered coordinates and timing; unique poses per stage');
check('WebP decoded alpha equals PNG alpha at every pixel; transparent outer borders; three fully clear terminal frames');
check('orb/trail loop seam compared with adjacent-frame differences; contact sheets retained for visual inspection');
}
const before=JSON.parse(await fs.readFile(path.join(root,'qa/protected-before.json'))),changed=[];
for(const [file,hash] of Object.entries(before))if(sha(await fs.readFile(path.join(project,file)))!==hash)changed.push(file);
assert.deepEqual(changed,[]);report.protectedFiles={checked:Object.keys(before).length,changed};check('formal game, approved maps and all approved third-version card files unchanged');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(project,'.'+name);assert.ok(file.startsWith(project+path.sep));const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  page.on('pageerror',e=>report.browser.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))report.browser.failedRequests.push({url:r.url(),status:r.status()});});
  await page.addInitScript(()=>{window.reviewClock={time:0,raf:[],advance(ms){this.time+=ms;const list=this.raf.splice(0);for(const f of list)f(this.time);}};Object.defineProperty(performance,'now',{value:()=>reviewClock.time});window.requestAnimationFrame=f=>{reviewClock.raf.push(f);return 1;};});
  await page.goto(`http://127.0.0.1:${server.address().port}/art-preproduction/cast-fx-stage3/`);await page.waitForFunction(()=>window.castFxReview?.state.ready,null,{polling:50});
  const snapshot=()=>page.evaluate(()=>castFxReview.snapshot()),seek=t=>page.evaluate(t=>castFxReview.seek(t),t),advance=ms=>page.evaluate(ms=>reviewClock.advance(ms),ms);
  for(const type of ['attack','control','buff']){
    await page.locator(`[data-type="${type}"]`).click();await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});
    for(const [phase,a] of Object.entries(M.animations[type])){
      await page.selectOption('#stage',phase);
      for(let n=0;n<a.frameCount;n++){await seek(n*a.frameDurationMs+1);const s=await snapshot(),d=s.draws.find(d=>d.scene==='primary');assert.equal(d.phase,phase);assert.equal(d.index,n);assert.equal(d.type,type);report.browser.framesChecked++;}
    }
    await page.selectOption('#stage','all');for(const time of [90,270,385,455,600,790,810,865,900,1000,1125,1200]){await seek(time);const s=await snapshot();if(time===1200)assert.equal(s.draws.length,0);if([90,270,600,900].includes(time))await page.locator('#battle').screenshot({path:path.join(root,`qa/${type}-${{90:'activation',270:'release',600:'flight',900:'impact'}[time]}-scene.png`)});}
  }
  check('all 144 exported frames actually selected and drawn by preview; three full performances reach clean end');
  await page.locator('[data-type="attack"]').click();await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});await page.selectOption('#stage','all');await seek(100);
  await advance(100);assert.equal((await snapshot()).time,100);await page.locator('#next').click();assert.equal((await snapshot()).time,120);await page.locator('#prev').click();assert.equal((await snapshot()).time,90);
  await page.selectOption('#speed','0.5');await seek(500);await page.locator('#play').click();await advance(200);assert.equal((await snapshot()).time,600);
  await page.selectOption('#speed','0.25');await advance(200);assert.equal((await snapshot()).time,650);await page.locator('#play').click();await advance(300);assert.equal((await snapshot()).time,650);
  await page.selectOption('#speed','1');await page.locator('#repeat').uncheck();await seek(1190);await page.locator('#play').click();await advance(20);assert.equal((await snapshot()).time,1200);assert.equal((await snapshot()).draws.length,0);
  await page.locator('#repeat').check();await page.locator('#replay').click();await advance(1800);assert.equal((await snapshot()).time,0);
  check('pause, real-frame previous/next, normal/0.5/0.25 speed, repeat and clean one-shot end');
  await page.locator('#compare').check();await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});await seek(600);let s=await snapshot();assert.ok(s.draws.some(d=>d.scene==='primary'&&d.type==='attack'));assert.ok(s.draws.some(d=>d.scene==='comparison'&&d.type==='buff'));await page.screenshot({path:path.join(root,'qa/enemy-self-comparison.png'),fullPage:true});await page.locator('#compare').uncheck();await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});
  check('same-time attack/control enemy route and buff self route comparison');
  for(const m of M.maps){
    await page.selectOption('#map',m.id);await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});
    for(const c of M.cards){
      if((await snapshot()).type!==c.type){await page.locator(`[data-type="${c.type}"]`).click();await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});}
      await page.selectOption('#card',c.id);await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});await seek(600);const to=(await snapshot()).target;assert.equal(m.terrain[to.index],'cell');
      if(c.id==='meteor')assert.equal(to.index,to.plan.landing);if(c.id==='quake')assert.ok(to.plan.cells.includes(to.index)&&Math.floor(to.index/8)===7);if(c.id==='rainbow')assert.equal(to.index,m.resolvedRainbow);
    }
  }
  check('five existing map shapes and twelve current target rules; meteor landing, bottom-row quake, random ordinary rainbow cell');
  await page.selectOption('#map','forest');await page.locator('[data-type="attack"]').click();await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});await page.selectOption('#stage','all');await seek(0);await page.locator('#battle').scrollIntoViewIfNeeded();
  const rect=await page.locator('#battle').boundingBox(),pos=(x,y)=>({x:rect.x+x/960*rect.width,y:rect.y+y/680*rect.height});
  const from=pos(275,548),to=pos(666.25,231.25);await page.mouse.move(from.x,from.y);await page.mouse.down();await advance(240);await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();await seek(260);s=await snapshot();
  assert.deepEqual(s.origin,{x:275,y:548});assert.ok(s.lastDrop.x>600);const burst=s.draws.find(d=>d.phase==='release');assert.equal(burst.x,275);assert.equal(burst.y,548);assert.ok(Math.hypot(s.lastDrop.x-burst.x,s.lastDrop.y-burst.y)>300);
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(pos(256.25,231.25).x,pos(256.25,231.25).y);await page.mouse.up();assert.equal((await snapshot()).time,0);assert.ok(!(await snapshot()).draws.some(d=>d.phase==='release'));
  check('real pointer drag emits burst at captured hand origin, not mouse release; wrong-side drop cancels');
  await page.selectOption('#quality','png');await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});await seek(600);assert.ok((await snapshot()).draws.every(d=>d.atlas.endsWith('.png')));await page.selectOption('#quality','runtime');await page.waitForFunction(()=>castFxReview.state.ready,null,{polling:50});await seek(600);
  for(const viewport of [{width:1440,height:1100},{width:1024,height:768},{width:600,height:900}]){await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  check('PNG masters and optimized atlases both playable; three preview layouts without horizontal overflow');
  const offline=await browser.newPage();offline.on('pageerror',e=>report.browser.errors.push('file: '+e.message));await offline.goto(pathToFileURL(path.join(root,'index.html')).href);await offline.waitForFunction(()=>window.castFxReview?.state.ready,null,{polling:50});await offline.evaluate(()=>castFxReview.seek(600));assert.ok((await offline.evaluate(()=>castFxReview.snapshot())).draws.length>=2);await offline.close();
  check('index.html opens directly via file URL, without a server or network dependency');
  assert.deepEqual(report.browser.errors,[]);assert.deepEqual(report.browser.failedRequests,[]);
  report.status='passed';report.totals=M.totals;
}catch(e){report.status='failed';report.failure=e.stack;throw e;}
finally{await fs.writeFile(path.join(root,'qa/verification.json'),JSON.stringify(report,null,2));await browser.close();server.close();}
console.log(JSON.stringify({status:report.status,checks:report.checks.length,framesChecked:report.browser.framesChecked,protectedFiles:report.protectedFiles,totals:report.totals},null,2));
