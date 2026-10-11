import {STANDARD_TERRAIN} from './terrain.mjs';
import {MatchEngine,findMatches,legalMoves} from './engine.mjs';
import {boardReady} from './arena.mjs';

export const DIFFICULTIES=Object.freeze({easy:{label:'简单',target:3000,min:2500,max:4000},normal:{label:'普通',target:6000,min:1500,max:2500},hard:{label:'困难',target:10000,min:800,max:1500}});

// Evaluate a copied visible board with the engine's pure range planner. Never
// instantiate a prediction engine or access random/refill state.
export function evaluateMove(board,[a,b],terrain=STANDARD_TERRAIN){
  const probe=Object.create(MatchEngine.prototype);probe.terrain=terrain;probe.width=terrain.width;probe.height=terrain.height;probe.board=board.map(t=>t?{...t}:null);
  [probe.board[a],probe.board[b]]=[probe.board[b],probe.board[a]];
  const combo=probe.combination(a,b),groups=combo?[]:findMatches(probe.board,terrain).filter(g=>g.cells.includes(a)||g.cells.includes(b));
  const active=[a,b].filter(i=>probe.board[i]?.special),plan=probe.resolution({a,b},groups,active,combo);
  const points=plan.cells.length*10+groups.reduce((n,g)=>n+(g.strength>=5?50:g.strength===4?20:0),0);
  const priority=(combo?4:0)+active.length+groups.reduce((n,g)=>n+(g.strength>=5?3:g.strength===4?2:0),0);
  return {points,priority,combo:!!combo,rewards:plan.rewards.length};
}
export function chooseMove(board,difficulty='normal',random=Math.random,terrain=STANDARD_TERRAIN,canSwap=()=>true){
  const moves=legalMoves([...board],terrain).filter(([a,b])=>canSwap(a,b));if(!moves.length)return null;
  if(difficulty==='easy')return moves[Math.floor(random()*moves.length)];
  const scored=moves.flatMap(pair=>[pair,[...pair].reverse()]).map(pair=>({pair,...evaluateMove(board,pair,terrain)}));
  const value=m=>difficulty==='hard'?m.points+(m.combo?35:0)+m.rewards*15:m.priority;
  const best=Math.max(...scored.map(value)),choices=scored.filter(m=>value(m)===best);
  return choices[Math.floor(random()*choices.length)].pair;
}
export class BotSource {
  constructor(difficulty='normal',random=Math.random){if(!DIFFICULTIES[difficulty])throw Error('Unknown difficulty');this.difficulty=difficulty;this.random=random;this.stop();}
  start(){this.active=true;this.due=null;}
  stop(){this.active=false;this.due=null;}
  update(now,session,side){
    if(!this.active)return;
    const engine=session.engines[side];
    if(!boardReady(engine)){this.due=null;return;}
    if(this.due===null){const d=DIFFICULTIES[this.difficulty];this.due=now+d.min+this.random()*(d.max-d.min);return;}
    if(now<this.due)return;
    const pair=chooseMove(engine.board,this.difficulty,this.random,engine.ruleTerrain,(a,b)=>engine.canSwap(a,b));this.due=null;
    if(pair)session.command(side,{kind:'swap',a:pair[0],b:pair[1]});
  }
}
