import {paintCandidate} from './effect_cast_soft_v2_preview.mjs';
import {paintSoftCast as paintOld} from '/effect_cast_soft_v1_preview.mjs';
const $=id=>document.getElementById(id),ctx=$('scene').getContext('2d'),zoom=$('zoom').getContext('2d'),isolated=$('isolated').getContext('2d');
const geometry=await (await fetch('/validation/2026-10-12/art-soft-c/geometry.json')).json(),background=new Image();background.src='/validation/2026-10-12/art-soft-c/battle-baseline.png';await background.decode();
let time=0,cycle=0,playing=true,old=false,last=performance.now();
function info(){const type=$('type').value,id={attack:'fire',control:'freeze',buff:'luck'}[type],side=type==='buff'?'player':'opponent',b=geometry.boards[side],unit=b.width/8;return {type,unit,from:geometry.origins[id],to:{x:b.x+3.5*unit,y:b.y+3.5*unit}};}
function point(ms,from,to){const t=Math.max(0,Math.min(1,(ms-420)/380)),s=1-t,lift=Math.min(230,Math.max(70,Math.abs(to.y-from.y)*.5));return {x:s*s*s*from.x+3*s*s*t*from.x+3*s*t*t*to.x+t*t*t*to.x,y:s*s*s*from.y+3*s*s*t*(from.y-lift)+3*s*t*t*(to.y+Math.min(100,lift*.5))+t*t*t*to.y};}
function paint(){
 ctx.clearRect(0,0,1440,960);ctx.drawImage(background,0,0);const {type,unit,from,to}=info(),amount=Number($('amount').value),draw=old?paintOld:paintCandidate;
 let stage,age,p,trail=[];
 if(time<240){stage='activation';age=time;p=from;}
 else if(time<420){stage='release';age=time-240;p=from;}
 else if(time<800){stage='flight';age=time-420;p=point(time,from,to);trail=Array.from({length:12},(_,i)=>point(Math.max(420,time-110+i*10),from,to));}
 else{stage='impact';age=time-800;p=to;}
 draw(ctx,type,stage,age,p,{unit,size:[116,153],trail,amount});
 const span=unit*2.8;zoom.clearRect(0,0,480,360);zoom.drawImage($('scene'),p.x-span/2,p.y-span*.375,span,span*.75,0,0,480,360);
 isolated.fillStyle='#eee6d7';isolated.fillRect(0,0,480,280);isolated.save();isolated.translate(240,140);isolated.scale(2,2);draw(isolated,type,stage,age,{x:0,y:0},{unit,size:[116,153],amount,trail:trail.map(q=>({x:q.x-p.x,y:q.y-p.y}))});isolated.restore();
 $('time').value=time;$('phase').textContent=time<240?'手牌激活':time<420?'聚光生成':time<800?'光球飞行':time<1100?'落地涟漪':'余辉消散';$('amount-label').textContent=amount===1?'标准':amount.toFixed(2)+'倍';
 window.__fxPreviewState={time,stage,old,unit,point:p,type,amount};
}
function seek(ms){playing=false;time=ms;cycle=ms;$('play').textContent='播放';paint();}
$('time').oninput=()=>seek(Number($('time').value));$('amount').oninput=paint;$('type').onchange=()=>{cycle=0;time=0;paint();};$('speed').onchange=()=>{last=performance.now();};$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停':'播放';};$('restart').onclick=()=>{time=0;cycle=0;playing=true;$('play').textContent='暂停';paint();};$('compare').onclick=()=>{old=!old;$('compare').textContent=old?'返回放大稿':'查看旧版';paint();};
document.querySelectorAll('[data-time]').forEach(button=>button.onclick=()=>seek(Number(button.dataset.time)));
window.__fxPreviewSeek=seek;paint();window.__fxPreviewReady=true;
function frame(now){const elapsed=Math.min(50,now-last);last=now;if(playing){cycle=(cycle+elapsed*Number($('speed').value))%1800;time=Math.min(1239,cycle);paint();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
