import {createCardCastVfx} from './card-cast-vfx.mjs';
// Presentation only: every reward, draw and board mutation has already committed.
export function createCardEffects(flow,boards,energy){
  const canvas=document.createElement('canvas');canvas.className='card-vfx';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const casts=createCardCastVfx(flow,boards,ctx);
  let motes=[],bursts=[],pulses=[],pendingDraws=[],flashUntil=0,flashFrom=0;
  const point=(side,index)=>{const r=boards[side].getBoundingClientRect(),e=flow.arena.engines[side];return {x:r.left+(index%e.width+.5)*r.width/e.width,y:r.top+(Math.floor(index/e.width)+.5)*r.height/e.height,unit:r.width/e.width};};
  const center=node=>{const r=node.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
  function ring(x,y,r,color,alpha=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);ctx.stroke();}
  function glow(x,y,r,color){ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  function energyMote(x,y){
    const halo=ctx.createRadialGradient(x,y,3,x,y,22);halo.addColorStop(0,'#fff3b8e6');halo.addColorStop(.35,'#ffd44799');halo.addColorStop(1,'#ffbf2400');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffe16a';ctx.strokeStyle='#d78c16';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fffef0';ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff5c6';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x+9,y);ctx.moveTo(x,y-9);ctx.lineTo(x,y+9);ctx.stroke();
  }
  function event(e){
    casts.event(e);
    if(e.kind==='clear-energy'&&e.side==='player'){
      const cells=e.cells,count=Math.min(reduced?3:14,cells.length),to=center(energy),duration=reduced?250:Math.min(450,250+Math.hypot(point(e.side,cells[0]).x-to.x,point(e.side,cells[0]).y-to.y)*.18);
      for(let n=0;n<count;n++){const p=point(e.side,cells[Math.floor(n*cells.length/count)]),angle=n*2.4;motes.push({from:p,to,dx:Math.cos(angle)*22,dy:Math.sin(angle)*18,start:e.now,duration,amount:e.amount,last:n===count-1});}
      motes=motes.slice(-70);
    }
    if(e.kind==='charged'&&e.side==='player'){flashFrom=Math.max(e.now,...motes.map(m=>m.start+m.duration));flashUntil=flashFrom+420;pulses.push({start:flashFrom,full:true});}
    if(e.kind==='cast'&&e.card.id==='freeze')bursts.push({...e,id:'freeze',start:e.now,duration:450});
    if(e.kind==='effect')bursts.push({...e,start:e.now,duration:e.id==='blackhole'?650:520});
    if(e.kind==='thaw')bursts.push({...e,targetSide:e.side,id:'thaw',start:e.now,duration:420});
    bursts=bursts.slice(-18);
  }
  function render(now,battle){
    const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);if(!battle){casts.reset();energy.classList.remove('energy-complete','energy-absorbing');return;}
    energy.classList.toggle('energy-complete',now>=flashFrom&&now<flashUntil);
    motes=motes.filter(m=>{
      const t=Math.max(0,(now-m.start)/m.duration);if(t>=1){if(m.last){pulses.push({start:now,amount:m.amount});}return false;}
      const spread=Math.min(1,t/.18),f=Math.max(0,(t-.18)/.82),s=1-f;
      const from={x:m.from.x+m.dx*spread,y:m.from.y+m.dy*spread},control={x:(from.x+m.to.x)/2+m.dx*2,y:Math.min(from.y,m.to.y)-60};
      const x=s*s*from.x+2*s*f*control.x+f*f*m.to.x,y=s*s*from.y+2*s*f*control.y+f*f*m.to.y;
      ctx.globalAlpha=1;energyMote(x,y);return true;
    });
    pulses=pulses.filter(p=>{const t=(now-p.start)/480;if(t<0)return true;if(t>=1)return false;const to=center(energy);ring(to.x,to.y,8+t*32,'#ffdf84',1-t);ctx.globalAlpha=1-t;ctx.fillStyle='#ffe6a4';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(p.full?'充能完成':`+${Number(p.amount.toFixed(1))}`,to.x,to.y-16-t*16);return true;}).slice(-12);
    energy.classList.toggle('energy-absorbing',pulses.some(p=>p.amount&&now>=p.start&&now<p.start+240));
    for(const cue of battle.cues){
      const t=Math.min(1,Math.max(0,(now-cue.created)/(cue.due-cue.created))),r=boards[cue.targetSide].getBoundingClientRect();
      if(cue.id==='fire'){
        const cells=cue.cells;if(!cells.length)continue;const first=point(cue.targetSide,cells[0]),last=point(cue.targetSide,cells.at(-1)),f=Math.min(1,t*3),x=first.x+(last.x-first.x)*f;
        ctx.globalAlpha=.75;ctx.fillStyle='#ff7b3055';ctx.beginPath();ctx.ellipse(x,first.y,first.unit*.55,first.unit*.38,0,0,Math.PI*2);ctx.fill();
        const flame=ctx.createLinearGradient(x-first.unit,first.y,x+first.unit*.4,first.y);flame.addColorStop(0,'#f34a2400');flame.addColorStop(.65,'#ff722bc0');flame.addColorStop(1,'#ffe995');ctx.fillStyle=flame;
        ctx.beginPath();ctx.moveTo(x-first.unit,first.y+first.unit*.25);ctx.quadraticCurveTo(x-first.unit*.2,first.y-first.unit*.7,x+first.unit*.4,first.y);ctx.quadraticCurveTo(x-first.unit*.2,first.y+first.unit*.55,x-first.unit,first.y+first.unit*.25);ctx.fill();
        for(let n=0;n<4;n++){const px=x-n*first.unit*.18,h=first.unit*(.28+.12*Math.sin(now*.023+n));ctx.fillStyle=n%2?'#ffe9a2':'#ff9246';ctx.beginPath();ctx.moveTo(px-first.unit*.1,first.y+first.unit*.1);ctx.quadraticCurveTo(px-first.unit*.15,first.y-h*.3,px+first.unit*.08,first.y-h);ctx.quadraticCurveTo(px+first.unit*.2,first.y-h*.2,px+first.unit*.12,first.y+first.unit*.1);ctx.fill();}
        for(let n=0;n<9;n++){const px=x-first.unit*.6+n*first.unit*.13,py=first.y+Math.sin(now*.022+n)*first.unit*.2;glow(px,py,3+n%3,'#ffc267');}
      }
      if(cue.id==='meteor'){
        const end=point(cue.targetSide,cue.landing),f=Math.max(0,(t-.68)/.32),y=r.top-end.unit+(end.y-r.top+end.unit)*f;
        ctx.globalAlpha=1;const tail=ctx.createLinearGradient(end.x,y-end.unit*1.8,end.x,y);tail.addColorStop(0,'#ff7a2600');tail.addColorStop(1,'#ffcb62');ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(end.x-end.unit*.18,y);ctx.lineTo(end.x,y-end.unit*1.8);ctx.lineTo(end.x+end.unit*.18,y);ctx.fill();glow(end.x,y,end.unit*.2,'#ffcb75');
        for(const i of cue.cells){const p=point(cue.targetSide,i);if(Math.abs(y-p.y)<p.unit*.6)ring(p.x,p.y,p.unit*.4,'#ffe8b0',.8);}
      }
    }
    bursts=bursts.filter(b=>{
      const t=Math.max(0,(now-b.start)/b.duration);if(t>=1)return false;const side=b.targetSide,r=boards[side].getBoundingClientRect();
      if(b.id==='blackhole'){
        const p=point(side,b.index),radius=p.unit*(.18+Math.sin(t*Math.PI)*.55);ctx.globalAlpha=1-t*.6;glow(p.x,p.y,radius,'#191531');
        for(let n=0;n<5;n++){ctx.strokeStyle=n%2?'#b79dff':'#80dff2';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,radius*1.4,radius*.55,now*.013+n*.6,0,Math.PI*1.6);ctx.stroke();}
        for(const i of b.cells){const q=point(side,i);ctx.strokeStyle='#c0aeff';ctx.globalAlpha=(1-t)*.6;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(p.x+(q.y-p.y)*.4,p.y,p.x,p.y);ctx.stroke();}
      }else if(b.id==='fire'){
        for(const i of b.cells){const p=point(side,i);for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.globalAlpha=1-t;glow(p.x+Math.cos(a)*p.unit*t*.65,p.y+Math.sin(a)*p.unit*t*.65,3*(1-t)+1,n%2?'#ffb543':'#ed653a');}}
      }else if(b.id==='meteor'){
        const p=point(side,b.landing);ring(p.x,p.y,p.unit*(.2+t*1.6),'#ffc16c',1-t);ring(p.x,p.y,p.unit*(.1+t),'#fff0c1',1-t);
        for(const i of b.cells){const q=point(side,i);ring(q.x,q.y,q.unit*(.15+t*.4),'#ffc46d',1-t);}
        if(!reduced)boards[side].style.translate=t<.4?`${Math.sin(t*70)*3*(1-t)}px ${Math.cos(t*55)*2*(1-t)}px`:'';
      }else if(b.id==='freeze'||b.id==='thaw'){
        const cells=b.cells||flow.arena.engines[side].board.flatMap((tile,i)=>tile?[i]:[]);
        for(const i of cells.filter((_,n)=>n%3===0)){const p=point(side,i);ctx.globalAlpha=(1-t)*.6;ctx.fillStyle='#d2f6ff';const x=p.x+Math.sin(i)*t*18,y=p.y+(b.id==='thaw'?t*24:-t*16);ctx.fillRect(x,y,3,8);}
      }
      return true;
    });
    ctx.globalAlpha=1;
    casts.render(now);
    // Remove the short shake even when the last effect was skipped by a long frame.
    for(const [side,board] of Object.entries(boards))if(!bursts.some(b=>b.id==='meteor'&&b.targetSide===side))board.style.translate='';
    pendingDraws=pendingDraws.filter(d=>{if(now<d.at)return true;d.run();return false;});
  }
  return {event,render,prepareCast:casts.prepare,cancelCast:casts.cancel,boardEvent:casts.boardEvent,snapshot:casts.snapshot,delayDraw(now,run){pendingDraws.push({at:Math.max(now,...motes.map(m=>m.start+m.duration))+180,run});},reset(){casts.reset();motes=[];bursts=[];pulses=[];pendingDraws=[];flashUntil=flashFrom=0;ctx.clearRect(0,0,canvas.width,canvas.height);energy.classList.remove('energy-complete','energy-absorbing');for(const b of Object.values(boards))b.style.translate='';}};
}
