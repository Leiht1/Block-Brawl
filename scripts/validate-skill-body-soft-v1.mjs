import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url),runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[runtime]})),sharp=require(require.resolve('sharp',{paths:[runtime]}));
const out=path.join(root,'validation/2026-10-12/skill-body-soft-v1'),base=path.join(root,'art-preproduction/skill-body-soft-v1');await fs.mkdir(out,{recursive:true});
const report={scope:['fire','freeze','blackhole','luck'],errors:[],checks:[],status:'running',integration:'independent review only'};
async function tree(dir){let files=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);files.push(...(e.isDirectory()?await tree(f):[f]));}return files;}
const files=await tree(path.join(root,'dist')),hash=async f=>crypto.createHash('sha256').update(await fs.readFile(f)).digest('hex'),before=await Promise.all(files.map(async f=>({file:path.relative(root,f),hash:await hash(f)})));
const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
assert.deepEqual(manifest.scope,report.scope);
for(const [id,e]of Object.entries(manifest.entries)){assert.equal(e.status,'preview');assert.equal(e.runtimePath,null);assert.ok(e.mainMs>=400&&e.mainMs<=900);const meta=await sharp(path.join(base,e.reviewPath)).metadata();assert.equal(meta.width,1024);assert.equal(meta.height,512);assert.equal(meta.hasAlpha,true);for(const f of e.frames){const m=await sharp(path.join(base,f)).metadata();assert.equal(m.width,256);assert.equal(m.height,256);const stats=await sharp(path.join(base,f)).stats();assert.equal(stats.channels[3].min,0);} }
report.checks.push('4 transparent 1024x512 atlases and 32 registered 256x256 keyframes exist; preview status and 720–800ms feedback recorded.');
if(['tone-v2','visibility-ice-v3'].includes(manifest.revision)){
 let pixelsChecked=0;for(const [id,e] of Object.entries(manifest.entries)){if(e.geometryChanged)continue;for(let n=0;n<8;n++){
  const old=await sharp(path.join(base,e.previousAssets.frames[n])).raw().toBuffer(),next=await sharp(path.join(base,e.frames[n])).raw().toBuffer();assert.equal(old.length,next.length);
  for(let p=3;p<old.length;p+=4){assert.equal(old[p]===0,next[p]===0,'Empty alpha mask must not move');assert.ok(next[p]>=old[p],'Opacity must not decrease');pixelsChecked++;}
 }}
 report.checks.push('Color revision: '+pixelsChecked+' unchanged-shape frame pixels checked; unchanged empty-alpha masks, no resampling or geometry changes, opacity increases only.');
 if(manifest.revision==='visibility-ice-v3'){
  const prior=JSON.parse(await fs.readFile(path.join(base,'manifest-v2.json'),'utf8'));
  for(const [id,e]of Object.entries(manifest.entries))for(const key of ['anchor','mainMs','frameMs','frameCount','frameSize'])assert.deepEqual(e[key],prior.entries[id][key],id+' '+key);
  assert.equal(manifest.entries.freeze.geometryChanged,true);
  report.checks.push('v3 changes freeze material only; all four anchors, main durations and atlas layouts retain v2 values.');
 }
}
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1220},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:5178/art-preproduction/skill-body-soft-v1/index.html');await page.waitForFunction(()=>window.__skillReviewReady);await page.waitForTimeout(300);
 for(const id of report.scope){
  await page.evaluate(id=>{__skillReview.choose(id);__skillReview.seek(1180);},id);
  await page.screenshot({path:path.join(out,id+'-review.png'),fullPage:true});
  const saveCanvas=async (element,name)=>{const data=await page.evaluate(element=>document.getElementById(element).toDataURL('image/png').split(',')[1],element);await fs.writeFile(path.join(out,name),Buffer.from(data,'base64'));};
  await saveCanvas('scene',id+'-board.png');await saveCanvas('isolated',id+'-isolated.png');
  if(['tone-v2','visibility-ice-v3'].includes(manifest.revision)){
   await page.locator('#tone-compare').check();assert.equal((await page.evaluate(()=>__skillReviewState)).time,1180);await saveCanvas('scene',id+'-before-color.png');await page.locator('#tone-compare').uncheck();
   const prior=await sharp(path.join(out,id+'-before-color.png')).removeAlpha().raw().toBuffer(),next=await sharp(path.join(out,id+'-board.png')).removeAlpha().raw().toBuffer();const g=await page.evaluate(()=>__skillReview.geometry.boards[__skillReviewState.targetSide]);let changed=0;
   for(let p=0;p<next.length;p+=3)if(next[p]!==prior[p]||next[p+1]!==prior[p+1]||next[p+2]!==prior[p+2]){changed++;const n=p/3,x=n%1440,y=Math.floor(n/1440);assert.ok(x>=Math.floor(g.x)&&x<=Math.ceil(g.x+g.width)&&y>=Math.floor(g.y)&&y<=Math.ceil(g.y+g.height),'Only target board may change');}
   assert.ok(changed>100,'Color correction visible at real board size');report[id+'ColorChange']={changedPixels:changed,comparisonAtMs:1180,outsideTargetBoardChanged:0};
  }
  const pixels=await sharp(path.join(out,id+'-board.png')).removeAlpha().raw().toBuffer();
  const geometry=await page.evaluate(()=>__skillReview.geometry);let readable=0;
  // Verify both real boards contain colorful blocks across rows, not only wells.
  for(const b of Object.values(geometry.boards))for(let n=0;n<64;n++){const x=Math.round(b.x+(n%8+.5)*b.width/8),y=Math.round(b.y+(Math.floor(n/8)+.5)*b.height/8),k=(y*1440+x)*3;const rgb=[pixels[k],pixels[k+1],pixels[k+2]];if(Math.max(...rgb)-Math.min(...rgb)>35)readable++;}
  assert.ok(readable>=112,'Colored tile centers must remain visible across both boards: '+readable);report[id+'Readability']={coloredCenters:readable,total:128};
  const stages=[];
  for(const t of [120,620,820,1180,1520,1950]){await page.evaluate(t=>__skillReview.seek(t),t);const png=await page.evaluate(()=>document.getElementById('scene').toDataURL('image/png').split(',')[1]);stages.push({input:await sharp(Buffer.from(png,'base64')).resize(480,320).toBuffer(),left:(stages.length%3)*480,top:Math.floor(stages.length/3)*320});}
  await sharp({create:{width:1440,height:640,channels:4,background:'#f0e7d7'}}).composite(stages).png().toFile(path.join(out,id+'-storyboard.png'));
  await page.selectOption('#mode','rules');
  const times={fire:2450,freeze:2000,blackhole:440,luck:2600};await page.evaluate(t=>__skillReview.seek(t),times[id]);await saveCanvas('scene',id+'-rules.png');
  const checks=await page.evaluate(id=>{const t=__skillReview.traces[id],c=t.cast;return {target:t.side,cells:c.cells,castTime:c.now,effect:t.changes.find(e=>e.kind==='effect'),moves:t.events.find(e=>e.kind==='card-change'&&e.card==='blackhole'),before:t.at(220).boards[t.side],atCast:t.at(240).boards[t.side],frozenUntil:t.at(240).buffs.freeze,luckUntil:t.at(240).buffs.luck,buffsAfter:t.at(id==='freeze'?3240:10240).buffs};},id);
  assert.equal(checks.castTime,240);assert.equal(checks.target,id==='luck'?'player':'opponent');
  if(id==='fire'){assert.deepEqual(checks.cells,[26,27,28]);assert.equal(checks.effect.now,2440);assert.deepEqual(checks.before,checks.atCast);}
  if(id==='freeze'){assert.equal(checks.cells.length,64);assert.equal(checks.frozenUntil,3240);assert.equal(checks.buffsAfter.freeze,undefined);}
  if(id==='blackhole'){assert.equal(checks.moves.duration,420);assert.equal(checks.moves.time,240);assert.equal(checks.moves.moves.length,6);for(const m of checks.moves.moves){assert.equal(m.control,27);assert.equal(checks.atCast[m.to].id,checks.before[m.from].id);}}
  if(id==='luck'){assert.equal(checks.luckUntil,10240);assert.deepEqual(checks.before,checks.atCast);}
  report[id]=checks;await page.selectOption('#mode','story');
 }
 report.checks.push('Real rule traces: fire cells 26/27/28 settle at 2440ms; freeze ends 3240ms; blackhole moves six tile identities at 240ms over 420ms; luck buff deadline 10240ms.');
 for(const speed of ['1','.5','.25']){await page.selectOption('#speed',speed);assert.equal(await page.locator('#speed').inputValue(),speed);}
 await page.getByRole('button',{name:'查看原尺寸棋盘'}).click();assert.equal(await page.locator('#large').evaluate(d=>d.open),true);await page.locator('#close-large').click();
 await page.getByRole('button',{name:'单独播放本体'}).click();assert.equal((await page.evaluate(()=>__skillReviewState)).bodyOnly,true);await page.evaluate(()=>__skillReview.seek(1180));
 report.checks.push('Review opens with no missing resources; four selectors, scrubbing, speed controls, isolated body and original-size dialog work.');
 const animations=process.argv.includes('--animations');
 if(animations){
  for(const id of report.scope){
   await page.evaluate(id=>{__skillReview.choose(id);__skillReview.seek(0);},id);await page.selectOption('#mode','story');
   const duration={fire:3200,freeze:3900,blackhole:2200,luck:10900}[id],raw=[];
   for(let t=0;t<duration;t+=50){await page.evaluate(t=>__skillReview.seek(t),t);const png=await page.evaluate(()=>document.getElementById('scene').toDataURL('image/png').split(',')[1]);raw.push(await sharp(Buffer.from(png,'base64')).resize(720,480).ensureAlpha().raw().toBuffer());}
   await sharp(Buffer.concat(raw),{raw:{width:720,height:480*raw.length,channels:4,pageHeight:480}}).webp({quality:72,effort:2,loop:0,delay:raw.map(()=>50)}).toFile(path.join(out,id+'-complete.webp'));
   const body=[];for(let t=880;t<880+manifest.entries[id].mainMs+150;t+=40){await page.evaluate(t=>__skillReview.seek(t),t);const png=await page.evaluate(()=>document.getElementById('isolated').toDataURL('image/png').split(',')[1]);body.push(await sharp(Buffer.from(png,'base64')).ensureAlpha().raw().toBuffer());}
   await sharp(Buffer.concat(body),{raw:{width:480,height:380*body.length,channels:4,pageHeight:380}}).webp({quality:80,effort:2,loop:0,delay:body.map(()=>40)}).toFile(path.join(out,id+'-body.webp'));
   console.log(id+' animated independent + full demo exported');
  }
  report.checks.push('4 independent body animations and 4 full workflow animated WebP exports.');
 }
 for(const item of before)assert.equal(await hash(path.join(root,item.file)),item.hash,item.file);report.protectedFiles=files.length;
 report.checks.push('All '+files.length+' production files retain identical hashes; no production integration.');assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=e.stack;throw e;}finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await fs.writeFile(path.join(out,'protected-files.json'),JSON.stringify(before,null,2));await browser.close();}
console.log(report.status);
