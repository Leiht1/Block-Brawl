import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/map-feedback');await fs.mkdir(out,{recursive:true});
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[deps]})),sharp=require(require.resolve('sharp',{paths:[deps]}));
const server=http.createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
 if(name==='flow.mjs')body=body.toString().replace('new MapReveal(performance.now(),Math.random,reducedMotion)','new MapReveal(performance.now(),()=>window.__mapRoll??Math.random(),reducedMotion)').replace('this.arena.start(now);','this.arena.start(now,37);');
 if(name==='app.mjs')body=body.toString()+`
 window.__languageQA={
  advance(ms){for(let n=0;n<ms;n+=10)__clock.advance(__clock.time+Math.min(10,ms-n));},
  pause(){flow.arena.source.stop();},
  massiveRock(){const env=flow.arena.environment;env.config={...env.config,footprints:env.config.footprints.filter(p=>p.name==='massive')};},
  state(){const a=flow.arena;return {time:__clock.time,map:a?.map.id,status:a?.status,next:a?.environment?.next,end:a?.environment?.state?.end,phase:a?.environment?.state?.phase,cue:mapPresentation.at(__clock.time),config:a?.map.environment,targets:a?.environment?.state?.targets,spreadTargets:a?.environment?.state?.spread?.targets,engines:a?Object.values(a.engines).map(e=>({fire:[...e.temporaryBlocks.keys()],ice:[...e.frozenCells.keys()],states:[...e.terrain.cells],ids:e.board.map(t=>t?.id),score:e.score})):[],visuals:(rockVisual||[]).length+rockRestores.length,shift:[document.documentElement.style.getPropertyValue('--world-shift'),document.documentElement.style.getPropertyValue('--platform-shift')],transform:[ctx,$('opponent-board').getContext('2d')].map(c=>{const t=c.getTransform();return [t.e,t.f];})};},
  save(){window.__old=flow.arena;},clean(){return !__old.environment||__old.environment.clean&&__old.environment.deadline===Infinity;},
  async breakIce(){
   const {legalMoves,findMatches}=await import('./engine.mjs');
   for(const [a,b] of legalMoves(engine.board,engine.ruleTerrain)){
    if(!engine.canSwap(a,b))continue;
    [engine.board[a],engine.board[b]]=[engine.board[b],engine.board[a]];
    const groups=findMatches(engine.board,engine.ruleTerrain).filter(g=>g.cells.includes(a)||g.cells.includes(b));
    const affected=engine.resolution({a,b},groups,[a,b].filter(i=>engine.board[i]?.special)).cells;
    const ice=[...engine.frozenCells.keys()].filter(i=>affected.some(j=>Math.abs(Math.floor(i/8)-Math.floor(j/8))+Math.abs(i%8-j%8)<=1));
    [engine.board[a],engine.board[b]]=[engine.board[b],engine.board[a]];
    if(ice.length){engine.command({kind:'swap',a,b});return {a,b,ice};}
   }throw Error('No legal clear reaches the ice fixture');
  }
 };`;
 res.writeHead(200,{'Content-Type':{'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],frames:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__languageQA&&blockBrawl.snapshot().art.ready===2);
 const state=()=>page.evaluate(()=>__languageQA.state()),advance=ms=>page.evaluate(ms=>__languageQA.advance(ms),ms),to=async time=>{const now=(await state()).time;assert.ok(time>=now);await advance(time-now);};
 const shot=async name=>{await page.screenshot({path:path.join(out,name+'.png')});report.frames.push(name+'.png');};
 const geometry=()=>page.evaluate(()=>['board','opponent-board','arena-scoreboard'].map(id=>{const b=document.getElementById(id).getBoundingClientRect();return [b.x,b.y,b.width,b.height];}));
 await page.locator('#open-arena').click();let baseline;
 for(const [n,id] of ['cliff','crystal','ruins','furnace'].entries()){
  await page.evaluate(n=>window.__mapRoll=(n+1.25)/5,n);await page.locator(n?'#restart':'[data-difficulty="easy"]').click();if(n)assert.ok(await page.evaluate(()=>__languageQA.clean()));
  await advance(7000);await page.evaluate(()=>__languageQA.pause());
  await page.evaluate(async id=>{const {MAPS}=await import('./maps.mjs');await Promise.all(Object.values(MAPS.find(m=>m.id===id).assets).filter(Boolean).map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=src;})));},id);
  await advance(10);let s=await state();assert.equal(s.map,id);baseline??=await geometry();assert.deepEqual(await geometry(),baseline);assert.deepEqual(baseline.slice(0,2).map(b=>b.slice(2)),[[480,480],[480,480]]);
  if(id==='cliff')await page.evaluate(()=>__languageQA.massiveRock());
  await shot(id+'-before');const first=s.next,c=s.config,fall=first+c.warning,land=fall+c.impact;
  await to(first+c.warning*.35);assert.equal((await state()).cue.stage,'Environment');await shot(id+'-environment');
  if(id==='crystal'){const frost=await page.evaluate(()=>{const c=document.getElementById('map-veil'),x=c.getContext('2d');return {edge:x.getImageData(8,25,1,1).data[3],center:x.getImageData(c.width/2,c.height/2,1,1).data[3],frozen:__languageQA.state().engines[0].ice.length};});assert.ok(frost.edge>30);assert.equal(frost.center,0);assert.equal(frost.frozen,0);report.checks.push({frostBeforeFreezing:frost});}
  if(id==='ruins'){const gear=await page.locator('#map-world').screenshot();await to(first+c.warning*.45);assert.notDeepEqual(await page.locator('#map-world').screenshot(),gear);await shot('ruins-large-gear');}
  if(id==='cliff'){await to(first+c.warning*.56);assert.equal((await state()).cue.stage,'Camera');await shot('cliff-mountain-shake');}
  await to(first+c.warning*.88);assert.equal((await state()).cue.stage,'Board');await shot(id+'-warning');
  const label=await page.evaluate(()=>{const a=document.getElementById('map-announcement'),b=document.getElementById('arena-scoreboard');return {hidden:a.hidden,opacity:getComputedStyle(a).opacity,bottom:a.getBoundingClientRect().bottom,scoreTop:b.getBoundingClientRect().top};});assert.equal(label.hidden,false);assert.equal(label.opacity,'1');assert.ok(label.bottom<=label.scoreTop-28);report.checks.push({map:id,persistentLabel:label});
  const targets=(await state()).targets,terrainBefore=(await state()).engines[0].states;
  await to(fall+c.impact*.22);await shot(id+'-arrival');await to(fall+c.impact*(id==='ruins'?.32:.5));await shot(id+'-execute');
  if(id==='ruins')await shot('ruins-event');
  await to(fall+c.impact*.88);await shot(id+'-landing');await to(land+180);s=await state();assert.equal(s.cue.stage,'Gameplay');await shot(id+'-active');
  if(id!=='ruins')await shot(id+'-event');
  if(id==='crystal'){const i=s.engines[0].ice[0],b=baseline[0];await page.screenshot({path:path.join(out,'crystal-ice-detail.png'),clip:{x:Math.floor(b[0]+i%8*60-12),y:Math.floor(b[1]+Math.floor(i/8)*60-12),width:84,height:84}});report.frames.push('crystal-ice-detail.png');}
  if(id==='crystal'){
   assert.deepEqual(s.engines.map(e=>e.ice.length),[4,4]);assert.deepEqual(s.engines.map(e=>e.fire.length),[0,0]);
   await to(land+6000);s=await state();assert.deepEqual(s.engines.map(e=>e.ice.length),[4,4]);assert.equal(s.cue,null);await shot('crystal-persistent');
   const action=await page.evaluate(()=>__languageQA.breakIce());assert.ok(action.ice.length);await advance(100+80);await shot('crystal-cracks');
   assert.ok((await state()).engines[0].ice.length<4);await advance(180);await shot('crystal-shards');await advance(520);await shot('crystal-recovered');
   report.checks.push({map:id,persistentPast6000:true,thawedByActualSwap:action,stages:['Environment','Board','Gameplay'],camera:false});
  }else if(id==='ruins'){
   assert.deepEqual(s.engines.map(e=>e.fire.length),[0,0]);assert.notDeepEqual(s.engines[0].states,terrainBefore);assert.deepEqual(s.engines[0].states,s.engines[1].states);
   assert.equal(s.engines[0].states.filter(s=>s==='obstacle').length,10);await to(land+1400);assert.equal((await state()).cue,null);await shot('ruins-changed');
   report.checks.push({map:id,targets,structureChanges:true,newObstacles:0,stages:['Environment','Board','Gameplay'],camera:false});
  }else{
   assert.deepEqual(s.engines.map(e=>e.fire.length),[targets[0].length,targets[0].length]);
   if(id==='furnace'){
    const clip={x:Math.floor(baseline[0][0]),y:Math.floor(baseline[0][1]),width:480,height:480};
    const before=await page.screenshot({clip});await advance(220);const after=await page.screenshot({clip});assert.notDeepEqual(before,after,'Fire tongues and sparks must visibly move');await shot('furnace-flame-motion');
    for(const elapsed of [3000,6000]){
     await to(land+elapsed-350);const warning=await state();await shot('furnace-spread-'+elapsed+'-warning');
     assert.ok(warning.spreadTargets.every(t=>t.length>1));
     const previous=warning.engines.map(e=>e.fire);await to(land+elapsed+220);const lit=await state();await shot('furnace-spread-'+elapsed+'-flame');
     assert.deepEqual(lit.engines.map(e=>e.fire.length),previous.map((p,n)=>p.length+warning.spreadTargets[n].length));report.checks.push({fourDirectionSpreadAt:elapsed,previous:previous.map(p=>p.length),targets:warning.spreadTargets,counts:lit.engines.map(e=>e.fire.length)});
     for(const [n,e] of lit.engines.entries()){const added=e.fire.filter(i=>!previous[n].includes(i));assert.deepEqual(added,warning.spreadTargets[n]);assert.ok(added.every(i=>previous[n].some(j=>Math.abs(i%8-j%8)+Math.abs(Math.floor(i/8)-Math.floor(j/8))===1)));}
    }
    await to(land+8999);assert.ok((await state()).engines.every(e=>e.fire.length>3));await shot('furnace-still-burning');
   }
   await to(land+c.duration+80);assert.deepEqual((await state()).engines.map(e=>e.fire.length),[0,0]);await shot(id+'-recovery');await advance(750);assert.equal((await state()).visuals,0);await shot(id+'-restored');
   report.checks.push({map:id,targets,duration:c.duration,dynamicFire:id==='furnace',stages:id==='cliff'?['Environment','Camera','Board','Gameplay']:['Environment','Board','Gameplay'],camera:id==='cliff'});
  }
  assert.equal(await page.locator('#map-announcement').isVisible(),true);s=await state();assert.deepEqual(s.transform,[[0,0],[0,0]]);if(id!=='cliff')assert.deepEqual(s.shift,['0px','0px']);assert.deepEqual(await geometry(),baseline);
  await page.evaluate(()=>__languageQA.save());
 }
 await page.evaluate(()=>window.__mapRoll=.05);await page.locator('#restart').click();await advance(7000);await page.evaluate(()=>__languageQA.pause());await page.evaluate(async()=>{const {MAPS}=await import('./maps.mjs');await Promise.all(Object.values(MAPS[0].assets).filter(Boolean).map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=src;})));});await advance(10);assert.ok((await state()).engines.every(e=>e.ids.filter(Boolean).length===64));await shot('forest-before');assert.deepEqual(await geometry(),baseline);await page.evaluate(()=>__languageQA.save());
 await page.locator('#exit-game').click();await advance(20000);assert.ok(await page.evaluate(()=>__languageQA.clean()));assert.equal((await state()).visuals,0);assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-event-stage')),null);
 // Reduced motion preserves rules while keeping scenery and turntable still.
 const low=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});low.on('pageerror',e=>report.errors.push(e.message));
 await low.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};window.__mapRoll=.7;});
 await low.goto(`http://127.0.0.1:${server.address().port}/`);await low.waitForFunction(()=>window.__languageQA&&blockBrawl.snapshot().art.ready===2);await low.locator('#open-arena').click();await low.locator('[data-difficulty="easy"]').click();await low.evaluate(()=>{__languageQA.advance(7000);__languageQA.pause();__languageQA.advance(9500);});
 assert.equal((await low.evaluate(()=>__languageQA.state())).map,'ruins');assert.deepEqual((await low.evaluate(()=>__languageQA.state())).shift,['0px','0px']);await low.close();
 report.checks.push('Actual restart/exit cleanup, reduced motion, identical 480×480 geometry and restored drawing transforms');assert.deepEqual(report.errors,[]);
 // The former clipped cliff wall must leave both SVG outer edges transparent.
 for(const side of ['left','right']){const {data,info}=await sharp(path.join(root,'dist/assets/maps/cliff-stage-'+side+'.svg')).ensureAlpha().raw().toBuffer({resolveWithObject:true});const x=side==='left'?0:info.width-1;assert.ok(Array.from({length:info.height},(_,y)=>data[(y*info.width+x)*4+3]).every(a=>a===0));}
 const small=await browser.newPage({viewport:{width:390,height:844}});small.on('pageerror',e=>report.errors.push(e.message));await small.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};window.__mapRoll=.3;});await small.goto(page.url());await small.waitForFunction(()=>window.__languageQA&&blockBrawl.snapshot().art.ready===2);await small.locator('#open-arena').click();await small.locator('[data-difficulty="easy"]').click();await small.evaluate(()=>{__languageQA.advance(7000);__languageQA.pause();});await small.waitForTimeout(200);await small.evaluate(()=>__languageQA.advance(10000));const mobileLabel=await small.evaluate(()=>{const a=document.getElementById('map-announcement').getBoundingClientRect(),b=document.getElementById('arena-scoreboard').getBoundingClientRect();return {bottom:a.bottom,scoreTop:b.top,toolbarTop:document.querySelector('.arena-mode .menu .tools').getBoundingClientRect().top,visible:!document.getElementById('map-announcement').hidden};});assert.ok(mobileLabel.visible&&mobileLabel.bottom<mobileLabel.scoreTop-20);assert.ok(mobileLabel.bottom<mobileLabel.toolbarTop);await small.screenshot({path:path.join(out,'mobile-name.png')});report.frames.push('mobile-name.png');report.checks.push({mobileLabel,cliffOuterEdgesTransparent:true});await small.close();
 const exposure=async name=>{const v=await sharp(path.join(out,name+'.png')).extract({left:15,top:900,width:220,height:65}).removeAlpha().stats();return v.channels.slice(0,3).reduce((sum,c)=>sum+c.mean,0)/3;};
 const cool=await exposure('furnace-before'),heated=await exposure('furnace-warning');assert.ok(heated>cool*1.12,'Whole scenery must visibly brighten before any cell ignites');report.checks.push({backgroundBrightnessBefore:cool,backgroundBrightnessWarning:heated});
 await fs.copyFile(path.join(out,'furnace-spread-6000-flame.png'),path.join(out,'furnace-event.png'));
 const names={cliff:'悬崖 · 山体崩落',crystal:'冰川 · 寒潮冻结',ruins:'遗迹 · 古代转盘',furnace:'熔炉 · 高温燃烧'};
 for(const id of Object.keys(names)){
  const labels=id==='furnace'?['before','warning','spread-3000-warning','spread-6000-flame']:id==='crystal'?['before','environment','active','shards']:id==='ruins'?['before','environment','execute','changed']:['before','environment','execute','active'],items=[];
  for(const [k,label] of labels.entries()){
   items.push({input:await sharp(path.join(out,`${id}-${label}.png`)).resize(720,500).png().toBuffer(),left:k%2*720,top:Math.floor(k/2)*534+34});
   items.push({input:Buffer.from(`<svg width="720" height="34"><rect width="720" height="34" fill="#26323d"/><text x="16" y="24" font-family="Arial" font-size="18" fill="#fff0d3">${id} · ${label}</text></svg>`),left:k%2*720,top:Math.floor(k/2)*534});
  }
  await sharp({create:{width:1440,height:1068,channels:4,background:'#26323d'}}).composite(items).png().toFile(path.join(out,id+'-storyboard.png'));
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
 await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>四张地图独立环境事件验收</title><style>body{margin:0;background:#18232d;color:#f1e5c9;font:16px system-ui}main{max-width:1440px;margin:auto;padding:32px}h1{font-size:30px}p{color:#bec9cb;line-height:1.8}section{margin:42px 0}img{width:100%;height:auto;border-radius:12px}a{color:#ffd18c}summary{cursor:pointer;padding:20px}</style><main><h1>方块乱斗 · 对战界面与事件细节修正</h1><p>悬崖：山体震动 → 碎石掉落 → 巨石砸入。冰川：寒潮 → 冰晶冻结 → 消除破冰。熔炉：整体升温 → 格框预热 → 动态燃烧，第3 / 6秒向上下左右蔓延，第9秒整轮熄灭。遗迹：符文 → 齿轮转盘 → 通道变化。只有悬崖使用地图震动。</p><section><h2>本轮细节修正对照</h2><p>左：上轮。右：本轮。名字常驻并上移、删除悬崖裁切山壁、遗迹齿轮加速、冰川霜雾柔化、熔炉四方向扩散。</p><img src="native-art-comparison.png" alt="原有美术细化对照"><p><a href="forest-before.png">森林棋盘细节</a></p></section>${Object.entries(names).map(([id,title])=>`<section><h2>${title}</h2><a href="${id}-event.png">打开完整演出截图</a><img src="${id}-event.png" alt="${title}"><details><summary>查看演出过程</summary><img src="${id}-storyboard.png" alt="${title}分镜">${report.frames.filter(f=>f.startsWith(id)&&!f.includes('event')).map(f=>`<p><a href="${f}">${f}</a></p>`).join('')}</details></section>`).join('')}<p><a href="report.json">自动验收记录</a></p></main>`);
 const artItems=[];
 for(const [n,id] of ['cliff','crystal','ruins','furnace'].entries())for(const [k,dir] of ['map-refinement','map-feedback'].entries()){
  artItems.push({input:await sharp(path.join(root,'validation/2026-10-11',dir,id+'-before.png')).resize(720,500).png().toBuffer(),left:k*720,top:n*530+30});
  artItems.push({input:Buffer.from('<svg width="720" height="30"><rect width="720" height="30" fill="#26323d"/><text x="16" y="22" fill="#fff0d3" font-size="17">'+id+' · '+(k?'feedback fixes':'previous refinement')+'</text></svg>'),left:k*720,top:n*530});
 }
 await sharp({create:{width:1440,height:2120,channels:4,background:'#26323d'}}).composite(artItems).png().toFile(path.join(out,'native-art-comparison.png'));
 console.log(JSON.stringify({checks:report.checks.length,frames:report.frames.length,errors:report.errors,output:out},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
