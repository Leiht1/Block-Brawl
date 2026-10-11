import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/map-presentation-2');await fs.mkdir(out,{recursive:true});
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[deps]})),sharp=require(require.resolve('sharp',{paths:[deps]}));
const server=http.createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
 if(name==='flow.mjs')body=body.toString().replace('new MapReveal(performance.now(),Math.random,reducedMotion)','new MapReveal(performance.now(),()=>window.__mapRoll??Math.random(),reducedMotion)');
 if(name==='app.mjs')body=body.toString()+`\nwindow.__mapQA={advance(ms){for(let n=0;n<ms;n+=10)__clock.advance(__clock.time+Math.min(10,ms-n));},pause(){flow.arena.source.stop();},state(){const a=flow.arena;return {time:__clock.time,screen:flow.screen,reveal:flow.reveal?.at(__clock.time),map:a?.map.id,status:a?.status,deadline:a?.deadline,next:a?.environment?.next,end:a?.environment?.state?.end,phase:a?.environment?.state?.phase,stage:mapPresentation.at(__clock.time)?.stage,cue:mapPresentation.at(__clock.time),config:a?.map.environment,counts:a?Object.values(a.engines).map(e=>e.temporaryBlocks.size+e.frozenCells.size):[],scores:a?Object.values(a.engines).map(e=>e.score):[],targets:a?.environment?.state?.targets,transform:[ctx,$('opponent-board').getContext('2d')].map(c=>{const t=c.getTransform();return [t.e,t.f];}),visuals:(rockVisual||[]).length+rockRestores.length,clean:a?.environment?.clean,canAct:flow.canInteract,worldHidden:$('map-world').hidden};},thaw(){engine.thawTerrain([...engine.frozenCells.keys()][0],'clear');},save(){window.__old=flow.arena;},oldClean(){return !__old.environment||__old.environment.clean&&__old.environment.deadline===Infinity;}};`;
 res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={scope:'Map reveal, five scene bindings, event presentation and cleanup only; no full regression.',checks:[],errors:[],frames:[]};
