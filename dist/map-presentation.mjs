// Optional stages are selected by each environment's natural sequence.
export const EVENT_STAGES=Object.freeze(['Environment','Camera','Board','Gameplay']);
export const EVENT_SEQUENCES=Object.freeze({
  rockfall:['Environment','Camera','Board','Gameplay'],
  freeze:['Environment','Board','Gameplay'],
  fire:['Environment','Board','Gameplay'],
  mechanism:['Environment','Board','Gameplay']
});
export class MapEventPresentation {
  constructor(){this.reset();}
  reset(){this.cue=null;}
  event(e){
    if(e.spread)return;
    if(e.kind==='reset'||/^(rock|map)-cancel$/.test(e.kind)){this.reset();return;}
    const phase=e.kind.match(/^(rock|map)-(warning|fall|blocked|restored)$/)?.[2];if(!phase)return;
    if(e.cells&&e.index!==e.cells[0])return;
    if(phase==='restored'&&e.reason==='clear')return;
    const cells=e.cells||[e.index];
    if(this.cue?.phase===phase&&this.cue.start===e.time&&this.cue.round===e.round){this.cue.cells=[...new Set([...this.cue.cells,...cells])];return;}
    const origin=this.cue?.round===e.round?(this.cue.origin??this.cue.start):e.time;
    this.cue={type:e.type||'rockfall',round:e.round,cells,origin,start:e.time,duration:e.duration||650,phase};
  }
  at(now){
    const c=this.cue;if(!c)return null;
    const elapsed=now-c.start,t=Math.max(0,Math.min(1,elapsed/c.duration));
    if((c.phase==='restored'||c.phase==='blocked'&&['freeze','mechanism'].includes(c.type))&&t>=1){this.reset();return null;}
    let stage,local=t;
    if(c.phase==='warning'){
      const split=c.type==='rockfall'?[.42,.67]:[.72];
      if(t<split[0]){stage='Environment';local=t/split[0];}
      else if(split.length===2&&t<split[1]){stage='Camera';local=(t-split[0])/(split[1]-split[0]);}
      else {stage='Board';const start=split.at(-1);local=(t-start)/(1-start);}
    }else stage=c.phase==='fall'?'Board':c.phase==='blocked'?'Gameplay':'Recovery';
    return {...c,stage,progress:t,local,impact:c.type==='rockfall'&&c.phase==='blocked'?Math.max(0,1-elapsed/650):0};
  }
}
export function mapMotion(cue,now,reduced=false){
  if(reduced||!cue||cue.type!=='rockfall')return {camera:0,board:0};
  const camera=cue.stage==='Camera'?1.8:cue.impact*3.1;
  const board=cue.stage==='Board'?1.15:cue.impact*2.1;
  return {camera:Math.sin(now*.038)*camera,board:Math.sin(now*.031)*board};
}
