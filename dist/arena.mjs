import {FOREST_MAP,selectMap} from './maps.mjs';
import {MapEventFramework} from './environment.mjs';
import {createTerrain,STANDARD_TERRAIN} from './terrain.mjs';
import {MatchEngine, seeded} from './engine.mjs';
import {CardBattle} from './cards.mjs';

export const boardReady=engine=>engine.stableChecked&&!engine.transactions.length;

// A local command boundary shared by human, bot and a future remote adapter.
// It is not a server-authoritative or trusted network validation boundary.
export class ArenaSession {
  constructor({player,opponent=new MatchEngine(),source=null,target=10000,decks=null,onCardChange=()=>{},terrain=STANDARD_TERRAIN,map=null,randomMap=false,mapRandom=Math.random,onMapChange=()=>{},onChange=()=>{}}){
    this.decks=decks;this.onCardChange=onCardChange;this.cards=null;
    this.fixedMap=map;this.randomMap=randomMap;this.mapRandom=mapRandom;this.onMapChange=onMapChange;this.environment=null;this.map=map||FOREST_MAP;
    this.terrain=createTerrain(map?.terrain||terrain);this.engines={player,opponent};this.source=source;this.target=target;this.onChange=onChange;
    this.status='idle';this.winner=null;this.result=null;this.readySides=new Set();
    this.previous={};
    for(const [side,engine] of Object.entries(this.engines)){
      this.previous[side]=engine.onEvent;
      engine.onEvent=e=>{this.cards?.event(side,e);this.previous[side](e);this.event(side,e);};
    }
  }
  start(now=0,seed=Math.floor(Math.random()*4294967296)){
    this.cards?.dispose();this.cards=null;
    this.environment?.dispose();this.source?.stop();this.status='preparing';this.winner=null;this.result=null;this.readySides.clear();this.deadline=null;
    this.map=this.randomMap?selectMap(this.mapRandom):this.fixedMap||FOREST_MAP;
    if(this.randomMap||this.fixedMap)this.terrain=this.map.terrain;
    this.onMapChange(this.map);
    const initial=new MatchEngine({random:seeded(seed),terrain:this.terrain}).board.map(t=>t?{type:t.type,...(t.special?{special:t.special}:{})}:null);
    for(const [side,engine] of Object.entries(this.engines)){
      engine.now=now;engine.random=seeded((seed^(side==='player'?0xa531:0xb917))>>>0);
      engine.loadLevel({id:'arena',board:initial,terrain:this.terrain});engine.tick(now);
    }
    this.environment=this.map.environment?.enabled!==false&&this.map.environment?new MapEventFramework(this.engines,this.map.environment,seeded(seed^0x7ac49)):null;
    if(this.decks)this.cards=new CardBattle(this,{decks:this.decks,random:seeded(seed^0x4c2d),onChange:this.onCardChange});
    this.onChange(this);
  }
  ready(side,now){
    if(this.status!=='preparing'||!['player','opponent'].includes(side))return false;
    this.readySides.add(side);
    if(this.readySides.size===2){
      this.status='countdown';this.deadline=now+3000;
    }
    this.onChange(this);return true;
  }
  command(side,command){
    if(this.status!=='playing'||!['player','opponent'].includes(side)||command?.kind!=='swap')return false;
    if(this.cards){if(!this.cards.allowed(side,command))return false;const wild=this.cards.swap(side,command);if(wild!==null)return wild;}
    return this.engines[side].command(command);
  }
  event(side,e){
    if(this.status==='playing'&&e.kind==='score'&&e.score>=this.target){
      this.winner=side;this.status='finishing';this.source?.stop();this.cards?.stop();this.environment?.stop(e.time);this.onChange(this);
    }
  }
  update(now){
    if(this.status==='countdown'&&now>=this.deadline){
      this.status='playing';for(const e of Object.values(this.engines))e.now=now;
      this.environment?.start(this.deadline);
      this.cards?.start(this.deadline);
      this.source?.start(now);this.onChange(this);
    }
    if(!['playing','finishing'].includes(this.status))return;
    // Resolve in deadline order even when a frame is delayed. Equal deadlines
    // use player then opponent. First crossing remains the winner regardless of
    // the other side's already committed cascades and final score.
    const engines=Object.values(this.engines);
    let next;
    while((next=Math.min(...engines.flatMap(e=>e.transactions.map(tx=>tx.end)),this.environment?.deadline??Infinity,this.cards?.deadline??Infinity))<=now){
      for(const engine of engines)engine.now=next;
      this.environment?.update(next);
      for(const engine of engines)engine.tick(next);
      this.cards?.update(next);
    }
    for(const engine of engines)engine.now=now;
    this.environment?.update(now);
    for(const engine of engines)engine.tick(now);
    this.cards?.update(now);
    if(this.status==='playing')this.source?.update(now,this,'opponent');
    if(this.status==='finishing'&&(!this.environment||this.environment.clean)&&Object.values(this.engines).every(boardReady)){
      this.status='finished';this.result={winner:this.winner,player:this.engines.player.score,opponent:this.engines.opponent.score};this.onChange(this);
    }
  }
  countdown(now){return Math.max(1,Math.ceil((this.deadline-now)/1000));}
  dispose(){
    this.cards?.dispose();this.cards=null;
    this.status='disposed';this.source?.stop();this.environment?.dispose();
    for(const [side,engine] of Object.entries(this.engines)){engine.onEvent=this.previous[side];engine.reset();}
  }
}
