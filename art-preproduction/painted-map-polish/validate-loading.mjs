import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const dir=new URL('./',import.meta.url),root=new URL('../../',dir);
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const browser=await chromium.launch({headless:true,channel:'msedge'}),report={review:{},offline:{},errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1450,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(new URL('背景棋盘精修预览.html',dir).href);
 const images=await page.evaluate(async()=>Promise.all([...document.images].map(async im=>{
  await im.decode();const c=document.createElement('canvas');c.width=160;c.height=100;c.getContext('2d').drawImage(im,0,0,160,100);
  const pixels=c.getContext('2d').getImageData(0,0,160,100).data;let visible=0;
  for(let i=3;i<pixels.length;i+=4)if(pixels[i]>20)visible++;
  return{alt:im.alt,width:im.naturalWidth,height:im.naturalHeight,visiblePixels:visible};
 })));
 assert.equal(images.length,26);assert.ok(images.every(i=>i.visiblePixels>100),'Blank art preview image');
 for(const section of await page.locator('section').all()){
  for(const mode of ['before','after']){
   await section.locator('[data-mode="'+mode+'"]').click();
   assert.ok(await section.locator('.comparison img').evaluate(async(im,mode)=>{await im.decode();return im.src===im.dataset[mode];},mode));
  }
 }
 await page.screenshot({path:fileURLToPath(new URL('review-page-checked.png',dir)),fullPage:false});
 report.review={images,switches:10,offlineEmbedded:true};
 await page.close();
 const game=await browser.newPage();game.on('pageerror',e=>report.errors.push(e.message));
 await game.goto(new URL('方块乱斗-最新版.html',root).href);
 await game.waitForFunction(()=>window.blockBrawl?.snapshot().art.ready===2);
 const names=JSON.parse(await fs.readFile(new URL('static-art-qa.json',dir),'utf8')).changedFiles;
 const embedded=await game.evaluate(async names=>{
  const result=[];for(const src of names){const im=new Image();im.src=__blockAsset(src);await im.decode();result.push({src,width:im.naturalWidth,height:im.naturalHeight,base64:__blockFiles[src].base64});}return result;
 },names);
 for(const a of embedded)assert.equal(a.base64,(await fs.readFile(new URL('dist/'+a.src.replace(/^\.\//,''),root))).toString('base64'),a.src+': stale offline artwork');
 report.offline={loaded:true,artReady:2,assets:embedded.map(({src,width,height})=>({src,width,height})),all15MatchDist:true};
 assert.deepEqual(report.errors,[]);
 await game.close();
}finally{await browser.close();await fs.writeFile(new URL('loading-qa.json',dir),JSON.stringify(report,null,2));}
console.log(JSON.stringify({reviewImages:report.review.images.length,reviewSwitches:10,offlineAssets:report.offline.assets.length,errors:report.errors}));
