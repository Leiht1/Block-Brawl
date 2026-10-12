import {BODY_AT} from './rule-trace.mjs';
const clamp=v=>Math.max(0,Math.min(1,v));

// Render between terrain and tiles so illumination comes through the board gaps.
export function paintSageBacklight(ctx,time,{board,ruleTime=time,trace}){
 const age=time-BODY_AT,until=trace.at(ruleTime).buffs.sage??0;
 if(age<0||until<=ruleTime)return null;
 const envelope=clamp(age/400)*clamp((until-ruleTime)/220);
 const pulse=.93+.07*Math.sin(age/1800*Math.PI*2);
 const {x,y,width,height=width}=board;
 ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.globalAlpha=envelope*pulse;
 const well=(cx,cy,rx,ry,strength)=>{ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);
  const glow=ctx.createRadialGradient(0,0,0,0,0,1);glow.addColorStop(0,`rgba(255,249,189,${strength})`);glow.addColorStop(.32,`rgba(255,226,105,${strength*.78})`);glow.addColorStop(.7,`rgba(255,199,55,${strength*.32})`);glow.addColorStop(1,'rgba(255,199,55,0)');ctx.fillStyle=glow;ctx.fillRect(-1,-1,2,2);ctx.restore();};
 // A broad floor glow and two soft wells; no lines, particles or crossing ribbons.
 well(x+width*.5,y+height*.99,width*.72,height*.31,.94);
 const rise=(age%2400)/2400,other=((age+1200)%2400)/2400;
 well(x+width*.29,y+height*(.98-rise*.58),width*.29,height*.6,Math.sin(rise*Math.PI)**2*.8);
 well(x+width*.73,y+height*(.98-other*.58),width*.29,height*.6,Math.sin(other*Math.PI)**2*.8);
 ctx.restore();return {layer:'terrain-before-tiles',alpha:envelope*pulse,until,rise};
}
