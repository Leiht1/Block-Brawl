import {MatchEngine} from '/engine.mjs';
import {ArenaSession} from '/arena.mjs';
import {FOREST_MAP} from '/maps.mjs';
export const CAST_AT=240,IMPACT_AT=800,BODY_AT=880;
const deck=['fire','freeze','blackhole','luck','quake','rainbow'];
// Capture actual engine payloads. Review renderer never invents targets/moves.
export function makeTrace(id){
 const events=[],changes=[],engines={};
 for(const side of ['player','opponent'])engines[side]=new MatchEngine({onEvent:e=>events.push({side,...structuredClone(e)})});
 const s=new ArenaSession({...engines,map:FOREST_MAP,decks:{player:deck,opponent:deck},onCardChange:e=>changes.push(structuredClone(e))});
 s.start(-3000,913);s.ready('player',-3000);s.ready('opponent',-3000);s.update(0);s.environment?.stop(0);s.cards.aiDue=Infinity;events.length=0;changes.length=0;
 const snapshots=[],side=id==='luck'?'player':'opponent';let cast;
 const record=t=>snapshots.push({time:t,boards:Object.fromEntries(Object.entries(engines).map(([side,e])=>[side,structuredClone(e.board)])),buffs:structuredClone(s.cards.sides[side].buffs)});
 record(0);
 for(let t=20;t<=11000;t+=20){
  s.update(t);
  if(t===CAST_AT){const card={id,uid:++s.cards.serial};s.cards.sides.player.hand=[card];const result=s.cards.cast('player',card.uid,side,27,t);if(!result.ok)throw Error(result.reason);cast=changes.find(e=>e.kind==='cast');}
  record(t);
 }
 const terrain=structuredClone(engines[side].terrain);s.dispose();
 return {id,side,cast,events,changes,snapshots,terrain,at(time){return snapshots[Math.max(0,Math.min(snapshots.length-1,Math.floor(time/20)))];}};
}
