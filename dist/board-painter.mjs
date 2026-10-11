import {THEME} from './theme.mjs';
// Shared sunny-jungle tile, beam, burst and formation painters for both boards.
export function createBoardPainter({ctx,art,reduced=false}){
const colors=THEME.palette.map(p=>p.color),shadows=THEME.palette.map(p=>p.dark);
let columns=8,rows=8,height=480,terrain=null,mapMaterial=null;
let width=480,cell=60,pixelRatio=1,visualNow=0,formations=[];
const ease=t=>1-Math.pow(1-t,3);
const xy=index=>({x:(((index%columns)+columns)%columns+.5)*cell,y:(Math.floor(index/columns)+.5)*cell});
const beamEnvelope=t=>reduced?1:ease(Math.max(0,Math.min(1,(t-.16)/.48)));
function impactDelay(e,index){
  if(reduced)return 0;
  const row=Math.floor(e.index/columns),col=e.index%columns,dr=Math.abs(Math.floor(index/columns)-row),dc=Math.abs(index%columns-col);
  const blast=e.type==='blast-blast'||e.tile?.special==='blast';
  const distance=blast?Math.hypot(dr,dc):e.type==='line-line'?Math.max(dr,dc):e.lineAxis==='column'||e.tile?.special==='column'?dr:dc;
  const vertical=e.lineAxis==='column'||e.tile?.special==='column'||e.type==='line-line'&&dr>0;
  const edge=blast?(e.type==='blast-blast'?3.55:2.55):vertical?(Math.floor(index/columns)<row?row:rows-1-row):(index%columns<col?col:columns-1-col);
  const travel=1-Math.cbrt(1-Math.min(1,distance/Math.max(1,edge)));
  return e.duration*(.16+.48*travel+(e.type==='line-blast'?Math.min(1,e.lineAxis==='column'?dc:dr)*.12:0));
}
function symbol(type,size){
  const r=size*.19,p=THEME.palette[type];ctx.save();ctx.lineWidth=Math.max(1.3,size*.026);ctx.strokeStyle=p.dark;
  const grad=ctx.createLinearGradient(-r,-r,r,r);grad.addColorStop(0,p.light);grad.addColorStop(.28,p.color);grad.addColorStop(1,p.dark);ctx.fillStyle=grad;ctx.beginPath();
  if(type===0){ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();}
  if(type===1){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.48:r,x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
  if(type===2){ctx.arc(0,0,r,0,Math.PI*2);ctx.moveTo(r*.48,0);ctx.arc(0,0,r*.48,0,Math.PI*2,true);}
  if(type===3){ctx.roundRect(-r,-r,2*r,2*r,r*.25);ctx.roundRect(-r*.48,-r*.48,r*.96,r*.96,r*.12);}
  if(type===4){ctx.moveTo(0,-r);ctx.lineTo(r,r*.8);ctx.lineTo(-r,r*.8);ctx.closePath();}
  ctx.shadowColor=p.edge;ctx.shadowOffsetY=size*.035;ctx.fill('evenodd');ctx.shadowOffsetY=0;ctx.stroke();ctx.restore();
}
function tile(tile,x,y,scale=1,alpha=1,squash=0,stretchX=0,stretchY=0){
  if(tile.special&&!reduced){const creation=formations.find(e=>e.tile.id===tile.id);if(creation){const t=Math.max(0,Math.min(1,(visualNow-creation.start)/creation.duration));scale*=t<.32?.72+.28*ease(t/.32):1+Math.sin((t-.32)/.68*Math.PI*2)*(.12+(tile.special==='blast'?.07:0))*(1-t);}}
  const size=cell*.84;ctx.save();ctx.translate(x,y+cell*squash*.3);ctx.scale(scale*(1+squash+stretchX),scale*(1-squash+stretchY));ctx.globalAlpha=alpha;
  const painted=art.tile(ctx,tile,cell*THEME.tile.ratio,pixelRatio);
  if(!painted){
  // A readable fallback keeps input and rules running if an asset fails to load.
  ctx.fillStyle=shadows[tile.type];ctx.beginPath();ctx.roundRect(-size/2,-size/2+5,size,size,cell*.13);ctx.fill();
  const grad=ctx.createLinearGradient(-size*.3,-size/2,size*.4,size/2);grad.addColorStop(0,THEME.palette[tile.type].light);grad.addColorStop(.32,colors[tile.type]);grad.addColorStop(.7,THEME.palette[tile.type].mid);grad.addColorStop(1,shadows[tile.type]);ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(-size/2,-size/2,size,size-3,cell*.13);ctx.fill();
  ctx.strokeStyle='#ffffff66';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-size*.3,-size*.32);ctx.quadraticCurveTo(-size*.12,-size*.44,size*.12,-size*.36);ctx.stroke();
  symbol(tile.type,size);
  }
  if(tile.special)drawIdleCore(tile,cell*THEME.tile.ratio,visualNow,!painted);
  ctx.restore();
}
function drawIdleCore(tile,size,now,fallback=false){
  const phase=reduced?0:now*.0012+tile.id*.37,breathe=reduced?.4:.5+.5*Math.sin(phase*1.7);
  const opacity=ctx.globalAlpha;
  ctx.save();
  const glow=tile.special==='row'?'#ffa5ff':tile.special==='column'?'#89edff':'#ffc1ac';
  ctx.strokeStyle=glow;ctx.lineWidth=size*(fallback?.045:.018);ctx.globalAlpha=opacity*(fallback?.8:.08+.06*breathe);ctx.beginPath();ctx.roundRect(-size*.413,-size*.413,size*.826,size*.826,size*.19);ctx.stroke();ctx.globalAlpha=opacity;
  if(tile.special==='blast'){
    ctx.beginPath();for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5,r=size*(n%2?.135:.29),x=Math.cos(a)*r,y=Math.sin(a)*r-size*.008;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();
    ctx.fillStyle=fallback?'#ffe56c':'#fffbd1';ctx.strokeStyle='#fff8d4';ctx.lineWidth=size*.025;ctx.globalAlpha=opacity*(fallback?1:.04+.07*breathe);ctx.fill();if(fallback)ctx.stroke();
    for(let n=0;n<3;n++){const a=phase+n*Math.PI*2/3,r=size*.34;ctx.globalAlpha=opacity*(.25+.3*breathe);ctx.fillStyle=n===0?'#fff':'#ffe9a3';ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r-size*.008,size*.012,0,Math.PI*2);ctx.fill();}
  }else{
    if(tile.special==='column')ctx.rotate(Math.PI/2);
    if(fallback){ctx.lineCap='round';ctx.strokeStyle=glow;for(const spread of [.19,.1,.05]){ctx.globalAlpha=opacity*(spread>.1?.18:.45);ctx.lineWidth=size*spread;ctx.beginPath();ctx.moveTo(-size*.37,0);ctx.lineTo(size*.37,0);ctx.stroke();}ctx.globalAlpha=opacity;ctx.strokeStyle='#fff';ctx.lineWidth=size*.028;ctx.beginPath();ctx.moveTo(-size*.34,0);ctx.lineTo(size*.34,0);ctx.stroke();}
    ctx.strokeStyle='#ffffff';ctx.lineCap='round';ctx.lineWidth=size*.027;
    for(let n=0;n<2;n++){const f=reduced?(n+.5)/2:((phase*.26+n*.5)%1),x=(f-.5)*size*.49;ctx.globalAlpha=opacity*(.35+.5*Math.sin(f*Math.PI));ctx.beginPath();ctx.moveTo(x-size*.036,-size*.023);ctx.lineTo(x+size*.036,-size*.023);ctx.stroke();}
    ctx.globalAlpha=opacity*(.25+.3*breathe);ctx.strokeStyle=glow;ctx.lineWidth=size*.012;
    for(let side=-1;side<=1;side+=2){const x=side*size*.36;ctx.beginPath();ctx.moveTo(x,-size*.06);ctx.lineTo(x+side*size*.025,-size*.01);ctx.lineTo(x-side*size*.012,size*.018);ctx.lineTo(x+side*size*.01,size*.064);ctx.stroke();ctx.fillStyle='#e2ffff';ctx.beginPath();ctx.arc(x+side*size*.018,size*(.09+.018*breathe),size*.014,0,Math.PI*2);ctx.fill();}
  }ctx.restore();
}
function outline(index,color,now){const p=xy(index);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(p.x-cell*.45,p.y-cell*.45,cell*.9,cell*.9,cell*.13);ctx.stroke();}
function drawBeam(p,axis,t,color,power=1,seed=0){
  if(t<0||t>=1)return;
  const progress=beamEnvelope(t),pulse=Math.sin(Math.PI*Math.min(1,t/.9));
  const center=axis==='row'?p.x:p.y,lo=-center*progress,hi=((axis==='column'?height:width)-center)*progress;
  if(hi-lo<1)return;
  const thickness=cell*(.055+.075*pulse)*power;
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();ctx.translate(p.x,p.y);if(axis==='column')ctx.rotate(Math.PI/2);
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-t)**.65;ctx.lineCap='round';
  const grad=ctx.createLinearGradient(lo,0,hi,0);grad.addColorStop(0,color+'00');grad.addColorStop(.17,color+'99');grad.addColorStop(.5,color);grad.addColorStop(.83,color+'99');grad.addColorStop(1,color+'00');
  // Tapered ribbons breathe around the center instead of a uniform white bar.
  for(const spread of [2.8,1.35]){
    const w=thickness*spread;ctx.fillStyle=grad;ctx.globalAlpha=(1-t)*(spread>2?.23:.55);ctx.beginPath();ctx.moveTo(lo,0);ctx.quadraticCurveTo((lo+hi)*.18,-w,hi,0);ctx.quadraticCurveTo((lo+hi)*.18,w,lo,0);ctx.fill();
  }
  ctx.globalAlpha=(1-t)*.28;ctx.strokeStyle=color;ctx.lineWidth=cell*.2*power;ctx.beginPath();ctx.moveTo(lo,0);ctx.lineTo(hi,0);ctx.stroke();
  ctx.globalAlpha=(1-t)**.65;ctx.strokeStyle='#fff5d9';ctx.lineWidth=cell*.045*power*(.4+pulse);ctx.beginPath();
  for(let n=0;n<=18;n++){const x=lo+(hi-lo)*n/18,envelope=Math.sin(Math.PI*n/18);const y=reduced?0:Math.sin(n*.95-t*13+seed)*cell*.025*envelope*pulse;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  if(!reduced){
    for(const x of [lo,hi]){const radius=cell*(.12+.12*pulse)*power,g=ctx.createRadialGradient(x,0,0,x,0,radius);g.addColorStop(0,'#fff9e8');g.addColorStop(.25,color);g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,0,radius,0,Math.PI*2);ctx.fill();}
    ctx.lineWidth=Math.max(1,cell*.018);ctx.strokeStyle=color;
    for(const direction of [-1,1])for(let n=0;n<5;n++){const x=(direction<0?lo:hi)-direction*(n+1)*cell*.14;const y=Math.sin(n*2.4+t*15+seed)*cell*.22*pulse;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-direction*cell*(.06+.09*pulse),y*.78);ctx.stroke();}
  }ctx.restore();
}
function clipCells(cells){ctx.beginPath();for(const index of cells)ctx.rect(index%columns*cell,Math.floor(index/columns)*cell,cell,cell);ctx.clip();}
function drawCompression(p,t,color,power=1){
  if(reduced||t>=.2)return;
  const f=t/.2,r=cell*(.36-.24*f)*power;
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=cell*.045;ctx.globalAlpha=1-f*.25;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff9db';ctx.beginPath();ctx.arc(p.x,p.y,r*.38,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawFractures(e,t){
  ctx.save();ctx.strokeStyle='#fffbe4';ctx.lineWidth=cell*.026;
  for(const index of e.cells){const local=reduced?t:(t-impactDelay(e,index)/e.duration)/.24;if(local<0||local>1)continue;const q=xy(index);ctx.globalAlpha=(1-local)*.85;ctx.beginPath();ctx.moveTo(q.x-cell*.35,q.y-cell*.25);ctx.lineTo(q.x-cell*.05,q.y+cell*.05);ctx.lineTo(q.x+cell*.28,q.y-cell*.18);ctx.moveTo(q.x-cell*.05,q.y+cell*.05);ctx.lineTo(q.x+cell*.12,q.y+cell*.35);ctx.stroke();}
  ctx.restore();
}
function drawCombo(e,t){
  const p=xy(e.index),row=Math.floor(e.index/columns),col=e.index%columns;
  ctx.save();ctx.globalAlpha=(1-t)*THEME.effects.flashAlpha;ctx.fillStyle='#fff4bc';
  // Cell flashes follow the exact clipped rule payload, including participants.
  for(const index of e.cells){const q=xy(index);ctx.fillRect(q.x-cell*.44,q.y-cell*.44,cell*.88,cell*.88);}
  ctx.strokeStyle=e.type==='line-line'?'#e6ffff':e.type==='line-blast'?'#ffe7a1':'#ffffff';
  drawCompression(p,t,'#ffe8a0',e.type==='blast-blast'?1.65:1.2);
  if(e.type==='blast-blast'){
    ctx.save();clipCells(e.cells);drawBurst(p,t,3.55,'#ffcb72');ctx.restore();
  }else{
    ctx.save();clipCells(e.cells);
    for(const offset of e.type==='line-blast'?[-1,0,1]:[0]){
      // Three pulses fit inside the original clear interval; no extra rule waits.
      const delay=reduced?0:Math.abs(offset)*.12,local=t-delay;
      const hue=e.participants.find(p=>p.tile.special!=='blast')?.tile.type??e.participants[0].tile.type;
      if((e.type==='line-line'||e.lineAxis==='row')&&row+offset>=0&&row+offset<rows)drawBeam({x:p.x,y:p.y+offset*cell},'row',local,colors[hue],e.type==='line-blast'?1.25:1,offset);
      if((e.type==='line-line'||e.lineAxis==='column')&&col+offset>=0&&col+offset<columns)drawBeam({x:p.x+offset*cell,y:p.y},'column',local,colors[hue],e.type==='line-blast'?1.25:1,offset+2);
    }
    ctx.restore();
    if(e.type==='line-line'){ctx.save();ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle='#fff8c9';ctx.lineWidth=cell*.04;ctx.beginPath();ctx.arc(p.x,p.y,cell*(.12+.65*beamEnvelope(t)),0,Math.PI*2);ctx.stroke();ctx.restore();}
  }ctx.restore();drawFractures(e,t);
}
function drawSpecial(e,t){
  const p=xy(e.index);ctx.save();ctx.globalAlpha=(1-t)*THEME.effects.flashAlpha;ctx.fillStyle=colors[e.tile.type];
  for(const index of e.cells){const q=xy(index);ctx.fillRect(q.x-cell*.44,q.y-cell*.44,cell*.88,cell*.88);}ctx.restore();
  drawCompression(p,t,colors[e.tile.type]);
  if(e.tile.special!=='blast'){ctx.save();clipCells(e.cells);drawBeam(p,e.tile.special,t,colors[e.tile.type],.9,e.index);ctx.restore();}
  else {ctx.save();clipCells(e.cells);drawBurst(p,t,2.55,colors[e.tile.type]);ctx.restore();}
  drawFractures(e,t);
}
function drawBurst(p,t,radius,color){
  if(!reduced&&t<.16)return;
  const f=beamEnvelope(t),r=cell*Math.max(.12,radius*f),fade=reduced?1-t:Math.max(0,1-(t-.16)/.84);
  ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.95;
  const glow=ctx.createRadialGradient(0,0,0,0,0,r);glow.addColorStop(0,'#fff8df');glow.addColorStop(.12,'#fff29b');glow.addColorStop(.35,color+'88');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;
  ctx.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,rr=r*(i%2?.58:1);i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(rr,0);}ctx.closePath();ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=cell*.045*(1-t);ctx.beginPath();ctx.arc(0,0,r*.9,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff6d4';ctx.lineWidth=cell*.035*(1-t);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();
  if(!reduced){ctx.lineWidth=cell*.045;for(let i=0;i<10;i++){const a=i*Math.PI/5+.1;ctx.strokeStyle=THEME.palette[i%5].light;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.78,Math.sin(a)*r*.78);ctx.lineTo(Math.cos(a)*r*1.08,Math.sin(a)*r*1.08);ctx.stroke();}}
  // Local hot core: keeps the arcade impact inside the blast, not over the board.
  const core=cell*(.2+.65*fade),heat=ctx.createRadialGradient(0,0,0,0,0,core*1.7);heat.addColorStop(0,'#ffffff');heat.addColorStop(.3,'#fff0a9');heat.addColorStop(1,color+'00');ctx.fillStyle=heat;ctx.globalAlpha=fade**.7;ctx.beginPath();ctx.arc(0,0,core*1.7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff9de';ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/columns,rr=core*(i%2?.38:1);i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(rr,0);}ctx.closePath();ctx.fill();ctx.restore();
}

