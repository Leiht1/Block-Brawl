import {CAST_TIMING} from './card-cast-vfx.mjs';
import {CARD_CONFIG} from './cards.mjs';
import {SKILL_ASSETS,SKILL_BODY_ENABLED} from './skill-body-assets.mjs';
import {paintSkillBody,paintFogGroup,paintSageBacklight,skillImages} from './effect_skill_body_soft_v1_final.mjs';
const duration=id=>CARD_CONFIG[({luck:'luckMs',sage:'sageMs',overload:'overloadMs',fog:'fogMs',freeze:'freezeMs'})[id]]??0;
// Read-only event history. Actual engine deadlines, targets and moves own the rules.
export class SkillBodyPlayback {
 constructor(){this.reset();}
 reset(){this.records=[];}
 event(e){
  if(e.kind==='cast'){
   if(duration(e.card.id)&&e.card.id!=='fog')this.records=this.records.filter(r=>r.id!==e.card.id||r.targetSide!==e.targetSide);
   const flightEnd=e.now+CAST_TIMING.flightStart+CAST_TIMING.flight;
   this.records.push({...e,id:e.card.id,cells:[...e.cells],path:[...(e.path??[])],flightEnd,bodyAt:['fog','quake'].includes(e.card.id)?e.now:flightEnd+80,until:e.now+duration(e.card.id),resolved:e.card.id!=='rainbow'});
  }else if(['fire-start','quake-start'].includes(e.kind)){
   const r=this.records.find(r=>r.card.uid===e.uid);
   if(r){r.waveAt=r.bodyAt=e.now;r.cells=[...e.cells];r.hitDelays=e.hitDelays;}
  }else if(e.kind==='effect'){
   const r=this.records.find(r=>(e.uid===undefined||r.card.uid===e.uid)&&r.id===e.id&&r.side===e.side&&r.targetSide===e.targetSide&&!r.effect);
   if(r){r.effect={...e,cells:[...e.cells]};if(['blackhole','storm','rainbow'].includes(e.id))r.bodyAt=Math.max(r.bodyAt,e.now);if(e.id==='storm')r.cells=[...e.cells];if(e.id==='rainbow'&&!r.resolved)r.noTarget=true;}
  }
 }
 boardEvent(side,e){
  if(e.kind!=='card-change')return;
  const r=this.records.find(r=>r.targetSide===side&&r.id===e.card&&!r.change&&(e.uid===undefined||r.card.uid===e.uid));
  if(!r)return;r.change=e;
  if(e.card==='rainbow'){r.index=e.index;r.landing=e.index;r.resolved=true;}
 }
 sync(casts){for(const c of casts){const r=this.records.find(r=>r.card.uid===c.uid);if(r){r.flightEnd=c.flightEnd;r.bodyAt=r.waveAt??(['fog','quake'].includes(r.id)?r.now:Math.max(c.flightEnd+80,['blackhole','storm','rainbow'].includes(r.id)?r.effect?.now??0:0));r.resolved=c.resolved;r.noTarget=c.noTarget;if(c.resolved&&r.id==='rainbow')r.landing=r.index=c.index;}}}
 at(now){
  this.records=this.records.filter(r=>{
   if(r.noTarget)return false;
   const effectUntil=r.effect?r.effect.now+900:!duration(r.id)?Infinity:0;
   return now<Math.max(r.bodyAt+(SKILL_ASSETS[r.id]?.mainMs??800),r.until+(r.id==='fog'?1200:r.id==='freeze'?360:0),effectUntil);
  });return this.records;
 }
}
export function createSkillBodyVfx(flow,boards,ctx,casts){
 const playback=new SkillBodyPlayback(),images=skillImages();
 const board=side=>{const b=boards[side].getBoundingClientRect(),e=flow.arena.engines[side];return {x:b.left,y:b.top,width:b.width,height:b.height,columns:e.width,terrain:e.ruleTerrain.cells};};
 const badges={};for(const side of ['player','opponent']){const n=document.createElement('div');n.className='skill-buff-rail';n.setAttribute('aria-label',side==='player'?'己方增益':'敌方增益');document.body.append(n);badges[side]=n;}
 function reset(){playback.reset();for(const n of Object.values(badges))n.replaceChildren();}
 function paintUnderlay(localCtx,side,now,width,height){
  if(!SKILL_BODY_ENABLED||flow.arena?.status!=='playing')return;
  const r=playback.records.findLast(r=>r.id==='sage'&&r.targetSide===side&&now>=r.bodyAt&&now<r.until);
  if(r)paintSageBacklight(localCtx,now-r.bodyAt,r.until-now,{x:0,y:0,width,height,columns:flow.arena.engines[side].width,terrain:flow.arena.engines[side].ruleTerrain.cells});
 }
 function render(now,battle){
  if(!SKILL_BODY_ENABLED||!battle){reset();return;}
  playback.sync(casts.snapshot().casts);
  const records=playback.at(now);
  for(const r of records)if(r.id!=='fog')paintSkillBody(ctx,r,now,board(r.targetSide),images);
  // The root overlay is outside each board's isolated stacking context. Fog
  // paints last and clips only board terrain, including scene obstacles.
  for(const side of ['player','opponent'])paintFogGroup(ctx,records.filter(r=>r.id==='fog'&&r.targetSide===side),now,board(side),images);
  for(const side of ['player','opponent']){
   const rail=badges[side],b=board(side),ids=['luck','overload'].filter(id=>now<(battle.sides[side].buffs[id]??0)),size=Math.max(36,Math.min(60,b.width*.18)),gap=Math.max(20,b.width*.09),available=Math.min(board('player').x,innerWidth-board('opponent').x-board('opponent').width),offset=Math.min(gap,Math.max(8,available-size-8));
   rail.style.left=(side==='opponent'?Math.min(innerWidth-size-8,b.x+b.width+offset):Math.max(8,b.x-size-offset))+'px';rail.style.top=b.y+12+'px';rail.style.width=size+'px';rail.style.setProperty('--buff-size',size+'px');
   for(const node of [...rail.children])if(!ids.includes(node.dataset.buff))node.remove();
   for(const id of ids){let n=rail.querySelector(`[data-buff="${id}"]`);if(!n){n=document.createElement('div');n.dataset.buff=id;n.className='skill-buff '+id;n.innerHTML='<canvas width="80" height="80" aria-hidden="true"></canvas><strong></strong>';n.title=id==='luck'?'幸运星 · 补充方块有22%概率变为特殊方块':'超载模式 · 消除得分×2';rail.append(n);}
    const img=images[id];if(img?.complete&&img.naturalWidth){const c=n.querySelector('canvas').getContext('2d');c.clearRect(0,0,80,80);const frame=id==='luck'?2:3;c.drawImage(img,frame*256+30,30,196,196,0,0,80,80);}
    const remaining=Math.max(0,(battle.sides[side].buffs[id]-now)/1000);n.querySelector('strong').textContent=Math.ceil(remaining)+'s';n.setAttribute('aria-label',`${id==='luck'?'幸运星':'超载模式'}，剩余${remaining.toFixed(1)}秒`);
   }
  }
 }
 return {event:e=>playback.event(e),boardEvent:(side,e)=>playback.boardEvent(side,e),render,reset,paintUnderlay,snapshot:()=>({enabled:SKILL_BODY_ENABLED,loaded:Object.values(images).filter(i=>i.complete&&i.naturalWidth).length,records:playback.records.map(r=>({id:r.id,uid:r.card.uid,side:r.side,targetSide:r.targetSide,index:r.landing??r.index,cells:r.cells,region:r.region,hitDelays:r.hitDelays,start:r.now,bodyAt:r.bodyAt,until:r.until,effectAt:r.effect?.now,resolved:r.resolved}))})};
}
