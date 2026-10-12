// Scheme C, presentation-only canvas source. No textures, additive blend or game state.
export const SOFT_CAST=Object.freeze({version:1,status:'preview',orbRadius:6,haloRadius:15,trailWidth:1.15,trailAlpha:.22,impactAlpha:.32,impactCellRadius:.52});
export const SOFT_CAST_COLORS=Object.freeze({attack:[248,233,206],control:[220,236,246],buff:[246,239,216]});
const rgba=(rgb,a)=>`rgba(${rgb.join(',')},${a})`;
function halo(ctx,x,y,r,rgb,alpha){
 const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(rgb,alpha));g.addColorStop(.32,rgba(rgb,alpha*.55));g.addColorStop(1,rgba(rgb,0));
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function ellipse(ctx,x,y,rx,ry,rgb,alpha,width=1){ctx.strokeStyle=rgba(rgb,alpha);ctx.lineWidth=width;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke();}
export function paintSoftCast(ctx,type,stage,time,p,{unit=60,size=[116,174],trail=[],reduced=false}={}){
 const rgb=SOFT_CAST_COLORS[type],scale=Math.max(.35,Math.min(1,unit/60));
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
 if(stage==='activation'){
  const t=Math.min(1,Math.max(0,time/240)),fade=.13+.09*Math.sin(t*Math.PI);
  halo(ctx,p.x,p.y,24,rgb,fade);ellipse(ctx,p.x,p.y,size[0]*.35,size[1]*.28,rgb,fade,1);
  ellipse(ctx,p.x,p.y+size[1]*.28,13*(1-t)+5,4,rgb,.18,1);
 }else if(stage==='release'){
  const t=Math.min(1,Math.max(0,time/200)),a=Math.sin(t*Math.PI)*.28;
  halo(ctx,p.x,p.y,12+t*10,rgb,a);ellipse(ctx,p.x,p.y,5+9*t,4+6*t,rgb,a,1);
 }else if(stage==='flight'){
  if(!reduced&&trail.length>1){ctx.strokeStyle=rgba(rgb,SOFT_CAST.trailAlpha);ctx.lineWidth=SOFT_CAST.trailWidth*scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(trail[0].x,trail[0].y);for(const q of trail.slice(1))ctx.lineTo(q.x,q.y);ctx.stroke();}
  halo(ctx,p.x,p.y,SOFT_CAST.haloRadius*scale,rgb,.30);
  const r=SOFT_CAST.orbRadius*scale;ctx.fillStyle=rgba(rgb,.57);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,253,246,.65)';ctx.beginPath();ctx.arc(p.x-r*.2,p.y-r*.2,r*.38,0,Math.PI*2);ctx.fill();
  if(!reduced&&trail.length>3){const q=trail[3];ctx.fillStyle=rgba(rgb,.27);ctx.beginPath();ctx.arc(q.x,q.y,1.1*scale,0,Math.PI*2);ctx.fill();}
 }else if(stage==='impact'){
  const t=Math.min(1,Math.max(0,time/400)),a=SOFT_CAST.impactAlpha*(1-t)*(1-t),r=unit*(.17+.35*t);
  // Empty center and a flattened ripple retain the tile symbol and grid boundaries.
  ellipse(ctx,p.x,p.y,r,r*.62,rgb,a,1.25*scale);
  if(t>.15)ellipse(ctx,p.x,p.y,r*.72,r*.44,rgb,a*.45,.8*scale);
  if(t<.35)halo(ctx,p.x,p.y,unit*.19,rgb,.15*(1-t/.35));
  if(!reduced)for(let n=0;n<3;n++){const angle=n*2.094+.5,x=p.x+Math.cos(angle)*unit*(.12+t*.2),y=p.y+Math.sin(angle)*unit*(.07+t*.12);ctx.fillStyle=rgba(rgb,a*.65);ctx.beginPath();ctx.arc(x,y,1.3*scale*(1-t),0,Math.PI*2);ctx.fill();}
 }
 ctx.restore();
}
