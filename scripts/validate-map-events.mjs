import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/map-event-presence');await fs.mkdir(out,{recursive:true});
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
if(name==='flow.mjs')body=body.toString().replace('new MapReveal(performance.now(),Math.random,reducedMotion)','new MapReveal(performance.now(),()=>window.__mapRoll??Math.random(),reducedMotion)');
if(name==='app.mjs')body=body.toString()+`\nwindow.__eventQA={advance(ms){for(let n=0;n<ms;n+=10)__clock.advance(__clock.time+Math.min(10,ms-n));},pause(){flow.arena.source.stop();},shape(name){const env=flow.arena.environment;env.config={...env.config,footprints:env.config.footprints.filter(p=>p.name===name)};},state(){const a=flow.arena;return {next:a?.environment?.next,end:a?.environment?.state?.end,config:a?.map.environment,phase:a?.environment?.state?.phase,time:__clock.time,status:a?.status,map:a?.map.id,targets:a?.environment?.state?.targets,transforms:[ctx,$('opponent-board').getContext('2d')].map(c=>{const m=c.getTransform();return [m.e,m.f];}),both:a?Object.values(a.engines).map(e=>({blocks:e.temporaryBlocks.size,ice:e.frozenCells.size,score:e.score})):[],visuals:(rockVisual||[]).length,restores:rockRestores.length};},save(){window.__oldArena=flow.arena;},clean(){return __oldArena.environment.clean&&__oldArena.environment.deadline===Infinity;},finish(){flow.arena.event('player',{kind:'score',score:999999,time:__clock.time});},thaw(){engine.thawTerrain([...engine.frozenCells.keys()][0],'clear');}};`;
res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]};
try{const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));
await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=f=>{__clock.raf=f;return 1;};});
await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__eventQA&&blockBrawl.snapshot().art.ready===2);
const advance=ms=>page.evaluate(ms=>__eventQA.advance(ms),ms),state=()=>page.evaluate(()=>__eventQA.state());
await page.locator('#open-arena').click();
const to=async time=>advance(time-(await state()).time);
for(const [n,scenario] of [{id:'cliff',shape:'wide',roll:.3},{id:'cliff',shape:'massive',roll:.3},{id:'crystal',roll:.5},{id:'ruins',roll:.7},{id:'furnace',roll:.9}].entries()){
const {id,shape,roll}=scenario,label=shape?id+'-'+shape:id;
await page.evaluate(roll=>window.__mapRoll=roll,roll);if(!n)await page.locator('[data-difficulty="easy"]').click();else {await page.locator('#restart').click();assert.ok(await page.evaluate(()=>__eventQA.clean()));}
await advance(8000);await page.evaluate(async id=>{const {MAPS}=await import('./maps.mjs');await Promise.all(Object.values(MAPS.find(m=>m.id===id).assets).filter(Boolean).map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=src;})));},id);
await page.evaluate(()=>__eventQA.pause());if(shape)await page.evaluate(shape=>__eventQA.shape(shape),shape);
let s=await state();assert.equal(s.map,id);const first=s.next,c=s.config;
await to(first+750);assert.equal((await state()).phase,'warning');await page.screenshot({path:path.join(out,label+'-warning.png')});
s=await state();await to(s.end+c.impact*.55);assert.equal((await state()).phase,'fall');await page.screenshot({path:path.join(out,label+'-execute.png')});
s=await state();await to(s.end+30);s=await state();assert.equal(s.phase,'blocked');const count=s.targets[0].length;assert.deepEqual(s.both.map(e=>e.blocks+e.ice),[count,count]);await page.screenshot({path:path.join(out,label+'-active.png')});
const expiry=s.end;
if(id==='crystal'){await page.evaluate(()=>__eventQA.thaw());await advance(120);await page.screenshot({path:path.join(out,label+'-crack.png')});await advance(190);await page.screenshot({path:path.join(out,label+'-shatter.png')});assert.deepEqual((await state()).both.map(e=>e.ice),[3,4]);}
await to(expiry+80);assert.equal((await state()).phase,undefined);await page.screenshot({path:path.join(out,label+'-recover.png')});await advance(650);s=await state();assert.deepEqual(s.both.map(e=>e.blocks+e.ice),[0,0]);assert.equal(s.visuals+s.restores,0);assert.deepEqual(s.transforms,[[0,0],[0,0]],'Both painters must restore the shake transform');
report.checks.push({map:id,shape:shape||null,completeLifecycle:true,pairedCount:count,firstDelay:c.firstDelay,interval:[c.intervalMin,c.intervalMax],duration:c.duration,themeFrames:id==='crystal'?6:4});
await to(s.next+c.warning+c.impact+20);assert.equal((await state()).phase,'blocked');await page.evaluate(()=>__eventQA.save());
}
await page.locator('#exit-game').click();await advance(40000);assert.ok(await page.evaluate(()=>__eventQA.clean()));assert.equal((await state()).visuals+(await state()).restores,0);assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-map')),'forest');
assert.deepEqual(report.errors,[]);report.checks.push('actual exit clears event storage, future deadlines and themed visuals');await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
