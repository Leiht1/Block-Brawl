import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {MAPS} from '../../dist/maps.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const out=path.join(root,'art-preproduction/painted-map-polish');
const before=process.argv.includes('--baseline');
const names=['toy-board.svg',...['cliff-canyon','crystal-landscape','ruins-temple','furnace-hall','cliff-stage-left','cliff-stage-right','crystal-stage','ruins-stage','furnace-stage','cliff-board','crystal-board','ruins-board','furnace-board'].map(n=>'maps/'+n+'.svg')];
const require=createRequire(import.meta.url);
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const sharp=require(require.resolve('sharp',{paths:[deps]}));
await fs.mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
async function protectedFiles(dir=path.join(root,'dist')){
 const result={};
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())Object.assign(result,await protectedFiles(p));
  else if(!names.includes(path.relative(path.join(root,'dist/assets'),p).replaceAll('\\','/')))result[path.relative(root,p)]=hash(await fs.readFile(p));
 }
 return result;
}
if(before){
 for(const name of names){const target=path.join(out,'original',name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,'dist/assets',name),target);}
 await fs.writeFile(path.join(out,'protected.json'),JSON.stringify(await protectedFiles(),null,2));
}else if(!process.argv.includes('--painted')){
 assert.deepEqual(await protectedFiles(),JSON.parse(await fs.readFile(path.join(out,'protected.json'),'utf8')),'Unrelated production file changed');
}
const report={mode:before?'before':'after',errors:[],maps:[],geometry:[]};
// Artwork edits may alter paint, but every original shape and terrain mask stays fixed.
const structure=s=>s.replace(/<!-- native-[\s\S]*?<!-- end-native-[^>]*-->/g,'').match(/<(?:path|rect|circle|ellipse|use|svg|mask)\b[^>]*>/g)?.map(tag=>[tag.match(/^<\w+/)?.[0],...['d','x','y','cx','cy','r','rx','ry','width','height','viewBox','transform','href'].map(a=>tag.match(new RegExp('\\b'+a+'="([^"]*)"'))?.[1]||'')]);
if(!before&&!process.argv.includes('--painted'))for(const name of names){
 const a=await fs.readFile(path.join(out,'original',name),'utf8'),b=await fs.readFile(path.join(root,'dist/assets',name),'utf8');
 assert.deepEqual(structure(b),structure(a),name+': original shape changed');
 assert.deepEqual(b.match(/<mask\b[\s\S]*?<\/mask>/g),a.match(/<mask\b[\s\S]*?<\/mask>/g),name+': mask changed');
 report.geometry.push({asset:name,shapeUnchanged:true,maskUnchanged:true});
}
const injection=`
window.__mapArtQA={
 async enter(id){const {MAPS}=await import('./maps.mjs');flow.arena?.dispose();flow.enterArena(MAPS.find(m=>m.id===id),__clock.time);flow.selection.update(__clock.time+60000);flow.update(__clock.time);},
 advance(ms){for(let n=0;n<ms;n+=20)__clock.advance(__clock.time+Math.min(20,ms-n));}
};`;
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1))||'index.html';
  let p=path.resolve(root,'dist',name);assert.ok(p.startsWith(path.join(root,'dist')+path.sep));
  if(before&&name.startsWith('assets/')&&names.includes(name.slice(7)))p=path.join(out,'original',name.slice(7));
  let body=await fs.readFile(p);if(name==='app.mjs')body=body.toString()+injection;
  res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 for(const map of MAPS){
  const page=await browser.newPage({viewport:{width:1672,height:941}});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{let seed=1729;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=f=>{__clock.raf=f;return 1;};});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.__mapArtQA&&blockBrawl.snapshot().art.ready===2);
  await page.evaluate(id=>__mapArtQA.enter(id),map.id);
  await page.evaluate(()=>__mapArtQA.advance(3200));
  await page.evaluate(async()=>{await document.fonts.ready;const {MAPS}=await import('./maps.mjs');const m=MAPS.find(m=>m.id===document.documentElement.dataset.map);await Promise.all(Object.values(m.assets).filter(Boolean).map(async src=>{const i=new Image();i.src=src;await i.decode();}));});
  await page.evaluate(()=>__mapArtQA.advance(40));
  const ui=await page.evaluate(()=>Object.fromEntries(['#board','#opponent-board','#arena-scoreboard','.menu .tools','.card-dock'].map(s=>{const n=document.querySelector(s);if(!n)return[s,null];const b=n.getBoundingClientRect();return[s,[b.x,b.y,b.width,b.height]];})));
  if(!before){const old=JSON.parse(await fs.readFile(path.join(root,'art-preproduction/native-map-polish',`${map.id}-geometry.json`),'utf8'));assert.deepEqual(ui,old,map.id+': UI moved');}
  else await fs.writeFile(path.join(out,`${map.id}-geometry.json`),JSON.stringify(ui));
  await page.screenshot({path:path.join(out,`${map.id}-${before?'before':'after'}.png`)});
  if(!before){
   const box=await page.locator('#board').boundingBox();
   await page.screenshot({path:path.join(out,`${map.id}-board.png`),clip:{x:Math.max(0,box.x-55),y:Math.max(0,box.y-30),width:box.width+110,height:box.height+100}});
   for(const [kind,src] of Object.entries({background:map.assets.backdrop,frame:map.assets.frame,body:map.assets.board})){
    await sharp(await fs.readFile(path.join(root,'dist',src))).resize({width:kind==='background'?1000:600}).png().toFile(path.join(out,`${map.id}-${kind}.png`));
   }
  }
  report.maps.push({id:map.id,cells:map.terrain.cells.filter(s=>s==='cell').length,obstacles:map.terrain.cells.filter(s=>s==='obstacle').length,ui});
  await page.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));await fs.writeFile(path.join(out,`${before?'before':'after'}-qa.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({mode:report.mode,maps:report.maps.length,unchangedGeometry:report.geometry.length,errors:report.errors}));
