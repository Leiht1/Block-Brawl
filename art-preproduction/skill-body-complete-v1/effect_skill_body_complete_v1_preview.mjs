import {paintSkillBody as paintEstablished} from '../skill-body-soft-v1/effect_skill_body_soft_v1_preview.mjs';
import {BODY_AT,CAST_AT} from './rule-trace.mjs';
import {IMMEDIATE} from './skill-specs.mjs';
import {paintSageBacklight} from './effect_sage_backlight_soft_v1_preview.mjs';
const clamp=v=>Math.max(0,Math.min(1,v)),cache=new WeakMap();
export function keyframe(image,frame){const k=Math.round(Math.max(0,Math.min(7,frame))*32);let map=cache.get(image);if(!map){map=new Map();cache.set(image,map);}if(map.has(k))return map.get(k);const f=k/32,lo=Math.floor(f),hi=Math.min(7,lo+1),a=f-lo,c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.globalAlpha=1-a;ctx.drawImage(image,lo%4*256,Math.floor(lo/4)*256,256,256,0,0,256,256);if(a){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.drawImage(image,hi%4*256,Math.floor(hi/4)*256,256,256,0,0,256,256);}map.set(k,c);if(map.size>32)map.delete(map.keys().next().value);return c;}
export function paintSkillBody(ctx,id,time,opt){
 if(['fire','freeze','blackhole'].includes(id))return paintEstablished(ctx,id,time,opt);
 const {board,cast,images,manifest,ruleTime=time,mode='story',trace,isolated=false}=opt,e=manifest.entries[id],u=board.width/8,p=i=>({x:board.x+(i%8+.5)*u,y:board.y+(Math.floor(i/8)+.5)*u}),to=p(trace.landing??cast.index);
 const start=mode==='rules'&&IMMEDIATE.includes(id)?CAST_AT:BODY_AT,age=time-start,f=clamp(age/e.mainMs),mainActive=age>=0&&age<e.mainMs;
 const sprite=(frame,at,size,alpha=1,rotation=0)=>{ctx.save();ctx.translate(at.x,at.y);ctx.rotate(rotation);ctx.globalAlpha=alpha;ctx.globalCompositeOperation='source-over';ctx.drawImage(keyframe(images[id],frame),-size/2,-size/2,size,size);ctx.restore();};
 const clipCells=cells=>{ctx.beginPath();for(const i of cells){const q=p(i);ctx.rect(q.x-u/2,q.y-u/2,u,u);}ctx.clip();};
 ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.width,board.height);ctx.clip();
 const eff=trace.changes.find(x=>x.kind==='effect'&&x.id===id),fades=Math.min(1,Math.max(0,age/60),Math.max(0,(e.mainMs-age)/120));
 if(id==='sage'&&isolated&&opt.sageBacklight!==false)paintSageBacklight(ctx,time,{board,ruleTime,trace});
 // User-requested upgrade-like gold veil; no flowing ribbons or particles.
 if(id==='sage'&&age>=0){const until=trace.at(ruleTime).buffs.sage??0;if(until>ruleTime){const envelope=clamp(age/250)*clamp((until-ruleTime)/180),breath=.96+.04*Math.sin(age/1800*Math.PI*2);ctx.save();ctx.globalAlpha=envelope;ctx.fillStyle=`rgba(255,197,58,${.29*breath})`;ctx.fillRect(board.x,board.y,board.width,board.height);ctx.shadowColor='#ffcc53';ctx.shadowBlur=u*.25;ctx.strokeStyle='rgba(255,219,101,.8)';ctx.lineWidth=u*.035;ctx.beginPath();ctx.roundRect(board.x+2,board.y+2,board.width-4,board.height-4,u*.12);ctx.stroke();ctx.restore();}}
 if(id==='quake'&&mainActive){if(isolated)sprite(f*7,to,u*2.3,fades);else{const cells=cast.cells;ctx.save();clipCells(cells);for(let n=0;n<cells.length;n++){const q=p(cells[n]),row=trace.candidate==='row',localAge=age-n*44,frame=row?clamp(localAge/340)*7:clamp(f-n*.012)*7,alpha=row?clamp(localAge/45)*clamp((340-localAge)/90):fades;if(alpha>0)sprite(frame,q,u*1.55,alpha,trace.candidate==='cross'?Math.atan2(q.y-to.y,q.x-to.x):0);}ctx.restore();}}
 if(id==='meteor'){
  if(isolated&&mainActive)sprite(f*7,to,u*2,1);
  else if(!isolated&&eff&&ruleTime>=CAST_AT){
   const impact=eff.now,flightStart=impact-600;
   if(ruleTime<impact){for(const i of cast.cells){const q=p(i);ctx.strokeStyle='#bb6339';ctx.globalAlpha=.78;ctx.lineWidth=u*.025;ctx.strokeRect(q.x-u*.44,q.y-u*.44,u*.88,u*.88);}
    if(ruleTime>=flightStart){const t=clamp((ruleTime-flightStart)/600),first=p(cast.path[0]),q={x:to.x,y:first.y+(to.y-first.y)*t};sprite(t*2.8,q,u*2.0,1);}}
   else if(ruleTime<impact+340){ctx.save();clipCells(cast.cells);sprite(3+4*(ruleTime-impact)/340,to,u*2.1,1-(ruleTime-impact)/400);ctx.restore();}
  }
 }
 if(id==='bomb'){
  if(isolated&&mainActive)sprite(f*7,to,u*1.8,1);
  else if(!isolated&&eff){if(ruleTime>=CAST_AT&&ruleTime<eff.now){ctx.save();clipCells(cast.cells);for(const i of cast.cells){const q=p(i);ctx.strokeStyle='#976143';ctx.globalAlpha=.65;ctx.lineWidth=u*.02;ctx.strokeRect(q.x-u*.46,q.y-u*.46,u*.92,u*.92);}ctx.restore();if(age>=0)sprite(age<600?Math.min(3,age/600*3):3,to,u*1.05,1);}
   if(ruleTime>=eff.now&&ruleTime<eff.now+360){ctx.save();clipCells(cast.cells);sprite(4+3*(ruleTime-eff.now)/360,to,u*3.5,1-(ruleTime-eff.now)/420);ctx.restore();}}
 }
 if(id==='storm'&&mainActive){const event=trace.events.find(x=>x.card==='storm'),cells=isolated?[cast.index]:event?.cells??[];for(const i of cells)sprite(f*7,p(i),u*(isolated?2.1:1.35),fades);}
 if(id==='fog'){
  const until=CAST_AT+6000,tail=clamp((ruleTime-until)/1200);
  if(age>=0&&ruleTime<until+1200){const frame=age<e.mainMs?f*3.4:ruleTime<until?3.6+.12*Math.sin(age/1700):4+tail*3;const alpha=clamp(age/160)*(1-tail*tail*(3-2*tail));sprite(frame,to,u*(isolated?3.3:4.3)*(.8+.2*clamp(age/500)),alpha);}
 }
 if(id==='overload'||id==='sage'||id==='rainbow'||id==='luck'){
  if(mainActive)sprite(f*7,id==='luck'?{x:to.x,y:to.y-u*.2*(1-clamp(f*3))}:to,u*(isolated?3.4:id==='overload'?1.7:1.8),fades);
 }
 ctx.restore();return {start,age,mainActive};
}

