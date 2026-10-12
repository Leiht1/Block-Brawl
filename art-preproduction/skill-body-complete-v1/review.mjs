import {paintSoftCast} from '/effect_cast_soft_v3_final.mjs';
import {CardCastPlayback,CAST_TIMING} from '/card-cast-vfx.mjs';
import {createArtAssets} from '/art.mjs';
import {createBoardPainter} from '/board-painter.mjs';
import {FOREST_MAP} from '/maps.mjs';
import {makeTrace,CAST_AT,IMPACT_AT,BODY_AT} from './rule-trace.mjs';
import {paintSkillBody,paintBuffBadge} from './effect_skill_body_complete_v1_preview.mjs';
import {SPECS,IMMEDIATE} from './skill-specs.mjs';
import {QUAKE_CANDIDATES,QUAKE_SELECTED} from './quake-candidates.mjs';
import {paintSageBacklight} from './effect_sage_backlight_soft_v1_preview.mjs';
import {MAPS} from '/maps.mjs';
const base='/art-preproduction/skill-body-complete-v1/',$=id=>document.getElementById(id);
const manifest=await(await fetch(base+'manifest.json')).json(),geometry=await(await fetch(base+'source/geometry_board_soft_v1_preview.json')).json();
const images={},faces={};await Promise.all(Object.entries(manifest.entries).map(async([id,e])=>{const img=new Image();img.src=base+e.reviewPath;await img.decode();images[id]=img;const face=new Image();face.src='/assets/cards/'+id+'.webp';await face.decode();faces[id]=face;}));
await Promise.all(Object.entries(manifest.stateAssets??{}).map(async([key,e])=>{const img=new Image();img.src=base+e.reviewPath;await img.decode();images[key]=img;}));
const specialTile=new Image();if(manifest.specialTile){specialTile.src=base+manifest.specialTile.reviewPath;await specialTile.decode();}
const background=new Image();background.src=base+'source/effect_board_forest_soft_v1_preview.png';await background.decode();
const info=SPECS;
const traces=Object.fromEntries(manifest.scope.map(id=>[id,makeTrace(id)]));
const scene=$('scene'),ctx=scene.getContext('2d'),iso=$('isolated').getContext('2d'),zoom=$('zoom').getContext('2d');
const boards={},painters={};
for(const side of ['player','opponent']){const canvas=document.createElement('canvas');canvas.width=canvas.height=480;boards[side]=canvas;painters[side]=createBoardPainter({ctx:canvas.getContext('2d'),art:createArtAssets()});}
const sageOptions=document.createElement('div');sageOptions.id='sage-options';sageOptions.className='controls';sageOptions.hidden=true;sageOptions.innerHTML='<label>贤者时间对比</label><button data-sage="veil">仅金色蒙层</button><button data-sage="backlight" class="active">加底层透光</button>';document.querySelector('.timeline').before(sageOptions);
document.querySelector('[data-skill="quake"] b').textContent='裂地横扫';document.querySelector('#quake-options h2').textContent='已选裂地横扫 · 其他方案供回看';document.querySelector('#quake-options p').textContent='指定目标行的有效普通方块横排清除；当前已确定横排方案，尚未接入正式游戏。';document.querySelectorAll('[data-quake]').forEach(b=>{b.classList.toggle('active',b.dataset.quake===QUAKE_SELECTED);if(b.dataset.quake==='pierce')b.textContent='岩刺突袭';if(b.dataset.quake===QUAKE_SELECTED)b.textContent='裂地横扫（已选）';});
let id='fire',time=0,playing=true,bodyOnly=false,last=performance.now(),quakeCandidate=QUAKE_SELECTED,sageVariant='backlight',backlightRendered=null;
const point=(b,i)=>({x:b.x+(i%8+.5)*b.width/8,y:b.y+(Math.floor(i/8)+.5)*(b.height??b.width)/8});
function ruleTime(t){return $('mode').value==='story'&&IMMEDIATE.includes(id)&&t>=CAST_AT?Math.max(CAST_AT-20,t-(BODY_AT-CAST_AT)):t;}
function drawBoards(t){
 backlightRendered=null;
 const trace=traces[id],snap=trace.at(t);
 for(const side of ['player','opponent']){
  const painter=painters[side],c=boards[side].getContext('2d'),unit=60;
  c.clearRect(0,0,480,480);painter.configure({width:480,cell:unit,pixelRatio:1,visualNow:t,formations:[],terrain:trace.terrain,map:FOREST_MAP});painter.drawTerrain(trace.terrain);
  if(id==='sage'&&side===trace.side&&sageVariant==='backlight')backlightRendered=paintSageBacklight(c,time,{board:{x:0,y:0,width:480,height:480},ruleTime:t,trace});
  const motions=trace.events.filter(e=>e.side===side&&e.moves&&e.time<=t&&t<e.time+e.duration);
  for(const [i,tile]of snap.boards[side].entries()){
   if(!tile)continue;let p=point({x:0,y:0,width:480},i);
   const e=motions.findLast(e=>e.moves.some(m=>m.tile.id===tile.id)),m=e?.moves.find(m=>m.tile.id===tile.id);
   if(m){const progress=Math.max(0,Math.min(1,(t-e.time)/e.duration)),f=e.kind==='fall'?Math.min(1,progress/.78)**2:1-(1-progress)**3,s=1-f;
    const from=point({x:0,y:0,width:480},m.from),to=point({x:0,y:0,width:480},m.to);
    if(m.control!==undefined){const cp=point({x:0,y:0,width:480},m.control);p={x:s*s*from.x+2*s*f*cp.x+f*f*to.x,y:s*s*from.y+2*s*f*cp.y+f*f*to.y};}
    else p={x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f};
   }
   const materializing=tile.wild&&id==='rainbow'&&$('mode').value==='story',wildAlpha=materializing?Math.max(0,Math.min(1,(time-BODY_AT-400)/220)):1;
   if(tile.wild&&manifest.specialTile){if(wildAlpha<1)painter.tile(tile,p.x,p.y);c.save();c.globalAlpha=wildAlpha;c.drawImage(specialTile,p.x-unit*.48,p.y-unit*.48,unit*.96,unit*.96);c.restore();}
   else painter.tile(tile,p.x,p.y);
  }
  for(const e of trace.events.filter(e=>e.side===side&&e.kind==='clear'&&e.time<=t&&t<e.time+e.duration))for(const g of e.tiles){const p=point({x:0,y:0,width:480},g.index),f=(t-e.time)/e.duration;painter.tile(g.tile,p.x,p.y,1,(1-f)**1.8);}
  const b=geometry.boards[side];ctx.drawImage(boards[side],b.x,b.y,b.width,b.height);
 }
}
function flightPoint(c,t,to){const f=Math.min(1,Math.max(0,(t-c.start-CAST_TIMING.flightStart)/CAST_TIMING.flight)),s=1-f,from=c.origin,lift=Math.min(230,Math.max(70,Math.abs(to.y-from.y)*.5));return {x:s*s*s*from.x+3*s*s*f*from.x+3*s*f*f*to.x+f*f*f*to.x,y:s*s*s*from.y+3*s*s*f*(from.y-lift)+3*s*f*f*(to.y+Math.min(100,lift*.5))+f*f*f*to.y};}
function common(t){
 const trace=traces[id],def=info[id],from={x:590,y:790},b=geometry.boards[trace.side],to=point(b,trace.landing),unit=b.width/8;
 if(t<CAST_AT){paintSoftCast(ctx,def.type,'activation',t,from,{size:[116,153],unit});return;}
 const playback=new CardCastPlayback();playback.prepare(trace.cast.card,from,[116,153],0);playback.cast(trace.cast,from);
 for(const c of playback.casts){c.index=trace.landing;c.resolved=true;}
 for(const c of playback.at(t).casts){const age=t-c.start;if(age<200)paintSoftCast(ctx,def.type,'release',age,c.origin,{unit});
  if(age>=180&&t<c.flightEnd){const p=flightPoint(c,t,to),trail=Array.from({length:12},(_,n)=>flightPoint(c,Math.max(c.start+180,t-110+n*10),to));paintSoftCast(ctx,def.type,'flight',age-180,p,{unit,trail});}
  else if(t>=c.flightEnd)paintSoftCast(ctx,def.type,'impact',t-c.flightEnd,to,{unit});
 }
}
function stateText(t){
 const trace=traces[id],cast=trace.cast,age=Math.max(0,t-CAST_AT),main=manifest.entries[id].mainMs;
 if(time<CAST_AT)return '手牌凝聚 · 尚未提交';
 if(id==='fire'){const effect=trace.changes.find(e=>e.kind==='effect');return t<effect.now?`敌方 ${cast.cells.length} 格已标记 · ${(Math.max(0,2200-age)/1000).toFixed(1)}s 后结算`:t<effect.now+530?'3格已烧毁 · 原规则落下补充中':'结算完成 · 本体已消散';}
 if(id==='freeze')return age<3000?`敌方整盘已冻结 · 剩余 ${(Math.max(0,3000-age)/1000).toFixed(1)}s · 方块仍可辨认`:'冻结已解除 · 霜纹消融';
 if(id==='luck')return t<CAST_AT+10000?`幸运增益 · 特殊补充概率22% · 剩余${((CAST_AT+10000-t)/1000).toFixed(1)}s`:'幸运增益结束 · 不生成万能方块';
 if(id==='quake')return t<240?'横排尚未结算':`${QUAKE_CANDIDATES[quakeCandidate].name} · ${cast.cells.length}个有效普通格清除 · ${quakeCandidate===QUAKE_SELECTED?'已选横排方案':'历史备选回看'}，未接入`;
 if(id==='meteor'||id==='bomb'){const e=trace.changes.find(e=>e.kind==='effect'&&e.id===id);return t<e.now?`${cast.cells.length}格已标记 · ${((e.now-t)/1000).toFixed(1)}s后结算`:`${cast.cells.length}格已结算 · 原引擎落下补充`;}
 if(id==='storm')return '实际6格变色 · 不移动方块 · 局部风纹短反馈';
 if(id==='fog')return t<CAST_AT+6000?`落点大雾遮蔽中 · 剩余${((CAST_AT+6000-t)/1000).toFixed(1)}s · 连续12格范围审核`:t<CAST_AT+7200?'迷雾持续已结束 · 雾团缓慢消散':'雾团已消散';
 if(id==='overload')return t<CAST_AT+10000?`己方×2得分增益 · 剩余${((CAST_AT+10000-t)/1000).toFixed(1)}s · 当前得分${trace.at(t).scores.player}`:'超载结束';
 if(id==='sage')return t<CAST_AT+5000?`${sageVariant==='backlight'?'底层金光上涌＋金色蒙层':'仅金色蒙层'} · 剩余${((CAST_AT+5000-t)/1000).toFixed(1)}s · 真实自动交换与得分`:'贤者时间结束 · 自动操作停止';
 if(id==='rainbow')return t<CAST_AT?'万能方块尚未生成':`万能方块已生成于第${trace.landing+1}格 · 真实随机落点`;
 const event=trace.events.find(e=>e.kind==='card-change'&&e.card==='blackhole');return t<event.time?'轮转尚未提交':t<event.time+420?`${event.moves.length} 块沿真实控制点牵引 · 420ms轮转反馈`:'轮转已完成 · 没有持续吸引状态';
}
function paint(){
 const trace=traces[id],b=geometry.boards[trace.side],rt=ruleTime(time),mode=$('mode').value;
 const renderImages=images,renderManifest=manifest;
 ctx.clearRect(0,0,1440,960);ctx.drawImage(background,0,0);drawBoards(rt);
 // Review hand dock contains the real selected card artwork for all twelve.
 ctx.save();ctx.fillStyle='#f6ecd9';ctx.strokeStyle='#c8b38d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(490,704,560,188,14);ctx.fill();ctx.stroke();ctx.drawImage(faces[id],532,713,116,154);ctx.fillStyle='#705f49';ctx.font='bold 20px Microsoft Yahei';ctx.fillText(info[id].name,680,748);ctx.font='14px Microsoft Yahei';ctx.fillText(traces[id].proposedRule?'现行卡面作参考 · 新规则仅在审核场景运行':'已接入卡面 · 本体效果审核',680,781);ctx.fillText('手牌原点 → 目标落点 → 本体 → 状态 / 结算',680,813);ctx.restore();
 if(!bodyOnly)common(time);
 const body=paintSkillBody(ctx,id,time,{board:b,cast:trace.cast,images:renderImages,manifest:renderManifest,ruleTime:rt,mode,trace});
 const badge=paintBuffBadge(ctx,id,time,{board:b,ruleTime:rt,trace,images:renderImages});
 iso.fillStyle='#e9e3d8';iso.fillRect(0,0,480,380);
 const ib=['freeze','sage','luck','overload'].includes(id)?{x:60,y:10,width:360,height:360}:{x:-128,y:-160,width:840,height:840},isolatedCast={...trace.cast,index:27};
 paintSkillBody(iso,id,time,{board:ib,cast:isolatedCast,images:renderImages,manifest:renderManifest,ruleTime:rt,mode,trace:{...trace,landing:27},isolated:true,sageBacklight:sageVariant==='backlight'});
 const to=point(b,trace.landing),span=['freeze','quake','fog','storm','sage'].includes(id)?b.width:b.width*.62;
 const cropX=id==='freeze'?b.x:Math.max(b.x,Math.min(b.x+b.width-span,to.x-span/2)),cropY=id==='freeze'?b.y:Math.max(b.y,Math.min(b.y+b.height-span,to.y-span/2));
 zoom.fillStyle='#e9e3d8';zoom.fillRect(0,0,480,380);zoom.drawImage(scene,cropX,cropY,span,span,50,0,380,380);
 $('large-scene').getContext('2d').drawImage(scene,0,0);
 $('time').value=time;$('clock').textContent=(time/1000).toFixed(2)+'s';
 $('phase').textContent=time<240?'手牌凝聚':time<420?'光团生成':time<800?'光团飞行':time<880?'命中落点':body.mainActive?'本体展开':time<1630?'消散收尾':'状态 / 结算';
 $('state').textContent=stateText(rt)+(mode==='story'&&IMMEDIATE.includes(id)?'（衔接示意：即时事件视觉重放延后640ms）':'');
 $('tone-label').textContent='十二张审核稿 · 正式游戏尚未接入';
 window.__skillReviewState={id,time,ruleTime:rt,mode,bodyOnly,bodyStart:body.start,mainActive:body.mainActive,scope:manifest.scope,state:$('state').textContent,targetSide:trace.side,cells:trace.cast.cells,landing:trace.landing,badge,sageVariant,backlight:backlightRendered,quakeCandidate};
 paintStrip();
}
function paintStrip(){const img=images[id];$('atlas-link').href=base+manifest.entries[id].reviewPath;const strip=$('strip').getContext('2d');strip.fillStyle='#e9e3d8';strip.fillRect(0,0,1440,190);for(let n=0;n<8;n++){strip.drawImage(img,n%4*256,Math.floor(n/4)*256,256,256,n*180+5,0,170,170);strip.fillStyle='#9a8b76';strip.font='12px system-ui';strip.fillText(String(n+1).padStart(2,'0'),n*180+12,181);}}
function choose(next){id=next;time=0;bodyOnly=false;playing=true;$('play').textContent='暂停';$('time').max=info[id].duration;document.querySelectorAll('[data-skill]').forEach(b=>b.classList.toggle('active',b.dataset.skill===id));
 $('name').textContent=info[id].name+' · '+manifest.entries[id].mainMs+'ms主反馈';$('design').textContent=info[id].design;$('rule').textContent=info[id].rule;$('target').textContent=traces[id].side==='player'?'强化己方棋盘':'影响敌方棋盘';
 $('timing-note').textContent=id==='fog'?'大雾在命中处展开，6秒期限从提交时刻计算，之后1.2秒仅视觉消散。连续12格范围仅在审核场景拟定；正式游戏随机12格规则未修改。':IMMEDIATE.includes(id)?'完整衔接示意将即时事件视觉重放延后640ms。时序视图在提交时生效；裂地横排方案已选，仍仅在审核场景运行。正式接入前需要适配表现重叠。':'实际期限从提交时刻计算；增益图标倒计时跟随真实状态，延迟攻击的结算反馈对齐真实效果事件。';
 $('mode').options[1].textContent=id==='quake'&&quakeCandidate===QUAKE_SELECTED?'已选规则时序（未接入）':traces[id].proposedRule?'拟定规则时序（未接入）':'现有规则时序';
 $('sage-options').hidden=id!=='sage';
 $('quake-options').hidden=id!=='quake';if(id==='quake'){$('design').textContent=QUAKE_CANDIDATES[quakeCandidate].visual+'；'+QUAKE_CANDIDATES[quakeCandidate].benefit;$('rule').textContent=QUAKE_CANDIDATES[quakeCandidate].rule;}
 $('atlas-link').href=base+manifest.entries[id].reviewPath;
 paint();
}
function seek(t){playing=false;time=t;$('play').textContent='播放';paint();}
document.querySelectorAll('[data-skill]').forEach(b=>{b.disabled=!manifest.entries[b.dataset.skill];b.onclick=()=>choose(b.dataset.skill);});
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const start=$('mode').value==='rules'&&IMMEDIATE.includes(id)?240:880;seek({before:720,open:start+300,tail:start+manifest.entries[id].mainMs-130,state:{fire:2450,freeze:2000,blackhole:start+200,luck:2600,quake:1200,meteor:1900,bomb:2110,storm:start+200,fog:2500,overload:2200,sage:2200,rainbow:start+750}[id],end:info[id].duration-200}[b.dataset.step]);});
 $('time').oninput=()=>seek(Number($('time').value));$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停':'播放';};$('restart').onclick=()=>{time=bodyOnly?($('mode').value==='rules'&&IMMEDIATE.includes(id)?240:880):0;playing=true;$('play').textContent='暂停';paint();};
 $('mode').onchange=()=>{time=0;bodyOnly=false;paint();};$('speed').onchange=()=>{last=performance.now();};
 document.querySelectorAll('[data-quake]').forEach(button=>button.onclick=()=>{quakeCandidate=button.dataset.quake;traces.quake=makeTrace('quake',{candidate:quakeCandidate});document.querySelectorAll('[data-quake]').forEach(b=>b.classList.toggle('active',b===button));choose('quake');});
 for(const [candidate,def]of Object.entries(QUAKE_CANDIDATES)){const row=document.createElement('tr');const counts=MAPS.map(map=>makeTrace('quake',{candidate,map}).cast.cells.length);row.innerHTML=`<td>${def.name}${def.selected?'（已选）':''}</td><td>${def.rule}</td><td>${counts.join(' / ')}</td><td>${def.benefit}</td>`;$('quake-table').append(row);}
 function setSageVariant(variant){sageVariant=variant==='veil'?'veil':'backlight';document.querySelectorAll('[data-sage]').forEach(b=>b.classList.toggle('active',b.dataset.sage===sageVariant));paint();}
 document.querySelectorAll('[data-sage]').forEach(button=>button.onclick=()=>setSageVariant(button.dataset.sage));
 $('body-only').onclick=()=>{bodyOnly=true;time=$('mode').value==='rules'&&IMMEDIATE.includes(id)?240:880;playing=true;$('play').textContent='暂停';paint();};
 $('full-size').onclick=()=>$('large').showModal();$('close-large').onclick=()=>$('large').close();
window.__skillReview={choose,seek,paint,setSageVariant,manifest,traces,geometry,images};const params=new URLSearchParams(location.search),requested=params.get('skill');choose(manifest.entries[requested]?requested:'fire');if(params.has('sage'))setSageVariant(params.get('sage'));if(params.has('time')){const requestedTime=Number(params.get('time'));if(Number.isFinite(requestedTime)&&requestedTime>=0&&requestedTime<=info[id].duration)seek(requestedTime);}window.__skillReviewReady=true;
function frame(now){const delta=Math.min(60,now-last);last=now;if(playing){time+=delta*Number($('speed').value);const end=bodyOnly?($('mode').value==='rules'&&IMMEDIATE.includes(id)?240:880)+manifest.entries[id].mainMs+450:info[id].duration;if(time>=end){if($('loop').checked)time=bodyOnly?($('mode').value==='rules'&&IMMEDIATE.includes(id)?240:880):0;else{time=end;playing=false;$('play').textContent='播放';}}paint();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
