import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-balance');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={scenes:[],errors:[]};
try{
 for(const [width,height] of [[1366,768],[1024,600],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/dist/index.html');
  const inspect=async(name)=>{
   await page.mouse.move(0,0);await page.waitForTimeout(150);
   const geometry=await page.evaluate(()=>{
    const bar=document.querySelector('.audio-controls'),r=bar.getBoundingClientRect();
    const overlap=e=>{const a=e.getBoundingClientRect();return a.width&&a.height&&getComputedStyle(e).visibility!=='hidden'&&a.left<r.right&&a.right>r.left&&a.top<r.bottom&&a.bottom>r.top;};
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,viewportWidth:document.body.clientWidth,count:document.querySelectorAll('[data-audio-setting]').length,
     hit:[...bar.querySelectorAll('button')].every(b=>{const a=b.getBoundingClientRect();return b.contains(document.elementFromPoint(a.left+a.width/2,a.top+a.height/2));}),
     overlaps:[...document.querySelectorAll('h1,button,canvas:not([aria-hidden="true"]),.stats,.tutorial-card')].filter(e=>!bar.contains(e)&&overlap(e)).map(e=>e.id||e.className)};
   });
   assert.equal(geometry.count,2);assert.equal(geometry.top,width<=640?12:20);assert.equal(geometry.right,geometry.viewportWidth-(width<=640?14:22));assert.ok(geometry.hit);assert.deepEqual(geometry.overlaps,[]);
   assert.ok(geometry.bottom<=height);report.scenes.push({name,width,height,...geometry});
   await page.screenshot({path:path.join(out,`${name}-${width}x${height}.png`)});
  };
  await inspect('shared-home');await page.click('#open-tutorial');await inspect('shared-levels');
  await page.click('#music');assert.equal(await page.getAttribute('#music','aria-pressed'),'false');
  await page.click('[data-level="0"]');await inspect('shared-tutorial');assert.equal(await page.getAttribute('#music','aria-pressed'),'false');
  await page.click('#sound');assert.equal(await page.getAttribute('#sound','aria-pressed'),'false');await page.click('#music');
  assert.equal(await page.getAttribute('#sound','aria-pressed'),'false');await page.click('#sound');await page.click('#exit-game');await page.click('#level-back');
  await page.click('#open-arena');await inspect('shared-difficulty');await page.click('[data-difficulty="easy"]');await inspect('shared-matching');
  await page.waitForSelector('#arena-panel',{state:'visible'});await inspect('shared-arena');
  await page.waitForSelector('#arena-countdown',{state:'hidden'});
  await page.click('#music');assert.equal(await page.getAttribute('#sound','aria-pressed'),'true');await page.click('#music');
  await page.click('#exit-game');await page.click('#open-sandbox');await inspect('shared-sandbox');
  await page.reload();assert.equal(await page.getAttribute('#music','aria-pressed'),'true');assert.equal(await page.getAttribute('#sound','aria-pressed'),'true');
  console.log('PASS shared controls across 7 scenes and independent toggles',width,height);await page.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await fs.writeFile(path.join(out,'shared-controls.json'),JSON.stringify(report,null,2));await browser.close();}
