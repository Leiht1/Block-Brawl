import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/map-facilities');await fs.mkdir(out,{recursive:true});
const iceOnly=process.argv.includes('--ice-only');
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[deps]})),sharp=require(require.resolve('sharp',{paths:[deps]}));
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
 if(name==='flow.mjs')body=body.toString().replace('performance.now(),Math.random,reducedMotion','performance.now(),()=>window.__mapRoll??Math.random(),reducedMotion');
 if(name==='app.mjs')body=body.toString()+`\nwindow.__facilityQA={advance(ms){for(let n=0;n<ms;n+=10)__clock.advance(__clock.time+Math.min(10,ms-n));},stopBot(){flow.arena.source.stop();},state(){const a=flow.arena;return {screen:flow.screen,interact:flow.canInteract,reveal:flow.reveal?.at(__clock.time).phase,selected:flow.reveal?.map.id,map:a?.map.id,status:a?.status,deadline:a?.deadline,time:__clock.time,pair:engine.hint(),scores:a?Object.values(a.engines).map(e=>e.score):[],terrain:engine.terrain.cells,phase:a?.environment?.state?.phase,blocks:a?Object.values(a.engines).map(e=>e.temporaryBlocks.size):[],alphas:engine.terrain.cells.map((_,i)=>ctx.getImageData(Math.floor((i%8+.5)*cell*pixelRatio),Math.floor((Math.floor(i/8)+.5)*cell*pixelRatio),1,1).data[3])};}};`;
 res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:false,channel:'msedge'}),errors=[],report={checks:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__facilityQA&&blockBrawl.snapshot().art.ready===2);
 const advance=ms=>page.evaluate(ms=>__facilityQA.advance(ms),ms),state=()=>page.evaluate(()=>__facilityQA.state());
 const sels=['.menu','.menu .tools','.player-play .arena-heading','.opponent-play .arena-heading','#arena-scoreboard','#board-wrap','#board','#opponent-board'];
 const geometry=()=>page.evaluate(s=>Object.fromEntries(s.map(q=>[q,document.querySelector(q).getBoundingClientRect().toJSON()])),sels);
 await page.locator('#open-arena').click();if(!iceOnly){await page.evaluate(()=>window.__mapRoll=.3);await page.locator('[data-difficulty="easy"]').click();
 assert.equal((await state()).screen,'matching');assert.equal((await state()).interact,false);assert.equal((await state()).map,undefined);
 const names=[];for(let n=0;n<4;n++){names.push(await page.locator('#map-reveal-name').textContent());await advance(160);}assert.equal(new Set(names).size,4);assert.equal(await page.locator('.map-reveal-card:visible').count(),1);await page.screenshot({path:path.join(out,'reveal-cycling.png')});
 await page.locator('#map-reveal-cancel').click();await advance(8000);assert.equal((await state()).screen,'difficulty');assert.equal((await state()).map,undefined);
 report.checks.push('One cycling window; no arena/input/bot/environment before reveal; cancelling prevents delayed entry');
 }
 let baseline;
 for(const [round,id] of (iceOnly?['crystal']:['forest','cliff','crystal','ruins']).entries()){
  const n=['forest','cliff','crystal','ruins'].indexOf(id);
  await page.evaluate(n=>window.__mapRoll=(n+.1)/4,n);await page.locator(round?'#restart':'[data-difficulty="easy"]').click();const entry=(await state()).time;
  await advance(3000);let s=await state();assert.equal(s.reveal,'locked');assert.equal(s.selected,id);assert.equal(s.map,undefined);
  await page.screenshot({path:path.join(out,id+'-revealed.png')});await advance(1990);assert.equal((await state()).screen,'matching');await advance(10);s=await state();assert.equal(s.map,id);assert.equal(s.status,'countdown');assert.equal(s.interact,false);assert.equal(s.deadline,entry+8000);
  await page.evaluate(async id=>{const {MAPS}=await import('./maps.mjs');await Promise.all(Object.values(MAPS.find(m=>m.id===id).assets).filter(Boolean).map(url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=url;})));},id);await advance(10);
  const g=await geometry();baseline??=g;assert.deepEqual(g,baseline);assert.equal(g['#board'].width,480);assert.equal(g['#opponent-board'].height,480);
  await advance(2990);assert.equal((await state()).status,'playing');assert.equal((await state()).interact,true);assert.equal(await page.locator('#map-announcement').isVisible(),true);await page.screenshot({path:path.join(out,id+'-opening.png')});
  await advance(2990);assert.equal(await page.locator('#map-announcement').isVisible(),true);await advance(10);assert.equal(await page.locator('#map-announcement').evaluate(e=>e.classList.contains('fading')),true);await advance(500);assert.equal(await page.locator('#map-announcement').isVisible(),false);assert.deepEqual(await geometry(),g);
  s=await state();s.terrain.forEach((t,i)=>assert.equal(s.alphas[i]>0,t!=='hole'));const box=await page.locator('#board').boundingBox();for(const i of s.pair)await page.mouse.click(box.x+(i%8+.5)*60,box.y+(Math.floor(i/8)+.5)*60);
  await advance(4500);await page.evaluate(()=>__facilityQA.stopBot());await advance(4000);s=await state();assert.ok(s.scores[0]>0);assert.ok(s.scores[1]>0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,id+'-duel.png')});if(id!=='forest'){const crop=await page.screenshot({clip:{x:Math.max(0,box.x-85),y:box.y-28,width:610,height:580}});await sharp(crop).resize(915,870).png().toFile(path.join(out,id+'-detail.png'));}
  report.checks.push({map:id,cells:s.terrain.filter(t=>t==='cell').length,obstacles:s.terrain.filter(t=>t==='obstacle').length,geometry:g,realScores:s.scores,revealMs:5000,bannerMs:3000});
  if(id==='cliff'){await advance(s.deadline+20000-s.time);assert.equal((await state()).phase,'warning');await advance(1650);assert.equal((await state()).phase,'fall');await page.screenshot({path:path.join(out,'cliff-rockfall.png')});await advance(150);assert.deepEqual((await state()).blocks,[1,1]);await advance(5000);assert.deepEqual((await state()).blocks,[0,0]);report.checks.push('Cliff rockfall still starts 20s after countdown, falls and restores both sides');}
 }
 if(!iceOnly){await page.locator('#restart').click();await advance(3000);await page.keyboard.press('Escape');await advance(8000);assert.equal((await state()).screen,'difficulty');assert.equal((await state()).map,undefined);assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-map')),'forest');
 report.checks.push('Restart redraws a map; Escape cancels a locked reveal and clears stage/banner');
 }
 assert.deepEqual(errors,[]);report.errors=errors;await fs.writeFile(path.join(out,iceOnly?'ice-final-report.json':'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