function drawFormation(e,t){
  const to=xy(e.index),power=e.tile.special==='blast'?1.6:1;
  ctx.save();ctx.strokeStyle=THEME.palette[e.tile.type].light;ctx.fillStyle='#fff9d8';ctx.lineWidth=cell*.026*power;
  if(!reduced&&t<.6){
    const f=ease(t/.6);ctx.globalAlpha=(1-t/.6)*.85;
    for(const index of e.sources){if(index===e.index)continue;const from=xy(index),x=from.x+(to.x-from.x)*f,y=from.y+(to.y-from.y)*f;ctx.beginPath();ctx.moveTo(x-(to.x-from.x)*.13,y-(to.y-from.y)*.13);ctx.lineTo(x,y);ctx.stroke();ctx.beginPath();ctx.arc(x,y,cell*.045*power,0,Math.PI*2);ctx.fill();}
  }
  const flash=reduced?1-t:Math.max(0,1-Math.abs(t-.36)/.32);
  ctx.globalAlpha=flash*.7;ctx.beginPath();ctx.arc(to.x,to.y,cell*.18*power,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=(1-t)*.75;ctx.strokeStyle='#fff4bc';ctx.lineWidth=cell*.03*power;
  const r=cell*(reduced?.4:.22+ease(t)*.36)*power;
  ctx.beginPath();ctx.arc(to.x,to.y,r,0,Math.PI*2);ctx.stroke();
  if(e.tile.special==='blast'){ctx.globalAlpha*=.65;ctx.beginPath();ctx.arc(to.x,to.y,r*.72,0,Math.PI*2);ctx.stroke();for(let n=0;n<8;n++){const a=n*Math.PI/4;ctx.beginPath();ctx.moveTo(to.x+Math.cos(a)*r,to.y+Math.sin(a)*r);ctx.lineTo(to.x+Math.cos(a)*r*1.25,to.y+Math.sin(a)*r*1.25);ctx.stroke();}}
  ctx.restore();
}
function drawCharge(e,t){
  const to=xy(e.index),large=e.type==='blast-blast';
  ctx.save();ctx.strokeStyle='#fff4bc';ctx.lineWidth=cell*(large?.05:.035);ctx.globalAlpha=.35+.6*t;
  ctx.beginPath();ctx.arc(to.x,to.y,cell*((large?.8:.5)-(large?.58:.2)*t),0,Math.PI*2);ctx.stroke();
  if(!reduced){
    for(const index of e.sources){const from=xy(index);ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.quadraticCurveTo((from.x+to.x)/2,from.y-cell*.35,from.x+(to.x-from.x)*ease(t),from.y+(to.y-from.y)*ease(t));ctx.stroke();}
    ctx.fillStyle='#fff1bd';const count=large?8:4;
    for(let n=0;n<count;n++){const a=n*Math.PI*2/count+t*2,r=cell*((large?.95:.65)-(large?.75:.45)*t),x=to.x+Math.cos(a)*r,y=to.y+Math.sin(a)*r;ctx.beginPath();ctx.moveTo(x,y-cell*.05);ctx.lineTo(x+cell*.035,y);ctx.lineTo(x,y+cell*.05);ctx.lineTo(x-cell*.035,y);ctx.fill();}
    if(large){ctx.globalAlpha=t*.75;ctx.beginPath();ctx.arc(to.x,to.y,cell*(.06+.18*t),0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffbc75';ctx.lineWidth=cell*.025;ctx.beginPath();ctx.ellipse(to.x,to.y,cell*(.62-.35*t),cell*(.24-.1*t),t*2,0,Math.PI*2);ctx.stroke();}
  }ctx.restore();
}

function drawScoreFloat(p,t){
  const points=p.points??Number(p.text.slice(1)),size=cell*Math.min(1.35,.38+.18*Math.log2(1+Math.max(0,points)/30));
  ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*3);ctx.font=`900 ${size}px system-ui`;ctx.textAlign='center';ctx.lineJoin='round';
  const half=(ctx.measureText(p.text)?.width??p.text.length*size*.6)/2,x=Math.max(half+6,Math.min(width-half-6,p.x)),y=p.y-t*cell;
  ctx.lineWidth=Math.max(2,size*.075);ctx.strokeStyle='#344655';ctx.strokeText(p.text,x,y);ctx.fillStyle='#ffffff';ctx.shadowColor='#23384088';ctx.shadowBlur=cell*.06;ctx.fillText(p.text,x,y);ctx.restore();
}
function drawTerrain(config){
  terrain=config;columns=config.width;rows=config.height;height=rows*cell;
  const material=mapMaterial||{base:THEME.board.base,well:THEME.board.well,rim:'#927963',obstacle:'#6c747a'};
  const standard=columns===8&&rows===8&&config.cells.every(s=>s==='cell');
  let painted=standard&&art.board(ctx,width,pixelRatio);
  if(!standard){
    // Clip the shared well texture to the actual footprint. Hole pixels stay
    // transparent while obstacles retain a distinct solid stone surface.
    ctx.save();ctx.beginPath();
    config.cells.forEach((state,i)=>{if(state!=='hole')ctx.rect(i%columns*cell,Math.floor(i/columns)*cell,cell,cell);});ctx.clip();
    ctx.fillStyle=material.base;ctx.fillRect(0,0,width,height);
    // The existing 8×8 material can be reused without drawing its missing cells.
    if(columns===8&&rows===8)painted=art.board(ctx,width,pixelRatio);
    ctx.restore();
    // Shallow stone rim only along exposed terrain edges, inside cell bounds.
    ctx.strokeStyle=material.rim;ctx.lineWidth=cell*(['cliff','crystal','ruins'].includes(material.style)?.018:.045);ctx.lineCap='round';ctx.beginPath();
    config.cells.forEach((state,i)=>{
      if(state==='hole')return;
      const r=Math.floor(i/columns),c=i%columns,x=c*cell,y=r*cell,inset=cell*.025;
      if(r===0||config.cells[i-columns]==='hole'){ctx.moveTo(x+inset,y+inset);ctx.lineTo(x+cell-inset,y+inset);}
      if(r===rows-1||config.cells[i+columns]==='hole'){ctx.moveTo(x+inset,y+cell-inset);ctx.lineTo(x+cell-inset,y+cell-inset);}
      if(c===0||config.cells[i-1]==='hole'){ctx.moveTo(x+inset,y+inset);ctx.lineTo(x+inset,y+cell-inset);}
      if(c===columns-1||config.cells[i+1]==='hole'){ctx.moveTo(x+cell-inset,y+inset);ctx.lineTo(x+cell-inset,y+cell-inset);}
    });ctx.stroke();
  }
  config.cells.forEach((state,i)=>{
    if(state==='hole')return;
    if(state==='cell'&&painted)return;
    const p=xy(i);ctx.fillStyle=state==='obstacle'?material.obstacle:material.well;
    ctx.beginPath();ctx.roundRect(p.x-cell*.46,p.y-cell*.46,cell*.92,cell*.92,cell*.12);ctx.fill();
    if(state==='obstacle'){ctx.save();ctx.translate(p.x,p.y);const painted=art.obstacle?.(ctx,cell*.94,pixelRatio);ctx.restore();if(painted)return;ctx.strokeStyle='#adb5b9';ctx.lineWidth=cell*.035;ctx.beginPath();ctx.moveTo(p.x-cell*.26,p.y-cell*.27);ctx.lineTo(p.x+cell*.2,p.y-cell*.27);ctx.stroke();}
  });
}
function rock(index,alpha=1,offset=0,scale=1){
  const p=xy(index);ctx.save();ctx.translate(p.x,p.y+offset);ctx.globalAlpha=alpha;ctx.scale(scale,scale);
  if(!art.obstacle?.(ctx,cell*.94,pixelRatio)){
    ctx.fillStyle=mapMaterial?.obstacle||'#8c7564';ctx.strokeStyle='#e1c4a0';ctx.lineWidth=cell*.04;ctx.beginPath();ctx.moveTo(-cell*.36,-cell*.2);ctx.lineTo(-cell*.13,-cell*.42);ctx.lineTo(cell*.28,-cell*.36);ctx.lineTo(cell*.43,cell*.04);ctx.lineTo(cell*.3,cell*.37);ctx.lineTo(-cell*.29,cell*.37);ctx.closePath();ctx.fill();ctx.stroke();
  }ctx.restore();
}
function rockBounds(cells){
  const cols=cells.map(i=>i%columns),rs=cells.map(i=>Math.floor(i/columns)),left=Math.min(...cols),top=Math.min(...rs),w=(Math.max(...cols)-left+1)*cell,h=(Math.max(...rs)-top+1)*cell;
  return {x:(left+.5)*cell+(w-cell)/2,y:(top+.5)*cell+(h-cell)/2,w,h};
}
function boulder(cells,alpha=1,offset=0,scale=1){
  const b=rockBounds(cells);ctx.save();ctx.translate(b.x,b.y+offset);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
  const w=b.w*.95,h=b.h*.94;
  // One continuous bevelled rock, whose real collision footprint spans 1/2/4 cells.
  ctx.fillStyle='#695d4b55';ctx.beginPath();ctx.ellipse(0,h*.38,w*.49,h*.18,0,0,Math.PI*2);ctx.fill();
  const shape=()=>{ctx.beginPath();ctx.moveTo(-w*.46,-h*.19);ctx.quadraticCurveTo(-w*.4,-h*.45,-w*.17,-h*.46);ctx.lineTo(w*.24,-h*.43);ctx.quadraticCurveTo(w*.42,-h*.38,w*.46,-h*.08);ctx.lineTo(w*.43,h*.32);ctx.quadraticCurveTo(w*.3,h*.47,w*.12,h*.45);ctx.lineTo(-w*.3,h*.42);ctx.quadraticCurveTo(-w*.48,h*.28,-w*.46,-h*.19);ctx.closePath();};
  const g=ctx.createLinearGradient(-w*.2,-h*.5,w*.3,h*.5);g.addColorStop(0,'#f2dfb7');g.addColorStop(.24,'#cbb593');g.addColorStop(.72,'#a18d73');g.addColorStop(1,'#776951');ctx.fillStyle=g;shape();ctx.fill();ctx.strokeStyle='#7f6e55';ctx.lineWidth=cell*.035;ctx.stroke();
  ctx.fillStyle='#ecdbb3';ctx.beginPath();ctx.moveTo(-w*.4,-h*.19);ctx.lineTo(-w*.14,-h*.4);ctx.lineTo(w*.21,-h*.37);ctx.lineTo(w*.35,-h*.18);ctx.lineTo(w*.06,-h*.07);ctx.lineTo(-w*.25,-h*.1);ctx.closePath();ctx.fill();
  ctx.fillStyle='#897960';ctx.beginPath();ctx.moveTo(w*.35,-h*.18);ctx.lineTo(w*.42,h*.24);ctx.lineTo(w*.12,h*.39);ctx.lineTo(w*.06,-h*.07);ctx.fill();
  ctx.strokeStyle='#fff2d1';ctx.lineWidth=cell*.028;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-w*.34,-h*.22);ctx.lineTo(-w*.14,-h*.36);ctx.lineTo(w*.17,-h*.34);ctx.stroke();
  ctx.strokeStyle='#72604b';ctx.lineWidth=cell*.025;ctx.beginPath();ctx.moveTo(-w*.18,-h*.25);ctx.lineTo(-w*.07,-h*.07);ctx.lineTo(-w*.15,h*.08);ctx.lineTo(w*.02,h*.21);ctx.lineTo(-w*.04,h*.35);ctx.moveTo(-w*.15,h*.08);ctx.lineTo(-w*.3,h*.13);ctx.stroke();
  for(let n=0;n<4;n++){ctx.fillStyle=n%2?'#e0caaa':'#a08b6c';ctx.beginPath();ctx.ellipse(w*(.17-Math.sin(n*2.4)*.18),h*(.12+Math.cos(n*1.9)*.14),cell*.05,cell*.027,.3,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function rockWarning(event,now){
  const cells=event.cells||[event.index],b=rockBounds(cells),pulse=reduced?1:.7+.3*Math.sin(now*.012);ctx.save();
  for(const i of cells){const p=xy(i);ctx.fillStyle=`rgba(255,199,62,${.12+.12*pulse})`;ctx.strokeStyle='#ffcc47';ctx.lineWidth=cell*.065;ctx.beginPath();ctx.roundRect(p.x-cell*.46,p.y-cell*.46,cell*.92,cell*.92,cell*.1);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#866044';ctx.lineWidth=cell*.034;ctx.beginPath();ctx.moveTo(p.x-cell*.36,p.y+cell*.23);ctx.lineTo(p.x-cell*.13,p.y+cell*.12);ctx.lineTo(p.x+cell*.03,p.y+cell*.33);ctx.lineTo(p.x+cell*.32,p.y+cell*.18);ctx.stroke();debris(i,reduced?.2:(now*.001)%1,'rockfall',.7);
  }
  ctx.translate(b.x,b.y);const r=cell*.29;ctx.fillStyle='#fff1a2';ctx.strokeStyle='#ce8634';ctx.lineWidth=cell*.035;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,r*.65);ctx.quadraticCurveTo(r*.94,r,0,r);ctx.lineTo(-r,r*.85);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#9c592d';ctx.font=`900 ${cell*.4}px system-ui`;ctx.textAlign='center';ctx.fillText('!',0,r*.66);
  const label=`落石 · ${cells.length}格`;ctx.font=`800 ${cell*.22}px system-ui`;const tw=ctx.measureText(label).width+cell*.28,ty=Math.max(-b.h*.5-cell*.24,-b.y+cell*.17);ctx.fillStyle='#a56136';ctx.beginPath();ctx.roundRect(-tw/2,ty-cell*.16,tw,cell*.34,cell*.1);ctx.fill();ctx.fillStyle='#fff1b5';ctx.fillText(label,0,ty+cell*.09);ctx.restore();
}
function iceBreak(event,t){
  const p=xy(event.index);if(t<.3){ice(event.index,event.start,1-Math.max(0,t-.2)/.1,1,event.art);ctx.save();ctx.strokeStyle='#ffffff';ctx.lineWidth=cell*.032;ctx.globalAlpha=1-t/.3;
    for(let n=0;n<5;n++){const a=n*1.256,growth=Math.min(1,t/.19);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*cell*.18*growth,p.y+Math.sin(a)*cell*.18*growth);ctx.lineTo(p.x+Math.cos(a+.18)*cell*.44*growth,p.y+Math.sin(a+.18)*cell*.44*growth);ctx.stroke();}ctx.restore();}
  // Angular shell pieces separate, tumble, then drop with a tiny frost puff.
  ctx.save();const shatter=Math.max(0,(t-.22)/.78);ctx.globalAlpha=shatter>0?1:0;for(let n=0;n<10;n++){
    const a=n*Math.PI*2/10,travel=reduced?0:ease(shatter),r=cell*(.09+.035*(n%3)),x=p.x+Math.cos(a)*cell*(.12+travel*.64),y=p.y+Math.sin(a)*cell*(.12+travel*.4)+cell*(t*t*.68-t*.22);
    ctx.save();ctx.translate(x,y);ctx.rotate(a+(reduced?0:t*(n%2?2:-2)));ctx.globalAlpha=shatter>0?(1-shatter)**1.1:0;const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#f5ffffee');g.addColorStop(.4,'#b9eeffcc');g.addColorStop(1,'#6ab7dfaa');ctx.fillStyle=g;ctx.strokeStyle='#efffffee';ctx.lineWidth=cell*.015;
    ctx.beginPath();ctx.moveTo(-r,-r*.35);ctx.lineTo(-r*.25,-r);ctx.lineTo(r*.8,-r*.45);ctx.lineTo(r*.65,r*.5);ctx.lineTo(-r*.25,r);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#77bfdad0';ctx.beginPath();ctx.moveTo(-r*.25,-r);ctx.lineTo(r*.12,r*.12);ctx.lineTo(-r*.25,r);ctx.stroke();ctx.restore();
  }
  ctx.globalAlpha=(1-t)*.55;ctx.strokeStyle='#d9fbff';ctx.lineWidth=cell*.025;ctx.beginPath();ctx.ellipse(p.x,p.y,cell*(.2+t*.65),cell*(.15+t*.25),0,0,Math.PI*2);ctx.stroke();
  for(let n=0;n<12;n++){const a=n*2.4;ctx.fillStyle='#f3ffff';ctx.beginPath();ctx.arc(p.x+Math.cos(a)*cell*(.15+t*.85),p.y+Math.sin(a)*cell*(.12+t*.55),cell*.012*(1-t*.5),0,Math.PI*2);ctx.fill();}ctx.restore();
  ctx.save();ctx.globalAlpha=(1-t)*.18;ctx.fillStyle='#d9f5f9';for(let n=0;n<5;n++){ctx.beginPath();ctx.ellipse(p.x+(n-2)*cell*.18,p.y+cell*.35+t*cell*.1,cell*(.2+t*.25),cell*.1,0,0,Math.PI*2);ctx.fill();}ctx.restore();
}

function ice(index,now,alpha=1,growth=1,art={}){
  const p=xy(index),r=cell*.46;ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;ctx.scale(.82+.18*growth,.82+.18*growth);
  // A chipped, faceted shell grows around the object, leaving its coloured core visible.
  const pts=[[-.94,-.63],[-.74,-.94],[-.24,-1.02],[.3,-.96],[.77,-.88],[1,-.53],[.94,.15],[1,.67],[.66,.99],[.04,.95],[-.64,1],[-.98,.61],[-1,.02]];
  const shell=()=>{ctx.beginPath();pts.forEach(([x,y],n)=>n?ctx.lineTo(x*r,y*r):ctx.moveTo(x*r,y*r));ctx.closePath();};
  shell();const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#faffffa8');g.addColorStop(.2,'#cbf0f733');g.addColorStop(.48,'#c7ecf910');g.addColorStop(.7,'#83bed745');g.addColorStop(1,'#5e94bdb0');ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle='#568fa680';ctx.lineWidth=cell*.065;ctx.stroke();ctx.strokeStyle='#eaffffe0';ctx.lineWidth=cell*.022;ctx.stroke();
  const facets=[[-.94,-.63,-.74,-.94,.3,-.96,-.5,-.63],[.77,-.88,1,-.53,.94,.15,.67,-.47],[-.98,.61,-.64,1,.66,.99,.45,.7],[1,.67,.66,.99,.45,.7,.72,.24]];
  facets.forEach((v,n)=>{ctx.fillStyle=['#f9ffff98','#c5f1ff65','#a5dcf388','#74b4d977'][n];ctx.beginPath();for(let k=0;k<v.length;k+=2)k?ctx.lineTo(v[k]*r,v[k+1]*r):ctx.moveTo(v[k]*r,v[k+1]*r);ctx.closePath();ctx.fill();ctx.strokeStyle='#f1ffffa0';ctx.lineWidth=cell*.015;ctx.stroke();});
  // Frost feathers branch in from the irregular edges instead of forming a UI border.
  ctx.save();shell();ctx.clip();
  for(let n=0;n<11;n++){
    const ang=n*2.399+index*.17,x=Math.cos(ang)*r*.88,y=Math.sin(ang)*r*.88,len=cell*(.11+.045*(n%3))*Math.min(1,growth*1.6-n*.04);
    ctx.save();ctx.translate(x,y);ctx.rotate(ang+Math.PI);ctx.strokeStyle='#efffffaa';ctx.lineWidth=cell*.012;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,0);
    for(let k=1;k<5;k++){const q=len*k/5,z=len*(1-k/6)*.48;ctx.moveTo(q,0);ctx.lineTo(q-z*.4,z);ctx.moveTo(q,0);ctx.lineTo(q-z*.4,-z);}ctx.stroke();ctx.restore();
  }
  for(let n=0;n<24;n++){const ang=n*2.4+index,rad=r*(.6+.3*Math.sin(n*7)**2);ctx.globalAlpha=alpha*(.24+.3*(n%3)/3);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(Math.cos(ang)*rad,Math.sin(ang)*rad,cell*(.006+.003*(n%3)),cell*.014,ang,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=alpha;ctx.strokeStyle='#ffffffe0';ctx.lineWidth=cell*.035;ctx.beginPath();ctx.moveTo(-r*.68,-r*.76);ctx.lineTo(-r*.15,-r*.82);ctx.stroke();ctx.lineWidth=cell*.012;ctx.beginPath();ctx.moveTo(-r*.57,-r*.49);ctx.lineTo(-r*.3,-r*.53);ctx.stroke();ctx.restore();
  for(let n=0;n<7;n++){const ang=n*2.4+index*.13,cr=cell*(.055+.024*(n%3))*Math.min(1,growth*1.8-n*.12);ctx.save();ctx.translate(Math.cos(ang)*r*.92,Math.sin(ang)*r*.92);ctx.rotate(ang+Math.PI/2);ctx.fillStyle='#c3e8f2b0';ctx.strokeStyle='#f6ffffdf';ctx.lineWidth=cell*.011;ctx.beginPath();ctx.moveTo(-cr*.5,0);ctx.lineTo(-cr*.24,-cr*.8);ctx.lineTo(0,-cr*1.7);ctx.lineTo(cr*.37,-cr*.68);ctx.lineTo(cr*.42,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-cr*1.7);ctx.lineTo(cr*.05,0);ctx.stroke();ctx.restore();}
  ctx.restore();
}
function rune(index,now,alpha=1){
  const p=xy(index);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;ctx.strokeStyle='#ffdc8b';ctx.lineWidth=cell*.027;
  ctx.beginPath();ctx.ellipse(0,cell*.14,cell*.39,cell*.27,0,0,Math.PI*2);ctx.stroke();
  for(let n=0;n<6;n++){const a=n*Math.PI/3,x=Math.cos(a)*cell*.29,y=Math.sin(a)*cell*.2+cell*.14;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.moveTo(-cell*.045,0);ctx.lineTo(0,-cell*.07);ctx.lineTo(cell*.045,0);ctx.lineTo(0,cell*.07);ctx.closePath();ctx.stroke();ctx.restore();}
  ctx.restore();
}
function debris(index,t,type='rockfall',alpha=1){
  const p=xy(index);ctx.save();ctx.globalAlpha=(1-t)*alpha;
  for(let n=0;n<9;n++){const a=n*Math.PI*2/9,travel=reduced?0:t;const x=p.x+Math.cos(a)*cell*(.15+travel*.65),y=p.y+Math.sin(a)*cell*.25+cell*(travel*travel*.5-travel*.38),r=cell*(.025+.009*(n%3));
    ctx.fillStyle=type==='freeze'?'#c6f5ff':n%2?'#dbc8a6':'#a9947b';ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x+r*.3,y+r);ctx.lineTo(x-r,y+r*.4);ctx.closePath();ctx.fill();
  }ctx.restore();
}
function drawEnvironment(event,now){
  if(!event)return;const p=xy(event.index),t=Math.max(0,Math.min(1,(now-event.start)/Math.max(1,event.duration))),type=event.type||'rockfall';
  // First the world warns, then its edge reacts, finally the target is revealed.
  if(event.phase==='warning'&&t<(type==='rockfall'?.67:type==='fire'?.35:.72))return;
  if(type==='fire'){
    if(event.phase==='warning'||event.phase==='spread-warning'){
      const heat=event.phase==='spread-warning'?t:Math.max(0,(t-.35)/.65),pulse=reduced?1:.85+.15*Math.sin(now*.016);
      ctx.save();ctx.globalAlpha=(.55+.45*heat)*pulse;ctx.strokeStyle='#ff382b';ctx.shadowColor='#ff401a';ctx.shadowBlur=cell*(.15+.16*heat);ctx.lineWidth=cell*(.04+.025*heat);
      ctx.beginPath();ctx.roundRect(p.x-cell*.46,p.y-cell*.46,cell*.92,cell*.92,cell*.085);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#ffc083';ctx.lineWidth=cell*.018;ctx.stroke();
      const g=ctx.createRadialGradient(p.x,p.y,cell*.24,p.x,p.y,cell*.64);g.addColorStop(0,'#ff302000');g.addColorStop(1,'#ff3b3044');ctx.fillStyle=g;ctx.fill();ctx.restore();
    }
    if(event.phase==='fall')flame(event.index,now,ease(t));
    if(event.phase==='restore'){
      flame(event.index,now,1-ease(t));
      ctx.save();ctx.globalAlpha=(1-t)*.28;ctx.fillStyle='#d5c5b0';
      for(let n=0;n<5;n++){ctx.beginPath();ctx.ellipse(p.x+Math.sin(n+now*.003)*cell*.13,p.y-cell*(t*.65+n*.07),cell*(.08+t*.13),cell*.06,0,0,Math.PI*2);ctx.fill();}ctx.restore();
    }return;
  }
  if(type==='freeze'){
    if(event.phase==='restore'){iceBreak(event,t);return;}
    ctx.save();ctx.globalAlpha=(event.phase==='warning'?.28:.4)*(1-t*.4);ctx.fillStyle=event.art?.mist||'#dcfaff';
    for(let n=0;n<5;n++){const x=p.x+cell*((n-2)*.18+(reduced?0:Math.sin(now*.002+n)*.08)),y=p.y+cell*(.2-Math.sin(t*Math.PI)*.2);ctx.beginPath();ctx.ellipse(x,y,cell*.2,cell*.08,0,0,Math.PI*2);ctx.fill();}ctx.restore();
    if(event.phase==='fall')ice(event.index,now,t,t,event.art);return;
  }
  if(type==='mechanism'){
    const cells=event.cells||[event.index],b=rockBounds(cells),angle=reduced?Math.PI/2:ease(t)*Math.PI/2;
    if(event.phase==='warning')mechanismRing(cells,now,.4+.5*t,0);
    if(event.phase==='fall'){
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);
      ctx.fillStyle='#645f50';ctx.shadowColor='#272e3799';ctx.shadowBlur=cell*.14;
      ctx.beginPath();ctx.roundRect(-cell,-cell,cell*2,cell*2,cell*.16);ctx.fill();ctx.shadowBlur=0;
      for(const item of event.tiles||[]){
        const q=xy(item.index),x=q.x-b.x,y=q.y-b.y;
        ctx.fillStyle=item.state==='obstacle'?'#827965':'#c2b699';ctx.strokeStyle='#e8d2a0';ctx.lineWidth=cell*.025;
        ctx.beginPath();ctx.roundRect(x-cell*.46,y-cell*.46,cell*.92,cell*.92,cell*.09);ctx.fill();ctx.stroke();
        if(item.tile)tile(item.tile,x,y);else {ctx.strokeStyle='#d3b780';ctx.beginPath();ctx.moveTo(x-cell*.2,y);ctx.lineTo(x,y-cell*.2);ctx.lineTo(x+cell*.2,y);ctx.lineTo(x,y+cell*.2);ctx.closePath();ctx.stroke();}
      }ctx.restore();mechanismRing(cells,now,1,angle);
    }return;
  }
  const cells=event.cells||[event.index],b=rockBounds(cells);
  if(event.phase==='warning')rockWarning(event,now);
  else if(event.phase==='fall'){
    const drop=reduced?0:(-b.y-b.h*.65-cell*1.8)*(1-t*t);boulder(cells,1,drop,reduced?1:.9+.1*t);
    if(!reduced){ctx.save();ctx.globalAlpha=(1-t)*.45;ctx.strokeStyle='#f6dfb2';ctx.lineWidth=cell*.045;for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(b.x+n*b.w*.25,b.y+drop-b.h*.4);ctx.lineTo(b.x+n*b.w*.25,b.y+drop-b.h*.4-cell*(.3+.5*t));ctx.stroke();}ctx.restore();}
  }else if(event.phase==='impact'||event.phase==='restore'){
    cells.forEach(i=>debris(i,t,'rockfall',1.3));
    if(event.phase==='restore'&&t<.42)boulder(cells,1-t/.42,0,reduced?1:1-.12*t);
    ctx.save();ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle='#f4d49c';ctx.lineWidth=cell*.05;ctx.beginPath();ctx.ellipse(b.x,b.y+b.h*.27,b.w*(.32+t*.4),b.h*(.08+t*.18),0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
}
function drawBoardAtmosphere(cue,now){
  if(!cue||!terrain||cue.type!=='freeze')return;
  // Drifting translucent volumes, never a line around the board perimeter.
  const strength=cue.phase==='warning'?cue.progress:cue.phase==='fall'?1:Math.max(0,1-cue.progress);
  ctx.save();ctx.beginPath();terrain.cells.forEach((state,i)=>{if(state==='cell')ctx.rect(i%columns*cell,Math.floor(i/columns)*cell,cell,cell);});ctx.clip();
  for(let n=0;n<5;n++){
    const x=reduced?width*n/4:((now*.12+n*width*.28)%(width*1.7))-width*.35,y=height*(.15+n*.18);
    const g=ctx.createRadialGradient(x,y,0,x,y,cell*2.5);g.addColorStop(0,'#d6f5ff');g.addColorStop(1,'#d6f5ff00');
    ctx.globalAlpha=.035+.075*strength;ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,cell*2.5,cell*.35,0,0,Math.PI*2);ctx.fill();
  }ctx.restore();
}
function mechanismRing(cells,now,alpha=1,angle=0){
  const b=rockBounds(cells);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);ctx.globalAlpha=alpha;
  ctx.strokeStyle='#ffe3a0';ctx.lineWidth=cell*.045;ctx.shadowColor='#ffbb4f';ctx.shadowBlur=cell*.12;
  ctx.beginPath();ctx.arc(0,0,cell*1.32,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle='#8d8061';ctx.lineWidth=cell*.08;
  for(let n=0;n<20;n++){const a=n*Math.PI/10;ctx.beginPath();ctx.moveTo(Math.cos(a)*cell*1.22,Math.sin(a)*cell*1.22);ctx.lineTo(Math.cos(a)*cell*1.38,Math.sin(a)*cell*1.38);ctx.stroke();}
  ctx.strokeStyle='#fff0b4';ctx.lineWidth=cell*.026;
  for(let n=0;n<8;n++){const a=n*Math.PI/4;ctx.save();ctx.translate(Math.cos(a)*cell*1.12,Math.sin(a)*cell*1.12);ctx.rotate(a);ctx.beginPath();ctx.moveTo(-cell*.06,0);ctx.lineTo(0,-cell*.08);ctx.lineTo(cell*.06,0);ctx.lineTo(0,cell*.08);ctx.closePath();ctx.stroke();ctx.restore();}
  ctx.restore();
}
function drawMechanism(cue){
  if(cue?.type==='mechanism'&&cue.phase==='fall'){
    const b=rockBounds(cue.cells);ctx.save();ctx.fillStyle='#625e50';
    ctx.fillRect(b.x-cell,b.y-cell,cell*2,cell*2);ctx.restore();
  }
  if(cue?.type==='mechanism'&&cue.phase==='blocked')mechanismRing(cue.cells,visualNow,1-cue.progress,Math.PI/2);
}
function flame(index,now,growth=1){
  if(growth<=0)return;const p=xy(index),time=reduced?0:now*.006+index;
  ctx.save();ctx.translate(p.x,p.y+cell*.28);ctx.scale(growth,growth);
  const glow=ctx.createRadialGradient(0,-cell*.16,0,0,-cell*.16,cell*.62);glow.addColorStop(0,'#ff943ecc');glow.addColorStop(.4,'#ff4c2d55');glow.addColorStop(1,'#ff3c2000');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,-cell*.16,cell*.62,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#392321';ctx.beginPath();ctx.ellipse(0,0,cell*.42,cell*.16,0,0,Math.PI*2);ctx.fill();
  for(let n=0;n<3;n++){
    const x=(n-1)*cell*.19,sway=Math.sin(time+n*2.3)*cell*.09,h=cell*(.58+.15*Math.sin(time*.83+n*1.8)),r=cell*(n===1?.24:.17);
    const g=ctx.createLinearGradient(x,0,x,-h);g.addColorStop(0,'#fff4ac');g.addColorStop(.22,'#ffc34b');g.addColorStop(.58,'#ff6c26');g.addColorStop(1,'#f3352500');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(x-r,0);ctx.bezierCurveTo(x-r*1.6,-h*.35,x+r*.4+sway,-h*.57,x+sway,-h);ctx.bezierCurveTo(x+r*1.3+sway,-h*.42,x+r*1.4,-h*.25,x+r,0);ctx.closePath();ctx.fill();
  }
  ctx.fillStyle='#fff5c2';ctx.beginPath();ctx.moveTo(-cell*.14,0);ctx.quadraticCurveTo(-cell*.2,-cell*.13,Math.sin(time*.9)*cell*.05,-cell*.36);ctx.quadraticCurveTo(cell*.21,-cell*.11,cell*.14,0);ctx.fill();
  for(let n=0;n<9;n++){const t=reduced?(n+.5)/9:(now*.00065+n*.173+index*.07)%1;ctx.globalAlpha=(1-t)*.85;ctx.fillStyle=n%2?'#ffe8a1':'#ff9740';ctx.beginPath();ctx.arc(Math.sin(n*2.4+time*.3)*cell*(.1+t*.3),-cell*(.18+t*.92),cell*(.014+.009*(n%3)),0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=.2;ctx.strokeStyle='#ffd998';ctx.lineWidth=cell*.018;
  for(let n=0;n<2;n++){ctx.beginPath();for(let k=0;k<7;k++){const y=-cell*(.35+k*.11),x=(n-.5)*cell*.4+Math.sin(time*.6+k)*cell*.07;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  ctx.restore();
}
function drawMapSurface(now,cue){
  if(mapMaterial?.style!=='furnace'||!terrain)return;
  const warming=cue?.type==='fire'&&cue.stage!=='Recovery';
  ctx.save();ctx.strokeStyle=warming?'#ff4b28':'#b97c61';ctx.lineWidth=cell*.025;ctx.globalAlpha=warming?.8:.35;
  for(const i of [10,21,34,45,50]){if(terrain.cells[i]==='hole')continue;const x=(i%columns)*cell,y=Math.floor(i/columns)*cell;
    ctx.beginPath();ctx.moveTo(x,y+cell*.18);ctx.lineTo(x+cell*.035,y+cell*.44);ctx.lineTo(x-cell*.02,y+cell*.67);ctx.stroke();
    const t=reduced?.45:(now*.00028+i*.31)%1;ctx.globalAlpha=.25+.15*Math.sin(t*Math.PI);ctx.fillStyle='#e4ad7d';ctx.beginPath();ctx.arc(x+Math.sin(t*6)*cell*.018,y+cell*(.18+t*.49),cell*.018,0,Math.PI*2);ctx.fill();
  }ctx.restore();
}
function drawTemporaryBlocks(blocks){for(const [index,b] of blocks){if(b.type==='fire')flame(index,visualNow,b.spread&&!reduced?ease(Math.min(1,(visualNow-b.start)/450)):1);else if(!b.cells||index===b.cells[0])boulder(b.cells||[index]);}}
function drawFrozenCells(cells,now){for(const [index,b] of cells){const growth=reduced?1:ease(Math.min(1,(now-b.start+400)/1200));ice(index,now,1,growth,b.art);};}

function clipSegment(top){ctx.beginPath();ctx.rect(0,top*cell,width,height-top*cell);ctx.clip();}
return {drawMapSurface,drawMechanism,drawBoardAtmosphere,drawFrozenCells,drawTemporaryBlocks,drawEnvironment,drawTerrain,clipSegment,drawScoreFloat,impactDelay,tile,drawIdleCore,outline,get drawBeam(){return drawBeam;},set drawBeam(fn){drawBeam=fn;},get clipCells(){return clipCells;},set clipCells(fn){clipCells=fn;},drawCombo,drawSpecial,drawBurst,drawFormation,drawCharge,
configure(state){({width,cell,pixelRatio,visualNow,formations}=state);if(state.terrain){terrain=state.terrain;columns=terrain.width;rows=terrain.height;}mapMaterial=state.map?.material||null;height=rows*cell;}};
}
