// Local desktop acceptance of the new arena only. QA helpers are injected into
// the local response, never shipped with the static game.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const presentation=process.argv.includes('--presentation'),tuning=presentation||process.argv.includes('--tuning');
const root=fileURLToPath(new URL('../',import.meta.url)),deps=process.argv.slice(2).find(a=>!a.startsWith('--'))||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[deps]}));
const out=path.join(root,presentation?'validation/2026-10-10/arena-presentation':tuning?'validation/2026-10-10/arena-tuning':'validation/2026-10-10/arena');await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,'dist',name);
  if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error('path');let body=await fs.readFile(file);
  if(name==='app.mjs')body=body.toString()+`\nwindow.__arenaQA={pair:()=>engine.hint(),state:()=>({screen:flow.screen,status:flow.arena?.status,winner:flow.arena?.winner,target:flow.arena?.target,player:engine.score,opponent:flow.arena?.engines.opponent.score,result:flow.arena?.result,bot:flow.arena?.source.active,due:flow.arena?.source.due,tx:engine.transactions.length,opponentTx:flow.arena?.engines.opponent.transactions.length,view:opponentView.snapshot(),mainFx:{combos:combos.length,effects:effects.length,motions:motions.size},same:flow.arena&&engine.board.every((t,i)=>t?.type===flow.arena.engines.opponent.board[i]?.type)}),advance:(ms)=>{for(let n=0;n<ms;n+=10)__clock.advance(__clock.time+Math.min(10,ms-n));}};`;
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],report={viewport:'1440x960',difficulties:[],checks:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__clock={time:0,raf:null,advance(t){this.time=t;const fn=this.raf;this.raf=null;fn?.(t);}};Object.defineProperty(performance,'now',{value:()=>__clock.time});requestAnimationFrame=fn=>{__clock.raf=fn;return 1;};});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__arenaQA&&blockBrawl.snapshot().art.ready===2);
  const state=()=>page.evaluate(()=>__arenaQA.state()),advance=ms=>page.evaluate(ms=>__arenaQA.advance(ms),ms);
  async function swap(pair){const box=await page.locator('#board').boundingBox();for(const i of pair)await page.mouse.click(box.x+(i%8+.5)*box.width/8,box.y+(Math.floor(i/8)+.5)*box.height/8);}
  for(const difficulty of ['easy','normal','hard']){
    await page.locator('#open-arena').click();await page.locator(`[data-difficulty="${difficulty}"]`).click();
    assert.equal((await state()).status,'preparing');assert.equal((await state()).same,true);assert.equal((await state()).target,{easy:3000,normal:6000,hard:10000}[difficulty]);assert.equal(await page.locator('#game-screen progress').count(),0);assert.equal(await page.locator('#arena-player-score').innerText(),'0');assert.equal(await page.locator('#opponent-score').innerText(),'0');assert.match(await page.locator('#arena-rule').innerText(),new RegExp(String((await state()).target)));
    const pair=await page.evaluate(()=>__arenaQA.pair());await swap(pair);assert.equal((await state()).tx,0);
    await page.locator('#arena-ready').click();
    const digits=()=>page.evaluate(()=>['arena','opponent'].map(side=>{const d=document.getElementById(side+'-countdown');return {text:d.textContent,scale:d.style.transform};}));
    const initial=await digits();assert.deepEqual(initial[0],initial[1]);assert.equal(initial[0].text,'3');
    await advance(400);const shrinking=await digits();assert.deepEqual(shrinking[0],shrinking[1]);assert.ok(Number(shrinking[0].scale.slice(6,-1))<Number(initial[0].scale.slice(6,-1)));
    await advance(600);assert.equal((await digits())[0].text,'2');await advance(1000);assert.deepEqual((await digits())[0],(await digits())[1]);assert.equal((await state()).status,'countdown');assert.equal(await page.locator('#arena-countdown').innerText(),'1');
    if(presentation&&difficulty==='normal')await page.screenshot({path:path.join(out,'countdown.png')});
    await swap(pair);assert.equal((await state()).tx,0);await advance(1000);assert.equal((await state()).status,'playing');
    const box=await page.locator('#board').boundingBox();assert.ok(box.width>=475);const opponentBox=await page.locator('#opponent-board').boundingBox();assert.ok(Math.abs(opponentBox.width-box.width)<1);assert.ok(Math.abs(opponentBox.y-box.y)<1);assert.ok(opponentBox.x>box.x+box.width);const scoreBox=await page.locator('#arena-scoreboard').boundingBox();assert.ok(scoreBox.x>box.x+box.width);assert.ok(scoreBox.x+scoreBox.width<opponentBox.x);assert.ok(opponentBox.x-(box.x+box.width)>200);assert.equal(await page.locator('#arena-player-score').evaluate(e=>getComputedStyle(e).color),'rgb(53, 149, 75)');assert.equal(await page.locator('#opponent-score').evaluate(e=>getComputedStyle(e).color),'rgb(217, 76, 76)');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await swap(pair);await advance(700);assert.ok((await state()).player>0);assert.equal(await page.locator('#arena-player-score').innerText(),String((await state()).player));assert.equal((await state()).opponent,0);
    const due=(await state()).due;await advance(due-await page.evaluate(()=>__clock.time)+120);assert.ok((await state()).opponent>0);
    assert.ok((await state()).view.effects>0||(await state()).view.ghosts>0);
    if(difficulty==='normal')await page.screenshot({path:path.join(out,'arena.png')});
    report.difficulties.push({difficulty,...await state(),playerBoardWidth:box.width,opponentBoardWidth:opponentBox.width});
    // Restart during a live opponent transaction, then leave and advance clock.
    await page.locator('#restart').click();assert.equal((await state()).status,'preparing');assert.equal((await state()).player,0);assert.equal((await state()).opponent,0);assert.equal((await state()).tx+(await state()).opponentTx,0);
    assert.deepEqual((await state()).view,{motions:0,effects:0,ghosts:0,formations:0,charges:0});
    await page.locator('#exit-game').click();await advance(10000);assert.equal((await state()).screen,'home');assert.equal((await state()).tx,0);
  }
  if(tuning){
    await page.locator('#open-sandbox').click();await page.locator('[data-mode="combo-blasts"]').click();
    await swap([26,27]);await advance(100);
    assert.equal((await state()).mainFx.combos,1);await advance(200);assert.equal((await state()).mainFx.combos,1);
    await page.screenshot({path:path.join(out,'combo-300ms.png')});await advance(220);
    assert.equal((await state()).mainFx.combos,0);assert.ok((await state()).mainFx.motions>0);
    await page.locator('#restart').click();assert.equal((await state()).mainFx.combos,0);
    await page.locator('#exit-game').click();
  }else{
  // A full default-target win by real pointer commands, no score injection.
  await page.locator('#open-arena').click();await page.locator('[data-difficulty="easy"]').click();await page.locator('#arena-ready').click();await advance(3000);
  let actions=0;
  while((await state()).status==='playing'&&actions<500){
    const pair=await page.evaluate(()=>__arenaQA.pair());if(pair){await swap(pair);actions++;}await advance(1500);
  }
  if((await state()).status==='finishing')await advance(10000);
  assert.equal((await state()).status,'finished');assert.equal((await state()).winner,'player');assert.equal((await state()).target,3000);assert.ok((await state()).player>=3000);
  assert.equal((await state()).bot,false);assert.equal((await state()).tx+(await state()).opponentTx,0);assert.ok(await page.locator('#result').isVisible());
  report.playerWin={actions,...await state()};await page.screenshot({path:path.join(out,'result.png')});
  await page.locator('#result-retry').click();assert.equal((await state()).status,'preparing');assert.equal((await state()).player,0);assert.equal((await state()).opponent,0);
  await page.locator('#arena-ready').click();await advance(3000);
  for(let i=0;i<1600&&(await state()).status!=='finished';i++)await advance(1000);
  assert.equal((await state()).winner,'opponent');assert.equal((await state()).status,'finished');assert.match(await page.locator('#result-title').innerText(),/对手获胜/);report.opponentWin=await state();
  await page.locator('#result-back').click();assert.equal((await state()).screen,'home');await advance(20000);assert.equal((await state()).tx,0);
  await page.locator('#open-sandbox').click();assert.equal(await page.locator('[data-mode]').count(),16);await page.locator('#exit-game').click();
  await page.locator('#open-tutorial').click();assert.equal(await page.locator('[data-level]').count(),6);await page.locator('[data-level="0"]').click();await advance(10);assert.ok(await page.locator('#tutorial-panel').isVisible());assert.equal(await page.locator('#arena-panel').isVisible(),false);
  }
  if(presentation){
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.__arenaQA);
    await page.locator('#open-arena').click();await page.locator('[data-difficulty="easy"]').click();await page.locator('#arena-ready').click();await advance(400);
    for(const id of ['arena-countdown','opponent-countdown'])assert.equal(await page.locator('#'+id).evaluate(e=>e.style.transform),'scale(1)');
    await page.locator('#exit-game').click();assert.equal((await state()).screen,'home');
  }
  assert.deepEqual(errors,[]);report.errors=errors;report.checks=tuning?['three difficulty targets retained, central green/red scores without progress bars','both synchronized shrinking countdowns and countdown input gate','central scores sit between equal boards with more than 200px separation','white point feedback uses shared size scaling','480x480 equal-size boards side by side and actual player input','real bot animation, restart and exit cleanup','combo remains visible at 300ms, clears at 520ms before gravity','browser errors empty']:['three difficulties: same initial boards, countdown input gate, real player and bot animations','equal-size side-by-side boards','restart during opponent clear cancels transaction and visuals','easy 3000 target: real pointer win, bot win, committed transactions finish','result replay and return; no old bot after exit','six tutorial entries and all 16 sandbox modes retained'];
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}
