import {createCardCastVfx} from './card-cast-vfx.mjs';
import {createSkillBodyVfx} from './skill-body-vfx.mjs';
// Presentation only: every reward, draw and board mutation has already committed.
export function createCardEffects(flow,boards,energy){
  const canvas=document.createElement('canvas');canvas.className='card-vfx';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const casts=createCardCastVfx(flow,boards,ctx),body=createSkillBodyVfx(flow,boards,ctx,casts);
  let motes=[],pulses=[],pendingDraws=[],flashUntil=0,flashFrom=0;
  const point=(side,index)=>{const r=boards[side].getBoundingClientRect(),e=flow.arena.engines[side];return {x:r.left+(index%e.width+.5)*r.width/e.width,y:r.top+(Math.floor(index/e.width)+.5)*r.height/e.height,unit:r.width/e.width};};
  const center=node=>{const r=node.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
  function ring(x,y,r,color,alpha=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);ctx.stroke();}
  function energyMote(x,y){
    const halo=ctx.createRadialGradient(x,y,3,x,y,22);halo.addColorStop(0,'#fff3b8e6');halo.addColorStop(.35,'#ffd44799');halo.addColorStop(1,'#ffbf2400');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffe16a';ctx.strokeStyle='#d78c16';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fffef0';ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff5c6';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x+9,y);ctx.moveTo(x,y-9);ctx.lineTo(x,y+9);ctx.stroke();
  }
  function event(e){
    casts.event(e);body.event(e);
    if(e.kind==='clear-energy'&&e.side==='player'){
      const cells=e.cells,count=Math.min(reduced?3:14,cells.length),to=center(energy),duration=reduced?250:Math.min(450,250+Math.hypot(point(e.side,cells[0]).x-to.x,point(e.side,cells[0]).y-to.y)*.18);
      for(let n=0;n<count;n++){const p=point(e.side,cells[Math.floor(n*cells.length/count)]),angle=n*2.4;motes.push({from:p,to,dx:Math.cos(angle)*22,dy:Math.sin(angle)*18,start:e.now,duration,amount:e.amount,last:n===count-1});}
      motes=motes.slice(-70);
    }
    if(e.kind==='charged'&&e.side==='player'){flashFrom=Math.max(e.now,...motes.map(m=>m.start+m.duration));flashUntil=flashFrom+420;pulses.push({start:flashFrom,full:true});}
  }
  function render(now,battle){
    const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    if(!battle){casts.reset();body.reset();energy.classList.remove('energy-complete','energy-absorbing');return;}
    energy.classList.toggle('energy-complete',now>=flashFrom&&now<flashUntil);
    motes=motes.filter(m=>{
      const t=Math.max(0,(now-m.start)/m.duration);if(t>=1){if(m.last)pulses.push({start:now,amount:m.amount});return false;}
      const spread=Math.min(1,t/.18),f=Math.max(0,(t-.18)/.82),s=1-f,from={x:m.from.x+m.dx*spread,y:m.from.y+m.dy*spread},control={x:(from.x+m.to.x)/2+m.dx*2,y:Math.min(from.y,m.to.y)-60};
      ctx.globalAlpha=1;energyMote(s*s*from.x+2*s*f*control.x+f*f*m.to.x,s*s*from.y+2*s*f*control.y+f*f*m.to.y);return true;
    });
    pulses=pulses.filter(p=>{const t=(now-p.start)/480;if(t<0)return true;if(t>=1)return false;const to=center(energy);ring(to.x,to.y,8+t*32,'#ffdf84',1-t);ctx.globalAlpha=1-t;ctx.fillStyle='#ffe6a4';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(p.full?'充能完成':`+${Number(p.amount.toFixed(1))}`,to.x,to.y-16-t*16);return true;}).slice(-12);
    energy.classList.toggle('energy-absorbing',pulses.some(p=>p.amount&&now>=p.start&&now<p.start+240));
    ctx.globalAlpha=1;casts.render(now);body.render(now,battle);
    pendingDraws=pendingDraws.filter(d=>{if(now<d.at)return true;d.run();return false;});
  }
  return {event,render,prepareCast:casts.prepare,cancelCast:casts.cancel,
    boardEvent(side,e){casts.boardEvent(side,e);body.boardEvent(side,e);},paintUnderlay:body.paintUnderlay,
    snapshot:()=>({...casts.snapshot(),skillBody:body.snapshot()}),
    delayDraw(now,run){pendingDraws.push({at:Math.max(now,...motes.map(m=>m.start+m.duration))+180,run});},
    reset(){casts.reset();body.reset();motes=[];pulses=[];pendingDraws=[];flashUntil=flashFrom=0;ctx.clearRect(0,0,canvas.width,canvas.height);energy.classList.remove('energy-complete','energy-absorbing');for(const b of Object.values(boards))b.style.translate='';}
  };
}
