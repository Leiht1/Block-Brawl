// Preview-only raster presentation. No imports into the production game.
import {BODY_AT,CAST_AT} from './rule-trace.mjs';
export async function loadSkillAssets(manifest){const images={};await Promise.all(Object.entries(manifest.entries).map(async([id,e])=>{const img=new Image();img.src='/art-preproduction/skill-body-soft-v1/'+e.reviewPath;await img.decode();images[id]=img;}));return images;}
const clamp=t=>Math.max(0,Math.min(1,t));
const blendCache=new WeakMap();
// Interpolate premultiplied pixels on transparent scratch surfaces. The final
// board draw remains source-over; no bloom or additive board compositing.
function blendFrame(img,frame){let cache=blendCache.get(img);if(!cache){cache=new Map();blendCache.set(img,cache);}const key=Math.round(frame*32);if(cache.has(key))return cache.get(key);
 const value=key/32,lo=Math.floor(value),hi=Math.min(7,lo+1),f=value-lo,canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 c.globalAlpha=1-f;c.drawImage(img,lo%4*256,Math.floor(lo/4)*256,256,256,0,0,256,256);
 if(f){c.globalCompositeOperation='lighter';c.globalAlpha=f;c.drawImage(img,hi%4*256,Math.floor(hi/4)*256,256,256,0,0,256,256);}
 cache.set(key,canvas);if(cache.size>32)cache.delete(cache.keys().next().value);return canvas;
}
export function paintSkillBody(ctx,id,time,{board,cast,images,manifest,ruleTime=time,mode='story',trace,isolated=false}){
 const unit=board.width/8,point=i=>({x:board.x+(i%8+.5)*unit,y:board.y+(Math.floor(i/8)+.5)*unit}),to=point(cast.index),entry=manifest.entries[id];
 const start=mode==='rules'&&id==='blackhole'?CAST_AT:BODY_AT,age=time-start;
 const color=entry.renderAlpha??{main:{fire:.72,freeze:.42,blackhole:.74,luck:.78}[id],state:id==='freeze'?.20:id==='luck'?.48:.28,mark:.5,markColor:'#d6a06c',settle:.35,thaw:.25,trail:.3,trailColor:'#dce8f4',speck:.25};
 const sprite=(frame,p,size,alpha=1,rotation=0)=>{
  frame=Math.max(0,Math.min(7,frame));const lo=Math.floor(frame),hi=Math.min(7,lo+1),f=frame-lo;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(rotation);ctx.globalCompositeOperation='source-over';
  if(entry.presentation==='premultiplied-keyframe-blend'){ctx.globalAlpha=alpha;ctx.drawImage(blendFrame(images[id],frame),-size/2,-size/2,size,size);}
  else for(const [n,a] of [[lo,1-f],[hi,f]]){if(!a)continue;ctx.globalAlpha=alpha*a;ctx.drawImage(images[id],n%4*256,Math.floor(n/4)*256,256,256,-size/2,-size/2,size,size);}ctx.restore();
 };
 const clip=()=>{ctx.beginPath();ctx.rect(board.x,board.y,board.width,board.height);ctx.clip();};
 ctx.save();clip();
 if(age>=0&&age<entry.mainMs){
  const f=clamp(age/entry.mainMs),frame=f*7,fade=Math.min(1,age/75,(entry.mainMs-age)/110);
  if(id==='fire'){
   const cells=[...cast.cells].sort((a,b)=>a-b),first=point(cells[0]),last=point(cells.at(-1));
   ctx.save();ctx.beginPath();for(const i of cells){const p=point(i);ctx.rect(p.x-unit/2,p.y-unit/2,unit,unit);}ctx.clip();
   const sweep=clamp(f/.7),p={x:first.x+(last.x-first.x)*sweep,y:first.y};sprite(frame,p,unit*2.45,color.main*fade);ctx.restore();
  }else if(id==='freeze'){
   // Thin raster frost at cell edges; the central symbols remain empty.
   const frostAlpha=isolated?color.main*fade:color.main*Math.min(1,age/75)*(1-(1-color.state/color.main)*clamp((age-entry.mainMs+170)/170));
   for(const i of cast.cells){const p=point(i),distance=Math.hypot(p.x-to.x,p.y-to.y)/board.width,local=clamp((f-distance*.28)*1.2);if(local>0)sprite(Math.min(4,local*6),p,unit*1.08,frostAlpha);}
  }else if(id==='blackhole'){
   sprite(frame,to,unit*1.52,color.main*fade);
   const moves=trace.events.find(e=>e.kind==='card-change'&&e.card==='blackhole')?.moves||[];
   const pull=clamp(age/420);
   if(age<420)for(const m of moves){const from=point(m.from),end=point(m.to);ctx.strokeStyle=color.trailColor;ctx.lineWidth=unit*.022;ctx.globalAlpha=color.trail*(1-pull);ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.quadraticCurveTo(to.x,to.y,end.x,end.y);ctx.stroke();}
  }else if(id==='luck'){
   sprite(frame,{x:to.x,y:to.y-unit*.24*(1-clamp(f*3))},unit*1.8,color.main*fade);
   if(f>.3)for(const i of [9,46,54]){const p=point(i);sprite(6,p,unit*.42,color.speck*Math.sin(Math.PI*f));}
  }
 }
 if(!isolated){
  if(id==='fire'&&ruleTime>=CAST_AT&&ruleTime<CAST_AT+2200)for(const i of cast.cells){const p=point(i);ctx.strokeStyle=color.markColor;ctx.lineWidth=unit*.027;ctx.globalAlpha=color.mark;ctx.strokeRect(p.x-unit*.44,p.y-unit*.44,unit*.88,unit*.88);if(age>entry.mainMs)sprite(6,{x:p.x,y:p.y+unit*.3},unit*.62,color.state);}
  if(id==='freeze'&&ruleTime>=CAST_AT&&ruleTime<CAST_AT+3000&&age>=entry.mainMs)for(const i of cast.cells){sprite(4,point(i),unit*1.06,color.state);}
  if(id==='freeze'&&ruleTime>=CAST_AT+3000&&ruleTime<CAST_AT+3360){const f=(ruleTime-CAST_AT-3000)/360;for(const i of cast.cells.filter((_,n)=>n%4===0))sprite(5+2*f,point(i),unit*1.06,color.thaw*(1-f));}
  if(id==='luck'&&ruleTime>=CAST_AT&&ruleTime<CAST_AT+10000&&age>=entry.mainMs){sprite(4,{x:board.x+board.width-unit*.3,y:board.y+unit*.3},unit*.65,color.state);}
  const effect=trace.changes.find(e=>e.kind==='effect'&&e.id==='fire');
  if(id==='fire'&&effect&&ruleTime>=effect.now&&ruleTime<effect.now+300)for(const i of effect.cells){const p=point(i),f=(ruleTime-effect.now)/300;sprite(5+2*f,p,unit*1.0,color.settle*(1-f));}
 }
 ctx.restore();
 return {start,age,mainActive:age>=0&&age<entry.mainMs};
}
