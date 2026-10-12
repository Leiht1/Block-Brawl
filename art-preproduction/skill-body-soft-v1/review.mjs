import {paintSoftCast} from '/effect_cast_soft_v3_final.mjs';
import {CardCastPlayback,CAST_TIMING} from '/card-cast-vfx.mjs';
import {createArtAssets} from '/art.mjs';
import {createBoardPainter} from '/board-painter.mjs';
import {FOREST_MAP} from '/maps.mjs';
import {makeTrace,CAST_AT,IMPACT_AT,BODY_AT} from './rule-trace.mjs';
import {loadSkillAssets,paintSkillBody} from './effect_skill_body_soft_v1_preview.mjs';
const base='/art-preproduction/skill-body-soft-v1/',$=id=>document.getElementById(id);
const manifest=await(await fetch(base+'manifest.json')).json(),geometry=await(await fetch(base+'source/geometry_board_soft_v1_preview.json')).json();
const images=await loadSkillAssets(manifest),background=new Image();background.src=base+'source/effect_board_forest_soft_v1_preview.png';await background.decode();
const previousManifest={...manifest,entries:Object.fromEntries(Object.entries(manifest.entries).map(([id,e])=>[id,{...e,version:e.previousAssets?.version??1,reviewPath:e.previousAssets?.reviewPath??e.reviewPath,renderAlpha:e.previousAssets?.renderAlpha??null,presentation:e.previousAssets?.presentation??null}]))};
const previousImages=await loadSkillAssets(previousManifest);
const info={
 fire:{name:'火焰冲击',type:'attack',duration:3200,design:'保留原横向火舌；橙红内层与暖金前缘更有颜色厚度，减少主体透明感。720ms主反馈、范围与收尾不变。',rule:'敌方横向最多3格。出牌后2.2秒烧毁；标记在真实结算前保留。'},
 freeze:{name:'时间冻结',type:'control',duration:3900,design:'新的冰晶棱角、薄冰壳与霜裂纹包住格边，中心仍能看清方块；稳定冰封状态保留到3秒解除。760ms主反馈与原消融时长不变。',rule:'冻结敌方整盘3秒，暂停新的交换；已有动作继续按原规则进行。'},
 blackhole:{name:'黑洞吸引',type:'control',duration:2200,design:'保留原小暗核与旋带；蓝紫核、蓝色轨带与牵引线颜色更实。760ms开合、真实6块移动曲线不变。',rule:'附近最多6个普通方块轮转位置；真实规则移动420ms，保留方块身份与落点。'},
 luck:{name:'幸运星',type:'buff',duration:10900,design:'保留原五角星与纤细星轨；主体改为更清楚的蜜金，米白只留作局部高光，小星标更易辨认。800ms主反馈与10秒状态不变。',rule:'己方10秒增益。只在实际补充方块时进行22%特殊块判定；此页不预造中奖方块。'}
};
const traces=Object.fromEntries(Object.keys(info).map(id=>[id,makeTrace(id)]));
const scene=$('scene'),ctx=scene.getContext('2d'),iso=$('isolated').getContext('2d'),zoom=$('zoom').getContext('2d');
const boards={},painters={};
for(const side of ['player','opponent']){const canvas=document.createElement('canvas');canvas.width=canvas.height=480;boards[side]=canvas;painters[side]=createBoardPainter({ctx:canvas.getContext('2d'),art:createArtAssets()});}
let id='fire',time=0,playing=true,bodyOnly=false,last=performance.now();
const point=(b,i)=>({x:b.x+(i%8+.5)*b.width/8,y:b.y+(Math.floor(i/8)+.5)*(b.height??b.width)/8});
function ruleTime(t){return $('mode').value==='story'&&id==='blackhole'&&t>=CAST_AT?Math.max(CAST_AT-20,t-(BODY_AT-CAST_AT)):t;}
function drawBoards(t){
 const trace=traces[id],snap=trace.at(t);
 for(const side of ['player','opponent']){
  const painter=painters[side],c=boards[side].getContext('2d'),unit=60;
  c.clearRect(0,0,480,480);painter.configure({width:480,cell:unit,pixelRatio:1,visualNow:t,formations:[],terrain:trace.terrain,map:FOREST_MAP});painter.drawTerrain(trace.terrain);
  const motions=trace.events.filter(e=>e.side===side&&e.moves&&e.time<=t&&t<e.time+e.duration);
  for(const [i,tile]of snap.boards[side].entries()){
   if(!tile)continue;let p=point({x:0,y:0,width:480},i);
   const e=motions.findLast(e=>e.moves.some(m=>m.tile.id===tile.id)),m=e?.moves.find(m=>m.tile.id===tile.id);
   if(m){const progress=Math.max(0,Math.min(1,(t-e.time)/e.duration)),f=e.kind==='fall'?Math.min(1,progress/.78)**2:1-(1-progress)**3,s=1-f;
    const from=point({x:0,y:0,width:480},m.from),to=point({x:0,y:0,width:480},m.to);
    if(m.control!==undefined){const cp=point({x:0,y:0,width:480},m.control);p={x:s*s*from.x+2*s*f*cp.x+f*f*to.x,y:s*s*from.y+2*s*f*cp.y+f*f*to.y};}
    else p={x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f};
   }
   painter.tile(tile,p.x,p.y);
  }
  for(const e of trace.events.filter(e=>e.side===side&&e.kind==='clear'&&e.time<=t&&t<e.time+e.duration))for(const g of e.tiles){const p=point({x:0,y:0,width:480},g.index),f=(t-e.time)/e.duration;painter.tile(g.tile,p.x,p.y,1,(1-f)**1.8);}
  const b=geometry.boards[side];ctx.drawImage(boards[side],b.x,b.y,b.width,b.height);
 }
}
function flightPoint(c,t,to){const f=Math.min(1,Math.max(0,(t-c.start-CAST_TIMING.flightStart)/CAST_TIMING.flight)),s=1-f,from=c.origin,lift=Math.min(230,Math.max(70,Math.abs(to.y-from.y)*.5));return {x:s*s*s*from.x+3*s*s*f*from.x+3*s*f*f*to.x+f*f*f*to.x,y:s*s*s*from.y+3*s*s*f*(from.y-lift)+3*s*f*f*(to.y+Math.min(100,lift*.5))+f*f*f*to.y};}
function common(t){
 const trace=traces[id],def=info[id],from=geometry.origins[id],b=geometry.boards[trace.side],to=point(b,trace.cast.index),unit=b.width/8;
 if(t<CAST_AT){paintSoftCast(ctx,def.type,'activation',t,from,{size:[116,153],unit});return;}
 const playback=new CardCastPlayback();playback.prepare(trace.cast.card,from,[116,153],0);playback.cast(trace.cast,from);
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
 if(id==='luck')return age<10000?`己方幸运已生效 · 剩余 ${(Math.max(0,10000-age)/1000).toFixed(1)}s · 补充时22%判定`:'幸运增益已结束 · 小星标移除';
 const event=trace.events.find(e=>e.kind==='card-change'&&e.card==='blackhole');return t<event.time?'轮转尚未提交':t<event.time+420?`${event.moves.length} 块沿真实控制点牵引 · 420ms轮转反馈`:'轮转已完成 · 没有持续吸引状态';
}
function paint(){
 const trace=traces[id],b=geometry.boards[trace.side],rt=ruleTime(time),mode=$('mode').value;
 const old=$('tone-compare').checked,renderImages=old?previousImages:images,renderManifest=old?previousManifest:manifest;
 ctx.clearRect(0,0,1440,960);ctx.drawImage(background,0,0);drawBoards(rt);
 if(!bodyOnly)common(time);
 const body=paintSkillBody(ctx,id,time,{board:b,cast:trace.cast,images:renderImages,manifest:renderManifest,ruleTime:rt,mode,trace});
 iso.fillStyle='#e9e3d8';iso.fillRect(0,0,480,380);
 const ib=id==='freeze'?{x:60,y:10,width:360,height:360}:{x:-128,y:-160,width:840,height:840},isolatedCast={...trace.cast,index:27};
 paintSkillBody(iso,id,time,{board:ib,cast:isolatedCast,images:renderImages,manifest:renderManifest,ruleTime:rt,mode,trace,isolated:true});
 const to=point(b,trace.cast.index),span=id==='freeze'?b.width:b.width*.62;
 const cropX=id==='freeze'?b.x:Math.max(b.x,Math.min(b.x+b.width-span,to.x-span/2)),cropY=id==='freeze'?b.y:Math.max(b.y,Math.min(b.y+b.height-span,to.y-span/2));
 zoom.fillStyle='#e9e3d8';zoom.fillRect(0,0,480,380);zoom.drawImage(scene,cropX,cropY,span,span,50,0,380,380);
 $('large-scene').getContext('2d').drawImage(scene,0,0);
 $('time').value=time;$('clock').textContent=(time/1000).toFixed(2)+'s';
 $('phase').textContent=time<240?'手牌凝聚':time<420?'光团生成':time<800?'光团飞行':time<880?'命中落点':body.mainActive?'本体展开':time<1630?'消散收尾':'状态 / 结算';
 $('state').textContent=stateText(rt)+(mode==='story'&&id==='blackhole'?'（视觉衔接示意，移动重放延后640ms）':'');
 $('tone-label').textContent=old?`对比：上一版v${previousManifest.entries[id].version}`:`当前：v${manifest.version}冰感与可见度增强`;
 window.__skillReviewState={id,time,ruleTime:rt,mode,bodyOnly,oldColors:old,bodyStart:body.start,mainActive:body.mainActive,scope:manifest.scope,state:$('state').textContent,targetSide:trace.side,cells:trace.cast.cells};
 paintStrip();
}
function paintStrip(){const old=$('tone-compare').checked,img=old?previousImages[id]:images[id];$('atlas-link').href=base+(old?previousManifest:manifest).entries[id].reviewPath;const strip=$('strip').getContext('2d');strip.fillStyle='#e9e3d8';strip.fillRect(0,0,1440,190);for(let n=0;n<8;n++){strip.drawImage(img,n%4*256,Math.floor(n/4)*256,256,256,n*180+5,0,170,170);strip.fillStyle='#9a8b76';strip.font='12px system-ui';strip.fillText(String(n+1).padStart(2,'0'),n*180+12,181);}}
function choose(next){id=next;time=0;bodyOnly=false;playing=true;$('play').textContent='暂停';$('time').max=info[id].duration;document.querySelectorAll('[data-skill]').forEach(b=>b.classList.toggle('active',b.dataset.skill===id));
 $('name').textContent=info[id].name+' · '+manifest.entries[id].mainMs+'ms主反馈';$('design').textContent=info[id].design;$('rule').textContent=info[id].rule;$('target').textContent=id==='luck'?'强化己方棋盘':'影响敌方棋盘';
 $('timing-note').textContent=id==='blackhole'?'完整衔接示意把真实轮转事件的视觉重放延后640ms，用于审动作语言；它不代表可直接接入。真实规则视图在出牌时同步420ms移动，光团命中更晚。正式接入需决定如何处理这段重叠。':'技能状态按现有出牌时刻生效；本体在通用命中后80ms展开，轻量状态提示按真实期限结束。主反馈不会延后规则结算。';
 $('atlas-link').href=base+manifest.entries[id].reviewPath;
 paint();
}
function seek(t){playing=false;time=t;$('play').textContent='播放';paint();}
document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>choose(b.dataset.skill));
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const start=$('mode').value==='rules'&&id==='blackhole'?240:880;seek({before:720,open:start+300,tail:start+manifest.entries[id].mainMs-130,state:{fire:2450,freeze:2000,blackhole:start+200,luck:2600}[id],end:{fire:3150,freeze:3360,blackhole:1950,luck:10600}[id]}[b.dataset.step]);});
 $('time').oninput=()=>seek(Number($('time').value));$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停':'播放';};$('restart').onclick=()=>{time=bodyOnly?($('mode').value==='rules'&&id==='blackhole'?240:880):0;playing=true;$('play').textContent='暂停';paint();};
 $('mode').onchange=()=>{time=0;bodyOnly=false;paint();};$('speed').onchange=()=>{last=performance.now();};
 $('tone-compare').onchange=paint;
 $('body-only').onclick=()=>{bodyOnly=true;time=$('mode').value==='rules'&&id==='blackhole'?240:880;playing=true;$('play').textContent='暂停';paint();};
 $('full-size').onclick=()=>$('large').showModal();$('close-large').onclick=()=>$('large').close();
window.__skillReview={choose,seek,paint,manifest,traces,geometry,images};choose('fire');window.__skillReviewReady=true;
function frame(now){const delta=Math.min(60,now-last);last=now;if(playing){time+=delta*Number($('speed').value);const end=bodyOnly?($('mode').value==='rules'&&id==='blackhole'?240:880)+manifest.entries[id].mainMs+450:info[id].duration;if(time>=end){if($('loop').checked)time=bodyOnly?($('mode').value==='rules'&&id==='blackhole'?240:880):0;else{time=end;playing=false;$('play').textContent='播放';}}paint();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
