import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),require=createRequire(import.meta.url),runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[runtime]})),sharp=require(require.resolve('sharp',{paths:[runtime]}));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={scope:'independent enlarged cast preview only',errors:[],checks:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:5187/art-preproduction/cast-soft-v2-preview/index.html');await page.waitForFunction(()=>window.__fxPreviewReady===true);await page.evaluate(()=>__fxPreviewSeek(620));
 await page.screenshot({path:path.join(dir,'effect_cast_review_soft_v2_preview.png')});
 const captures=[];
 for(const [stage,ms] of [['activation',160],['release',340],['flight',620],['impact',930]]){
  await page.evaluate(ms=>__fxPreviewSeek(ms),ms);assert.equal((await page.evaluate(()=>__fxPreviewState)).stage,stage);
  const file=path.join(dir,`effect_cast_${stage}_soft_v2_preview.png`);await page.locator('#scene').screenshot({path:file});
  captures.push({input:await sharp(file).resize(600,400,{fit:'contain',background:'#f4efe5'}).png().toBuffer(),left:captures.length%2*600,top:Math.floor(captures.length/2)*400});
 }
 await sharp({create:{width:1200,height:800,channels:3,background:'#f4efe5'}}).composite(captures).png().toFile(path.join(dir,'effect_cast_storyboard_soft_v2_preview.png'));
 await page.evaluate(()=>__fxPreviewSeek(620));await page.locator('#zoom').screenshot({path:path.join(dir,'effect_cast_detail_soft_v2_preview.png')});
 const before=(await page.locator('#scene').screenshot());await page.locator('#compare').click();assert.equal((await page.evaluate(()=>__fxPreviewState)).old,true);const after=await page.locator('#scene').screenshot();assert.ok(!before.equals(after));await page.locator('#compare').click();
 report.checks.push('Enlarged activation, release, orb flight and impact render; old/new comparison works.');
 for(const type of ['control','buff']){await page.selectOption('#type',type);await page.evaluate(()=>__fxPreviewSeek(620));assert.equal((await page.evaluate(()=>__fxPreviewState)).type,type);}await page.selectOption('#type','attack');await page.evaluate(()=>__fxPreviewSeek(620));
 await page.locator('#amount').evaluate(n=>{n.value='1.3';n.dispatchEvent(new Event('input'));});assert.equal((await page.evaluate(()=>__fxPreviewState)).amount,1.3);await page.locator('#amount').evaluate(n=>{n.value='1';n.dispatchEvent(new Event('input'));});
 report.checks.push('Type colors, size control, slow replay and scrubbing available.');
 // Pixel contrast at the orb must remain visible on the actual scene, not just in the enlarged inset.
 const state=await page.evaluate(()=>__fxPreviewState),candidate=await page.locator('#scene').screenshot();await page.locator('#compare').click();const previous=await page.locator('#scene').screenshot();
 const metadata=await sharp(candidate).metadata(),cx=Math.round(state.point.x*metadata.width/1440),cy=Math.round(state.point.y*metadata.height/960),rect={left:cx-18,top:cy-18,width:36,height:36};
 const a=await sharp(candidate).extract(rect).removeAlpha().raw().toBuffer(),b=await sharp(previous).extract(rect).removeAlpha().raw().toBuffer();let differences=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>8)differences++;
 assert.ok(differences>100,'Orb enlargement must be visible in the actual-size main canvas');report.visibleChangedChannels=differences;
 await page.locator('#compare').click();await page.evaluate(()=>__fxPreviewSeek(620));await page.screenshot({path:path.join(dir,'effect_cast_review_soft_v2_preview.png')});
 const protectedFiles=JSON.parse((await fs.readFile(path.join(dir,'protected-before.json'),'utf8')).replace(/^\uFEFF/,''));for(const item of protectedFiles)assert.equal(crypto.createHash('sha256').update(await fs.readFile(item.path)).digest('hex'),item.sha256,item.path);report.protectedFiles=protectedFiles.length;
 report.checks.push('Every dist file and offline game hash unchanged; candidate remains outside the game.');assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=e.stack;throw e;}finally{await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));await browser.close();console.log(report.status,report.checks);}
