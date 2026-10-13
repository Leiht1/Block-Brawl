import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(await fs.readFile(path.join(root,'spec/manifest.json'),'utf8'));
const mime={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const cache=new Map();
async function embed(file){if(!cache.has(file))cache.set(file,'data:'+mime[path.extname(file)]+';base64,'+(await fs.readFile(path.join(root,file))).toString('base64'));return cache.get(file);}
for(const m of data.maps){for(const key of ['background','frame','body'])m[key]=await embed(m[key]);m.battle=await embed('previews/'+m.id+'-battle.png');}
for(const c of data.cards){c.art=await embed(c.art);c.frame=await embed(c.frame);c.finished=await embed('previews/card-'+c.id+'.png');}
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
const css=await fs.readFile(path.join(root,'review.css'),'utf8');
let js=await fs.readFile(path.join(root,'review.js'),'utf8');
js=js.replaceAll('`previews/${id}-battle.png`','m.battle').replaceAll('previews/${m.id}-battle.png','${m.battle}').replaceAll('previews/card-${c.id}.png','${c.finished}');
html=html.replace('<link rel="stylesheet" href="review.css">','<style>'+css+'</style>').replace('<script src="review-data.js" defer></script>','').replace('<script src="review.js" defer></script>','');
html=html.replace('src="spec/approved-battle.png"','src="'+await embed('spec/approved-battle.png')+'"');
html=html.replace('</body>','<script>window.REVIEW='+JSON.stringify(data)+';</script><script>'+js+'</script></body>');
const offline=path.join(root,'离线美术预览.html');await fs.writeFile(offline,html);
const {chromium}=createRequire(import.meta.url)('C:/Users/HT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
try{
 for(const url of ['http://127.0.0.1:4187/',pathToFileURL(offline).href]){
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+':'+r.url());});
  await page.goto(url);await page.waitForSelector('.card-item');
  async function loaded(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).length),0);}
  await loaded();assert.equal(await page.locator('.card-item').count(),12);assert.equal(await page.locator('#art-grid figure').count(),6);
  for(const m of data.maps){await page.locator('[data-map='+m.id+']').click();await loaded();}
  await page.locator('[data-map=forest]').click();await loaded();
  await page.screenshot({path:path.join(root,'previews',url.startsWith('http')?'入口加载验证.png':'离线加载验证.png'),fullPage:true});
  assert.deepEqual(errors,[]);results.push({entry:url,images:await page.locator('img').count(),maps:5,cards:12,failedImages:0,errors});await page.close();
 }
 await fs.writeFile(path.join(root,'spec/preview-loading-qa.json'),JSON.stringify(results,null,2));
 console.log('HTTP root entry and self-contained offline preview: all images decode, all five maps switch, twelve cards render.');
}finally{await browser.close();}
