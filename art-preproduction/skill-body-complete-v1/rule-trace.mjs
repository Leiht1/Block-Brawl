import {MatchEngine} from '/engine.mjs';
import {ArenaSession} from '/arena.mjs';
import {FOREST_MAP} from '/maps.mjs';
import {cardById} from '/cards.mjs';
import {quakeCells,QUAKE_SELECTED} from './quake-candidates.mjs';
export const CAST_AT=240,IMPACT_AT=800,BODY_AT=880;
const deck=['fire','freeze','blackhole','luck','quake','rainbow'];
export function makeTrace(id,{candidate=QUAKE_SELECTED,map=FOREST_MAP,wildSwapAt=null}={}){
 const events=[],changes=[],engines={};
 for(const side of ['player','opponent'])engines[side]=new MatchEngine({onEvent:e=>events.push({side,...structuredClone(e)})});
 const s=new ArenaSession({...engines,map,decks:{player:deck,opponent:deck},onCardChange:e=>changes.push(structuredClone(e))});
 s.start(-3000,913);s.ready('player',-3000);s.ready('opponent',-3000);s.update(0);s.environment?.stop(0);s.cards.aiDue=Infinity;events.length=changes.length=0;
 const snapshots=[],side=cardById(id).target==='self'?'player':'opponent';let cast;
 const target=engines[side].board.flatMap((t,i)=>t&&engines[side].ruleTerrain.cells[i]==='cell'&&!t.wild&&!t.special&&!engines[side].frozenCells.has(i)?[i]:[]).sort((a,b)=>Math.abs(a-27)-Math.abs(b-27))[0];
 const record=t=>snapshots.push({time:t,boards:Object.fromEntries(Object.entries(engines).map(([side,e])=>[side,structuredClone(e.board)])),buffs:structuredClone(s.cards.sides[side].buffs),fogCells:[...s.cards.sides[side].fogCells],scores:Object.fromEntries(Object.entries(engines).map(([side,e])=>[side,e.score]))});
 record(0);
 for(let t=20;t<=11200;t+=20){s.update(t);if(t===CAST_AT){const card={id,uid:++s.cards.serial};s.cards.sides.player.hand=[card];
   if(id==='quake'){const cells=quakeCells(engines[side],target,candidate);cast={kind:'cast',side:'player',targetSide:side,index:target,landing:target,cells,path:[],impact:[],card,now:t,proposal:true};changes.push(cast);s.cards.clear(engines[side],cells);changes.push({kind:'effect',id,targetSide:side,index:target,landing:target,cells,now:t,proposal:true});}
   else{const result=s.cards.cast('player',card.uid,side,target,t);if(!result.ok)throw Error(result.reason);cast=changes.find(e=>e.kind==='cast');
    if(id==='fog'){const e=engines[side],cx=target%8,cy=Math.floor(target/8);const local=e.board.flatMap((tile,i)=>tile&&e.ruleTerrain.cells[i]==='cell'&&!tile.wild&&!tile.special?[i]:[]).sort((a,b)=>((a%8-cx)**2+(Math.floor(a/8)-cy)**2)-((b%8-cx)**2+(Math.floor(b/8)-cy)**2)||a-b).slice(0,12);s.cards.sides[side].fogCells=local;cast.cells=local;cast.proposal=true;}}
  }
  // A normal real player command illustrates overload scoring, not a scripted score.
  if(['overload','luck'].includes(id)&&t===1800){const move=s.cards.bestMove('player');if(move)s.command('player',{kind:'swap',a:move[0],b:move[1]});}
  if(id==='rainbow'&&t===wildSwapAt){const engine=engines.player,wild=engine.board.findIndex(tile=>tile?.wild),adjacent=[wild+1,wild-1,wild-engine.width,wild+engine.width].find(i=>engine.canSwap(wild,i));if(adjacent!==undefined)s.command('player',{kind:'swap',a:wild,b:adjacent});}
  record(t);
 }
 const terrain=structuredClone(engines[side].terrain),rainbow=events.find(e=>e.card==='rainbow'&&Number.isInteger(e.index));
 const landing=id==='rainbow'?rainbow?.index??cast.index:cast.landing??cast.index;
 s.dispose();return {id,side,cast,landing,events,changes,snapshots,terrain,map,candidate,proposedRule:['fog','quake'].includes(id),at(time){return snapshots[Math.max(0,Math.min(snapshots.length-1,Math.floor(time/20)))];}};
}
