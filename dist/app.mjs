import {TEST_TERRAINS,STANDARD_TERRAIN} from './terrain.mjs';
import {createBoardPainter} from './board-painter.mjs';
import {createOpponentView} from './opponent-view.mjs';
import {MatchEngine} from './engine.mjs';
import {THEME,applyTheme,applyMapTheme} from './theme.mjs';
import {createArtAssets} from './art.mjs';
import {createGameFlow} from './flow.mjs';
import {MapEventPresentation,mapMotion} from './map-presentation.mjs';
import {createMapScene} from './map-scene.mjs';
import {audio} from './audio-manager.mjs';
import {createAudioEvents} from './audio-events.mjs';
const audioEvents=createAudioEvents(audio);
const $=id=>document.getElementById(id), canvas=$('board'), ctx=canvas.getContext('2d');
applyTheme(document);
const art=createArtAssets(),colors=THEME.palette.map(p=>p.color),shadows=THEME.palette.map(p=>p.dark);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mapPresentation=new MapEventPresentation(),mapScene=createMapScene($('map-world'),reduced,$('map-veil'));
let height=480;
let width=480,cell=60,pixelRatio=1,drag=null,selected=null,keyboard=0,hint=null,hintUntil=0,toastUntil=0,shake=0,mode='free';
let motions=new Map(),ghosts=[],particles=[],rings=[],floats=[],formations=[],effects=[],charges=[],combos=[];
let visualNow=0;
let rockVisual=null,rockRestores=[];
function changeMap(map){applyMapTheme(document,map);art.setMap(map);opponentView?.setMap(map);rockVisual=null;rockRestores=[];mapPresentation.reset();mapScene.reset();document.documentElement.removeAttribute('data-event-stage');}
let flow=null;
const beamEnvelope=t=>reduced?1:ease(Math.max(0,Math.min(1,(t-.16)/.48)));
// Schedule presentation fragments only. Engine clear/fall deadlines never move.
function scheduleImpact(e,delay=0){
  const origin=xy(e.index),blast=e.type==='blast-blast'||e.tile?.special==='blast';
  const visualEvent=delay?{...e,duration:e.duration-delay}:e;
  for(const p of particles){
    if(p.clearTime!==e.time||!e.cells.includes(p.index))continue;
    const start=e.time+delay+impactDelay(visualEvent,p.index);
    if(p.impact&&p.start<=start)continue;
    p.start=start;p.impact=true;
    if(blast){const a=Math.atan2(p.y-origin.y,p.x-origin.x)+Math.sin(p.angle)*.4,speed=cell*(e.type==='blast-blast'?4.5:3);p.vx=Math.cos(a)*speed;p.vy=Math.sin(a)*speed;p.size*=p.blast?1:1.2;p.blast=true;}
  }
  for(const g of ghosts)if(g.start===e.time&&e.cells.includes(g.index)){const at=e.time+delay+impactDelay(visualEvent,g.index);g.impactAt=Math.min(g.impactAt??Infinity,at);}
}
const xy=index=>({x:(((index%engine.width)+engine.width)%engine.width+.5)*cell,y:(Math.floor(index/engine.width)+.5)*cell});
const ease=t=>1-Math.pow(1-t,3);
function message(text){$('message').textContent=text;}
function toast(text,time=700){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=performance.now()+time;}
function onEvent(e){
  audioEvents.engine(e);
  flow?.event(e);
  mapPresentation.event(e);
  if(['rock-warning','rock-fall','map-warning','map-fall','map-spread-warning'].includes(e.kind)){
    if(['rockfall','mechanism'].includes(e.type)&&e.cells&&e.index!==e.cells[0])return;
    const phase=e.kind==='map-spread-warning'?'spread-warning':e.kind.endsWith('warning')?'warning':'fall';
    rockVisual=(rockVisual||[]).filter(v=>v.index!==e.index);rockVisual.push({phase,index:e.index,cells:e.cells,type:e.type||'rockfall',art:e.art,tiles:e.tiles,start:e.time,duration:e.duration});
  }
  if(['rock-blocked','rock-cancel','map-blocked','map-cancel','map-spread-cancel'].includes(e.kind))rockVisual=(rockVisual||[]).filter(v=>v.index!==e.index);
  if(['rock-restored','map-restored'].includes(e.kind)&&(!e.cells||e.index===e.cells[0]))rockRestores.push({phase:'restore',index:e.index,cells:e.cells,reason:e.reason,type:e.type||'rockfall',art:e.art,tiles:e.tiles,start:e.time,duration:e.duration});
  if(['rock-blocked','map-blocked'].includes(e.kind)&&e.type==='rockfall'&&(!e.cells||e.index===e.cells[0]))rockRestores.push({phase:'impact',index:e.index,cells:e.cells,type:e.type||'rockfall',art:e.art,start:e.time,duration:650});
  if(e.kind==='reset'){rockVisual=null;rockRestores=[];motions.clear();ghosts=[];particles=[];rings=[];floats=[];formations=[];effects=[];charges=[];combos=[];shake=0;drag=null;selected=null;hint=null;$('score').textContent='0';$('chain').textContent='—';$('toast').classList.remove('show');$('toast').textContent='';return;}
  if(['swap','revert','fall'].includes(e.kind)||e.kind==='card-change'&&e.moves)for(const m of e.moves){
    let from=xy(m.from);const to=xy(m.to);
    if(e.kind==='swap'&&drag?.index===m.from){from.x+=drag.dx;from.y+=drag.dy;}
    const delay=e.kind==='fall'&&!reduced&&m.refill?Math.min(e.duration-1,Math.max(0,m.segmentTop-Math.floor(m.from/engine.width)-1)*6):0;
    motions.set(m.tile.id,{from,to,control:m.control===undefined?null:xy(m.control),start:e.time+delay,duration:e.duration-delay,fall:e.kind==='fall',segmentTop:m.segmentTop});
  }
  if(e.kind==='swap'&&e.combo)charges.push({...e.combo,sources:e.moves.map(m=>m.from),start:e.time,duration:e.duration});
  if(e.kind==='combo-trigger'){
    scheduleImpact(e);
    charges=charges.filter(c=>!c.participants.some(p=>e.participants.some(q=>q.tile.id===p.tile.id)));
    combos.push({...e,start:e.time});
    toast(e.type==='line-line'?'组合 · 十字光束！':e.type==='line-blast'?(e.lineAxis==='row'?'组合 · 三行光束！':'组合 · 三列光束！'):'组合 · 巨型爆破！');
    shake=reduced?0:e.type==='line-line'?3:e.type==='line-blast'?5:7;
  }
  if(e.kind==='special-create')formations.push({...e,start:e.time});
  if(e.kind==='special-trigger'){
    const delay=reduced?0:Math.min(e.order*12,36);
    scheduleImpact(e,delay);
    motions.delete(e.tile.id);effects.push({...e,start:e.time+delay,duration:e.duration-delay});
    toast(e.tile.special==='blast'?'十三格爆破！':e.tile.special==='row'?'整行清除！':'整列清除！');
    shake=reduced?0:5;
  }
  if(e.kind==='revert'){charges=charges.filter(c=>!c.participants.some(p=>e.moves.some(m=>m.tile.id===p.tile.id)));message(e.conflict?'交叉区域正在落下，换个空闲位置':'差一点！要凑出至少三个同色');}
  if(e.kind==='clear'){
    const now=e.time;
    e.tiles.forEach(({index,tile})=>{
      motions.delete(tile.id);const p=xy(index);if(!e.comboType)ghosts.push({...p,index,tile,start:now,duration:e.duration});
      const count=reduced?3:e.comboType?(e.comboType==='line-line'?6:e.comboType==='line-blast'?10:16):e.strength>=5?24:e.strength===4?16:9;
      for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=cell*(1.8+Math.random()*3.4);particles.push({...p,index,clearTime:now,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:cell*(.035+Math.random()*.055),color:i%4===0?THEME.palette[tile.type].light:colors[tile.type],shape:i%3,angle,spin:(Math.random()-.5)*12,start:now,life:350+Math.random()*240});}
      if(e.strength>=4&&!e.comboType)rings.push({...p,start:now,life:370,color:colors[tile.type],strength:e.strength});
    });
    particles=particles.slice(-THEME.effects.particleLimit);rings=rings.slice(-THEME.effects.ringLimit);
    const center=e.tiles.reduce((p,t)=>{const v=xy(t.index);return{x:p.x+v.x/e.tiles.length,y:p.y+v.y/e.tiles.length};},{x:0,y:0});
    if(e.points>0)floats.push({...center,text:`+${e.points}`,points:e.points,start:now,life:750});
    if(e.depth>1)toast(`${e.depth} 连击！`);else if(e.strength>=5)toast('五连 · 爆发！');else if(e.strength===4)toast('四连 · 漂亮！');
    shake=reduced?0:e.strength>=5?7:e.strength===4?3:0;
    message(e.depth>1?`连击 ×${e.depth} · 继续找下一步`:'消除中，其他空闲列仍可交换');
  }
  if(e.kind==='score'){$('score').textContent=e.score;$('chain').textContent=`×${Math.max(engine?.bestChain||1,e.depth)}`;}
  if(e.kind==='settled')message('拖动交换 · 点击相邻两格也可以');
  if(e.kind==='reshuffle'){motions.clear();hint=null;selected=null;drag=null;toast(e.preservedInventory?'没有可消除交换，已自动重排':'没有可消除交换，已重新配色');}
}
const engine=new MatchEngine({onEvent});
const opponentView=createOpponentView($('opponent-board'),reduced);
flow=createGameFlow({engine,opponentView,onOpponentEvent:e=>audioEvents.engine(e,'opponent'),onCardEvent:e=>audioEvents.card(e),onMapChange:changeMap,reducedMotion:reduced,showHint:()=>showHint(),message,resize:()=>resize(),onSandbox:()=>{mode='free';}});
// Read-only diagnostic snapshot for local QA; gameplay commands remain in the engine.
window.blockBrawl={snapshot:()=>({score:engine.score,bestChain:engine.bestChain,busyColumns:engine.locks.map((v,c)=>v===null?null:c).filter(v=>v!==null),transactions:engine.transactions.length,mode:engine.mode,specials:engine.board.flatMap((t,index)=>t?.special?[{index,type:t.type,special:t.special}]:[]),animations:motions.size+ghosts.length+formations.length+effects.length+charges.length+combos.length,art:art.snapshot(),theme:THEME.id})};
function resize(){width=canvas.getBoundingClientRect().width||480;cell=width/engine.width;pixelRatio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*pixelRatio);height=cell*engine.height;canvas.height=Math.round(height*pixelRatio);if(canvas.style)canvas.style.height=height+'px';canvas.setAttribute('aria-label',`${engine.width}乘${engine.height}三消棋盘，可拖动交换`);ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);art.invalidate();motions.clear();drag=null;}
new ResizeObserver(resize).observe(canvas);
const painter=createBoardPainter({ctx,art,reduced});
let {impactDelay,tile,drawIdleCore,outline,drawBeam,clipCells,drawCombo,drawSpecial,drawBurst,drawFormation,drawCharge}=painter;
let last=0,frameCount=0,fpsSince=performance.now();
function frame(now){
  visualNow=now;
  if(engine.terrain.cells[keyboard]!=='cell')keyboard=engine.terrain.cells.indexOf('cell');
  if(cell!==width/engine.width||height!==width/engine.width*engine.height)resize();
  painter.configure({width,cell,pixelRatio,visualNow,formations,terrain:engine.terrain,map:flow?.arena?.map});
  if(flow&&!flow.visibleGame){flow.update(now);audioEvents.observeFlow(flow,now);mapScene.draw(flow.arena?.map,null,now,false);requestAnimationFrame(frame);return;}
  if(!flow?.arena)engine.tick(now);flow?.update(now);
  audioEvents.observeFlow(flow,now);
  if(flow?.arena){opponentView.draw(flow.arena.engines.opponent,now);if(!flow.canInteract){drag=null;selected=null;hint=null;}}
  const worldCue=mapPresentation.at(now),worldMotion=mapMotion(worldCue,now,reduced);
  if(flow?.arena){const root=document.documentElement;root.setAttribute('data-event-stage',worldCue?.stage||'idle');root.style.setProperty('--world-shift',worldMotion.camera+'px');root.style.setProperty('--platform-shift',worldMotion.board+'px');root.style.setProperty('--environment-strength',worldCue?(worldCue.phase==='warning'?worldCue.progress:worldCue.type==='freeze'?Math.max(0,1-worldCue.progress):worldCue.stage==='Recovery'?1-worldCue.progress:1):0);}
  mapScene.draw(flow?.arena?.map,worldCue,now,!!flow?.arena,opponentView?.cue(now));
  painter.configure({width,cell,pixelRatio,visualNow,formations,terrain:engine.terrain,map:flow?.arena?.map});ctx.clearRect(0,0,width,height);ctx.save();
  if(shake>.2){ctx.translate(Math.sin(now*.08)*shake,Math.cos(now*.07)*shake*.5);shake*=.83;}
  ctx.translate(worldMotion.board,worldMotion.board*.35);
  canvas.classList.toggle('terrain-outline',engine.terrain.cells.includes('hole'));
  painter.drawTerrain(engine.terrain);
  painter.drawMapSurface(now,worldCue);
  painter.drawMechanism(worldCue);
  const moving=[];
  engine.board.forEach((t,i)=>{if(worldCue?.type==='mechanism'&&worldCue.phase==='fall'&&worldCue.cells.includes(i))return;if(!t)return;let p=xy(i),m=motions.get(t.id);if(m){const progress=Math.max(0,Math.min(1,(now-m.start)/m.duration));let f=ease(progress),squash=0,stretchX=0,stretchY=0;if(m.fall&&!reduced){f=Math.min(1,progress/.78)**2;if(progress>=.78)squash=Math.sin((progress-.78)/.22*Math.PI*2)*THEME.motion.landingSquash;}else if(!reduced){const stretch=Math.sin(progress*Math.PI)*THEME.motion.exchangeStretch,horizontal=m.from.x!==m.to.x;stretchX=horizontal?stretch:-stretch*.55;stretchY=horizontal?-stretch*.55:stretch;}p={x:m.from.x+(m.to.x-m.from.x)*f,y:m.from.y+(m.to.y-m.from.y)*f};if(m.control&&!reduced){const q=1-f;p={x:q*q*m.from.x+2*q*f*m.control.x+f*f*m.to.x,y:q*q*m.from.y+2*q*f*m.control.y+f*f*m.to.y};}if(progress>=1)motions.delete(t.id);else{moving.push({t,p,squash,stretchX,stretchY,segmentTop:m.segmentTop});return;}}
    if(drag?.index===i){moving.push({t,p:{x:p.x+drag.dx,y:p.y+drag.dy}});return;}tile(t,p.x,p.y);
  });
  for(const {t,p,squash,stretchX,stretchY,segmentTop} of moving){ctx.save();if(segmentTop!==undefined)painter.clipSegment(segmentTop);tile(t,p.x,p.y,1,1,squash,stretchX,stretchY);ctx.restore();}
  ghosts=ghosts.filter(g=>{let t=(now-g.start)/g.duration;if(t>=1)return false;if(g.impactAt!==undefined)t=Math.max(0,(now-g.impactAt)/Math.max(1,g.start+g.duration-g.impactAt));const pop=reduced?1:1+Math.sin(t*Math.PI)*THEME.motion.clearPop;const contraction=g.tile.special&&!reduced?1-.24*Math.min(1,(now-g.start)/(g.duration*.16)):1;tile(g.tile,g.x,g.y,pop*contraction,(1-t)**1.8,reduced?0:-Math.sin(t*Math.PI)*.06);return true;});
  charges=charges.filter(e=>{const t=(now-e.start)/e.duration;if(t>=1)return false;drawCharge(e,t);return true;});
  combos=combos.filter(e=>{const t=(now-e.start)/e.duration;if(t>=1)return false;drawCombo(e,t);return true;});
  formations=formations.filter(e=>{const t=(now-e.start)/e.duration;if(t>=1)return false;drawFormation(e,t);return true;});
  effects=effects.filter(e=>{const t=(now-e.start)/e.duration;if(t>=1)return false;if(t<0)return true;drawSpecial(e,t);return true;});
  rings=rings.filter(r=>{const t=(now-r.start)/r.life;if(t>=1)return false;ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,cell*(.2+t*(r.strength>=5?1.5:1)),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;return true;});
  particles=particles.filter(p=>{const age=now-p.start,t=age/p.life;if(t>=1)return false;if(age<0)return true;const s=reduced?0:age/1000,r=p.size*(1-t*.6);ctx.save();ctx.translate(p.x+p.vx*s,p.y+p.vy*s+200*s*s);ctx.rotate(p.angle+s*p.spin);ctx.globalAlpha=(1-t)**1.5;ctx.fillStyle=p.color;ctx.strokeStyle=p.color;ctx.beginPath();if(p.shape===0){ctx.roundRect(-r,-r,r*2,r*1.4,r*.28);ctx.fill();ctx.fillStyle='#ffffff66';ctx.fillRect(-r*.6,-r*.7,r*.7,r*.25);}else if(p.shape===1){ctx.moveTo(0,-r*1.5);ctx.lineTo(r*.45,0);ctx.lineTo(0,r*1.5);ctx.lineTo(-r*.45,0);ctx.closePath();ctx.fill();}else{ctx.lineWidth=r*.6;ctx.moveTo(-r*1.7,0);ctx.lineTo(r*.7,0);ctx.stroke();}ctx.restore();return true;});
  floats=floats.filter(p=>{const t=(now-p.start)/p.life;if(t>=1)return false;painter.drawScoreFloat(p,t);return true;});
  painter.drawTemporaryBlocks(engine.temporaryBlocks);painter.drawFrozenCells(engine.frozenCells,now);
  painter.drawBoardAtmosphere(worldCue,now);
  (rockVisual||[]).forEach(e=>painter.drawEnvironment(e,now));
  rockRestores=rockRestores.filter(e=>now<e.start+e.duration);rockRestores.forEach(e=>painter.drawEnvironment(e,now));
  if(selected!==null)outline(selected,'#ffffff',now);
  if(hint&&now<hintUntil){ctx.globalAlpha=reduced?1:.65+.35*Math.sin(now*.01);hint.forEach(i=>outline(i,'#f5ffb4',now));if(flow?.session){const a=xy(hint[0]),b=xy(hint[1]),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);ctx.strokeStyle='#fff2a0';ctx.lineWidth=3;ctx.beginPath();const x=a.x+dx*.64,y=a.y+dy*.64;ctx.moveTo(a.x+dx*.36,a.y+dy*.36);ctx.lineTo(x,y);ctx.moveTo(x-dx/len*9-dy/len*5,y-dy/len*9+dx/len*5);ctx.lineTo(x,y);ctx.lineTo(x-dx/len*9+dy/len*5,y-dy/len*9-dx/len*5);ctx.stroke();}ctx.globalAlpha=1;}else hint=null;
  if(document.activeElement===canvas&&!drag)outline(keyboard,'#ffffff66',now);
  ctx.restore();if(now>toastUntil)$('toast').classList.remove('show');
  frameCount++;if(now-fpsSince>=800){$('fps').textContent=Math.round(frameCount*1000/(now-fpsSince));frameCount=0;fpsSince=now;}last=now;requestAnimationFrame(frame);
}
function point(e){const r=canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;return{x,y,index:Math.floor(y/cell)*engine.width+Math.floor(x/cell),inside:x>=0&&y>=0&&x<width&&y<height};}
function attempt(a,b){hint=null;const ok=flow?flow.swap(a,b):engine.command({kind:'swap',a,b});if(!ok)message(flow?.session&&!flow.session.canAct?'等待结算，或重试本关':'这一列正在落下，试试其他空闲列');return ok;}
canvas.addEventListener('pointerdown',e=>{
  if(flow&&!flow.canInteract)return;
  if(drag||e.button>0)return;const p=point(e);if(!p.inside||engine.terrain.cells[p.index]!=='cell')return;e.preventDefault();canvas.focus({preventScroll:true});keyboard=p.index;
  if(engine.isBusy(p.index)){message('这一列正在落下，试试其他空闲列');return;}
  drag={index:p.index,x:p.x,y:p.y,dx:0,dy:0,pointer:e.pointerId};canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;const p=point(e),dx=p.x-drag.x,dy=p.y-drag.y;const horizontal=Math.abs(dx)>Math.abs(dy);drag.dx=horizontal?Math.max(-cell,Math.min(cell,dx)):0;drag.dy=horizontal?0:Math.max(-cell,Math.min(cell,dy));
  if(Math.max(Math.abs(dx),Math.abs(dy))>=cell*.22){const a=drag.index,b=a+(horizontal?(dx>0?1:-1):(dy>0?engine.width:-engine.width));if((horizontal&&Math.floor(a/engine.width)!==Math.floor(b/engine.width))||b<0||b>=engine.board.length){drag.dx=0;drag.dy=0;return;}attempt(a,b);selected=null;const id=drag.pointer;drag=null;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
});
canvas.addEventListener('pointerup',e=>{
  if(!drag||drag.pointer!==e.pointerId)return;const a=drag.index;drag=null;
  if(selected!==null&&selected!==a){if(engine.canSwap(selected,a)){attempt(selected,a);selected=null;}else selected=a;}else selected=selected===a?null:a;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
});
for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
canvas.addEventListener('keydown',e=>{
  if(flow&&!flow.canInteract)return;
  const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-engine.width,ArrowDown:engine.width};if(e.key in steps){e.preventDefault();const next=keyboard+steps[e.key];if(next>=0&&next<engine.board.length&&(!(e.key==='ArrowLeft'||e.key==='ArrowRight')||Math.floor(next/engine.width)===Math.floor(keyboard/engine.width) )&&engine.terrain.cells[next]==='cell')keyboard=next;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();if(selected!==null&&engine.canSwap(selected,keyboard)){attempt(selected,keyboard);selected=null;}else if(engine.terrain.cells[keyboard]==='cell'&&!engine.isBusy(keyboard))selected=keyboard;}
  if(e.key==='Escape'){selected=null;drag=null;}
});
function showHint(){hint=flow?.session?flow.session.hint():engine.practiceMove&&engine.score===0?engine.practiceMove:engine.hint();hintUntil=performance.now()+3500;if(hint)message('亮框的两个方块，沿相邻方向交换');else message('方块还在落下，空闲后再提示');}
$('hint').addEventListener('click',showHint);
$('restart').addEventListener('click',()=>{if(flow?.session||flow?.arena){flow.retry();return;}engine.reset(mode);message('重新开局，找到你的节奏');if(mode!=='free')showHint();});
try{const saved=JSON.parse(localStorage.getItem('block-brawl.audio.v1')||'null');if(typeof saved?.sound==='boolean')audio.setSoundEnabled(saved.sound);if(typeof saved?.music==='boolean')audio.setBgmEnabled(saved.music);}catch{}
function renderSound(){
  document.querySelectorAll('[data-audio-setting]').forEach(button=>{const music=button.dataset.audioSetting==='music',enabled=music?audio.bgmEnabled:audio.soundEnabled;button.setAttribute('aria-pressed',String(enabled));button.textContent=(music?'♪ 音乐':'♫ 音效')+(enabled?'开':'关');});
}
document.querySelectorAll('[data-audio-setting]').forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.audioSetting==='music')audio.setBgmEnabled(!audio.bgmEnabled);else audio.setSoundEnabled(!audio.soundEnabled);
  renderSound();try{localStorage.setItem('block-brawl.audio.v1',JSON.stringify({sound:audio.soundEnabled,music:audio.bgmEnabled}));}catch{}
}));
// Browsers require a trusted first gesture. Navigation and game clocks never
// wait on decoding; this gesture also retries a previously suspended device.
for(const event of ['pointerdown','keydown'])document.addEventListener(event,e=>{if(e.isTrusted&&!e.repeat)audio.unlock();},true);
document.addEventListener('visibilitychange',()=>audio.setSuspended(document.hidden));
renderSound();
document.addEventListener('click',e=>audioEvents.uiButton(e.target.closest?.('button')),true);
const labels={free:'自由练习',three:'三连练习',four:'四连练习',five:'五连练习',chain:'连击练习',row:'清行体验',column:'清列体验',blast:'爆破体验',edge:'边缘爆破', 'special-chain':'连续引爆','t-five':'T 型五消','l-five':'L 型五消','combo-lines':'直线＋直线','combo-cross':'横线＋爆破','combo-column':'竖线＋爆破','combo-blasts':'爆破＋爆破'};
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(el=>el.classList.toggle('active',el===b));if(mode==='free')engine.reset('free',STANDARD_TERRAIN);else engine.reset(mode);resize();$('mode-label').textContent=labels[mode];message(mode==='free'?'拖动交换 · 点击相邻两格也可以':'交换亮框方块，感受消除反馈');if(mode!=='free')showHint();}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){drag=null;selected=null;}else{fpsSince=performance.now();frameCount=0;}});
document.querySelectorAll('[data-terrain]').forEach(b=>b.addEventListener('click',()=>{
  if(flow&&flow.screen!=='sandbox')return;
  mode='free';engine.reset('free',TEST_TERRAINS[b.dataset.terrain]);resize();keyboard=engine.terrain.cells.indexOf('cell');
  document.querySelectorAll('[data-terrain]').forEach(el=>el.classList.toggle('active',el===b));
  document.querySelectorAll('[data-mode]').forEach(el=>el.classList.remove('active'));
  $('mode-label').textContent=b.textContent;message('垂直补充 · 空洞可穿越，石柱阻断下落');
}));
resize();requestAnimationFrame(frame);