const geometrySelectors=['.menu','.menu .tools','.player-play .arena-heading','.opponent-play .arena-heading','#arena-scoreboard','#board','#opponent-board'];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__mapQA&&blockBrawl.snapshot().art.ready===2);
 const advance=ms=>page.evaluate(ms=>__mapQA.advance(ms),ms),state=()=>page.evaluate(()=>__mapQA.state()),to=async time=>advance(time-(await state()).time);
 const geometry=()=>page.evaluate(s=>Object.fromEntries(s.map(q=>{const b=document.querySelector(q).getBoundingClientRect();return [q,[b.x,b.y,b.width,b.height]];})),geometrySelectors);
 const shot=async(name)=>{await page.screenshot({path:path.join(out,name+'.png')});report.frames.push(name+'.png');};
 await page.locator('#open-arena').click();let baseline;const maps=['forest','cliff','crystal','ruins','furnace'];
 for(const [n,id] of maps.entries()){
  await page.evaluate(n=>window.__mapRoll=(n+.25)/5,n);await page.locator(n?'#restart':'[data-difficulty="easy"]').click();const entry=(await state()).time;
  assert.equal((await state()).screen,'matching');assert.equal((await state()).canAct,false);
  if(n===0){const seen=[];for(const time of [0,75,155,245,345]){await to(entry+time);seen.push((await state()).reveal.map.id);}assert.deepEqual(seen,maps);assert.equal(await page.locator('.map-reveal-card:visible').count(),1);await to(entry+1000);await shot('reveal-cycling');}
  await to(entry+1999);assert.equal((await state()).reveal.phase,'cycling');await advance(1);let s=await state();assert.equal(s.reveal.phase,'locked');assert.equal(s.reveal.map.id,id);assert.equal(s.map,undefined);
  await page.evaluate(async()=>{const {MAPS}=await import('./maps.mjs');await Promise.all(MAPS.flatMap(m=>Object.values(m.assets)).filter(Boolean).map(url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=url;})));});
  await page.waitForTimeout(350);await shot(id+'-reveal');await to(entry+3999);assert.equal((await state()).screen,'matching');await advance(1);s=await state();assert.equal(s.status,'countdown');assert.equal(s.deadline,entry+7000);assert.equal(s.map,id);await shot(id+'-countdown');
  await to(entry+7000);await page.evaluate(()=>__mapQA.pause());await shot(id+'-scene');const g=await geometry();baseline??=g;assert.deepEqual(g,baseline);assert.deepEqual(g['#board'].slice(2),[480,480]);assert.deepEqual(g['#opponent-board'].slice(2),[480,480]);
  if(id==='forest'){await advance(1800);assert.equal((await state()).stage,undefined);await shot('forest-ambient');report.checks.push({map:id,event:'none; preserved forest rules',geometry:g});continue;}
  s=await state();const first=s.next,c=s.config;
  for(const [label,offset,stage] of [['Environment',.2,'Environment'],['Camera',.55,'Camera'],['BoardReaction',.85,'BoardReaction']]){await to(first+c.warning*offset);s=await state();assert.equal(s.stage,stage);assert.deepEqual(s.counts,[0,0]);await shot(id+'-'+label);assert.deepEqual(await geometry(),g);}
  const fall=first+c.warning;await to(fall+c.impact*.18);await shot(id+'-arrival');await to(fall+c.impact*.52);await shot(id+'-execute');await to(fall+c.impact*.85);await shot(id+'-impact');
  const landed=fall+c.impact;await to(landed+80);s=await state();assert.equal(s.stage,'Gameplay');assert.deepEqual(s.counts,[s.targets[0].length,s.targets[0].length]);await shot(id+'-Gameplay');const count=s.targets[0].length;
  if(id==='crystal'){await page.evaluate(()=>__mapQA.thaw());await advance(110);await shot('crystal-crack');await advance(200);await shot('crystal-shatter');assert.deepEqual((await state()).counts,[3,4]);}
  await to(landed+c.duration+80);s=await state();assert.equal(s.stage,'Recovery');assert.deepEqual(s.counts,[0,0]);await shot(id+'-Recovery');await advance(750);s=await state();assert.equal(s.stage,undefined);assert.equal(s.visuals,0);assert.deepEqual(s.transform,[[0,0],[0,0]]);assert.deepEqual(s.scores,[0,0]);await shot(id+'-restored');
  report.checks.push({map:id,stages:['Environment','Camera','BoardReaction','Gameplay','Recovery'],pairedCount:count,firstDelay:c.firstDelay,impact:c.impact,duration:c.duration,scoreUnchanged:true,geometry:g,restored:true});
  await to(s.next+c.warning+c.impact+30);await page.evaluate(()=>__mapQA.save());
  // Next map's restart must remove this active event before revealing a new map.
  if(n<maps.length-1){await page.locator('#restart').click();assert.ok(await page.evaluate(()=>__mapQA.oldClean()));await page.keyboard.press('Escape');await page.locator('[data-difficulty="easy"]').click();await advance(7000);await page.evaluate(()=>__mapQA.pause());}
 }
 await page.evaluate(()=>__mapQA.save());await page.locator('#exit-game').click();await advance(20000);assert.ok(await page.evaluate(()=>__mapQA.oldClean()));assert.equal((await state()).worldHidden,true);assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-map')),'forest');assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-event-stage')),null);
 await page.locator('#open-arena').click();await page.locator('[data-difficulty="easy"]').click();await advance(2500);await page.keyboard.press('Escape');await advance(8000);assert.equal((await state()).screen,'difficulty');assert.equal((await state()).map,undefined);report.checks.push('Restart, exit and locked-reveal cancellation clean old world effects and clocks.');
 const low=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});low.on('pageerror',e=>report.errors.push(e.message));
 await low.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};window.__mapRoll=.9;});
 await low.goto(`http://127.0.0.1:${server.address().port}/`);await low.waitForFunction(()=>window.__mapQA&&blockBrawl.snapshot().art.ready===2);await low.locator('#open-arena').click();await low.locator('[data-difficulty="easy"]').click();await low.evaluate(()=>__mapQA.advance(300));assert.equal((await low.evaluate(()=>__mapQA.state())).reveal.map.id,'furnace');await low.evaluate(()=>__mapQA.advance(6700));await low.evaluate(()=>__mapQA.pause());await low.evaluate(()=>__mapQA.advance(7320));assert.equal((await low.evaluate(()=>__mapQA.state())).stage,'Camera');assert.equal(await low.evaluate(()=>document.documentElement.style.getPropertyValue('--world-shift')),'0px');assert.equal(await low.evaluate(()=>document.documentElement.style.getPropertyValue('--platform-shift')),'0px');report.checks.push('Reduced motion uses a stable preview and suppresses camera/platform movement.');await low.close();
 assert.deepEqual(report.errors,[]);
 // Keep complete full-size screenshots plus one readable storyboard per map.
 for(const id of maps){const labels=id==='forest'?['scene','ambient']:['scene','Environment','Camera','BoardReaction','execute','Gameplay','Recovery','restored'];const width=720,height=500,items=[];
  for(const [k,label] of labels.entries()){const png=await sharp(path.join(out,`${id}-${label}.png`)).resize(width,height).png().toBuffer();items.push({input:png,left:(k%2)*width,top:Math.floor(k/2)*(height+34)+34});const tag=Buffer.from(`<svg width="720" height="34"><rect width="720" height="34" fill="#283445"/><text x="15" y="24" font-family="Arial" font-size="19" fill="#eee5d6">${id} · ${label}</text></svg>`);items.push({input:tag,left:(k%2)*width,top:Math.floor(k/2)*(height+34)});}
  await sharp({create:{width:width*2,height:Math.ceil(labels.length/2)*(height+34),channels:4,background:'#283445'}}).composite(items).png().toFile(path.join(out,id+'-storyboard.png'));
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,frames:report.frames.length,errors:report.errors},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
