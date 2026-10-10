import {MatchEngine} from './engine.mjs';
const $=id=>document.getElementById(id), canvas=$('board'), ctx=canvas.getContext('2d');
const colors=['#caee75','#ac98f4','#f9b564','#65d7de','#f185a0'];
const shadows=['#718b36','#615195','#9e6430','#337f94','#98475f'];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let width=480,cell=60,drag=null,selected=null,keyboard=0,hint=null,hintUntil=0,toastUntil=0,shake=0,mode='free',sound=false,audio=null;
let motions=new Map(),ghosts=[],particles=[],rings=[],floats=[];
const xy=index=>({x:(index%8+.5)*cell,y:(Math.floor(index/8)+.5)*cell});
const ease=t=>1-Math.pow(1-t,3);
function message(text){$('message').textContent=text;}
function toast(text,time=700){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=performance.now()+time;}
function tone(strength,depth=1){
  if(!sound)return;
  try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();
    const notes=strength>=5?[660,880,1100,1320]:strength===4?[560,750,940]:[440,660];
    notes.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.035;o.type='sine';o.frequency.setValueAtTime(hz*(1+.08*(depth-1)),t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.065,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.18);});
  }catch{sound=false;$('sound').textContent='♫ 音效不可用';$('sound').setAttribute('aria-pressed','false');}
}
function onEvent(e){
  if(e.kind==='reset'){motions.clear();ghosts=[];particles=[];rings=[];floats=[];shake=0;drag=null;selected=null;hint=null;$('score').textContent='0';$('chain').textContent='—';$('toast').classList.remove('show');$('toast').textContent='';return;}
  if(['swap','revert','fall'].includes(e.kind))for(const m of e.moves){
    let from=xy(m.from);const to=xy(m.to);
    if(e.kind==='swap'&&drag?.index===m.from){from.x+=drag.dx;from.y+=drag.dy;}
    motions.set(m.tile.id,{from,to,start:e.time,duration:e.duration,fall:e.kind==='fall'});
  }
  if(e.kind==='revert'){message(e.conflict?'交叉区域正在落下，换个空闲位置':'差一点！要凑出至少三个同色');}
  if(e.kind==='clear'){
    const now=e.time;
    e.tiles.forEach(({index,tile})=>{
      const p=xy(index);ghosts.push({...p,tile,start:now,duration:e.duration});
      const count=reduced?3:e.strength>=5?24:e.strength===4?16:9;
      for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=cell*(1.8+Math.random()*3.4);particles.push({...p,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:2+Math.random()*3,color:colors[tile.type],start:now,life:350+Math.random()*240});}
      if(e.strength>=4)rings.push({...p,start:now,life:370,color:colors[tile.type],strength:e.strength});
    });
    const center=e.tiles.reduce((p,t)=>{const v=xy(t.index);return{x:p.x+v.x/e.tiles.length,y:p.y+v.y/e.tiles.length};},{x:0,y:0});
    floats.push({...center,text:`+${e.points}`,start:now,life:750});
    if(e.depth>1)toast(`${e.depth} 连锁！`);else if(e.strength>=5)toast('五连 · 爆发！');else if(e.strength===4)toast('四连 · 漂亮！');
    shake=reduced?0:e.strength>=5?7:e.strength===4?3:0;
    message(e.depth>1?`连锁 ×${e.depth} · 继续找下一步`:'消除中，其他空闲列仍可交换');tone(e.strength,e.depth);
  }
  if(e.kind==='score'){$('score').textContent=e.score;$('chain').textContent=`×${Math.max(engine?.bestChain||1,e.depth)}`;}
  if(e.kind==='settled')message('拖动交换 · 点击相邻两格也可以');
  if(e.kind==='reshuffle'){motions.clear();hint=null;selected=null;drag=null;toast('没有可消除交换，已自动换盘');}
}
const engine=new MatchEngine({onEvent});
// Read-only diagnostic snapshot for local QA; gameplay commands remain in the engine.
window.blockBrawl={snapshot:()=>({score:engine.score,bestChain:engine.bestChain,busyColumns:engine.locks.map((v,c)=>v===null?null:c).filter(v=>v!==null),transactions:engine.transactions.length,mode:engine.mode})};
function resize(){width=canvas.getBoundingClientRect().width;cell=width/8;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(width*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);motions.clear();drag=null;}
new ResizeObserver(resize).observe(canvas);
function symbol(type,size){
  const r=size*.17;ctx.lineWidth=Math.max(1.3,size*.026);ctx.strokeStyle='#17223c66';ctx.fillStyle='#ffffff38';ctx.beginPath();
  if(type===0){ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();}
  if(type===1){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.48:r;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
  if(type===2){ctx.arc(0,0,r,0,Math.PI*2);}
  if(type===3){ctx.roundRect(-r,-r,2*r,2*r,r*.25);}
  if(type===4){ctx.moveTo(0,-r);ctx.lineTo(r,r*.8);ctx.lineTo(-r,r*.8);ctx.closePath();}
  ctx.fill();ctx.stroke();
}
function tile(tile,x,y,scale=1,alpha=1){
  const size=cell*.84;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.fillStyle=shadows[tile.type];ctx.beginPath();ctx.roundRect(-size/2,-size/2+3,size,size,cell*.13);ctx.fill();
  const grad=ctx.createLinearGradient(0,-size/2,0,size/2);grad.addColorStop(0,colors[tile.type]);grad.addColorStop(1,colors[tile.type]);ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(-size/2,-size/2,size,size-2,cell*.13);ctx.fill();
  ctx.strokeStyle='#ffffff42';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-size*.28,-size*.36);ctx.lineTo(size*.25,-size*.36);ctx.stroke();symbol(tile.type,size);ctx.restore();
}
function outline(index,color,now){const p=xy(index);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(p.x-cell*.45,p.y-cell*.45,cell*.9,cell*.9,cell*.13);ctx.stroke();}
let last=0,frameCount=0,fpsSince=performance.now();
function frame(now){
  engine.tick(now);ctx.clearRect(0,0,width,width);ctx.save();
  if(shake>.2){ctx.translate(Math.sin(now*.08)*shake,Math.cos(now*.07)*shake*.5);shake*=.83;}
  for(let i=0;i<64;i++){const p=xy(i);ctx.fillStyle=engine.isBusy(i)?'#101722':'#151c2a';ctx.beginPath();ctx.roundRect(p.x-cell*.46,p.y-cell*.46,cell*.92,cell*.92,cell*.12);ctx.fill();}
  const moving=[];
  engine.board.forEach((t,i)=>{if(!t)return;let p=xy(i),m=motions.get(t.id);if(m){const progress=Math.min(1,(now-m.start)/m.duration);let f=ease(progress);if(m.fall&&!reduced)f=progress<.85?ease(progress/.85):1+Math.sin((progress-.85)/.15*Math.PI)*.025;p={x:m.from.x+(m.to.x-m.from.x)*f,y:m.from.y+(m.to.y-m.from.y)*f};if(progress>=1)motions.delete(t.id);else{moving.push({t,p});return;}}
    if(drag?.index===i){moving.push({t,p:{x:p.x+drag.dx,y:p.y+drag.dy}});return;}tile(t,p.x,p.y);
  });
  for(const {t,p} of moving)tile(t,p.x,p.y);
  ghosts=ghosts.filter(g=>{let t=(now-g.start)/g.duration;if(t>=1)return false;tile(g.tile,g.x,g.y,1+t*.25,1-t);ctx.fillStyle=`rgba(255,255,255,${(1-t)*.5})`;ctx.beginPath();ctx.arc(g.x,g.y,cell*.3*(1+t*.5),0,Math.PI*2);ctx.fill();return true;});
  rings=rings.filter(r=>{const t=(now-r.start)/r.life;if(t>=1)return false;ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,cell*(.2+t*(r.strength>=5?1.5:1)),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;return true;});
  particles=particles.filter(p=>{const age=now-p.start,t=age/p.life;if(t>=1)return false;const s=age/1000;ctx.globalAlpha=(1-t)**1.5;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x+p.vx*s,p.y+p.vy*s+200*s*s,p.size*(1-t*.6),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;return true;});
  floats=floats.filter(p=>{const t=(now-p.start)/p.life;if(t>=1)return false;ctx.globalAlpha=Math.min(1,(1-t)*3);ctx.font=`700 ${cell*.33}px system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#151b29';ctx.strokeText(p.text,p.x,p.y-t*cell);ctx.fillStyle='#ffffff';ctx.fillText(p.text,p.x,p.y-t*cell);ctx.globalAlpha=1;return true;});
  if(selected!==null)outline(selected,'#ffffff',now);
  if(hint&&now<hintUntil){ctx.globalAlpha=.65+.35*Math.sin(now*.01);hint.forEach(i=>outline(i,'#f5ffb4',now));ctx.globalAlpha=1;}else hint=null;
  if(document.activeElement===canvas&&!drag)outline(keyboard,'#ffffff66',now);
  ctx.restore();if(now>toastUntil)$('toast').classList.remove('show');
  frameCount++;if(now-fpsSince>=800){$('fps').textContent=Math.round(frameCount*1000/(now-fpsSince));frameCount=0;fpsSince=now;}last=now;requestAnimationFrame(frame);
}
function point(e){const r=canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;return{x,y,index:Math.floor(y/cell)*8+Math.floor(x/cell),inside:x>=0&&y>=0&&x<width&&y<width};}
function attempt(a,b){hint=null;const ok=engine.command({kind:'swap',a,b});if(!ok)message('这一列正在落下，试试其他空闲列');return ok;}
canvas.addEventListener('pointerdown',e=>{
  if(drag||e.button>0)return;const p=point(e);if(!p.inside)return;e.preventDefault();canvas.focus({preventScroll:true});keyboard=p.index;
  if(engine.isBusy(p.index)){message('这一列正在落下，试试其他空闲列');return;}
  drag={index:p.index,x:p.x,y:p.y,dx:0,dy:0,pointer:e.pointerId};canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;const p=point(e),dx=p.x-drag.x,dy=p.y-drag.y;const horizontal=Math.abs(dx)>Math.abs(dy);drag.dx=horizontal?Math.max(-cell,Math.min(cell,dx)):0;drag.dy=horizontal?0:Math.max(-cell,Math.min(cell,dy));
  if(Math.max(Math.abs(dx),Math.abs(dy))>=cell*.22){const a=drag.index,b=a+(horizontal?(dx>0?1:-1):(dy>0?8:-8));if((horizontal&&Math.floor(a/8)!==Math.floor(b/8))||b<0||b>=64){drag.dx=0;drag.dy=0;return;}attempt(a,b);selected=null;const id=drag.pointer;drag=null;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
});
canvas.addEventListener('pointerup',e=>{
  if(!drag||drag.pointer!==e.pointerId)return;const a=drag.index;drag=null;
  if(selected!==null&&selected!==a){if(engine.canSwap(selected,a)){attempt(selected,a);selected=null;}else selected=a;}else selected=selected===a?null:a;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
});
for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
canvas.addEventListener('keydown',e=>{
  const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};if(e.key in steps){e.preventDefault();const next=keyboard+steps[e.key];if(next>=0&&next<64&&(!(e.key==='ArrowLeft'||e.key==='ArrowRight')||Math.floor(next/8)===Math.floor(keyboard/8)))keyboard=next;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();if(selected!==null&&engine.canSwap(selected,keyboard)){attempt(selected,keyboard);selected=null;}else if(!engine.isBusy(keyboard))selected=keyboard;}
  if(e.key==='Escape'){selected=null;drag=null;}
});
function showHint(){hint=engine.practiceMove&&engine.score===0?engine.practiceMove:engine.hint();hintUntil=performance.now()+3500;if(hint)message('亮框的两个方块，沿相邻方向交换');else message('方块还在落下，空闲后再提示');}
$('hint').addEventListener('click',showHint);
$('restart').addEventListener('click',()=>{engine.reset(mode);message('重新开局，找到你的节奏');if(mode!=='free')showHint();});
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'♫ 音效开':'♫ 音效关';if(sound)tone(3);});
const labels={free:'自由练习',three:'三连练习',four:'四连练习',five:'五连练习',chain:'连锁练习'};
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(el=>el.classList.toggle('active',el===b));engine.reset(mode);$('mode-label').textContent=labels[mode];message(mode==='free'?'拖动交换 · 点击相邻两格也可以':'交换亮框方块，感受消除反馈');if(mode!=='free')showHint();}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){drag=null;selected=null;}else{fpsSince=performance.now();frameCount=0;}});
resize();requestAnimationFrame(frame);