export function paintBuffBadge(ctx,id,time,{board,ruleTime,trace,images}){
 if(!['luck','overload'].includes(id)||time<BODY_AT)return null;
 const until=trace.at(ruleTime).buffs[id]??0;if(until<=ruleTime)return null;
 const x=board.x-123,y=board.y+73,width=108,height=185,gold=id==='luck',remaining=(until-ruleTime)/1000;
 ctx.save();ctx.fillStyle=gold?'#fff0cbed':'#e0f1e8f2';ctx.strokeStyle=gold?'#b78221':'#428c83';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,width,height,16);ctx.fill();ctx.stroke();
 ctx.drawImage(keyframe(images[id],gold?2:3),30,30,196,196,x+14,y+5,80,80);
 ctx.textAlign='center';ctx.fillStyle=gold?'#714b14':'#215c58';ctx.font='bold 21px Microsoft Yahei';ctx.fillText(gold?'幸运星':'超载',x+width/2,y+105);
 ctx.font='bold 29px Microsoft Yahei';ctx.fillText(remaining.toFixed(1)+'s',x+width/2,y+140);
 ctx.font='bold 18px Microsoft Yahei';ctx.fillText(gold?'特殊率22%':'得分 ×2',x+width/2,y+166);ctx.restore();
 return {id,remaining,until,x,y,width,height,iconSize:80};
}
