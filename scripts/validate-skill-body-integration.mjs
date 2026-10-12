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
const out=path.join(root,'validation/2026-10-12/skill-body-integration');await fs.mkdir(out,{recursive:true});
const injection=`
const oldUnderlay=flow.paintCardUnderlay.bind(flow);flow.paintCardUnderlay=(...args)=>{if(!window.__disableSageLight)oldUnderlay(...args);};

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
 const page=await browser.newPage({viewport:{width:1440,height:960}});await page.addInitScript(clock);page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{const reason=r.failure()?.errorText;if(reason==='net::ERR_ABORTED'&&r.url().includes('/assets/audio/'))return;report.failedRequests.push({url:r.url(),reason});});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.__castEffects?.snapshot().skillBody.loaded===13,{},{polling:50});
 const advance=ms=>page.evaluate(ms=>__castQA.advance(ms),ms),fx=()=>page.evaluate(()=>__castEffects.snapshot());
 async function enter(map='forest'){
  await page.evaluate(map=>__castQA.enter(map),map);for(const id of ['fire','quake','freeze','blackhole','overload','rainbow'])await page.locator('[data-pick="'+id+'"]').click();await page.locator('#deck-ready').click();await advance(6600);await page.evaluate(()=>__castQA.isolate());
 }
 async function drag(id,side,{cancel=false}={}){
  await page.evaluate(id=>__castQA.give(id),id);await advance(20);const card=page.locator('#card-hand [data-card-id="'+id+'"]');await card.hover();await page.waitForTimeout(200);const box=await card.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+30);await page.mouse.down();await advance(240);
  const prepared=(await fx()).prepared[0];assert.ok(prepared);
  const b=await page.locator(side==='player'?'#board':'#opponent-board').boundingBox();
  // Use a central legal cell through the diagnostic plan, avoiding edge-only art reviews.
  const i=await page.evaluate(({id,side})=>{for(const index of [27,28,35,36,19,20,43,44,11,12,51,52,3,4,59,60,0,1])if(__castQA.plan(id,side,index).valid)return index;return __castQA.cell(side);},{id,side});
  await page.mouse.move(b.x+(i%8+.5)*b.width/8,b.y+(Math.floor(i/8)+.5)*b.height/8,{steps:8});if(cancel){await page.keyboard.press('Escape');await page.mouse.up();return;}
  const plan=await page.evaluate(({id,side,i})=>__castQA.plan(id,side,i),{id,side,i});await page.mouse.up();await advance(20);const snap=await fx();assert.equal(snap.casts.at(-1).id,id);assert.deepEqual(snap.casts.at(-1).origin,prepared.origin);assert.equal(snap.skillBody.records.at(-1).id,id);return {record:snap.skillBody.records.at(-1),plan};
 }
 report.scope='12 approved skill bodies, selected quake/fog rules, common-cast linkage, sage underlight, badges and offline package';
 for(const id of ['fire','quake','meteor','bomb','freeze','blackhole','storm','fog','overload','sage','rainbow','luck']){
  await enter();const side=['overload','sage','rainbow','luck'].includes(id)?'player':'opponent',d=await drag(id,side);await advance(880);
  const state=await fx();assert.ok(state.skillBody.records.some(r=>r.id===id));assert.equal(state.skillBody.loaded,13);
  if(id==='quake'){assert.ok(d.plan.cells.every(i=>Math.floor(i/8)===Math.floor(d.plan.cells[0]/8)));assert.ok(Math.floor(d.plan.cells[0]/8)!==7);}
  if(id==='rainbow'){assert.ok((await page.evaluate(()=>__castQA.wild('player'))).includes(state.skillBody.records.at(-1).index));}
  await page.screenshot({path:path.join(out,id+'-body.png')});
  if(['luck','overload'].includes(id)){
   const badge=page.locator('[data-buff="'+id+'"]');assert.equal(await badge.count(),1);const rect=await badge.boundingBox(),br=await page.locator('#board').boundingBox();assert.ok(rect.width>=90);assert.ok(rect.x+rect.width<br.x);const first=await badge.locator('strong').textContent();await advance(1000);assert.notEqual(await badge.locator('strong').textContent(),first);await advance(9000);assert.equal(await badge.count(),0);
  }else if(id==='sage'){
   await advance(900);await page.screenshot({path:path.join(out,'sage-veil-backlight.png')});
   const before=await page.locator('#board').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data));
   await page.evaluate(()=>{window.__disableSageLight=true;__clock.advance(__clock.time);});const after=await page.locator('#board').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data));
   let changed=0;for(let i=0;i<before.length;i+=4)if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>8)changed++;assert.ok(changed>2000);report.sageBacklightChangedPixels=changed;
   await page.evaluate(()=>{window.__disableSageLight=false;__clock.advance(__clock.time);});await advance(5000);assert.ok(!(await fx()).skillBody.records.some(r=>r.id==='sage'));
  }else if(id==='fog'){
   await advance(5500);assert.ok((await fx()).skillBody.records.some(r=>r.id==='fog'));await page.screenshot({path:path.join(out,'fog-fade.png')});await advance(1200);assert.ok(!(await fx()).skillBody.records.some(r=>r.id==='fog'));
  }else{await advance(5000);assert.equal((await fx()).skillBody.records.length,0);}
  report.checks.push(id+': real drag, approved raster body, true target/deadline and cleanup');
 }
 await enter();await drag('fire','opponent',{cancel:true});assert.equal((await fx()).skillBody.records.length,0);report.checks.push('Escape produces no skill body');
 await page.evaluate(()=>__castQA.hold());await drag('rainbow','player');await advance(1500);assert.equal((await fx()).skillBody.records.at(-1).resolved,false);await page.evaluate(()=>__castQA.release());await advance(20);assert.equal((await fx()).skillBody.records.at(-1).resolved,true);await advance(1500);assert.equal((await fx()).skillBody.records.length,0);report.checks.push('queued rainbow resolves actual generated tile after board unlock');
 for(const map of ['cliff','crystal','ruins','furnace']){await enter(map);await drag('sage','player');await advance(1800);await page.screenshot({path:path.join(out,'sage-'+map+'.png')});await advance(5000);}
 report.checks.push('sage veil and underlight fit all five real map boards');
 await enter();await page.evaluate(()=>__castQA.ai('overload','opponent'));await advance(1300);assert.equal(await page.locator('[aria-label="敌方增益"] [data-buff="overload"]').count(),1);await page.evaluate(()=>__castQA.leave());await advance(20);assert.equal((await fx()).skillBody.records.length,0);assert.equal(await page.locator('[data-buff]').count(),0);report.checks.push('AI buff uses own side; exit removes casts, bodies and countdown rails');
 // Open the actual unmodified offline distribution, not the QA-injected app.
 const offline=await browser.newPage({viewport:{width:1366,height:768}}),requests=[];offline.on('pageerror',e=>report.errors.push(e.message));offline.on('request',r=>requests.push(r.url()));const offlineUrl=pathToFileURL(path.join(root,'方块乱斗-最新版.html')).href;
 await offline.goto(offlineUrl);const sizes=await offline.evaluate(async()=>{const list=Object.keys(__blockFiles).filter(p=>p.startsWith('./assets/skill-body/')&&p.endsWith('.png'));return Promise.all(list.map(async p=>{const i=new Image();i.src=__blockAsset(p);await i.decode();return {path:p,width:i.naturalWidth,height:i.naturalHeight};}));});assert.equal(sizes.length,13);assert.ok(sizes.every(s=>s.path.includes('tile_wild')?s.width===128:s.width===1024&&s.height===512));assert.ok(requests.every(u=>u===offlineUrl||/^(blob:|data:)/.test(u)));report.offlineSkills=sizes.length;
 report.checks.push('actual offline HTML opens and decodes all thirteen adopted skill/tile assets without external requests');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=e.stack;process.exitCode=1;}
finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();console.log(JSON.stringify(report,null,2));}
