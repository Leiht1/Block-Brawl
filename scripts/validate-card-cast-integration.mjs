// Focused acceptance. Game access and image-draw instrumentation exist only here.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const out=path.join(root,'validation/2026-10-12/card-cast-integration');await fs.mkdir(out,{recursive:true});
const injection=`
window.__castQA={
 advance(ms){for(let n=0;n<ms;n+=20)__clock.advance(__clock.time+Math.min(20,ms-n));},
 isolate(){flow.arena.source.stop();flow.arena.environment?.stop(__clock.time);flow.arena.cards.aiDue=Infinity;},
 give(id,side='player'){const b=flow.arena.cards;b.sides[side].hand=[{id,uid:++b.serial}];b.sides[side].used={};b.sides[side].preview=null;b.sides[side].previewQueue=[];},
 state(){return {status:flow.arena?.status,hand:flow.arena?.cards.sides.player.hand.length,cues:flow.arena?.cards.cues,queue:flow.arena?.cards.queue};},
 cell(side){const e=flow.arena.engines[side];return e.board.findIndex((t,i)=>t&&e.ruleTerrain.cells[i]==='cell'&&!e.frozenCells.has(i));},
 plan(id,side,index){return flow.arena.cards.previewTarget(side,id,index);},
 wild(side){return flow.arena.engines[side].board.flatMap((t,i)=>t?.wild?[i]:[]);},
 ai(id,side){this.give(id,'opponent');const b=flow.arena.cards;return b.cast('opponent',b.sides.opponent.hand[0].uid,side,this.cell(side),__clock.time);},
 async enter(map){const {MAPS}=await import('./maps.mjs');flow.arena?.dispose();flow.enterArena(MAPS.find(m=>m.id===map),__clock.time);},
 hold(){const e=flow.arena.engines.player;e.reserveTerrain(0,'cast-qa');},
 release(){const e=flow.arena.engines.player;e.releaseTerrain(0,'cast-qa');},
 leave(){document.getElementById('exit-game').click();}
};`;
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);assert.ok(file.startsWith(path.join(root,'dist')+path.sep));let body=await fs.readFile(file);
 if(name==='app.mjs')body=body.toString()+injection;
 if(name==='card-ui.mjs')body=body.toString().replace('const effects=createCardEffects(flow,boards,','const effects=window.__castEffects=createCardEffects(flow,boards,');
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch(e){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={date:'2026-10-12',scope:'generic cast integration, card rules, approved art and offline build only',checks:[],errors:[],failedRequests:[],draws:[],status:'running'};
const clock=()=>{
 window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};
 Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=f=>{__clock.raf=f;return 1;};
 window.__paintedDraws=[];window.__offlinePaintedDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(img,...args){if(this.canvas.classList.contains('card-vfx')){if(img.src?.includes('/card-cast/'))__paintedDraws.push({time:__clock.time,url:img.src.split('/').at(-1),args,matrix:[this.getTransform().e,this.getTransform().f]});if(img.naturalWidth===1024)__offlinePaintedDraws.push({time:__clock.time,url:img.src,args});}return draw.call(this,img,...args);};
};
try{
 const offlineOnly=process.argv.includes('--offline-only');
 if(offlineOnly){Object.assign(report,JSON.parse(await fs.readFile(path.join(out,'report.json'),'utf8')),{status:'running'});delete report.failure;assert.equal(report.checks.length,8);}
 if(!offlineOnly){
 const page=await browser.newPage({viewport:{width:1440,height:960}});await page.addInitScript(clock);page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.failedRequests.push(r.url()));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__castQA&&window.__castEffects.snapshot().loaded===15,{},{polling:50});
 const advance=ms=>page.evaluate(ms=>__castQA.advance(ms),ms),fx=()=>page.evaluate(()=>__castEffects.snapshot()),check=s=>report.checks.push(s);
 await page.evaluate(()=>__castQA.enter('forest'));for(const id of ['fire','quake','meteor','freeze','rainbow','overload'])await page.locator(`[data-pick="${id}"]`).click();await page.locator('#deck-ready').click();await advance(6600);await page.evaluate(()=>__castQA.isolate());
 assert.equal(await page.evaluate(()=>__castQA.state().status),'playing');
 assert.equal(await page.locator('.card-illustration').evaluateAll(ns=>ns.filter(n=>n.closest('#card-pool')).length),12);
 await page.waitForFunction(()=>[...document.querySelectorAll('#card-pool img')].every(i=>i.complete&&i.naturalWidth===512),{},{polling:50});check('all 12 approved v3 card faces and 15 painted atlases load');
 async function drag(id,side,{cancel=false,invalid=false,hold=240}={}){
   await page.evaluate(id=>__castQA.give(id),id);await advance(20);const card=page.locator(`#card-hand [data-card-id="${id}"]`);await card.hover();await page.waitForTimeout(200);const box=await card.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+30);await page.mouse.down();await advance(hold);
   const prepared=(await fx()).prepared[0];assert.ok(prepared);const board=await page.locator(side==='player'?'#board':'#opponent-board').boundingBox(),index=await page.evaluate(side=>__castQA.cell(side),side),point={x:board.x+(index%8+.5)*board.width/8,y:board.y+(Math.floor(index/8)+.5)*board.height/8};
   await page.mouse.move(point.x,point.y,{steps:8});
   if(cancel){await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await fx()).prepared.length,0);assert.equal((await fx()).casts.length,0);return;}
   const plan=await page.evaluate(({id,side,index})=>__castQA.plan(id,side,index),{id,side,index});await page.mouse.up();await advance(20);
   if(invalid){assert.equal((await fx()).casts.length,0);assert.equal(await page.evaluate(()=>__castQA.state().hand),1);return;}
   const c=(await fx()).casts.at(-1);assert.ok(c);assert.deepEqual(c.origin,prepared.origin);assert.ok(Math.hypot(c.origin.x-point.x,c.origin.y-point.y)>150);assert.equal(c.targetSide,side);assert.equal(await page.locator('.drag-card').count(),0);
   return {c,plan,index,point};
 }
 await drag('fire','player',{invalid:true});await page.waitForTimeout(450);await drag('fire','opponent',{cancel:true});await page.waitForTimeout(450);check('wrong-side drop and Escape consume nothing, clear activation, and create no projectile');
 for(const [id,side,type] of [['fire','opponent','attack'],['freeze','opponent','control'],['rainbow','player','buff']]){
   const d=await drag(id,side);assert.equal(d.c.type,type);const start=d.c.start;
   await page.screenshot({path:path.join(out,type+'-release.png')});await advance(240);await page.screenshot({path:path.join(out,type+'-flight.png')});await advance(380);await page.screenshot({path:path.join(out,type+'-impact.png')});
   const c=(await fx()).casts.at(-1);if(id==='rainbow'){assert.ok(c.resolved);assert.ok((await page.evaluate(()=>__castQA.wild('player'))).includes(c.index));}
   const draws=await page.evaluate(start=>__paintedDraws.filter(d=>d.time>=start),start);assert.ok(draws.some(d=>d.url===type+'-release.webp'));assert.ok(draws.some(d=>d.url===type+'-orb.webp'));assert.ok(draws.some(d=>d.url===type+'-trail.webp'));assert.ok(draws.some(d=>d.url===type+'-impact.webp'));
   assert.ok(new Set(draws.filter(d=>d.url===type+'-orb.webp').map(d=>d.args.slice(0,2).join(','))).size>=7);report.draws.push({type,spriteDraws:draws.length,origin:d.c.origin,target:c.target});
   await advance(320);assert.equal((await fx()).casts.length,0);await advance(2500);
 }check('three distinct painted releases, >=7 moving orb frames, correct target sides, exact hand origin and 960ms cleanup');
 for(const id of ['meteor','quake']){const d=await drag(id,'opponent'),expected=id==='meteor'?d.plan.landing:d.plan.cells[Math.floor(d.plan.cells.length/2)];assert.equal(d.c.index,expected);await advance(960);await advance(2000);}check('meteor lands at its real penetration end; quake aims at its actual bottom row');
 await page.evaluate(()=>__castQA.hold());await drag('rainbow','player');await advance(1300);assert.equal((await fx()).casts.at(-1).resolved,false);await page.evaluate(()=>__castQA.release());await advance(20);assert.equal((await fx()).casts.at(-1).resolved,true);await advance(580);assert.equal((await fx()).casts.length,0);check('rainbow waits for a busy board, resumes to the real generated wild tile, then cleans up');
 assert.ok((await page.evaluate(()=>__castQA.ai('fire','player'))).ok);await advance(200);let ai=(await fx()).casts.at(-1);assert.equal(ai.side,'opponent');assert.equal(ai.targetSide,'player');const r=await page.locator('#opponent-card-summary').boundingBox();assert.ok(Math.abs(ai.origin.x-r.x-r.width/2)<1);await advance(1000);
 assert.ok((await page.evaluate(()=>__castQA.ai('overload','opponent'))).ok);await advance(240);ai=(await fx()).casts.at(-1);assert.equal(ai.type,'buff');assert.equal(ai.targetSide,'opponent');await advance(960);check('AI attacks the player and strengthens its own board, originating at its existing hand summary');
 await drag('fire','opponent');await page.setViewportSize({width:1366,height:768});await advance(240);await page.screenshot({path:path.join(out,'battle-1366.png')});const dims=await page.locator('.card-vfx').evaluate(c=>[c.width,c.height,innerWidth,innerHeight,devicePixelRatio]);assert.equal(dims[0],Math.round(dims[2]*Math.min(dims[4],2)));await page.evaluate(()=>__castQA.leave());await advance(20);assert.equal((await fx()).casts.length,0);assert.equal(await page.locator('.drag-card').count(),0);check('resize keeps the sprite layer fitted; leaving battle removes every transient cast');
 const before=JSON.parse((await fs.readFile(path.join(out,'protected-before.json'),'utf8')).replace(/^\uFEFF/,''));for(const item of before){const file=path.isAbsolute(item.path)?item.path:path.join(root,item.path);assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),item.sha256,item.path);}report.protectedFiles=before.length;check('rules, engine, arena, bots, all existing backgrounds/boards and all approved card masters remain byte-for-byte unchanged');
 }
 const check=s=>report.checks.push(s);
 const offline=await browser.newPage({viewport:{width:1366,height:768}}),requests=[];await offline.addInitScript(clock);offline.on('pageerror',e=>report.errors.push(e.message));offline.on('request',r=>requests.push(r.url()));const url=pathToFileURL(path.join(root,'方块乱斗-最新版.html')).href;await offline.goto(url);await offline.locator('#open-arena').click();await offline.locator('[data-difficulty="normal"]').click();await offline.evaluate(()=>{for(let i=0;i<200;i++)__clock.advance(__clock.time+20);});await offline.locator('#deck-selection').waitFor({state:'visible'});
 for(const id of ['fire','quake','meteor','freeze','rainbow','overload'])await offline.locator(`[data-pick="${id}"]`).click();await offline.locator('#deck-ready').click();await offline.evaluate(()=>{for(let i=0;i<600;i++)__clock.advance(__clock.time+20);});await offline.locator('#arena-gate').waitFor({state:'hidden'});await offline.waitForFunction(()=>[...document.querySelectorAll('#card-pool img')].every(i=>i.complete&&i.naturalWidth===512),{},{polling:50});
 const build=await offline.locator('#offline-build').textContent();const meta=JSON.parse(build);assert.equal(Object.keys(meta.sources).filter(s=>s.startsWith('./assets/card-cast/')).length,15);assert.equal(Object.keys(meta.sources).filter(s=>s.startsWith('./assets/cards/')).length,12);
 await offline.evaluate(()=>{for(let i=0;i<5000;i++)__clock.advance(__clock.time+20);});const hand=offline.locator('.hand-card').first();await hand.waitFor({state:'visible'});await hand.hover();await offline.waitForTimeout(200);let box=await hand.boundingBox();const self=await hand.evaluate(n=>n.classList.contains('yellow'));await offline.mouse.move(box.x+box.width/2,box.y+30);await offline.mouse.down();await offline.evaluate(()=>{for(let i=0;i<12;i++)__clock.advance(__clock.time+20);});box=await offline.locator(self?'#board':'#opponent-board').boundingBox();await offline.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:8});const legal=await offline.locator('.aim-legal').first().boundingBox();assert.ok(legal);await offline.mouse.move(legal.x+legal.width/2,legal.y+legal.height/2);await offline.mouse.up();await offline.evaluate(()=>{for(let i=0;i<15;i++)__clock.advance(__clock.time+20);});await offline.screenshot({path:path.join(out,'offline-battle.png')});await offline.evaluate(()=>{for(let i=0;i<40;i++)__clock.advance(__clock.time+20);});const offlineDraws=await offline.evaluate(()=>__offlinePaintedDraws);assert.ok(offlineDraws.length>15);assert.ok(new Set(offlineDraws.map(d=>d.args.slice(0,2).join(','))).size>=7);assert.ok(offlineDraws.every(d=>d.url.startsWith('blob:')));report.offlinePaintedDraws=offlineDraws.length;
 assert.ok(requests.every(u=>u===url||/^(blob:|data:)/.test(u)));check('local single HTML embeds all 27 new media files, displays approved cards and plays painted cast frames after a real drag, with no external requests');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=e.stack;throw e;}finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();console.log(JSON.stringify(report,null,2));}
