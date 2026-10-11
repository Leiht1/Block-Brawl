// Desktop-only visual evidence from the real app, using a controlled frame clock.
// Run: node scripts/validate-special-visuals.mjs [--static-only|--tile-material] [dependency-node_modules]
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const embossed=process.argv.includes('--embossed'),material=embossed||process.argv.includes('--tile-material'),staticOnly=material||process.argv.includes('--static-only');
const deps=process.argv.slice(2).find(arg=>!arg.startsWith('--'))||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
const sharp=require(require.resolve('sharp',{paths:[deps]}));
const out=path.join(root,'validation/2026-10-10',embossed?'embossed-toy-material':material?'solid-toy-material':staticOnly?'special-light-restyle':'special-upgrade');await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
    const file=path.resolve(root,'dist',name);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');
    let body=await fs.readFile(file);
    // Test helpers exist only in this local server response, never in deployed code.
    if(name==='app.mjs')body=body.toString()+`\nwindow.__qa={resetClock(){engine.now=0;window.__clock.time=0;},clearHint(){hint=null;selected=null;},clearEnd(){return engine.transactions.find(t=>t.phase==='clear').end;},swap(){engine.swap(...engine.practiceMove);},state(){return {snapshot:window.blockBrawl.snapshot(),particles:particles.length,rings:rings.length,floats:floats.length,effects:effects.map(e=>({cells:e.cells,start:e.start,duration:e.duration})),combos:combos.map(e=>({cells:e.cells,type:e.type})),formations:formations.map(e=>({index:e.index,special:e.tile.special}))};}};`;
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,channel:process.env.VISUAL_BROWSER||'msedge'});
const errors=[],report={viewport:'1440x960 desktop',clock:'controlled actual app frames; not a recording',captures:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    let seed=9;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    window.__clock={time:0,raf:null,advance(t){this.time=t;const f=this.raf;this.raf=null;f?.(t);}};
    Object.defineProperty(performance,'now',{value:()=>window.__clock.time});
    window.requestAnimationFrame=fn=>{window.__clock.raf=fn;return 1;};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.__qa&&window.blockBrawl.snapshot().art.ready===2);
  async function reset(mode){await page.evaluate(()=>__qa.resetClock());await page.locator(`[data-mode="${mode}"]`).click();await page.evaluate(()=>__clock.advance(0));}
  async function capture(name,mode,time){
    await page.evaluate(t=>__clock.advance(t),time);
    const pixels=await page.locator('#board').evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]);
    await fs.writeFile(path.join(out,name+'.png'),Buffer.from(pixels,'base64'));
    const state=await page.evaluate(()=>__qa.state());report.captures.push({file:name+'.png',mode,time,...state});
  }
  await reset('special-chain');await page.evaluate(()=>__qa.clearHint());await capture('specials-static','special-chain',0);
  await page.screenshot({path:path.join(out,'desktop-static.png')});
  const staticLayers=[],specials=report.captures[0].snapshot.specials;
  const staticLabels=['清行 · 渐变横光','清列 · 渐变纵光','爆破 · 发光五角星'];
  for(const [n,kind] of ['row','column','blast'].entries()){
    const index=specials.find(t=>t.special===kind).index;
    const crop=await sharp(path.join(out,'specials-static.png')).extract({left:index%8*60,top:Math.floor(index/8)*60,width:60,height:60}).resize(240,240).png().toBuffer();
    staticLayers.push({input:crop,left:n*264+12,top:40});
    staticLayers.push({input:Buffer.from(`<svg width="264" height="36"><text x="132" y="26" text-anchor="middle" font-family="Microsoft YaHei" font-size="17" fill="#fff4d8">${staticLabels[n]}</text></svg>`),left:n*264,top:0});
  }
  await sharp({create:{width:792,height:292,channels:4,background:'#183246'}}).composite(staticLayers).png().toFile(path.join(out,'static-detail.png'));
  if(material){
    const normalLayers=[],names=['青柠绿','葡萄紫','橘子橙','汽水蓝','莓果粉'];
    for(let n=0;n<5;n++){
      const crop=await sharp(path.join(out,'specials-static.png')).extract({left:n*60,top:0,width:60,height:60}).resize(180,180).png().toBuffer();
      normalLayers.push({input:crop,left:n*192+6,top:36});
      normalLayers.push({input:Buffer.from(`<svg width="192" height="36"><text x="96" y="26" text-anchor="middle" font-family="Microsoft YaHei" font-size="17" fill="#fff4d8">${names[n]}</text></svg>`),left:n*192,top:0});
    }
    await sharp({create:{width:960,height:228,channels:4,background:'#183246'}}).composite(normalLayers).png().toFile(path.join(out,'normal-detail.png'));
  }
  if(!staticOnly){
  // Actual engine swaps on the existing fixtures, sampled within the configured animation windows.
  for(const mode of ['four','five','row','column','blast','edge','combo-lines','combo-cross','combo-column','combo-blasts','special-chain']){
    await reset(mode);await page.evaluate(()=>__qa.swap());
    if(mode==='combo-blasts')await capture('combo-blasts-charge',mode,75);
    await page.evaluate(()=>__clock.advance(100));
    await capture(mode+'-active',mode,mode==='four'||mode==='five'?158:185);
    await capture(mode+'-late',mode,225);
    const clearEnd=await page.evaluate(()=>__qa.clearEnd());
    await page.evaluate(t=>__clock.advance(t),clearEnd);
    const deadline=await page.evaluate(()=>__qa.state());
    if(deadline.effects.length||deadline.combos.length||deadline.formations.length)throw Error(mode+' range effects survived clear deadline');
    for(let t=clearEnd+50;t<=4000;t+=50)await page.evaluate(t=>__clock.advance(t),t);
    const end=await page.evaluate(()=>__qa.state());
    if(end.snapshot.animations||end.particles||end.rings||end.floats)throw Error(mode+' residual effects');
  }
  const labels=['Row beam','Column beam','13-cell blast','Cross beams','Three-row pulses','5x5 blast'];
  const names=['row-active','column-active','blast-active','combo-lines-active','combo-cross-active','combo-blasts-active'];
  const layers=[];
  for(let i=0;i<names.length;i++){
    const x=i%3*480,y=Math.floor(i/3)*512;
    layers.push({input:await fs.readFile(path.join(out,names[i]+'.png')),left:x,top:y+32});
    layers.push({input:Buffer.from(`<svg width="480" height="32"><text x="16" y="23" font-family="Arial" font-size="18" fill="#fff4d8">${labels[i]}</text></svg>`),left:x,top:y});
  }
  await sharp({create:{width:1440,height:1024,channels:4,background:'#183246'}}).composite(layers).png().toFile(path.join(out,'trigger-comparison.png'));
  }
  report.errors=errors;if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(`Desktop special visuals verified; ${report.captures.length} captures. ${out}`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
