import {createCardCastVfx} from '/card-cast-vfx.mjs';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),zoom=$('zoom').getContext('2d');
const geometry=await (await fetch('./geometry.json')).json(),background=new Image();background.src='/art-preproduction/skill-body-complete-v1/source/effect_board_forest_soft_v1_preview.png';await background.decode();
const boards=Object.fromEntries(Object.entries(geometry.boards).map(([side,r])=>[side,{getBoundingClientRect:()=>({left:r.x,top:r.y,width:r.width,height:r.height})}]));
const fx=createCardCastVfx({arena:{engines:{player:{width:8,height:8},opponent:{width:8,height:8}}}},boards,ctx);
let playing=true,time=0,last=performance.now(),old=false,cycle=0;
const handFallback=document.createElement('span');handFallback.id='card-hand';handFallback.hidden=true;document.body.append(handFallback);
const names=[['fire','火焰冲击','横向火浪'],['quake','地裂冲击','裂口与岩片'],['meteor','陨石坠落','纵向石体'],['bomb','炸弹投放','悬空炸弹'],['freeze','时间冻结','冰封钟面'],['blackhole','黑洞吸引','引力核与牵引'],['storm','混乱风暴','斜向风旋'],['fog','迷雾领域','横向叠雾'],['overload','超载模式','增幅晶体'],['sage','贤者时间','沙漏与推演'],['rainbow','彩虹核心','柔彩万能方块'],['luck','幸运星','祝福星轨']];
function cards(){ $('cards').innerHTML=names.map(([id,name,anchor])=>`<div class="card"><img src="${old?'/art-preproduction/card-reference-v3/cards/'+id+'.png':'/assets/cards/'+id+'.webp'}" alt="${name}"><b>${name}</b><small>${anchor}</small></div>`).join(''); }
function reset(){fx.reset();const id={attack:'fire',control:'freeze',buff:'luck'}[$('type').value],h=geometry.hand;fx.prepare({id,uid:1},geometry.origins?.[id]||{x:h.x+h.width/2,y:h.y+h.height/2},[116,153],0);}
function paint(){
 ctx.clearRect(0,0,1440,960);ctx.drawImage(background,0,0);reset();const type=$('type').value,id={attack:'fire',control:'freeze',buff:'luck'}[type],side=type==='buff'?'player':'opponent';
 if(time>=240)fx.event({kind:'cast',card:{id,uid:1},side:'player',targetSide:side,index:27,landing:27,cells:[26,27,28],now:240});
 fx.render(time);const r=geometry.boards[side],unit=r.width/8,x=r.x+3.5*unit,y=r.y+3.5*unit;zoom.clearRect(0,0,360,264);zoom.drawImage(canvas,x-1.2*unit,y-.88*unit,2.4*unit,1.76*unit,0,0,360,264);
 $('time').value=time;$('phase').textContent=time<240?'手牌激活 / 聚光':time<420?'光球生成':time<800?'细流飞行':time<1100?'轻柔涟漪':'余辉消散';
}
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停':'播放';};$('restart').onclick=()=>{time=0;cycle=0;playing=true;$('play').textContent='暂停';};$('type').onchange=paint;$('time').oninput=()=>{playing=false;$('play').textContent='播放';time=Number($('time').value);cycle=time;paint();};$('compare').onclick=()=>{old=!old;$('compare').textContent=old?'返回方案C':'查看旧版';cards();};
cards();paint();window.__softReviewReady=true;
// Separate cycle clock gives a short, calm hold after the afterglow.
function animate(now){const delta=Math.min(40,now-last);last=now;if(playing){cycle=(cycle+delta*.65)%1600;time=Math.min(1200,cycle);paint();}requestAnimationFrame(animate);}requestAnimationFrame(animate);
