import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[deps]}));
const out=path.join(root,'validation/2026-10-10/terrain-shapes');await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);
  if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
  if(name==='app.mjs')body=body.toString()+`\nimport {findMatches as qaMatches,legalMoves as qaMoves} from './engine.mjs';
  window.__terrainQA={
    state:()=>({width:engine.width,height:engine.height,score:engine.score,terrain:engine.terrain.cells,board:engine.board.map(t=>t?{id:t.id,type:t.type}:null),pair:engine.hint(),tx:engine.transactions.length,stable:engine.stableChecked,matches:qaMatches(engine.board,engine.terrain).length,alphas:engine.terrain.cells.map((_,i)=>ctx.getImageData(Math.floor((i%engine.width+.5)*cell*pixelRatio),Math.floor((Math.floor(i/engine.width)+.5)*cell*pixelRatio),1,1).data[3])}),
    advance:ms=>{for(let n=0;n<ms;n+=10)__clock.advance(__clock.time+Math.min(10,ms-n));},
    arenaShape:name=>{flow.arena.terrain=TEST_TERRAINS[name];flow.arena.start(__clock.time,17);flow.arena.ready('opponent',__clock.time);resize();},
    same:()=>engine.terrain.cells.every((s,i)=>s===flow.arena.engines.opponent.terrain.cells[i])
  };`;
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch(e){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],report={checks:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__terrainQA&&blockBrawl.snapshot().art.ready===2);
  const state=()=>page.evaluate(()=>__terrainQA.state()),advance=ms=>page.evaluate(ms=>__terrainQA.advance(ms),ms);
  const scenery=()=>page.screenshot({clip:{x:0,y:0,width:80,height:600}});
  const initialScenery=await scenery(),background=[];
  const measureBackground=label=>page.evaluate(label=>{const s=getComputedStyle(document.body,':before');return {label,width:s.width,height:s.height,position:s.position,background:s.background,bodyHeight:document.body.getBoundingClientRect().height,scrollY};},label);
  background.push(await measureBackground('home'));
  await page.locator('#open-tutorial').click();assert.deepEqual(await scenery(),initialScenery);background.push(await measureBackground('levels'));
  await page.locator('[data-level="0"]').click();await advance(10);assert.deepEqual(await scenery(),initialScenery);background.push(await measureBackground('tutorial'));
  await page.locator('#exit-game').click();await page.locator('#level-back').click();await page.locator('#open-arena').click();assert.deepEqual(await scenery(),initialScenery);background.push(await measureBackground('difficulty'));
  await page.locator('#difficulty-back').click();await page.locator('#open-sandbox').click();await advance(10);assert.deepEqual(await scenery(),initialScenery);background.push(await measureBackground('sandbox'));
  assert.ok(new Set(background.map(b=>b.bodyHeight)).size>1);assert.ok(background.every(b=>b.width===background[0].width&&b.height===background[0].height&&b.position==='fixed'&&b.scrollY===0));report.background=background;
  const selectors=['.menu','.menu .tools','.player-play .stats','.player-play .arena-heading','.opponent-play .arena-heading','#arena-scoreboard','#board-wrap','#board','#opponent-board','.player-play .board-caption','#practice-panel'];
  const geometry=()=>page.evaluate(selectors=>Object.fromEntries(selectors.map(s=>[s,document.querySelector(s).getBoundingClientRect().toJSON()])),selectors);
  async function swap(pair){const box=await page.locator('#board').boundingBox(),s=await state();for(const i of pair)await page.mouse.click(box.x+(i%s.width+.5)*box.width/s.width,box.y+(Math.floor(i/s.width)+.5)*box.height/s.height);}
  const sandboxBox=await geometry();
  for(const name of ['standard','cliff','crystal','ruins']){
    await page.locator(`[data-terrain="${name}"]`).click();await advance(10);const s=await state();assert.equal(s.width,8);assert.equal(s.height,8);assert.deepEqual(await geometry(),sandboxBox);assert.ok(s.stable&&s.pair);assert.equal(s.matches,0);
    s.terrain.forEach((t,i)=>{assert.equal(!!s.board[i],t==='cell');assert.equal(s.alphas[i]>0,t!=='hole');});
    await page.screenshot({path:path.join(out,`${name}.png`)});
    const gap=s.terrain.indexOf('hole');if(gap>=0){const box=await page.locator('#board').boundingBox();await page.mouse.click(box.x+(gap%8+.5)*box.width/8,box.y+(Math.floor(gap/8)+.5)*box.height/8);assert.equal((await state()).tx,0);}
    await swap(s.pair);await advance(110);assert.ok((await state()).score>0);await advance(4000);assert.equal((await state()).tx,0);assert.ok((await state()).stable);report.checks.push({name,width:8,height:8,score:(await state()).score,holes:s.terrain.filter(t=>t==='hole').length,obstacles:s.terrain.filter(t=>t==='obstacle').length});
  }
  report.checks.push('sandbox geometry and transparent hole pixels match every preset');
  await page.locator('#exit-game').click();await page.locator('#open-arena').click();await page.locator('[data-difficulty="easy"]').click();await advance(10);
  const arenaBox=await geometry();assert.equal(arenaBox['#board'].width,arenaBox['#opponent-board'].width);assert.equal(arenaBox['#board'].height,arenaBox['#opponent-board'].height);
  for(const name of ['standard','cliff','crystal','ruins']){await page.evaluate(name=>__terrainQA.arenaShape(name),name);await advance(10);assert.deepEqual(await geometry(),arenaBox);assert.ok(await page.evaluate(()=>__terrainQA.same()));await page.screenshot({path:path.join(out,`arena-${name}.png`)});}
  report.checks.push('all arena titles, toolbar, central scores and equal board boxes remain stationary');
  await page.locator('#arena-ready').click();await advance(7500);
  // The injected snapshot only reads real arena state; verify actual bot score.
  const opponentScore=Number(await page.locator('#opponent-score').innerText());assert.ok(opponentScore>0);report.checks.push({realBotOnRuinsScore:opponentScore});
  assert.deepEqual(errors,[]);report.errors=errors;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
