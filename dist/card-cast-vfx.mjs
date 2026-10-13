import {CAST_ASSETS,CAST_FRAME_SIZE,CAST_COLUMNS} from './card-cast-assets.mjs';
import {cardById} from './cards.mjs';
import {paintSoftCast} from './effect_cast_soft_v3_final.mjs';

const typeOf=id=>({red:'attack',blue:'control',yellow:'buff'})[cardById(id).color];
export const CAST_TIMING=Object.freeze({release:200,flightStart:180,flight:380,impact:400});
export function castFrame(type,stage,elapsed){
  const a=CAST_ASSETS[type][stage],n=Math.floor(Math.max(0,elapsed)/a.frameMs);
  return a.loop?n%a.frameCount:Math.min(a.frameCount-1,n);
}
// Owns visual clocks only. No engine updates, random calls or board mutations.
export class CardCastPlayback {
  constructor(){this.reset();}
  reset(){this.prepared=new Map();this.casts=[];}
  prepare(card,origin,size,now){this.prepared.set(card.uid,{card,type:typeOf(card.id),origin:{...origin},size:[...size],start:now});}
  cancel(uid){this.prepared.delete(uid);}
  cast(e,fallback){
    const p=this.prepared.get(e.card.uid);this.cancel(e.card.uid);
    const landing=e.card.id==='quake'?e.cells[Math.floor(e.cells.length/2)]:e.landing??e.index;
    this.casts.push({uid:e.card.uid,id:e.card.id,type:typeOf(e.card.id),side:e.side,targetSide:e.targetSide,index:landing,origin:{...(p?.origin||fallback)},start:e.now,resolved:e.card.id!=='rainbow',flightEnd:e.now+CAST_TIMING.flightStart+CAST_TIMING.flight});
  }
  boardEvent(side,e,now){
    if(e.kind!=='card-change'||e.card!=='rainbow'||!Number.isInteger(e.index))return;
    const c=this.casts.find(c=>c.id==='rainbow'&&c.targetSide===side&&!c.resolved&&(e.uid===undefined||c.uid===e.uid));if(!c)return;
    c.index=e.index;c.resolved=true;
    // If a queued skill had to wait for settlement, depart the hover point once
    // its real landing is known. This never delays the queued skill itself.
    if(now>=c.flightEnd){c.resume=now;c.flightEnd=now+180;}
  }
  effect(e){
    // A rainbow action can legally finish with no ordinary tile available.
    // In that case there is no target event and no impact to invent.
    if(e.kind==='effect'&&e.id==='rainbow'){
      const c=this.casts.find(c=>c.id==='rainbow'&&c.side===e.side&&c.targetSide===e.targetSide&&!c.resolved&&(e.uid===undefined||c.uid===e.uid));
      if(c){c.noTarget=true;c.resolved=true;}
    }
  }
  at(now){
    this.casts=this.casts.filter(c=>c.noTarget?now<c.start+CAST_TIMING.release:!c.resolved||now<c.flightEnd+CAST_TIMING.impact);
    return {prepared:[...this.prepared.values()],casts:this.casts};
  }
}

export function createCardCastVfx(flow,boards,ctx){
  const playback=new CardCastPlayback(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const center=node=>{const r=node.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
  function target(c){
    const board=boards[c.targetSide],engine=flow.arena?.engines[c.targetSide];
    if(!engine)return center(board);
    const r=board.getBoundingClientRect();return {x:r.left+(c.index%engine.width+.5)*r.width/engine.width,y:r.top+(Math.floor(c.index/engine.width)+.5)*r.height/engine.height};
  }
  const unit=c=>{const board=boards[c.targetSide],engine=flow.arena?.engines[c.targetSide];return engine?board.getBoundingClientRect().width/engine.width:60;};
  function flightPoint(c,now){
    const to=target(c),elapsed=now-c.start-CAST_TIMING.flightStart;
    if(c.resume){const t=Math.min(1,Math.max(0,(now-c.resume)/180)),s=1-t;return {x:s*c.hover.x+t*to.x,y:s*c.hover.y+t*to.y};}
    const t=Math.min(1,Math.max(0,elapsed/CAST_TIMING.flight)),s=1-t,from=c.origin;
    const lift=Math.min(230,Math.max(70,Math.abs(to.y-from.y)*.5));
    return {x:s*s*s*from.x+3*s*s*t*from.x+3*s*t*t*to.x+t*t*t*to.x,y:s*s*s*from.y+3*s*s*t*(from.y-lift)+3*s*t*t*(to.y+Math.min(100,lift*.5))+t*t*t*to.y};
  }
  function render(now){
    const state=playback.at(now);
    for(const p of state.prepared)paintSoftCast(ctx,p.type,'activation',Math.min(239,now-p.start),p.origin,{size:p.size,reduced});
    for(const c of state.casts){
      const age=now-c.start;if(age<0)continue;
      if(age<CAST_TIMING.release)paintSoftCast(ctx,c.type,'release',age,c.origin,{reduced});
      if(c.noTarget)continue;
      if(age>=CAST_TIMING.flightStart&&(now<c.flightEnd||!c.resolved)){
        const p=flightPoint(c,now),trail=Array.from({length:12},(_,n)=>flightPoint(c,Math.max(c.start+CAST_TIMING.flightStart,now-110+n*10)));
        if(!c.resolved&&now>=c.flightEnd)c.hover={...p};
        paintSoftCast(ctx,c.type,'flight',age-CAST_TIMING.flightStart,p,{unit:unit(c),trail,reduced});
      }else if(c.resolved&&now>=c.flightEnd){
        paintSoftCast(ctx,c.type,'impact',now-c.flightEnd,target(c),{unit:unit(c),reduced});
      }
    }
  }
  return {render,prepare:(...args)=>playback.prepare(...args),cancel:uid=>playback.cancel(uid),reset:()=>playback.reset(),
    event(e){if(e.kind==='cast')playback.cast(e,center(document.getElementById(e.side==='opponent'?'opponent-card-hand':'card-hand')));else playback.effect(e);},
    boardEvent(side,e){const c=playback.casts.find(c=>c.id==='rainbow'&&c.targetSide===side&&!c.resolved&&(e.uid===undefined||c.uid===e.uid));if(c&&!c.hover)c.hover=target(c);playback.boardEvent(side,e,performance.now());},
    snapshot(){return {prepared:[...playback.prepared.values()],casts:playback.casts.map(c=>({...c,origin:{...c.origin},target:target(c)})),renderer:'soft-c-v3',sizeMultiplier:1.5,loaded:0};}
  };
}
