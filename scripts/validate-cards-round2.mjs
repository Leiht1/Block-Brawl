// Focused browser acceptance; diagnostic hooks exist only in this local server.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const out=path.join(root,'validation/2026-10-12/cards-round2');await fs.mkdir(out,{recursive:true});
const injection=`
window.__cards2={
 advance(ms){for(let n=0;n<ms;n+=20)__clock.advance(__clock.time+Math.min(20,ms-n));},
 state(){const b=flow.arena?.cards;return {status:flow.arena?.status,selection:flow.selection?.player,energy:b?.sides.player.energy,hand:b?.sides.player.hand,preview:b?.sides.player.preview,queue:b?.sides.player.previewQueue,used:b?.sides.player.used,generated:b?.sides.player.generated,next:b?.sides.player.next};},
 isolate(){flow.arena.source.stop();flow.arena.environment?.stop(__clock.time);flow.arena.cards.aiDue=Infinity;},
 give(id){const b=flow.arena.cards;b.sides.player.hand=[{id,uid:++b.serial}];b.sides.player.preview=null;b.sides.player.previewQueue=[];},
 gain(amount){flow.arena.cards.gain('player',amount,__clock.time);},
 cell(side){const e=flow.arena.engines[side];return e.board.findIndex((t,i)=>t&&e.ruleTerrain.cells[i]==='cell'&&!e.frozenCells.has(i));},
 plan(id,index){return flow.arena.cards.previewTarget('opponent',id,index);},
 pair(){return engine.hint();},
 swaps(){const p=engine.hint();return flow.swap(...p);},
 vfx(){const c=document.querySelector('.card-vfx'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0;for(let n=3;n<data.length;n+=4)if(data[n])count++;return count;},
 async enter(map){const {MAPS}=await import('./maps.mjs');flow.arena?.dispose();flow.enterArena(MAPS.find(m=>m.id===map),__clock.time);},
 audio(){return audio.snapshot();}
};`;
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);assert.ok(file.startsWith(path.join(root,'dist')+path.sep));let body=await fs.readFile(file);if(name==='app.mjs')body=body.toString()+injection;res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[],layouts:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=f=>{__clock.raf=f;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__cards2&&blockBrawl.snapshot().art.ready>=2);assert.equal(await page.locator('.card-vfx').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
 const advance=ms=>page.evaluate(ms=>__cards2.advance(ms),ms),state=()=>page.evaluate(()=>__cards2.state()),check=name=>report.checks.push(name);
 await page.evaluate(()=>__cards2.enter('cliff'));assert.equal(await page.locator('#deck-timer').innerText(),'60 秒');
 for(const id of ['fire','quake','meteor','bomb','freeze','blackhole'])await page.locator(`[data-pick="${id}"]`).click();
 assert.equal((await state()).selection.length,6);assert.equal(await page.locator('#deck-category-counts').innerText(),'已选 6 / 6');assert.ok(!(await page.locator('#deck-selection').innerText()).includes('最多 2'));
 await page.locator('[data-slot="3"]').click();assert.equal((await state()).selection.length,5);await page.locator('[data-pick="bomb"]').click();
 await page.waitForTimeout(460);await page.screenshot({path:path.join(out,'selection.png')});check('four attack plus two control cards; mini-card removal and selection flight; 60-second clock');
 await advance(59980);assert.equal((await state()).status,'preparing');await advance(20);assert.equal((await state()).status,'countdown');await advance(3000);assert.equal((await state()).status,'playing');await page.evaluate(()=>__cards2.isolate());check('timeout remains exactly 60 seconds, then original three-second countdown');
 await advance(99980);assert.equal((await state()).hand.length,0);assert.ok(Math.abs((await state()).energy-99.98)<.000001);assert.equal(await page.evaluate(()=>__cards2.vfx()),0);await advance(20);assert.equal((await state()).hand.length,1);await advance(240);assert.equal(await page.locator('.card-flight').count(),1);check('one natural energy per second, no natural energy motes, charge then preview-to-hand flight');
 await page.evaluate(()=>__cards2.gain(700));await advance(20);assert.equal((await state()).hand.length,6);assert.equal((await state()).queue.length,1);assert.ok((await state()).preview);
 await page.mouse.move(10,10);await page.waitForTimeout(500);
 const card=page.locator('.hand-card').last();const before=await card.boundingBox();await card.hover();await page.waitForTimeout(220);const after=await card.boundingBox();assert.ok(after.width>before.width);assert.equal(await card.evaluate(n=>getComputedStyle(n).zIndex),'30');check('six-card fan enlarges, lifts and foregrounds hovered card');
 async function drag(id,side,{cancel=false,invalid=false}={}){
  await page.evaluate(id=>__cards2.give(id),id);await advance(20);const card=page.locator(`#card-hand [data-card-id="${id}"]`);await card.hover();await page.waitForTimeout(190);const box=await card.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+30);await page.mouse.down();
  const board=await page.locator(side==='player'?'#board':'#opponent-board').boundingBox(),index=await page.evaluate(side=>__cards2.cell(side),side),x=board.x+(index%8+.5)*board.width/8,y=board.y+(Math.floor(index/8)+.5)*board.height/8;
  await page.mouse.move(x,y,{steps:12});assert.equal(await page.locator('.drag-card').count(),1);
  if(cancel){await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await state()).hand.length,1);return;}
  if(!invalid){assert.ok(await page.locator('.aim-hit').count()>0);if(id==='meteor'){const plan=await page.evaluate(index=>__cards2.plan('meteor',index),index);assert.equal(await page.locator('.aim-hit').count(),plan.cells.length);assert.equal(await page.locator('.aim-path').count(),plan.path.length);await page.screenshot({path:path.join(out,'meteor-aim.png')});}}
  await page.mouse.up();await advance(20);assert.equal((await state()).hand.length,invalid?1:0);await page.waitForTimeout(460);return index;
 }
 await drag('fire','player',{invalid:true});check('wrong-side drop consumes nothing and returns card');
 await drag('fire','opponent',{cancel:true});assert.equal(await page.locator('.drag-card').count(),0);check('Escape cancels a captured pointer drag');
 await drag('fire','opponent');assert.ok(await page.locator('.fire-cell').count()>0);await advance(500);assert.ok(await page.evaluate(()=>__cards2.vfx())>0);await page.screenshot({path:path.join(out,'fire-wave.png')});await advance(1780);assert.equal(await page.locator('.fire-cell').count(),0);check('fire wave follows aimed row, burns then resolves once with embers');
 await advance(2000);await drag('meteor','opponent');await advance(1250);assert.ok(await page.evaluate(()=>__cards2.vfx())>0);await page.screenshot({path:path.join(out,'meteor-fall.png')});await advance(370);await page.screenshot({path:path.join(out,'meteor-impact.png')});await advance(2000);check('meteor previews exact penetrated cells, falls with trail and impacts on cliff geometry');
 await drag('freeze','opponent');assert.equal(await page.locator('.card-freeze-glass').count(),1);assert.ok(await page.locator('.freeze-cell').count()>0);await advance(400);await page.screenshot({path:path.join(out,'freeze.png')});await advance(2600);assert.equal(await page.locator('.card-freeze-glass').count(),0);assert.ok(await page.evaluate(()=>__cards2.vfx())>0);check('ice crystals persist through freeze and shatter at exact expiry');
 await advance(500);await drag('blackhole','opponent');await advance(120);assert.ok(await page.evaluate(()=>__cards2.vfx())>0);await page.screenshot({path:path.join(out,'blackhole.png')});await advance(2000);assert.equal(await page.evaluate(()=>__cards2.vfx()),0);check('rotating blackhole, gravity lines and real tile moves; all transient effects clean up');
 assert.ok(await page.evaluate(()=>__cards2.swaps()));await advance(140);assert.ok(await page.evaluate(()=>__cards2.vfx())>0);await page.screenshot({path:path.join(out,'energy-motes.png')});await advance(450);assert.ok(await page.evaluate(()=>__cards2.vfx())>0);await advance(3000);check('real clear produces energy motes, absorption feedback and settles without duplicate reward');
 await page.evaluate(()=>{for(let i=0;i<6;i++)__cards2.gain(100);});await advance(800);await page.mouse.move(10,10);await page.waitForTimeout(500);
 for(const viewport of [{width:1440,height:960},{width:1366,height:768},{width:1920,height:1080},{width:1024,height:768}]){
  await page.setViewportSize(viewport);await advance(20);await page.waitForTimeout(200);
  const geometry=await page.evaluate(()=>{const rect=id=>document.getElementById(id).getBoundingClientRect().toJSON();return {scrollX:document.documentElement.scrollWidth>innerWidth,board:rect('board'),enemy:rect('opponent-board'),dock:rect('card-dock'),card:document.querySelector('.hand-card').getBoundingClientRect().toJSON()};});report.layouts.push({viewport,...geometry});assert.equal(geometry.scrollX,false);assert.ok(Math.abs(geometry.board.width-geometry.enemy.width)<1);assert.ok(geometry.dock.y>geometry.board.bottom);assert.ok(geometry.dock.bottom<=viewport.height+1);await page.screenshot({path:path.join(out,`battle-${viewport.width}.png`)});
 }check('four desktop viewports retain equal board sizes and enlarged hand without horizontal overflow');
 assert.deepEqual(report.errors,[]);
 const offline=await browser.newPage({viewport:{width:1366,height:768}}),requests=[];offline.on('pageerror',e=>report.errors.push(e.message));offline.on('request',r=>requests.push(r.url()));
 const offlineURL=pathToFileURL(path.join(root,'方块乱斗-最新版.html')).href;await offline.goto(offlineURL);await offline.locator('#open-arena').click();await offline.locator('[data-difficulty="normal"]').click();await offline.locator('#deck-selection').waitFor({state:'visible'});
 for(const id of ['fire','quake','meteor','bomb','freeze','blackhole'])await offline.locator(`[data-pick="${id}"]`).click();await offline.locator('#deck-ready').click();await offline.locator('#deck-selection').waitFor({state:'hidden'});await offline.locator('#arena-gate').waitFor({state:'hidden'});
 assert.equal(await offline.locator('.card-vfx').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');assert.ok(requests.every(url=>url===offlineURL||/^(data:|blob:)/.test(url)));assert.deepEqual(report.errors,[]);await offline.screenshot({path:path.join(out,'offline-battle.png')});check('rebuilt standalone file opens directly, accepts free deck and enters real battle without external requests');
}catch(e){report.failure=e.stack;throw e;}finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();console.log(JSON.stringify(report,null,2));}
