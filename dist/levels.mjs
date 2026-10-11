import {seeded,legalMoves} from './engine.mjs';

const base=()=>Array.from({length:64},(_,i)=>({type:(Math.floor(i/8)+i%8)%5}));
function matchBoard(length){const b=base();b[0]={type:4};for(let c=1;c<=length;c++)b[c]={type:c===3?2:0};b[length+1]={type:1};b[11]={type:0};return b;}
const activeBoard=base();activeBoard[26].special='column';activeBoard[30].special='column';
const comboBoard=base();comboBoard[26].special='row';comboBoard[27].special='blast';
const finalBoard=base();finalBoard[26].special='blast';finalBoard[27].special='blast';finalBoard[63].special='column';
// Data only: matching, creation, activation and scoring remain in MatchEngine.
export const LEVELS=[
  {id:'tutorial-1',title:'基础三消',description:'相邻交换，让三个同色积木连成一线。完成三次有效三消。',board:matchBoard(3),hintMove:[11,3],autoHint:true,seed:91,goals:[{kind:'triples',target:3,label:'有效三消'}]},
  {id:'tutorial-2',title:'四消技巧',description:'四个同色连成直线会留下光束块。再把它与相邻方块交换，点亮整行或整列。',board:matchBoard(4),hintMove:[11,3],autoHint:true,seed:1,goals:[{kind:'lineCreated',target:1,label:'制造直线方块'},{kind:'lineActivated',target:1,label:'触发自己制造的直线'}]},
  {id:'tutorial-3',title:'五消技巧',description:'五个同色连成一线，或组成 T / L 型，会留下爆破块。制造后触发它！需要时再点提示。',board:matchBoard(5),hintMove:[11,3],seed:1,goals:[{kind:'blastCreated',target:1,label:'制造爆破方块'},{kind:'blastActivated',target:1,label:'触发自己制造的爆破'}]},
  {id:'tutorial-4',title:'主动引爆',description:'不用凑三连！把光束块与相邻普通块交换，两次主动引爆即可过关。波及引爆不算主动操作。',board:activeBoard,seed:91,goals:[{kind:'active',target:2,label:'主动特殊消除'}]},
  {id:'tutorial-5',title:'组合技巧',description:'两个相邻特殊块，不分颜色，直接交换就能释放组合技。试着自己找到它们。',board:comboBoard,seed:91,goals:[{kind:'combos',target:1,label:'特殊组合技'}]},
  {id:'tutorial-6',title:'综合实战',description:'8 步内获得 300 分。观察特殊块，把三消、主动引爆和组合技用起来！',board:finalBoard,seed:2,moveLimit:8,targetScore:300,goals:[{kind:'score',target:300,label:'目标得分'}]}
].map(l=>({...l,refills:{}}));

export class LevelSession {
  constructor(engine,config){
    if(config.moveLimit!==undefined&&(!Number.isInteger(config.moveLimit)||config.moveLimit<1))throw new Error('Invalid move limit');
    this.engine=engine;this.config=config;this.moves=0;this.pending=new Set();this.accepted=new Set();this.created=new Map();this.activated=new Set();
    this.counts={triples:0,lineCreated:0,lineActivated:0,blastCreated:0,blastActivated:0,active:0,combos:0,score:0};this.status='playing';
    engine.random=seeded(config.seed??91);engine.loadLevel(config);
  }
  get goals(){return this.config.goals||[{kind:'score',label:'目标得分',target:this.config.targetScore}];}
  get complete(){return this.goals.every(g=>this.counts[g.kind]>=g.target);}
  get remaining(){return this.config.moveLimit===undefined?null:this.config.moveLimit-this.moves;}
  get canAct(){return this.status==='playing'&&!this.complete&&(this.remaining===null||this.remaining>this.pending.size);}
  swap(a,b){return this.canAct&&this.engine.command({kind:'swap',a,b});}
  event(e){
    if(this.status!=='playing')return;
    if(e.kind==='swap')this.pending.add(e.txId);
    if(e.kind==='revert')this.pending.delete(e.txId);
    if(e.kind==='action-accepted'&&!this.accepted.has(e.txId)){
      this.accepted.add(e.txId);this.pending.delete(e.txId);this.moves++;
      if(e.matches.some(m=>m.strength===3))this.counts.triples++;
      if(e.activeIds.length)this.counts.active++;
    }
    if(e.kind==='special-create'){
      this.created.set(e.tile.id,e.tile.special);this.counts[e.tile.special==='blast'?'blastCreated':'lineCreated']++;
    }
    const triggered=e.kind==='special-trigger'?[e.tile]:e.kind==='combo-trigger'?e.participants.map(p=>p.tile):[];
    for(const t of triggered)if(this.created.has(t.id)&&!this.activated.has(t.id)){
      this.activated.add(t.id);this.counts[this.created.get(t.id)==='blast'?'blastActivated':'lineActivated']++;
    }
    if(e.kind==='combo-trigger')this.counts.combos++;
    if(e.kind==='score')this.counts.score=e.score;
  }
  update(){
    // Last move includes all gravity cascades and any concurrent operations.
    if(this.status==='playing'&&this.engine.stableChecked&&!this.engine.transactions.length){
      if(this.complete)this.status='won';else if(this.remaining===0)this.status='lost';
    }
    return this.status;
  }
  hint(){
    const moves=legalMoves(this.engine.board).filter(([a,b])=>this.engine.canSwap(a,b));
    if(this.counts.lineCreated||this.counts.blastCreated){
      const made=moves.find(([a,b])=>[a,b].some(i=>this.created.has(this.engine.board[i]?.id)));if(made)return made;
    }
    if(this.config.hintMove&&this.moves===0&&this.engine.canSwap(...this.config.hintMove))return this.config.hintMove;
    if(this.config.id==='tutorial-4')return moves.find(([a,b])=>!!this.engine.board[a].special!==!!this.engine.board[b].special);
    if(this.config.id==='tutorial-5')return moves.find(([a,b])=>this.engine.board[a].special&&this.engine.board[b].special);
    return moves.find(([a,b])=>this.engine.board[a].special||this.engine.board[b].special)||moves[0];
  }
}

export const PROGRESS_KEY='block-brawl.tutorial.v1';
export class TutorialProgress {
  constructor(storage){this.storage=storage;this.completed=0;this.saved=true;try{const data=JSON.parse(storage.getItem(PROGRESS_KEY));if(data?.version===1&&Number.isInteger(data.completed)&&data.completed>=0&&data.completed<=LEVELS.length)this.completed=data.completed;}catch{this.saved=false;}}
  unlocked(index){return Number.isInteger(index)&&index>=0&&index<LEVELS.length&&index<=this.completed;}
  get qualified(){return this.completed===LEVELS.length;}
  finish(index){if(!this.unlocked(index))return false;this.completed=Math.max(this.completed,index+1);try{this.storage.setItem(PROGRESS_KEY,JSON.stringify({version:1,completed:this.completed}));this.saved=true;}catch{this.saved=false;}return true;}
}
