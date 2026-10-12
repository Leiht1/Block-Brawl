// Narrow visual acceptance of approved release enlargement and colors.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url),runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[runtime]})),sharp=require(require.resolve('sharp',{paths:[runtime]}));
const out=path.join(root,'validation/2026-10-12/cast-soft-v3-integration'),report={scope:'approved 1.5x cast integration and three palettes only',checks:[],errors:[],protectedFiles:0};
const check=s=>{report.checks.push(s);console.log(s);};
const protectedFiles=JSON.parse((await fs.readFile(path.join(out,'protected-before.json'),'utf8')).replace(/^\uFEFF/,''));
for(const item of protectedFiles)assert.equal(crypto.createHash('sha256').update(await fs.readFile(item.path)).digest('hex'),item.sha256,item.path);
report.protectedFiles=protectedFiles.length;check('Existing game modules, card art, environments and original masters unchanged.');
const injection=`window.__softQA={advance(ms){for(let n=0;n<ms;n+=20)__clock.advance(__clock.time+Math.min(20,ms-n));},async enter(map){const {MAPS}=await import('./maps.mjs');flow.arena?.dispose();flow.enterArena(MAPS.find(m=>m.id===map),__clock.time);},isolate(){flow.arena.source.stop();flow.arena.environment?.stop(__clock.time);flow.arena.cards.aiDue=Infinity;},give(ids){const b=flow.arena.cards;b.sides.player.hand=ids.map(id=>({id,uid:++b.serial}));b.sides.player.used={};},cell(side){const e=flow.arena.engines[side];return e.board.findIndex((t,i)=>t&&e.ruleTerrain.cells[i]==='cell'&&!e.frozenCells.has(i));}};`;
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1)||'index.html',base=name.startsWith('validation/')||name.startsWith('art-preproduction/')?path.resolve(root):path.join(root,'dist'),file=path.resolve(base,name);assert.ok(file.startsWith(base+path.sep));let body=await fs.readFile(file);if(name==='app.mjs')body=body.toString()+injection;if(name==='card-ui.mjs')body=body.toString().replace('const effects=createCardEffects(flow,boards,','const effects=window.__softEffects=createCardEffects(flow,boards,');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=f=>{__clock.raf=f;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__softQA);await page.evaluate(()=>__softQA.enter('forest'));
 await page.waitForFunction(()=>[...document.querySelectorAll('#card-pool img')].every(i=>i.complete&&i.naturalWidth===512));
 await page.screenshot({path:path.join(out,'card-selection.png')});
 for(const id of ['fire','freeze','blackhole','quake','rainbow','luck'])await page.locator(`[data-pick="${id}"]`).click();await page.locator('#deck-ready').click();await page.evaluate(()=>__softQA.advance(6600));await page.evaluate(()=>{__softQA.isolate();__softQA.give(['fire','freeze','blackhole','quake','rainbow','luck']);__softQA.advance(20);});
 await page.waitForFunction(()=>[...document.querySelectorAll('#card-hand img')].every(i=>i.complete&&i.naturalWidth===512));await page.waitForTimeout(220);
 await page.screenshot({path:path.join(out,'battle-baseline.png')});
 const geometry=await page.evaluate(()=>{const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};return {viewport:[1440,960],boards:{player:rect('board'),opponent:rect('opponent-board')},hand:rect('card-hand'),origins:Object.fromEntries([...document.querySelectorAll('#card-hand .hand-card')].map(n=>{const r=n.getBoundingClientRect();return [n.dataset.cardId,{x:r.x+r.width/2,y:r.y+r.height/2}];}))};});await fs.writeFile(path.join(out,'geometry.json'),JSON.stringify(geometry,null,2));
 check('All 12 card faces load in real selection; six priority cards are visible at battle hand size.');
 for(const [id,side,type] of [['fire','opponent','attack'],['freeze','opponent','control'],['rainbow','player','buff']]){
  await page.evaluate(id=>{__softQA.give([id]);__softQA.advance(20);},id);const card=page.locator('#card-hand .hand-card').first();await card.hover();await page.waitForTimeout(220);const box=await card.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+30);await page.mouse.down();await page.evaluate(()=>__softQA.advance(160));await page.screenshot({path:path.join(out,type+'-activation.png')});
  const prepared=await page.evaluate(()=>__softEffects.snapshot().prepared[0]);assert.ok(prepared);
  const r=await page.locator(side==='player'?'#board':'#opponent-board').boundingBox(),index=await page.evaluate(side=>__softQA.cell(side),side);
  await page.mouse.move(r.x+(index%8+.5)*r.width/8,r.y+(Math.floor(index/8)+.5)*r.height/8,{steps:8});await page.mouse.up();await page.evaluate(()=>__softQA.advance(80));let state=await page.evaluate(()=>__softEffects.snapshot());assert.equal(state.renderer,'soft-c-v3');assert.equal(state.loaded,0);assert.equal(state.sizeMultiplier,1.5);assert.deepEqual(state.casts[0].origin,prepared.origin);assert.equal(state.casts[0].targetSide,side);
  await page.screenshot({path:path.join(out,type+'-release.png')});await page.evaluate(()=>__softQA.advance(270));await page.screenshot({path:path.join(out,type+'-flight.png')});await page.evaluate(()=>__softQA.advance(280));await page.screenshot({path:path.join(out,type+'-impact.png')});await page.evaluate(()=>__softQA.advance(400));assert.equal((await page.evaluate(()=>__softEffects.snapshot())).casts.length,0);await page.evaluate(()=>__softQA.advance(3400));
 }check('Three real drags use original hand origins, correct target boards, procedural soft renderer and exact cleanup.');
 await page.evaluate(()=>{document.getElementById('exit-game').click();__softQA.advance(20);});assert.equal((await page.evaluate(()=>__softEffects.snapshot())).casts.length,0);
 await page.goto(`http://127.0.0.1:${server.address().port}/art-preproduction/cast-soft-v3/index.html`);await page.waitForFunction(()=>window.__fxPreviewReady===true,{},{polling:50});await page.screenshot({path:path.join(out,'review-page.png')});
 for(const type of ['attack','control','buff']){await page.selectOption('#type',type);await page.locator('#play').click();await page.locator('#time').evaluate(n=>{n.value='920';n.dispatchEvent(new Event('input',{bubbles:true}));});await page.screenshot({path:path.join(out,type+'-simulation.png')});}
 check('Interactive cast preview loads, scrubs and displays all three subtle type palettes on captured real boards.');
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=e.stack;throw e;}finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();}
