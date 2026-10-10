export const SIZE = 8;
export const TIMING = Object.freeze({swap:100, revert:90, clear:160, fall:250});
export const RULESET = Object.freeze({colors:5, targetScore:null, loadoutSlots:3, energy:null});
// Future adapters consume the command/event boundary; no network or item rules yet.
export const FUTURE_PORTS = Object.freeze(['realtimeCommands','environmentEvents','loadout','energy','tutorialProgress','challengeRules']);
export function seeded(seed=12345) { let n=seed>>>0; return ()=>{ n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296; }; }
export function findMatches(board) {
  const runs=[];
  for(let axis=0;axis<2;axis++) for(let a=0;a<SIZE;a++) {
    let b=0;
    while(b<SIZE) {
      const ids=[]; const pos=axis?b*SIZE+a:a*SIZE+b; const type=board[pos]?.type;
      let end=b;
      while(type!==undefined && end<SIZE && board[axis?end*SIZE+a:a*SIZE+end]?.type===type) {ids.push(axis?end*SIZE+a:a*SIZE+end);end++;}
      if(ids.length>=3) runs.push({cells:new Set(ids),strength:ids.length});
      b=Math.max(b+1,end);
    }
  }
  // Merge overlapping runs, including T and L shapes, without double scoring.
  let merged=true;
  while(merged) {merged=false; outer:for(let i=0;i<runs.length;i++)for(let j=i+1;j<runs.length;j++){
    if([...runs[i].cells].some(k=>runs[j].cells.has(k))) {for(const k of runs[j].cells)runs[i].cells.add(k);runs[i].strength=Math.max(runs[i].strength,runs[j].strength);runs.splice(j,1);merged=true;break outer;}
  }}
  return runs.map(g=>({...g,cells:[...g.cells],columns:[...new Set([...g.cells].map(i=>i%SIZE))]}));
}
export function legalMoves(board) {
  const result=[];
  for(let i=0;i<board.length;i++) for(const j of [i%SIZE<7?i+1:-1,i+8]) {
    if(j<0||j>=64||!board[i]||!board[j]||board[i].type===board[j].type)continue;
    [board[i],board[j]]=[board[j],board[i]];
    if(findMatches(board).some(g=>g.cells.includes(i)||g.cells.includes(j)))result.push([i,j]);
    [board[i],board[j]]=[board[j],board[i]];
  }
  return result;
}
export class MatchEngine {
  constructor({random=Math.random,onEvent=()=>{}}={}) {this.random=random;this.onEvent=onEvent;this.now=0;this.nextId=0;this.nextTx=0;this.reset();}
  emit(kind,data={}) {this.onEvent({kind,time:this.now,...data});}
  tile(type) {return {id:++this.nextId,type:type??Math.floor(this.random()*5)};}
  freshBoard() {
    let board;
    do {board=[];for(let i=0;i<64;i++){let type;do{type=Math.floor(this.random()*5);}while((i%8>=2&&board[i-1].type===type&&board[i-2].type===type)||(i>=16&&board[i-8].type===type&&board[i-16].type===type));board.push(this.tile(type));}}while(!legalMoves(board).length);
    return board;
  }
  reset(mode='free') {
    this.transactions=[];this.locks=Array(8).fill(null);this.pendingColumns=new Set();this.depths=Array(8).fill(0);this.score=0;this.bestChain=0;this.cleared=0;this.refills=new Map();
    this.board=this.freshBoard();this.practiceMove=null;
    if(mode!=='free') {
      const length=mode==='four'?4:mode==='five'?5:3;
      // Reject incidental initial matches so a fixture always starts stable.
      const gap=3;
      let ready=false;
      do {
        this.board=this.freshBoard();for(let c=1;c<=length;c++)this.board[c]=this.tile(c===gap?2:0);this.board[8+gap]=this.tile(0);
        if(findMatches(this.board).length)continue;
        [this.board[gap],this.board[8+gap]]=[this.board[8+gap],this.board[gap]];
        const groups=findMatches(this.board);
        ready=groups.length===1&&groups[0].cells.length===length&&groups[0].strength===length;
        [this.board[gap],this.board[8+gap]]=[this.board[8+gap],this.board[gap]];
      }while(!ready);
      this.practiceMove=[gap,8+gap];
      if(mode==='chain')for(let c=1;c<=3;c++)this.refills.set(c,[1]);
    }
    this.mode=mode;this.stableChecked=false;this.emit('reset',{mode});
  }
  isBusy(index) {return this.locks[index%8]!==null||this.pendingColumns.has(index%8);}
  canSwap(a,b) {return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<64&&b<64&&Math.abs(Math.floor(a/8)-Math.floor(b/8))+Math.abs(a%8-b%8)===1&&!this.isBusy(a)&&!this.isBusy(b)&&!!this.board[a]&&!!this.board[b];}
  command(command) {return command.kind==='swap'?this.swap(command.a,command.b):false;}
  swap(a,b) {
    if(!this.canSwap(a,b))return false;
    const tx={id:++this.nextTx,phase:'swap',end:this.now+TIMING.swap,a,b,depth:1,columns:[...new Set([a%8,b%8])]};
    for(const c of tx.columns){this.locks[c]=tx.id;this.depths[c]=0;}
    const moves=[{tile:this.board[a],from:a,to:b},{tile:this.board[b],from:b,to:a}];
    [this.board[a],this.board[b]]=[this.board[b],this.board[a]];
    this.stableChecked=false;this.transactions.push(tx);this.emit('swap',{moves,duration:TIMING.swap});return true;
  }
  claim(tx,groups) {
    const columns=[...new Set(groups.flatMap(g=>g.columns))];
    if(columns.some(c=>this.locks[c]!==null&&this.locks[c]!==tx.id))return false;
    for(const c of columns){this.locks[c]=tx.id;if(!tx.columns.includes(c))tx.columns.push(c);}
    tx.groups=groups;tx.phase='clear';tx.end=this.now+TIMING.clear;
    const cells=[...new Set(groups.flatMap(g=>g.cells))];const strength=Math.max(...groups.map(g=>g.strength));
    const points=(cells.length*10+(strength>=5?50:strength===4?20:0))*tx.depth;
    const tiles=cells.map(index=>({index,tile:this.board[index]}));
    for(const i of cells)this.board[i]=null;
    this.score+=points;this.cleared+=cells.length;this.bestChain=Math.max(this.bestChain,tx.depth);
    this.emit('clear',{tiles,strength,depth:tx.depth,points,duration:TIMING.clear});this.emit('score',{score:this.score,points,depth:tx.depth});return true;
  }
  release(tx) {for(const c of tx.columns)if(this.locks[c]===tx.id)this.locks[c]=null;this.transactions=this.transactions.filter(t=>t!==tx);}
  advance(tx) {
    if(tx.phase==='swap') {
      const groups=findMatches(this.board).filter(g=>g.cells.includes(tx.a)||g.cells.includes(tx.b));
      if(groups.length&&this.claim(tx,groups))return;
      const moves=[{tile:this.board[tx.a],from:tx.a,to:tx.b},{tile:this.board[tx.b],from:tx.b,to:tx.a}];
      [this.board[tx.a],this.board[tx.b]]=[this.board[tx.b],this.board[tx.a]];
      tx.phase='revert';tx.end=this.now+TIMING.revert;this.emit('revert',{moves,duration:TIMING.revert,conflict:groups.length>0});
    } else if(tx.phase==='revert')this.release(tx);
    else if(tx.phase==='clear') {
      const moves=[];
      for(const c of tx.columns) {
        let row=7;
        for(let r=7;r>=0;r--)if(this.board[r*8+c]){const tile=this.board[r*8+c];const to=row*8+c;this.board[to]=tile;if(row!==r)moves.push({tile,from:r*8+c,to});row--;}
        for(let r=row;r>=0;r--) {const queue=this.refills.get(c);const tile=this.tile(queue?.length?queue.shift():undefined);this.board[r*8+c]=tile;moves.push({tile,from:(r-row-1)*8+c,to:r*8+c});}
      }
      tx.phase='fall';tx.end=this.now+TIMING.fall;this.emit('fall',{moves,duration:TIMING.fall});
    } else {
      for(const c of tx.columns)this.depths[c]=tx.depth;
      this.release(tx);this.emit('settled',{columns:tx.columns,depth:tx.depth});
    }
  }
  tick(time) {
    this.now=time;
    if(this.stableChecked&&!this.transactions.length)return;
    for(const tx of [...this.transactions])if(time>=tx.end)this.advance(tx);
    const groups=findMatches(this.board).filter(g=>g.columns.every(c=>this.locks[c]===null));
    for(const g of groups) {
      const tx={id:++this.nextTx,columns:[],depth:Math.max(...g.columns.map(c=>this.depths[c]))+1};
      if(this.claim(tx,[g]))this.transactions.push(tx);
    }
    // A cross-column cascade may wait for an independent animation. Preserve
    // its lineage and keep its affected free columns from accepting a new swap.
    this.pendingColumns=new Set(findMatches(this.board).flatMap(g=>g.columns));
    for(let c=0;c<8;c++)if(this.locks[c]===null&&!this.pendingColumns.has(c))this.depths[c]=0;
    if(!this.transactions.length&&!findMatches(this.board).length){if(!legalMoves(this.board).length){this.board=this.freshBoard();this.emit('reshuffle');}this.stableChecked=true;}
  }
  hint() {return legalMoves(this.board).find(([a,b])=>!this.isBusy(a)&&!this.isBusy(b));}
}
