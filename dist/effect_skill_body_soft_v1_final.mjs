// Approved raster keyframes with read-only geometry and real event clocks.
import {SKILL_ASSETS,WILD_TILE,SKILL_BODY_ENABLED} from './skill-body-assets.mjs';
import {CARD_CONFIG} from './cards.mjs';
const clamp=v=>Math.max(0,Math.min(1,v));
let images;
export function skillImages(){
 if(!images){images={};if(typeof Image!=='undefined')for(const [id,url] of [...Object.entries(SKILL_ASSETS).map(([id,e])=>[id,e.url]),['wild',WILD_TILE]]){const img=new Image();img.src=url;images[id]=img;}}
 return images;
}
const blendCache=new WeakMap();
function keyframe(img,frame){
 const k=Math.round(Math.max(0,Math.min(7,frame))*32);let cache=blendCache.get(img);if(!cache){cache=new Map();blendCache.set(img,cache);}if(cache.has(k))return cache.get(k);
 const f=k/32,lo=Math.floor(f),hi=Math.min(7,lo+1),a=f-lo,c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.globalAlpha=1-a;ctx.drawImage(img,lo%4*256,Math.floor(lo/4)*256,256,256,0,0,256,256);
 if(a){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.drawImage(img,hi%4*256,Math.floor(hi/4)*256,256,256,0,0,256,256);}
 cache.set(k,c);if(cache.size>32)cache.delete(cache.keys().next().value);return c;
}
export function paintWildTile(ctx,size){if(!SKILL_BODY_ENABLED)return false;const img=skillImages().wild;if(!img?.complete||!img.naturalWidth)return false;ctx.drawImage(img,-size/2,-size/2,size,size);return true;}
function clipBoard(ctx,b){
 const u=b.width/b.columns;ctx.beginPath();
 if(b.terrain)for(let i=0;i<b.terrain.length;i++){if(b.terrain[i]==='cell')ctx.rect(b.x+i%b.columns*u,b.y+Math.floor(i/b.columns)*u,u,u);}
 else ctx.rect(b.x,b.y,b.width,b.height);
 ctx.clip();
}
export function paintSageBacklight(ctx,age,remaining,b){
 if(age<0||remaining<=0)return;
 const envelope=clamp(age/400)*clamp(remaining/220),pulse=.93+.07*Math.sin(age/1800*Math.PI*2),{x,y,width,height}=b;
 ctx.save();clipBoard(ctx,b);ctx.globalAlpha=envelope*pulse;
 const well=(cx,cy,rx,ry,strength)=>{ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(255,249,189,${strength})`);g.addColorStop(.32,`rgba(255,226,105,${strength*.78})`);g.addColorStop(.7,`rgba(255,199,55,${strength*.32})`);g.addColorStop(1,'rgba(255,199,55,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();};
 well(x+width*.5,y+height*.99,width*.72,height*.31,.94);
 const phase=(age%2400)/2400,other=((age+1200)%2400)/2400;
 well(x+width*.29,y+height*(.98-phase*.58),width*.29,height*.6,Math.sin(phase*Math.PI)**2*.8);
 well(x+width*.73,y+height*(.98-other*.58),width*.29,height*.6,Math.sin(other*Math.PI)**2*.8);
 ctx.restore();
}
export function paintSkillBody(ctx,r,now,b,imgs=skillImages()){
 const id=r.id,e=SKILL_ASSETS[id],img=imgs[id];if(!e||!img?.complete||!img.naturalWidth||r.noTarget)return;
 const u=b.width/b.columns,point=i=>({x:b.x+(i%b.columns+.5)*u,y:b.y+(Math.floor(i/b.columns)+.5)*u}),to=point(r.landing??r.index),age=now-r.bodyAt,f=clamp(age/e.mainMs),main=age>=0&&age<e.mainMs,fade=clamp(age/60)*clamp((e.mainMs-age)/120),color=e.alpha;
 const sprite=(frame,p,size,alpha=1,rotation=0)=>{if(alpha<=0)return;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(rotation);ctx.globalAlpha=alpha;ctx.globalCompositeOperation='source-over';ctx.drawImage(keyframe(img,frame),-size/2,-size/2,size,size);ctx.restore();};
 const clipCells=cells=>{ctx.beginPath();for(const i of cells){const p=point(i);ctx.rect(p.x-u/2,p.y-u/2,u,u);}ctx.clip();};
 const mark=(cells,c,alpha=.8)=>{ctx.save();ctx.strokeStyle=c;ctx.lineWidth=u*.025;ctx.globalAlpha=alpha;for(const i of cells){const p=point(i);ctx.strokeRect(p.x-u*.44,p.y-u*.44,u*.88,u*.88);}ctx.restore();};
 ctx.save();clipBoard(ctx,b);
 if(id==='fire'){
  if(main&&r.cells.length){const a=point(r.cells[0]),z=point(r.cells.at(-1));ctx.save();clipCells(r.cells);sprite(f*7,{x:a.x+(z.x-a.x)*clamp(f/.7),y:a.y},u*2.45,fade);ctx.restore();}
  if(!r.effect){mark(r.cells,color.markColor??'#b84d16',color.mark??.9);if(age>=e.mainMs)for(const i of r.cells){const p=point(i);sprite(6,{x:p.x,y:p.y+u*.3},u*.62,color.state??.65);}}
  if(r.effect&&now<r.effect.now+300){const t=(now-r.effect.now)/300;for(const i of r.effect.cells)sprite(5+2*t,point(i),u,(color.settle??.75)*(1-t));}
 }
 if(id==='quake'){
  if(main){ctx.save();clipCells(r.cells);for(let n=0;n<r.cells.length;n++){const a=age-n*44;sprite(clamp(a/340)*7,point(r.cells[n]),u*1.55,clamp(a/45)*clamp((340-a)/90));}ctx.restore();}
  // This settlement mark follows the actual clear, including a queued clear.
  if(r.effect&&now<r.effect.now+240){const t=(now-r.effect.now)/240;for(const i of r.effect.cells)sprite(4+3*t,point(i),u,1-t);}
 }
 if(id==='meteor'){
  const due=r.now+CARD_CONFIG.meteorMs;
  if(!r.effect){mark(r.cells,'#bb6339');if(now>=Math.max(r.bodyAt,due-600)){const t=clamp((now-(due-600))/600),first=point(r.path[0]??r.index);sprite(t*2.8,{x:to.x,y:first.y+(to.y-first.y)*t},u*2);}}
  else if(now<r.effect.now+340){ctx.save();clipCells(r.effect.cells);const t=(now-r.effect.now)/340;sprite(3+4*t,to,u*2.1,1-t*.85);ctx.restore();}
 }
 if(id==='bomb'){
  if(!r.effect){mark(r.cells,'#976143',.65);if(age>=0)sprite(Math.min(3,age/600*3),to,u*1.05);}
  else if(now<r.effect.now+360){const t=(now-r.effect.now)/360;ctx.save();clipCells(r.effect.cells);sprite(4+3*t,to,u*3.5,1-t*.85);ctx.restore();}
 }
 if(id==='freeze'){
  if(age>=0&&now<r.until){const alpha=main?(color.main??.96)*(1-(1-(color.state??.68)/(color.main??.96))*clamp((age-e.mainMs+170)/170)):(color.state??.68);for(const i of r.cells){const p=point(i),distance=Math.hypot(p.x-to.x,p.y-to.y)/b.width,local=clamp((f-distance*.28)*1.2);if(local>0)sprite(main?Math.min(4,local*6):4,p,u*1.08,alpha*clamp(age/75));}}
  if(now>=r.until&&now<r.until+360){const t=(now-r.until)/360;for(const i of r.cells.filter((_,n)=>n%4===0))sprite(5+2*t,point(i),u*1.06,(color.thaw??.7)*(1-t));}
 }
 if(id==='blackhole'){
  if(main)sprite(f*7,to,u*1.52,fade);
  const change=r.change,t=change?clamp((now-change.time)/(change.duration||420)):1;
  if(change&&t<1){sprite(Math.min(3,t*3),to,u*1.25,.85);ctx.save();ctx.strokeStyle=color.trailColor??'#3b61a2';ctx.lineWidth=u*.022;ctx.globalAlpha=(color.trail??.85)*(1-t);for(const m of change.moves??[]){const a=point(m.from),z=point(m.to);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(to.x,to.y,z.x,z.y);ctx.stroke();}ctx.restore();}
 }
 if(id==='storm'){
  // Use changed cells, never the drop cell as a pretend six-cell effect.
  if(r.effect){const a=now-Math.max(r.bodyAt,r.effect.now),t=clamp(a/e.mainMs);if(a>=0&&a<e.mainMs)for(const i of r.effect.cells)sprite(t*7,point(i),u*1.35,clamp(a/60)*clamp((e.mainMs-a)/120));}
 }
 if(id==='fog'&&age>=0&&now<r.until+1200){const tail=clamp((now-r.until)/1200),frame=age<e.mainMs?f*3.4:now<r.until?3.6+.12*Math.sin(age/1700):4+tail*3;sprite(frame,to,u*4.3*(.8+.2*clamp(age/500)),clamp(age/160)*(1-tail*tail*(3-2*tail)));}
 if(id==='sage'&&age>=0&&now<r.until){
  ctx.save();ctx.globalAlpha=clamp(age/250)*clamp((r.until-now)/180);ctx.fillStyle=`rgba(255,197,58,${.29*(.96+.04*Math.sin(age/1800*Math.PI*2))})`;ctx.fillRect(b.x,b.y,b.width,b.height);ctx.shadowColor='#ffcc53';ctx.shadowBlur=u*.25;ctx.strokeStyle='rgba(255,219,101,.8)';ctx.lineWidth=u*.035;ctx.beginPath();ctx.roundRect(b.x+2,b.y+2,b.width-4,b.height-4,u*.12);ctx.stroke();ctx.restore();
 }
 if(['overload','sage','rainbow','luck'].includes(id)&&main&&r.resolved){const p=id==='luck'?{x:to.x,y:to.y-u*.2*(1-clamp(f*3))}:to;sprite(f*7,p,u*(id==='overload'?1.7:1.8),fade);}
 ctx.restore();
}
