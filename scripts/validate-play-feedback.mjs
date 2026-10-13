// Focused acceptance for the five 2026-10-13 gameplay and selection fixes.
// Diagnostic access is injected by this server and never shipped in the game.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const out=path.join(root,'validation/2026-10-13/play-feedback');await fs.mkdir(out,{recursive:true});
const injection=`
window.__feedbackQA={
 advance(ms){for(let n=0;n<ms;n+=20)__clock.advance(__clock.time+Math.min(20,ms-n));},
 async enter(mapId='forest'){flow.arena?.dispose();const {MAPS}=await import('./maps.mjs');flow.enterArena(MAPS.find(m=>m.id===mapId),__clock.time);this.advance(20);},
 isolate(){flow.arena.source.stop();flow.arena.environment?.stop(__clock.time);flow.arena.cards.aiDue=Infinity;this.clears=[];for(const [side,e] of Object.entries(flow.arena.engines)){const old=e.onEvent;e.onEvent=event=>{old(event);if(event.kind==='clear'&&event.card)this.clears.push({side,time:event.time,cells:event.tiles.map(t=>t.index),ids:event.tiles.map(t=>t.tile.id),points:event.points});};}},
 give(id,side='player'){const b=flow.arena.cards;b.sides[side].hand=[{id,uid:++b.serial}];b.sides[side].preview=null;b.sides[side].previewQueue=[];b.sides[side].used={};this.advance(20);},
 state(){return {status:flow.arena.status,hand:flow.arena.cards.sides.player.hand.length,time:__clock.time,board:flow.arena.engines.opponent.board.map(t=>t?.id??null),clears:this.clears,queue:flow.arena.cards.queue.length};},
 plan(id,index=27){return flow.arena.cards.previewTarget('opponent',id,index);},
 hold(){flow.arena.engines.opponent.reserveTerrain(26,'feedback-qa');},
 release(){flow.arena.engines.opponent.releaseTerrain(26,'feedback-qa');},
 specials(){const e=flow.arena.engines.opponent;for(let i=24;i<32;i++)e.board[i]={...e.board[i],...(i===31?{wild:true}:{special:['row','column','blast'][i%3]})};},
 aiFire(){const b=flow.arena.cards;this.give('fire','opponent');return b.cast('opponent',b.sides.opponent.hand[0].uid,'player',27,__clock.time);}
};`;
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);assert.ok(file.startsWith(path.join(root,'dist')+path.sep));let body=await fs.readFile(file);
 if(name==='app.mjs')body=body.toString()+injection;
 if(name==='card-ui.mjs')body=body.toString().replace('const effects=createCardEffects(flow,boards,','const effects=window.__feedbackEffects=createCardEffects(flow,boards,');
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={date:'2026-10-13',checks:[],layouts:[],errors:[],failedRequests:[],status:'running'};
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().includes('/assets/audio/'))report.failedRequests.push(r.url());});
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=f=>{__clock.raf=f;return 1;};});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.__feedbackEffects?.snapshot().skillBody.loaded===13);
 const advance=ms=>page.evaluate(ms=>__feedbackQA.advance(ms),ms),state=()=>page.evaluate(()=>__feedbackQA.state()),fx=()=>page.evaluate(()=>__feedbackEffects.snapshot()),check=name=>report.checks.push(name);
 const deck=['fire','quake','meteor','bomb','freeze','blackhole'];
 const paintedUI=await page.evaluate(async()=>{const m=await(await fetch('./assets/selection/manifest.json')).json();return Promise.all(m.entries.map(async e=>{const img=new Image();img.src=e.runtime;await img.decode();return {id:e.id,width:img.naturalWidth,height:img.naturalHeight};}));});assert.equal(paintedUI.length,9);report.selectionArt=paintedUI;check('all nine existing painted selection components decode at their original dimensions');
 async function select(mapId='forest'){await page.evaluate(mapId=>__feedbackQA.enter(mapId),mapId);for(const id of deck)await page.locator('[data-pick="'+id+'"]').click();}
 for(const viewport of [{width:1920,height:1080},{width:1440,height:960},{width:1366,height:768},{width:1024,height:768},{width:1024,height:600},{width:390,height:844},{width:375,height:568},{width:844,height:390}]){
  await page.setViewportSize(viewport);await select();await page.waitForTimeout(460);
  const geometry=await page.evaluate(()=>{
   const overlay=document.getElementById('deck-selection'),panel=document.querySelector('.deck-panel'),rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
   return {overflowX:overlay.scrollWidth>overlay.clientWidth,overflowY:overlay.scrollHeight>overlay.clientHeight,panel:rect(panel),ready:rect(document.getElementById('deck-ready')),cancel:rect(document.getElementById('deck-cancel')),pool:[...document.querySelectorAll('#card-pool .card-painting')].map(rect),slots:[...document.querySelectorAll('#deck-slots img')].map(n=>({loaded:n.complete&&n.naturalWidth>0,url:n.getAttribute('src')})),images:[...document.querySelectorAll('#card-pool img')].every(n=>n.complete&&n.naturalWidth>0)};
  });report.layouts.push({viewport,...geometry});assert.equal(geometry.overflowX,false);assert.equal(geometry.overflowY,false);assert.equal(geometry.pool.length,12);assert.equal(geometry.slots.length,6);assert.ok(geometry.images&&geometry.slots.every(s=>s.loaded&&s.url.startsWith('./assets/cards/')));
  assert.ok([geometry.panel,geometry.ready,geometry.cancel,...geometry.pool].every(r=>r.y>=0&&r.bottom<=viewport.height+1&&r.x>=0&&r.right<=viewport.width+1&&r.height>0));
  if([1366,390,375,844].includes(viewport.width))await page.screenshot({path:path.join(out,'selection-'+viewport.width+'x'+viewport.height+'.png')});
 }check('all twelve painted choices, six painted selections and ready/back controls fit eight viewport sizes');
 report.mapLayouts=[];
 for(const map of ['forest','cliff','crystal','ruins','furnace']){await page.setViewportSize({width:375,height:568});await select(map);const layout=await page.evaluate(()=>{const n=document.getElementById('deck-selection'),cards=[...document.querySelectorAll('#card-pool .card-painting')].map(n=>n.getBoundingClientRect());return {overflow:n.scrollHeight>n.clientHeight||n.scrollWidth>n.clientWidth,minimumCardHeight:Math.min(...cards.map(r=>r.height)),lastCardBottom:Math.max(...cards.map(r=>r.bottom))};});assert.equal(layout.overflow,false,map);assert.ok(layout.minimumCardHeight>0&&layout.lastCardBottom<=568,map);report.mapLayouts.push({map,...layout});}check('all five map descriptions and painted choices fit the smallest portrait viewport');
 await page.setViewportSize({width:1366,height:768});await select();
 await page.locator('[data-slot="2"]').click();assert.equal(await page.locator('#deck-slots img').count(),5);await page.locator('[data-pick="meteor"]').click();assert.equal(await page.locator('#deck-slots img').count(),6);check('painted selections retain remove, reselect and ready behavior');
 await advance(3300);assert.equal(await page.locator('.deck-ai .card-back.chosen').count(),6);assert.ok(await page.evaluate(()=>getComputedStyle(document.querySelector('.deck-ai .card-back.chosen')).backgroundImage.includes('ui_selection_card_back')));check('AI completes its six choices using the painted concealed card back');
 await page.locator('#deck-ready').click();await advance(6600);await page.evaluate(()=>__feedbackQA.isolate());assert.equal((await state()).status,'playing');
 async function startDrag(id,side='opponent',index=27){
  await page.evaluate(id=>__feedbackQA.give(id),id);const card=page.locator('#card-hand [data-card-id="'+id+'"]');await card.hover();await page.waitForTimeout(200);const from=await card.boundingBox();await page.mouse.move(from.x+from.width/2,from.y+from.height*.3);await page.mouse.down();
  const b=await page.locator(side==='player'?'#board':'#opponent-board').boundingBox(),to={x:b.x+(index%8+.5)*b.width/8,y:b.y+(Math.floor(index/8)+.5)*b.height/8};await page.mouse.move(to.x,to.y,{steps:12});return to;
 }
 const to=await startDrag('fire');const icon=await page.locator('.drag-card').boundingBox();assert.ok(icon.width<=40&&icon.height<=40);assert.equal(await page.locator('.drag-card.over-board').count(),1);assert.ok(to.x<icon.x||to.x>icon.x+icon.width||to.y<icon.y||to.y>icon.y+icon.height);assert.equal(await page.locator('.drag-card .card-painting').isVisible(),false);assert.equal(await page.locator('.aim-hit').count(),3);
 await page.screenshot({path:path.join(out,'drag-icon.png')});await page.mouse.move(25,200);assert.equal(await page.locator('.drag-card.over-board').count(),0);assert.ok((await page.locator('.drag-card').boundingBox()).width>100);await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await state()).hand,1);assert.equal(await page.locator('.drag-card').count(),0);await page.waitForTimeout(460);check('entering a board switches to an offset small painted icon, leaving restores the card, Escape cancels');
 await startDrag('fire','player');assert.equal(await page.locator('.drag-card.over-board').count(),1);await page.mouse.up();assert.equal((await state()).hand,1);await page.waitForTimeout(460);check('wrong board uses the small icon and preserves invalid-drop return behavior');
 const plan=await page.evaluate(()=>__feedbackQA.plan('fire'));await startDrag('fire');await page.mouse.up();const castTime=(await state()).time;
 await advance(700);let st=await state();assert.equal(plan.cells.filter(i=>st.board[i]===null).length,1);
 await advance(192);st=await state();assert.equal(plan.cells.filter(i=>st.board[i]===null).length,2);await page.screenshot({path:path.join(out,'fire-progress.png')});
 await advance(252);st=await state();assert.equal(plan.cells.filter(i=>st.board[i]===null).length,3);assert.deepEqual(st.clears.slice(-3).map(e=>e.time-castTime),[700,892,1144]);assert.ok(st.clears.slice(-3).every(e=>e.points===0));await advance(2400);check('real fire drag clears one, two and three tiles during the sweep with exact ordered zero-score events');
 await page.evaluate(()=>__feedbackQA.specials());await startDrag('quake');assert.equal(await page.locator('.aim-hit').count(),8);await page.mouse.up();st=await state();assert.ok(st.board.slice(24,32).every(t=>t===null));await page.screenshot({path:path.join(out,'quake-special-row.png')});await advance(2400);check('real quake drag previews and clears all eight special/wild tiles in the selected row');
 await page.evaluate(()=>__feedbackQA.hold());await startDrag('fire');await page.mouse.up();await advance(1000);const pending=(await fx()).skillBody.records.findLast(r=>r.id==='fire');const clearsBefore=(await state()).clears.length;await page.evaluate(()=>__feedbackQA.release());const releaseAt=(await state()).time;await advance(520);
 const sweep=(await fx()).skillBody.records.findLast(r=>r.id==='fire');assert.ok(sweep.bodyAt>=pending.bodyAt);assert.ok(sweep.bodyAt>=releaseAt);assert.equal((await state()).clears.length-clearsBefore,3);await advance(2400);check('busy-board fire waits for a safe boundary and restarts the complete visual sweep together with real clears');
 await page.evaluate(()=>__feedbackQA.aiFire());await advance(1200);assert.equal((await state()).clears.slice(-3).filter(e=>e.side==='player').length,3);await advance(2400);check('AI fire uses the same progressive clear on the player board');
 await page.locator('#exit-game').click();await advance(20);assert.equal(await page.locator('.drag-card').count(),0);assert.equal((await fx()).skillBody.records.length,0);check('exit cleans drag and skill state');
 const offline=await browser.newPage({viewport:{width:1366,height:768}}),requests=[];offline.on('request',r=>requests.push(r.url()));offline.on('pageerror',e=>report.errors.push(e.message));const offlineURL=pathToFileURL(path.join(root,'方块乱斗-最新版.html')).href;
 await offline.goto(offlineURL);await offline.locator('#open-arena').click();await offline.locator('[data-difficulty="normal"]').click();await offline.locator('#deck-selection').waitFor({state:'visible'});
 for(const id of deck)await offline.locator('[data-pick="'+id+'"]').click();await offline.waitForFunction(()=>[...document.querySelectorAll('#card-pool img,#deck-slots img')].every(n=>n.complete&&n.naturalWidth>0));
 assert.ok(await offline.locator('#deck-ready').isVisible());assert.equal(await offline.evaluate(()=>{const n=document.getElementById('deck-selection');return n.scrollHeight>n.clientHeight||n.scrollWidth>n.clientWidth;}),false);await offline.screenshot({path:path.join(out,'offline-selection.png')});await offline.locator('#deck-ready').click();await offline.locator('#deck-selection').waitFor({state:'hidden'});await offline.locator('#arena-gate').waitFor({state:'hidden'});
 assert.ok(requests.every(url=>url===offlineURL||/^(data:|blob:)/.test(url)));check('rebuilt standalone file loads all selection paintings, fits one page and enters a match without external requests');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=e.stack;throw e;}finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();console.log(JSON.stringify({status:report.status,checks:report.checks,layouts:report.layouts.map(l=>l.viewport),failure:report.failure},null,2));}
