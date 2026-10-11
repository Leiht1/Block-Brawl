import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'validation/2026-10-11/audio-balance');
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={layouts:[],errors:[]};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1280,720],[1024,600],[390,844],[390,667],[375,568]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4175/dist/index.html');await page.waitForTimeout(180);
  const geometry=await page.evaluate(()=>{
   const root=document.documentElement,home=document.querySelector('#home-screen'),bar=document.querySelector('.audio-controls');
   const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
   const controls=rect(bar),items=[...home.querySelectorAll('h1,.sandbox-sign,.home-actions button,.save-note')].map(rect);
   return {scrollHeight:Math.max(root.scrollHeight,document.body.scrollHeight),scrollWidth:Math.max(root.scrollWidth,document.body.scrollWidth),height:innerHeight,width:innerWidth,controls,items};
  });
  report.layouts.push({width,height,...geometry});assert.ok(geometry.scrollHeight<=height+1,`${width}x${height}: vertical scroll ${geometry.scrollHeight}`);assert.ok(geometry.scrollWidth<=width,`${width}: horizontal scroll`);
  assert.ok(geometry.items.every(r=>r.top>=0&&r.bottom<=height),`${width}: all menu entries visible`);assert.ok(geometry.controls.top>=0&&geometry.controls.right<=width);
  assert.ok(geometry.items.every(r=>r.right<=geometry.controls.left||r.left>=geometry.controls.right||r.bottom<=geometry.controls.top||r.top>=geometry.controls.bottom),'audio controls do not cover menu');
  await page.screenshot({path:path.join(out,`home-${width}x${height}.png`)});console.log('PASS one-page home',width,height);
 }
 assert.deepEqual(report.errors,[]);
}finally{await fs.writeFile(path.join(out,'home-layout.json'),JSON.stringify(report,null,2));await browser.close();}
