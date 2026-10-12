// Independent review candidate only. Not imported by any game module.
export const SETTINGS=Object.freeze({version:2,status:'preview',orbRadius:17,haloRadius:40,trailWidth:3.2,trailAlpha:.64,impactAlpha:.72,impactCellRadius:.95});
const palettes={attack:{light:[249,237,210],edge:[179,139,81]},control:{light:[223,240,251],edge:[115,161,190]},buff:{light:[248,241,219],edge:[159,148,99]}};
const rgba=(rgb,a)=>`rgba(${rgb.join(',')},${a})`;
function halo(ctx,p,r,rgb,a){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,rgba(rgb,a));g.addColorStop(.4,rgba(rgb,a*.5));g.addColorStop(1,rgba(rgb,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();}
function ring(ctx,p,r,rgb,a,w=2,flat=.66){ctx.strokeStyle=rgba(rgb,a);ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*flat,0,0,Math.PI*2);ctx.stroke();}
function star(ctx,x,y,r,rgb,a){ctx.strokeStyle=rgba(rgb,a);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.stroke();}
export function paintCandidate(ctx,type,stage,time,p,{unit=60,size=[116,153],trail=[],amount=1}={}){
 const {light,edge}=palettes[type],s=Math.max(.55,Math.min(1.1,unit/60))*amount;
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
 if(stage==='activation'){
  const t=Math.min(1,time/240),a=.24+.18*Math.sin(t*Math.PI);
  halo(ctx,p,44*s,light,a);ring(ctx,p,size[0]*.43,light,a,2.2,.72);
  for(let n=0;n<3;n++){const a=n*2.094+t*.6,r=(34-12*t)*s;star(ctx,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.7,3*s,light,.52);}
 }else if(stage==='release'){
  const t=Math.min(1,time/200),a=Math.sin(t*Math.PI);
  halo(ctx,p,(25+22*t)*s,light,.4*a);ring(ctx,p,(9+21*t)*s,light,.66*a,2.4*s,.8);
  ring(ctx,p,(8+20*t)*s,edge,.2*a,.8*s,.8);
 }else if(stage==='flight'){
  if(trail.length>1){
   ctx.lineCap='round';ctx.lineJoin='round';
   for(let i=1;i<trail.length;i++){const f=i/(trail.length-1),a=SETTINGS.trailAlpha*f;ctx.beginPath();ctx.moveTo(trail[i-1].x,trail[i-1].y);ctx.lineTo(trail[i].x,trail[i].y);ctx.strokeStyle=rgba(light,a*.22);ctx.lineWidth=(3+4*f)*s;ctx.stroke();ctx.strokeStyle=rgba(light,a);ctx.lineWidth=(.6+SETTINGS.trailWidth*f)*s;ctx.stroke();}
  }
  halo(ctx,p,SETTINGS.haloRadius*s,light,.42);
  const r=SETTINGS.orbRadius*s,g=ctx.createRadialGradient(p.x-r*.28,p.y-r*.3,1,p.x,p.y,r);
  g.addColorStop(0,'rgba(255,252,242,.95)');g.addColorStop(.38,rgba(light,.9));g.addColorStop(.8,rgba(light,.74));g.addColorStop(1,rgba(edge,.35));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=rgba(light,.72);ctx.lineWidth=1.1*s;ctx.beginPath();ctx.arc(p.x,p.y,r*.95,-2.6,-.3);ctx.stroke();
  if(trail.length>5){const q=trail[trail.length-5];star(ctx,q.x,q.y,2.7*s,light,.45);}
 }else if(stage==='impact'){
  const t=Math.min(1,Math.max(0,time/440)),a=SETTINGS.impactAlpha*Math.sin(Math.PI*(.18+.82*t)),r=unit*(.27+.68*t)*amount;
  halo(ctx,p,unit*.40*amount,light,.28*(1-t));
  ring(ctx,p,r,edge,a*.20,4*s);ring(ctx,p,r,light,a,2.4*s);
  if(t>.12)ring(ctx,p,r*.67,light,a*.6,1.5*s);
  for(let n=0;n<4;n++){const angle=n*Math.PI/2+.4,x=p.x+Math.cos(angle)*r*.8,y=p.y+Math.sin(angle)*r*.52;star(ctx,x,y,3.4*s*(1-t*.5),light,a*.7);}
 }
 ctx.restore();
}
