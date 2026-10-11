import {MAPS,selectMap} from './maps.mjs';
export const REVEAL_STEPS=Object.freeze([0,75,155,245,345,460,590,740,920,1130,1380,1670]);
// Presentation clock only: one draw at entry; cycling never rerolls the result.
export class MapReveal {
  constructor(now,random=Math.random,reduced=false){this.start=now;this.map=selectMap(random);this.reduced=reduced;this.cancelled=false;}
  at(now){
    if(this.cancelled)return {phase:'cancelled'};
    const elapsed=Math.max(0,now-this.start),locked=elapsed>=2000;
    const index=REVEAL_STEPS.filter(t=>t<=elapsed).length-1;
    return {phase:elapsed>=4000?'complete':locked?'locked':'cycling',map:locked||this.reduced?this.map:MAPS[index%MAPS.length],progress:Math.min(1,elapsed/2000)};
  }
  cancel(){this.cancelled=true;}
}
