import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const cliffArt=process.argv.includes('--cliff-art');
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,cliffArt?'validation/2026-10-11/cliff-art':'validation/2026-10-11/maps');await fs.mkdir(out,{recursive:true});
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[deps]}));
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
 // Validation-only clock and map rolls; production has no testing hooks.
 if(name==='flow.mjs')body=body.toString().replace('randomMap:true,onMapChange','randomMap:true,mapRandom:()=>window.__mapRoll??Math.random(),onMapChange');
 if(name==='app.mjs')body=body.toString()+`\nwindow.__mapsQA={
  advance(ms){for(let n=0;n<ms;n+=10)__clock.advance(__clock.time+Math.min(10,ms-n));},
  state(){const a=flow.arena,e=a?.environment;return {time:__clock.time,map:a?.map.id,status:a?.status,phase:e?.state?.phase,indexes:e?.state?.indexes,next:e?.next,end:e?.state?.end,counts:e?.counts,score:engine.score,pair:engine.hint(),terrain:engine.terrain.cells,board:engine.board.map(t=>t?{...t}:null),blocks:[...engine.temporaryBlocks].map(([index,b])=>({index,tile:{...b.tile}})),both:a?Object.values(a.engines).map(b=>({terrain:b.terrain.cells,score:b.score,blocks:b.temporaryBlocks.size})):[],alphas:engine.terrain.cells.map((_,i)=>ctx.getImageData(Math.floor((i%8+.5)*cell*pixelRatio),Math.floor((Math.floor(i/8)+.5)*cell*pixelRatio),1,1).data[3]),backdrop:document.documentElement.style.getPropertyValue('--art-backdrop'),rocks:!!rockVisual||rockRestores.length>0};},
  pauseBot(){flow.arena.source.stop();},remember(){window.__oldArena=flow.arena;},oldClean(){return __oldArena.status==='disposed'&&!__oldArena.environment.active&&__oldArena.environment.deadline===Infinity&&Object.values(__oldArena.engines).every(e=>!e.temporaryBlocks.size);}
 };`;
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch(e){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:false,channel:'msedge'}),errors=[],report={checks:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__mapsQA&&blockBrawl.snapshot().art.ready===2);
 const advance=ms=>page.evaluate(ms=>__mapsQA.advance(ms),ms),state=()=>page.evaluate(()=>__mapsQA.state());
 const selectors=['.menu','.menu .tools','.player-play .arena-heading','.opponent-play .arena-heading','#arena-scoreboard','#board-wrap','#board','#opponent-board'];
 const geometry=()=>page.evaluate(s=>Object.fromEntries(s.map(q=>[q,document.querySelector(q).getBoundingClientRect().toJSON()])),selectors);
 if(cliffArt){
  await page.locator('#open-arena').click();await page.evaluate(()=>window.__mapRoll=0);await page.locator('[data-difficulty="easy"]').click();await advance(10);
  const baseline=await geometry();await page.evaluate(()=>window.__mapRoll=.3);await page.locator('#restart').click();
  await page.evaluate(async()=>{const {MAPS}=await import('./maps.mjs');await Promise.all(Object.values(MAPS[1].assets).filter(Boolean).map(url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=url;})));});
  await page.locator('#arena-ready').click();await advance(3000);const start=(await state()).time;
  const g=await geometry();assert.deepEqual(g,baseline);assert.equal(g['#board'].width,480);assert.equal(g['#board'].height,480);assert.equal(g['#opponent-board'].width,480);
  let s=await state();assert.equal(s.map,'cliff');assert.equal(s.terrain.filter(t=>t==='cell').length,48);s.terrain.forEach((t,i)=>assert.equal(s.alphas[i]>0,t!=='hole'));assert.deepEqual(s.both[0].terrain,s.both[1].terrain);
  const box=await page.locator('#board').boundingBox(),pair=s.pair;
  for(const i of pair)await page.mouse.click(box.x+(i%8+.5)*60,box.y+(Math.floor(i/8)+.5)*60);
  await advance(8000);s=await state();assert.ok(s.score>0);assert.ok(s.both[1].score>0);await page.evaluate(()=>__mapsQA.pauseBot());await advance(4000);s=await state();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Cliff roots must not cause horizontal scrolling');
  await page.screenshot({path:path.join(out,'cliff-duel.png')});
  const sharp=require(require.resolve('sharp',{paths:[deps]}));
  const crop=await page.screenshot({clip:{x:Math.max(0,box.x-95),y:box.y-28,width:610,height:580}});
  await sharp(crop).resize(915,870).png().toFile(path.join(out,'cliff-board-detail.png'));
  const neutral=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=480;const p=c.getContext('2d');return import('./art.mjs').then(async({createArtAssets})=>{const {MAPS}=await import('./maps.mjs');const a=createArtAssets();a.setMap(MAPS[1]);await new Promise(r=>setTimeout(r,50));a.board(p,480);return [...p.getImageData(30,30,1,1).data];});});
  report.checks.push({geometryUnchanged:true,player:g['#board'],opponent:g['#opponent-board'],cells:48,transparentCanvasHoles:16,realPlayerScore:s.score,realBotScore:s.both[1].score,wellPixel:neutral});
  await advance(start+20000-s.time);assert.equal((await state()).phase,'warning');await page.screenshot({path:path.join(out,'cliff-warning.png')});
  await advance(1650);assert.equal((await state()).phase,'fall');await page.screenshot({path:path.join(out,'cliff-fall.png')});
  await advance(150);s=await state();assert.equal(s.phase,'blocked');assert.deepEqual(s.both.map(b=>b.blocks),[1,1]);const saved=s.blocks[0];await page.screenshot({path:path.join(out,'cliff-blocked.png')});
  await advance(5000);s=await state();assert.equal(s.phase,undefined);assert.deepEqual(s.board[saved.index],saved.tile);assert.deepEqual(s.both.map(b=>b.blocks),[0,0]);await advance(350);
  report.checks.push('Existing paired rock warning / fall / blockage / restoration remains visible and preserves original tile');
  await page.locator('#exit-game').click();assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-map')),'forest');
  report.checks.push('Cliff stage styling is removed on exit');
 }else{
 const home=await page.screenshot({clip:{x:0,y:0,width:80,height:600}});await page.locator('#open-arena').click();assert.deepEqual(await page.screenshot({clip:{x:0,y:0,width:80,height:600}}),home);
 let baseline;
 for(const [n,id] of ['forest','cliff','crystal','ruins'].entries()){
  await page.evaluate(n=>window.__mapRoll=(n+.1)/4,n);if(n===0)await page.locator('[data-difficulty="easy"]').click();else await page.locator('#restart').click();
  await page.evaluate(async id=>{const {MAPS}=await import('./maps.mjs');await Promise.all(Object.values(MAPS.find(m=>m.id===id).assets).filter(Boolean).map(url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=url;})));},id);
  await advance(10);const g=await geometry(),s=await state();baseline??=g;assert.deepEqual(g,baseline);assert.equal(g['#board'].width,480);assert.equal(g['#opponent-board'].width,480);assert.equal(g['#board'].height,480);assert.equal(s.map,id);assert.deepEqual(s.both[0].terrain,s.both[1].terrain);assert.ok(s.pair);s.terrain.forEach((t,i)=>assert.equal(s.alphas[i]>0,t!=='hole'));await page.screenshot({path:path.join(out,id+'.png')});report.checks.push({map:id,cells:s.terrain.filter(t=>t==='cell').length,obstacles:s.terrain.filter(t=>t==='obstacle').length,geometry:g['#board']});
  await page.locator('#arena-ready').click();await advance(8000);assert.ok((await state()).both[1].score>0);assert.equal((await state()).blocks.length,0);
 }
 report.checks.push('four maps retain both 480px boards, all toolbar/title/score positions, transparent holes and real bot actions');
 await page.evaluate(()=>window.__mapRoll=.3);await page.locator('#restart').click();await advance(10);await page.locator('#arena-ready').click();await advance(3000);await page.evaluate(()=>__mapsQA.pauseBot());const start=(await state()).time;
 await advance(19990);assert.equal((await state()).phase,undefined);await advance(10);let s=await state();assert.equal(s.phase,'warning');assert.equal(s.time,start+20000);await page.screenshot({path:path.join(out,'cliff-warning.png')});
 await advance(1500);assert.equal((await state()).phase,'fall');await advance(150);await page.screenshot({path:path.join(out,'cliff-fall.png')});await advance(150);s=await state();assert.equal(s.phase,'blocked');assert.deepEqual(s.both.map(b=>b.blocks),[1,1]);const saved=s.blocks[0];await page.screenshot({path:path.join(out,'cliff-blocked.png')});
 const box=await page.locator('#board').boundingBox();await page.mouse.click(box.x+(saved.index%8+.5)*60,box.y+(Math.floor(saved.index/8)+.5)*60);await page.mouse.click(box.x+((saved.index+1)%8+.5)*60,box.y+(Math.floor((saved.index+1)/8)+.5)*60);assert.equal((await state()).score,s.score);
 await advance(4990);assert.equal((await state()).phase,'blocked');await advance(10);s=await state();assert.equal(s.phase,undefined);assert.deepEqual(s.board[saved.index],saved.tile);assert.deepEqual(s.counts,{blocked:1,restored:1,skipped:0});await advance(350);await page.screenshot({path:path.join(out,'cliff-restored.png')});report.checks.push('20s warning / 1.5s / 0.3s / 5s paired event preserves original tile and score');
 await advance(s.next-(await state()).time+1800);assert.equal((await state()).phase,'blocked');await page.evaluate(()=>__mapsQA.remember());await page.locator('#exit-game').click();await advance(40000);assert.ok(await page.evaluate(()=>__mapsQA.oldClean()));s=await state();assert.ok(s.backdrop.includes('jungle-scenery'));assert.equal(s.rocks,false);assert.equal(s.blocks.length,0);await page.screenshot({path:path.join(out,'home-restored.png')});report.checks.push('exit during blockage restores forest and clears old clocks, blocks, warnings and animations');
 await page.locator('#open-sandbox').click();await advance(10);assert.equal((await state()).terrain.filter(t=>t==='cell').length,64);assert.equal((await state()).blocks.length,0);
 }
 assert.deepEqual(errors,[]);report.errors=errors;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
