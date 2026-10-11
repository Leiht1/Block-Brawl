import {mapMotion} from './map-presentation.mjs';
import {createBoardPainter} from './board-painter.mjs';
// World effects follow real scenery and platform positions, below the UI.
export function createMapScene(canvas,reduced=false,veil=null){
  const ctx=canvas.getContext('2d'),frost=veil?.getContext('2d');let w=0,h=0,rects=[],measureAt=-Infinity;
  const projectile=createBoardPainter({ctx,art:{obstacle:()=>false},reduced});
  const mote=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
  const halo=(x,y,r,color,alpha)=>{ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();};
  function draw(map,cue,now,visible,opponentCue=null){
    canvas.hidden=!visible;if(veil)veil.hidden=!visible;if(!visible)return;
    if(w!==innerWidth||h!==innerHeight){w=innerWidth;h=innerHeight;canvas.width=w;canvas.height=h;if(veil){veil.width=w;veil.height=h;}measureAt=-Infinity;}
    frost?.clearRect(0,0,w,h);
    if(now>=measureAt){rects=['board','opponent-board'].map(id=>document.getElementById(id).getBoundingClientRect());measureAt=now+500;}
    ctx.clearRect(0,0,w,h);ctx.save();const motion=mapMotion(cue,now,reduced);ctx.translate(motion.camera,0);
    const time=reduced?0:now/1000,id=map.id,active=!!cue,pre=cue?.phase==='warning';
    const strength=active?(cue.stage==='Recovery'?1-cue.progress:pre?.25+.75*cue.progress:1):.12;
    if(id==='forest'){
      for(let n=0;n<13;n++){const x=(n*179+time*9)%w,y=h*.65+Math.sin(time*.45+n)*h*.13;ctx.save();ctx.translate(x,y);ctx.rotate(n+time*.3);ctx.globalAlpha=.2;ctx.fillStyle='#738c57';ctx.beginPath();ctx.ellipse(0,0,6,2.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    }
    if(id==='cliff'){
      for(let n=0;n<7;n++){ctx.globalAlpha=.05+strength*.055;ctx.fillStyle='#e6eee0';ctx.beginPath();ctx.ellipse((n*299+time*(pre?34:10))%(w+220)-110,h*(.68+.09*Math.sin(n)),130,18,0,0,Math.PI*2);ctx.fill();}
      if(active){
        // Fractures open on canyon walls, with visibly detached rock ledges.
        for(const side of [-1,1]){
          ctx.save();ctx.translate(side<0?0:w,0);ctx.scale(side<0?1:-1,1);
          ctx.globalAlpha=strength*.65;ctx.strokeStyle='#5d5142';ctx.lineWidth=3;
          ctx.beginPath();ctx.moveTo(48,100);ctx.lineTo(96,173);ctx.lineTo(77,225);ctx.lineTo(130,315);ctx.lineTo(108,400);ctx.lineTo(155,475);ctx.stroke();
          const slide=reduced?0:strength*8;
          ctx.fillStyle='#95866c';ctx.beginPath();ctx.moveTo(80,190+slide);ctx.lineTo(115,203+slide);ctx.lineTo(125,249+slide);ctx.lineTo(92,238+slide);ctx.closePath();ctx.fill();
          for(let n=0;n<24;n++){
            const f=reduced?.3:((time*.58+n*.071)%1),x=56+n%6*16+f*f*36,y=130+n%4*130+f*f*150;
            ctx.globalAlpha=(1-f)*strength*.85;ctx.strokeStyle='#d7c3a0';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x-f*10,y-f*25);ctx.lineTo(x,y);ctx.stroke();
            ctx.save();ctx.translate(x,y);ctx.rotate(n+f*3);ctx.fillStyle=n%3?'#a79579':'#e0c9a5';ctx.fillRect(-3,-3,4+n%4,5+n%3);ctx.restore();
          }ctx.restore();
        }
      }
      if(cue?.phase==='fall')rects.forEach((b,n)=>{
        const c=(n===0?cue:opponentCue)||cue;ctx.save();ctx.globalAlpha=1;ctx.translate(b.x,b.y);ctx.beginPath();ctx.rect(0,-240,b.width,240);ctx.clip();
        projectile.configure({width:b.width,cell:b.width/8,pixelRatio:1,visualNow:now,formations:[],terrain:map.terrain,map});projectile.drawEnvironment({...c,index:c.cells[0],phase:'fall'},now);ctx.restore();
      });
    }
    if(id==='crystal'){
      if(frost&&active){
        const chill=pre?Math.min(1,cue.progress*2.5):cue.phase==='fall'?1:Math.max(0,1-cue.progress);
        frost.save();frost.globalAlpha=chill;
        for(const side of [0,1,2,3]){
          frost.save();if(side===1){frost.translate(w,0);frost.rotate(Math.PI/2);}if(side===2){frost.translate(w,h);frost.rotate(Math.PI);}if(side===3){frost.translate(0,h);frost.rotate(-Math.PI/2);}
          const span=side%2?h:w,depth=Math.min(w,h)*.09,g=frost.createLinearGradient(0,0,0,depth);g.addColorStop(0,'#edfaffba');g.addColorStop(.5,'#d8efff50');g.addColorStop(1,'#dcf5ff00');frost.fillStyle=g;frost.fillRect(0,0,span,depth);
          // Soft frost haze: layered feathered volumes, no geometric branch lines.
          for(let n=0;n<span/110;n++){
            const x=n*110+Math.sin(n*2.3)*28,y=-depth*.08,r=depth*(.7+.35*Math.sin(n*3.1)**2),mist=frost.createRadialGradient(x,y,0,x,y,r);
            mist.addColorStop(0,'#f5ffff60');mist.addColorStop(.5,'#eef9ff28');mist.addColorStop(1,'#e1f6ff00');frost.fillStyle=mist;frost.fillRect(x-r,y-r,r*2,r*2);
          }
          frost.restore();
        }frost.restore();
      }
      ctx.globalAlpha=active?.55:.16;ctx.strokeStyle='#f4ffff';ctx.lineWidth=1.4;
      for(let n=0;n<(active?115:24);n++){
        const x=(n*137+time*(active?410:24))%(w+100)-50,y=(n*73+time*24)%(h+50);
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(active?20:3),y-4);ctx.stroke();
      }
      // A broad moving cold front sweeps through the landscape, not its rim.
      for(let n=0;n<6;n++){
        const x=reduced?w*n/5:((time*(active?155:16)+n*w*.27)%(w*1.6))-w*.3,y=h*(.3+n*.1);
        ctx.globalAlpha=(active?.08:.025)*strength;ctx.fillStyle='#d4eeff';ctx.beginPath();ctx.ellipse(x,y,w*.34,30+n%3*11,-.04,0,Math.PI*2);ctx.fill();
      }
      rects.forEach(b=>{for(let n=0;n<5;n++){
        ctx.globalAlpha=.03+strength*.075;ctx.fillStyle='#e0f5ff';ctx.beginPath();ctx.ellipse(b.x+(n/4)*b.width+Math.sin(time+n)*15,b.bottom+20+Math.sin(n+time*.8)*9,b.width*.2,18+n%3*5,0,0,Math.PI*2);ctx.fill();
      }});
    }
    if(id==='ruins'){
      // One monumental gear is embedded in the temple behind both platforms.
      const radius=Math.min(w*.23,h*.30);
      ctx.save();ctx.translate(w*.5,h*.44);ctx.rotate(active&&!reduced?(now-(cue.origin??cue.start))*.0012:0);ctx.globalAlpha=active?.82:.16;
      const metal=ctx.createLinearGradient(-radius,-radius,radius,radius);metal.addColorStop(0,'#d4c19a');metal.addColorStop(.5,'#a3977a');metal.addColorStop(1,'#6d735f');ctx.fillStyle=metal;ctx.strokeStyle='#747961';ctx.lineWidth=3;
      ctx.beginPath();for(let n=0;n<144;n++){const a=n*Math.PI/72,r=radius*([0,1].includes(n%6)?1:.945);n?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.arc(0,0,radius*.78,0,Math.PI*2,true);ctx.fill('evenodd');ctx.stroke();
      ctx.strokeStyle=active?'#efdaa0':'#b6ac8a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,radius*.865,0,Math.PI*2);ctx.stroke();
      for(let n=0;n<8;n++){ctx.save();ctx.rotate(n*Math.PI/4);ctx.fillStyle=metal;ctx.fillRect(radius*.16,-radius*.036,radius*.65,radius*.072);ctx.strokeStyle='#e3d0a4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(radius*.3,-radius*.02);ctx.lineTo(radius*.7,-radius*.02);ctx.stroke();ctx.restore();}
      ctx.fillStyle=metal;ctx.beginPath();ctx.arc(0,0,radius*.2,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=active?'#ffe6a0':'#b9ab82';ctx.lineWidth=2;for(let n=0;n<24;n++){const a=n*Math.PI/12,x=Math.cos(a)*radius*.86,y=Math.sin(a)*radius*.86;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(0,-10);ctx.lineTo(7,0);ctx.lineTo(0,10);ctx.closePath();ctx.stroke();ctx.restore();}ctx.restore();
      ctx.strokeStyle='#ffdf8e';ctx.lineWidth=3;ctx.globalAlpha=active?.25+strength*.6:.08;
      for(const x of [w*.032,w*.968])for(let n=0;n<5;n++){
        const y=h*(.34+n*.087);ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+12,y);ctx.lineTo(x,y+12);ctx.lineTo(x-12,y);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y);ctx.stroke();
      }
      rects.forEach(b=>{
        ctx.strokeStyle='#f0d288';ctx.lineWidth=2;ctx.globalAlpha=.08+strength*.6;
        for(let n=0;n<5;n++){const y=b.y+35+n*b.height*.19;for(const x of [b.x-32,b.right+32]){ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+7,y);ctx.lineTo(x,y+7);ctx.lineTo(x-7,y);ctx.closePath();ctx.stroke();}}
        if(active)for(const x of [b.x-64,b.right+64]){
          ctx.save();ctx.translate(x,b.bottom-50);ctx.rotate(reduced?0:time*1.4);ctx.globalAlpha=.9;
          ctx.strokeStyle='#867a5f';ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();ctx.lineWidth=4;
          for(let k=0;k<10;k++){const a=k*Math.PI/5;ctx.beginPath();ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12);ctx.lineTo(Math.cos(a)*26,Math.sin(a)*26);ctx.stroke();}
          ctx.strokeStyle='#ffe3a0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.stroke();ctx.restore();
        }
      });
    }
    if(id==='furnace'){
      // Light spreads from the existing furnace and lava into the whole hall.
      halo(w*.5,h*.48,Math.max(w,h)*.72,'#ff9d59',strength*.27);
      halo(w*.07,h*.9,h*.65,'#ff713a',strength*.27);halo(w*.93,h*.9,h*.65,'#ff713a',strength*.27);
      if(active){ctx.globalAlpha=strength*.55;ctx.strokeStyle='#ffb66c';ctx.lineWidth=3;for(const x of [w*.09,w*.91]){ctx.beginPath();ctx.moveTo(x,h*.2);ctx.lineTo(x+12,h*.34);ctx.lineTo(x-5,h*.47);ctx.lineTo(x+14,h*.62);ctx.stroke();}}
      rects.forEach(b=>{
        const fireX=b.x+b.width*.5,pulse=reduced?1:1+Math.sin(time*3+b.x)*.12;
        halo(fireX,b.y-50,110,'#ff762c',(.14+strength*.55)*pulse);
        halo(fireX,b.bottom+48,145,'#ff3e25',(.12+strength*.35)*pulse);
        ctx.globalAlpha=.7;ctx.fillStyle='#252630';ctx.beginPath();ctx.roundRect(fireX-25,b.y-48,50,33,8);ctx.fill();
        ctx.fillStyle=active?'#ffbd53':'#ab7c5f';ctx.beginPath();ctx.moveTo(fireX-17,b.y-17);ctx.quadraticCurveTo(fireX-22,b.y-31,fireX-4,b.y-42*pulse);ctx.quadraticCurveTo(fireX,b.y-25,fireX+8,b.y-44*pulse);ctx.quadraticCurveTo(fireX+25,b.y-27,fireX+17,b.y-17);ctx.closePath();ctx.fill();
        ctx.globalAlpha=.06+strength*.14;ctx.strokeStyle='#ffd6a1';ctx.lineWidth=2;
        for(let n=0;n<7;n++){
          const x=b.x+b.width*(.05+n*.15),y=b.bottom+48;ctx.beginPath();
          for(let k=0;k<13;k++){const yy=y-k*13,xx=x+Math.sin(k*.7+time*2.8+n)*6;k?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();
        }
        for(let n=0;n<(active?42:8);n++){
          const f=reduced?.4:(n*.163+time*(pre?.52:.32))%1,x=b.x+(n*.287%1)*b.width+Math.sin(n+time)*12,y=b.bottom+40-f*(active?230:90);
          ctx.globalAlpha=(1-f)*(.14+strength*.65);mote(x,y,1.2+n%3*.5,n%3?'#ffb44f':'#ffe4a0');
        }
      });
    }
    ctx.restore();
  }
  return {draw,reset(){canvas.hidden=true;if(veil)veil.hidden=true;ctx.clearRect(0,0,w,h);frost?.clearRect(0,0,w,h);measureAt=-Infinity;}};
}
