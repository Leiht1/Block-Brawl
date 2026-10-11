import {createTerrain,STANDARD_TERRAIN,columnSegments,witnesses,triples} from './terrain.mjs';
// Legacy default exported for existing standard-board fixtures.
export const SIZE = 8;
export const TIMING = Object.freeze({swap:100, revert:90, clear:280, comboClear:420, fall:250});
export const RULESET = Object.freeze({colors:5, targetScore:null, loadoutSlots:3, energy:null});
// Future adapters consume the command/event boundary; no network or item rules yet.
export const FUTURE_PORTS = Object.freeze(['realtimeCommands','environmentEvents','loadout','energy','tutorialProgress','challengeRules']);
export function seeded(seed=12345) { let n=seed>>>0; return ()=>{ n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296; }; }
export function findMatches(board,terrain=STANDARD_TERRAIN) {
  const {width,height}=terrain;
  const runs=[];
  for(let axis=0;axis<2;axis++) for(let a=0;a<(axis?width:height);a++) {
    let b=0;const limit=axis?height:width;
    while(b<limit) {
      const ids=[],pos=axis?b*width+a:a*width+b;
      const type=terrain.cells[pos]==='cell'?board[pos]?.type:undefined;
      let end=b;
      while(type!==undefined && end<limit) {
        const i=axis?end*width+a:a*width+end;
        if(terrain.cells[i]!=='cell'||board[i]?.type!==type)break;
        ids.push(i);end++;
      }
      if(ids.length>=3) runs.push({cells:new Set(ids),strength:ids.length,runs:[{cells:ids,axis:axis?'column':'row'}]});
      b=Math.max(b+1,end);
    }
  }
  // Merge overlapping runs, including T and L shapes, without double scoring.
  let merged=true;
  while(merged) {merged=false; outer:for(let i=0;i<runs.length;i++)for(let j=i+1;j<runs.length;j++){
    if([...runs[i].cells].some(k=>runs[j].cells.has(k))) {for(const k of runs[j].cells)runs[i].cells.add(k);runs[i].runs.push(...runs[j].runs);runs[i].strength=Math.max(runs[i].strength,runs[j].strength);runs.splice(j,1);merged=true;break outer;}
  }}
  return runs.map(g=>({...g,
    // Intersecting horizontal and vertical triples form a five-match (T/L/+).
    strength:g.runs.some(r=>r.axis==='row')&&g.runs.some(r=>r.axis==='column')&&g.cells.size>=5?Math.max(5,g.strength):g.strength,
    cells:[...g.cells],columns:[...new Set([...g.cells].map(i=>i%width))]}));
}
export function legalMoves(board,terrain=STANDARD_TERRAIN) {
  const {width}=terrain;
  const result=[];
  for(let i=0;i<board.length;i++) for(const j of [i%width<width-1?i+1:-1,i+width]) {
    if(j<0||j>=board.length||terrain.cells[i]!=='cell'||terrain.cells[j]!=='cell'||!board[i]||!board[j])continue;
    if(board[i].special||board[j].special){result.push([i,j]);continue;}
    if(board[i].type===board[j].type)continue;
    [board[i],board[j]]=[board[j],board[i]];
    if(findMatches(board,terrain).some(g=>g.cells.includes(i)||g.cells.includes(j)))result.push([i,j]);
    [board[i],board[j]]=[board[j],board[i]];
  }
  return result;
}
export class MatchEngine {
  constructor({random=Math.random,onEvent=()=>{},terrain=STANDARD_TERRAIN}={}) {this.terrain=createTerrain(terrain);this.width=this.terrain.width;this.height=this.terrain.height;this.random=random;this.onEvent=onEvent;this.now=0;this.nextId=0;this.nextTx=0;this.reset();}
  emit(kind,data={}) {this.onEvent({kind,time:this.now,...data});}
  tile(type) {return {id:++this.nextId,type:type??Math.floor(this.random()*5)};}
  freshBoard() {
    // Finite color choice: even a constant random source cannot spin forever.
    for(let attempt=0;attempt<64;attempt++) {
      const board=Array(this.width*this.height).fill(null);
      for(let i=0;i<board.length;i++)if(this.terrain.cells[i]==='cell') {
        for(let n=0;n<37;n++) {
          const type=n<32?Math.floor(this.random()*5):n-32,w=this.width;
          if(i%w>=2&&board[i-1]?.type===type&&board[i-2]?.type===type)continue;
          if(i>=2*w&&board[i-w]?.type===type&&board[i-2*w]?.type===type)continue;
          board[i]=this.tile(type);break;
        }
      }
      if(legalMoves(board,this.terrain).length)return board;
      if(attempt===63)return this.arrange(board,false);
    }
  }
  arrange(board,preserve=true,anchors=new Map()) {
    const indices=this.ruleTerrain.cells.flatMap((s,i)=>s==='cell'&&!anchors.has(i)?[i]:[]),tiles=indices.map(i=>board[i]);
    const candidate=Array(board.length).fill(null),lines=triples(this.ruleTerrain);
    for(const [i,tile] of anchors)candidate[i]=tile;
    const playable=candidate=>legalMoves(candidate,this.ruleTerrain).some(([a,b])=>!anchors.has(a)&&!anchors.has(b));
    // Fast bounded permutations preserve IDs, colors and special identities.
    if(preserve)for(let attempt=0;attempt<128;attempt++) {
      for(let n=tiles.length-1;n>0;n--){const j=Math.floor(this.random()*(n+1));[tiles[n],tiles[j]]=[tiles[j],tiles[n]];}
      indices.forEach((i,n)=>candidate[i]=tiles[n]);
      if(!findMatches(candidate,this.ruleTerrain).length&&playable(candidate))return candidate;
    }
    // Construct a witnessed move with a bounded constraint search. For a fresh
    // board colors are free. If the inventory is mathematically insufficient
    // or search exhausts its budget, redeal colors without replacing identities.
    const local=new Map(indices.map(i=>[i,lines.filter(g=>g.includes(i))]));
    let budget=300000;
    for(const witness of witnesses(this.ruleTerrain))for(let color=0;color<5;color++)for(let other=0;other<5;other++) {
      if(other===color)continue;
      if(anchors.has(witness.target)||anchors.has(witness.source))continue;
      const fixed=new Map([...witness.same.map(i=>[i,color]),[witness.target,other]]);
      if([...fixed].some(([i,type])=>anchors.has(i)&&anchors.get(i).type!==type))continue;
      const counts=Array(5).fill(0);tiles.forEach(t=>counts[t.type]++);
      const values=Array(board.length).fill(undefined);
      for(const [i,tile] of anchors)values[i]=tile.type;
      const order=[...[...fixed.keys()].filter(i=>!anchors.has(i)),...indices.filter(i=>!fixed.has(i))];
      const search=n=>{
        if(--budget<0)return false;
        if(n===order.length)return true;
        const i=order[n],options=fixed.has(i)?[fixed.get(i)]:[0,1,2,3,4].sort((a,b)=>counts[b]-counts[a]);
        for(const type of options){
          if(preserve&&!counts[type])continue;
          values[i]=type;
          if(local.get(i).some(g=>g.every(j=>values[j]===type))){values[i]=undefined;continue;}
          counts[type]--;if(search(n+1))return true;counts[type]++;values[i]=undefined;
        }
        return false;
      };
      if(search(0)) {
        const pools=Array.from({length:5},(_,type)=>tiles.filter(t=>t.type===type));
        indices.forEach((i,n)=>candidate[i]=preserve?pools[values[i]].pop():{...tiles[n],type:values[i]});
        return candidate;
      }
      if(budget<0){if(preserve)return this.arrange(board,false,anchors);throw Error('Terrain arrangement search limit exceeded');}
    }
    if(preserve)return this.arrange(board,false,anchors);
    throw Error('Terrain cannot form a stable playable board');
  }
  // Configuration boundary for future map adapters. Changes are atomic and
  // only allowed at rest; temporary events use the reservation boundary below.
  configureTerrain(config) {
    if(this.transactions.length||this.pendingColumns.size)throw Error('Cannot change terrain during a transaction');
    this.reset('free',config);
  }
  reset(mode='free',config=this.terrain) {
    const terrain=createTerrain(mode==='free'?config:STANDARD_TERRAIN);
    this.terrain=terrain;this.width=terrain.width;this.height=terrain.height;
    this.temporaryBlocks=new Map();this.frozenCells=new Map();this.effectiveTerrain=null;this.recoveryColumns=new Set();
    this.transactions=[];this.locks=Array(this.width).fill(null);this.pendingColumns=new Set();this.depths=Array(this.width).fill(0);this.score=0;this.bestChain=0;this.cleared=0;this.refills=new Map();
    this.board=this.freshBoard();this.practiceMove=null;
    if(['combo-lines','combo-cross','combo-column','combo-blasts'].includes(mode)) {
      this.board=Array.from({length:64},(_,i)=>this.tile((Math.floor(i/8)+i%8)%5));
      this.board[26].special=mode==='combo-blasts'?'blast':mode==='combo-column'?'column':'row';
      this.board[27].special=mode==='combo-lines'?'column':'blast';
      this.practiceMove=[26,27];
    } else if(['row','column','blast','special-chain','edge'].includes(mode)) {
      // Stable, repeatable activation fixtures, independent of random refills.
      this.board=Array.from({length:64},(_,i)=>this.tile((Math.floor(i/8)+i%8)%5));
      const index=mode==='edge'?1:27;
      this.board[index].special=mode==='column'?'column':mode==='row'?'row':'blast';
      if(mode==='special-chain'){this.board[28].special='row';this.board[30].special='column';}
      this.practiceMove=[index,index-1];
    } else if(mode==='t-five'||mode==='l-five') {
      const cells=mode==='t-five'?[26,27,28,35,43]:[27,28,29,35,43];
      const target=27,source=mode==='t-five'?19:26;
      let ready=false;
      do {
        this.board=this.freshBoard();for(const i of cells)this.board[i]=this.tile(i===target?2:0);this.board[source]=this.tile(0);
        if(findMatches(this.board,this.ruleTerrain).length)continue;
        [this.board[source],this.board[target]]=[this.board[target],this.board[source]];
        const groups=findMatches(this.board,this.ruleTerrain);
        ready=groups.length===1&&groups[0].cells.length===5&&cells.every(i=>groups[0].cells.includes(i));
        [this.board[source],this.board[target]]=[this.board[target],this.board[source]];
      }while(!ready);
      this.practiceMove=[source,target];
    } else if(mode!=='free') {
      const length=mode==='four'?4:mode==='five'?5:3;
      // Reject incidental initial matches so a fixture always starts stable.
      const gap=3;
      let ready=false;
      do {
        this.board=this.freshBoard();for(let c=1;c<=length;c++)this.board[c]=this.tile(c===gap?2:0);this.board[8+gap]=this.tile(0);
        if(findMatches(this.board,this.ruleTerrain).length)continue;
        [this.board[gap],this.board[8+gap]]=[this.board[8+gap],this.board[gap]];
        const groups=findMatches(this.board,this.ruleTerrain);
        ready=groups.length===1&&groups[0].cells.length===length&&groups[0].strength===length;
        [this.board[gap],this.board[8+gap]]=[this.board[8+gap],this.board[gap]];
      }while(!ready);
      this.practiceMove=[gap,8+gap];
      if(mode==='chain')for(let c=1;c<=3;c++)this.refills.set(c,[1]);
    }
    this.mode=mode;this.stableChecked=false;this.emit('reset',{mode});
  }
  get ruleTerrain(){return this.effectiveTerrain||this.terrain;}
  get gravityTerrain(){return this.frozenCells.size?{...this.ruleTerrain,cells:this.ruleTerrain.cells.map((s,i)=>this.frozenCells.has(i)?'obstacle':s)}:this.ruleTerrain;}
  refreshTerrain(){
    this.effectiveTerrain=this.temporaryBlocks.size?Object.freeze({...this.terrain,cells:Object.freeze(this.terrain.cells.map((s,i)=>this.temporaryBlocks.has(i)?'obstacle':s))}):null;
    this.stableChecked=false;
  }
  terrainBoundary(index,owner=null){const c=index%this.width;return owner!==null&&this.locks[c]===owner||this.locks[c]===null&&!this.pendingColumns.has(c);}
  canSeal(index,owner=null){return this.terrain.cells[index]==='cell'&&!this.temporaryBlocks.has(index)&&!this.frozenCells.has(index)&&!!this.board[index]&&!this.board[index].special&&this.terrainBoundary(index,owner);}
  reserveTerrain(index,owner){if(!this.canSeal(index,owner))return false;this.locks[index%this.width]=owner;return true;}
  releaseTerrain(index,owner){if(this.locks[index%this.width]===owner)this.locks[index%this.width]=null;}
  sealTerrain(index,owner,round,duration,type='rockfall',art=null,cells=[index],release=true,spread=false){
    if(!this.canSeal(index,owner))return false;
    const tile=this.board[index];this.board[index]=null;this.temporaryBlocks.set(index,{tile,round,type,art,cells,start:this.now,spread});if(release)this.releaseTerrain(index,owner);this.refreshTerrain();
    this.emit(type==='rockfall'?'rock-blocked':'map-blocked',{index,round,duration,type,art,cells,spread});return true;
  }
  restoreTerrain(index,duration=300){
    if(!this.temporaryBlocks.has(index)||!this.terrainBoundary(index))return false;
    const {tile,round,type='rockfall',art,cells=[index]}=this.temporaryBlocks.get(index);this.board[index]=tile;this.temporaryBlocks.delete(index);this.recoveryColumns.delete(index%this.width);this.refreshTerrain();
    this.emit(type==='rockfall'?'rock-restored':'map-restored',{index,round,duration,type,art,cells});return true;
  }
  freezeTerrain(index,owner,round,duration,art,release=true){
    if(!this.canSeal(index,owner)||this.frozenCells.has(index))return false;
    this.frozenCells.set(index,{tile:this.board[index],round,type:'freeze',start:this.now,persistent:true,art});if(release)this.releaseTerrain(index,owner);this.stableChecked=false;
    this.emit('map-blocked',{index,round,duration,type:'freeze',art});return true;
  }
  thawTerrain(index,reason='timeout',duration=650){
    if(!['clear','cleanup'].includes(reason))return false;
    const ice=this.frozenCells.get(index);if(!ice)return false;
    this.frozenCells.delete(index);this.recoveryColumns.delete(index%this.width);this.stableChecked=false;
    this.emit('map-restored',{index,round:ice.round,duration,type:'freeze',art:ice.art,reason});return true;
  }
  mechanismPlan(cells){
    if(cells.length!==4||new Set(cells).size!==4)return null;
    const [a,b,c,d]=cells;
    if(a<0||a%this.width>=this.width-1||b!==a+1||c!==a+this.width||d!==c+1||d>=this.board.length)return null;
    const states=cells.map(i=>this.terrain.cells[i]);
    if(states.includes('hole')||!states.includes('obstacle')||!states.includes('cell'))return null;
    const destination=[b,d,a,c],terrainCells=[...this.terrain.cells],board=[...this.board];
    cells.forEach((i,n)=>{terrainCells[destination[n]]=this.terrain.cells[i];board[destination[n]]=this.board[i];});
    return {terrain:createTerrain({...this.terrain,cells:terrainCells}),board,destination};
  }
  canTurnMechanism(cells,owner=null){
    if(!cells.every(i=>this.terrainBoundary(i,owner)&&!this.temporaryBlocks.has(i)&&!this.frozenCells.has(i)&&(this.terrain.cells[i]!=='cell'||!!this.board[i])))return false;
    const plan=this.mechanismPlan(cells);
    return !!plan&&legalMoves(plan.board,plan.terrain).length>0;
  }
  reserveMechanism(cells,owner){
    if(!this.canTurnMechanism(cells))return false;
    for(const i of cells)this.locks[i%this.width]=owner;
    return true;
  }
  turnMechanism(cells,owner,round,duration,art){
    const plan=this.mechanismPlan(cells);
    // Other columns can still be settling; only the reserved columns are
    // committed here. Existing match/deadlock handling resumes after release.
    if(!plan||!cells.every(i=>this.locks[i%this.width]===owner))return false;
    this.terrain=plan.terrain;this.board=plan.board;this.refreshTerrain();
    cells.forEach(i=>this.releaseTerrain(i,owner));
    this.emit('map-blocked',{index:cells[0],cells,round,duration,type:'mechanism',art,structureChanged:true});
    return true;
  }
  isBusy(index) {return this.recoveryColumns.has(index%this.width)||this.locks[index%this.width]!==null||this.pendingColumns.has(index%this.width);}
  loadLevel(config) {
    const terrain=createTerrain(config.terrain||STANDARD_TERRAIN),{width,height}=terrain;
    const valid=t=>Number.isInteger(typeof t==='number'?t:t?.type)&&(typeof t==='number'?t:t.type)>=0&&(typeof t==='number'?t:t.type)<5&&(!t?.special||['row','column','blast'].includes(t.special));
    if(!Array.isArray(config.board)||config.board.length!==width*height||!config.board.every((t,i)=>terrain.cells[i]==='cell'?valid(t):t===null))throw new Error('Invalid level board');
    const board=config.board.map(t=>t===null?null:({...this.tile(typeof t==='number'?t:t.type),...(t.special?{special:t.special}:{})}));
    if(findMatches(board,terrain).length||!legalMoves(board,terrain).length)throw new Error('Level must start stable and playable');
    const queues=Object.entries(config.refills||{});
    if(queues.some(([c,q])=>!/^\d+$/.test(c)||Number(c)>=width||!Array.isArray(q)||!q.every(t=>Number.isInteger(t)&&t>=0&&t<5)))throw new Error('Invalid refill sequence');
    this.terrain=terrain;this.width=width;this.height=height;
    this.temporaryBlocks=new Map();this.frozenCells=new Map();this.effectiveTerrain=null;this.recoveryColumns=new Set();
    this.transactions=[];this.locks=Array(this.width).fill(null);this.pendingColumns=new Set();this.depths=Array(this.width).fill(0);
    this.score=0;this.bestChain=0;this.cleared=0;this.refills=new Map(queues.map(([c,q])=>[Number(c),[...q]]));
    this.board=board;this.practiceMove=config.hintMove?[...config.hintMove]:null;this.mode=config.id;this.stableChecked=false;
    this.emit('reset',{mode:config.id});
  }
  canSwap(a,b) {return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<this.board.length&&b<this.board.length&&Math.abs(Math.floor(a/this.width)-Math.floor(b/this.width))+Math.abs(a%this.width-b%this.width)===1&&!this.isBusy(a)&&!this.isBusy(b)&&!this.frozenCells.has(a)&&!this.frozenCells.has(b)&&this.ruleTerrain.cells[a]==='cell'&&this.ruleTerrain.cells[b]==='cell'&&!!this.board[a]&&!!this.board[b];}
  command(command) {return command.kind==='swap'?this.swap(command.a,command.b):false;}
  swap(a,b) {
    if(!this.canSwap(a,b))return false;
    const tx={id:++this.nextTx,phase:'swap',end:this.now+TIMING.swap,a,b,depth:1,columns:[...new Set([a%this.width,b%this.width])]};
    for(const c of tx.columns){this.locks[c]=tx.id;this.depths[c]=0;}
    const moves=[{tile:this.board[a],from:a,to:b},{tile:this.board[b],from:b,to:a}];
    [this.board[a],this.board[b]]=[this.board[b],this.board[a]];
    this.stableChecked=false;this.transactions.push(tx);this.emit('swap',{txId:tx.id,a,b,moves,duration:TIMING.swap,combo:this.combination(a,b)});return true;
  }
  combination(a,b) {
    const first=this.board[a],second=this.board[b];
    if(!first?.special||!second?.special)return null;
    const count=[first,second].filter(t=>t.special==='blast').length;
    const type=count===2?'blast-blast':count===1?'line-blast':'line-line';
    const lineAxis=count===1?[first,second].find(t=>t.special!=='blast').special:null;
    const row=Math.floor(b/this.width),col=b%this.width,cells=[];
    for(let i=0;i<this.board.length;i++) {
      const dr=Math.abs(Math.floor(i/this.width)-row),dc=Math.abs(i%this.width-col);
      if((count===2?dr<=2&&dc<=2:count===1?(lineAxis==='row'?dr<=1:dc<=1):dr===0||dc===0)&&this.ruleTerrain.cells[i]==='cell'&&this.board[i])cells.push(i);
    }
    return {type,index:b,lineAxis,participants:[{index:a,tile:first},{index:b,tile:second}],cells};
  }
  resolution(tx,groups,active=[],combo=null) {
    const matched=new Set(groups.flatMap(g=>g.cells)), cells=new Set([...matched,...active,...(combo?.cells||[])]), rewards=[];
    for(const g of groups) {
      if(g.strength<4)continue;
      const run=[...g.runs].sort((a,b)=>b.cells.length-a.cells.length)[0];
      const candidates=[tx.b,tx.a,...run.cells];
      const index=candidates.find(i=>g.cells.includes(i)&&!this.board[i]?.special);
      if(index!==undefined)rewards.push({index,tile:{...this.board[index],special:g.strength>=5?'blast':run.axis}});
    }
    const blasts=[],triggered=new Set(combo?.participants.map(p=>p.tile.id)), blastCells=new Set(combo?.cells);
    // Closure before claiming locks: each existing special can fire only once.
    for(const index of cells) {
      const tile=this.board[index];
      if(!tile?.special||triggered.has(tile.id))continue;
      triggered.add(tile.id);
      const area=[];const row=Math.floor(index/this.width),col=index%this.width;
      // Radius-two diamond: the 3×3 core plus one cell beyond each side center.
      for(let i=0;i<this.board.length;i++)if(tile.special==='row'?Math.floor(i/this.width)===row:tile.special==='column'?i%this.width===col:Math.abs(Math.floor(i/this.width)-row)+Math.abs(i%this.width-col)<=2) {
        if(this.ruleTerrain.cells[i]==='cell'&&this.board[i]){area.push(i);cells.add(i);blastCells.add(i);}
      }
      blasts.push({index,tile,cells:area});
    }
    const kept=rewards.filter(r=>!blastCells.has(r.index));
    return {cells:[...cells],rewards:kept,blasts,columns:[...new Set([...cells].map(i=>i%this.width))],matched,combo};
  }
  claim(tx,groups,active=[],combo=null) {
    const duration=combo?TIMING.comboClear:TIMING.clear;
    const plan=this.resolution(tx,groups,active,combo);
    const {columns}=plan;
    if(columns.some(c=>this.locks[c]!==null&&this.locks[c]!==tx.id))return false;
    for(const c of columns){this.locks[c]=tx.id;if(!tx.columns.includes(c))tx.columns.push(c);}
    tx.groups=groups;tx.phase='clear';tx.end=this.now+duration;
    const rewardIndices=new Set(plan.rewards.map(r=>r.index));
    const cells=plan.cells.filter(i=>!rewardIndices.has(i)&&this.ruleTerrain.cells[i]==='cell'&&this.board[i]);const strength=Math.max(combo?(combo.type==='line-line'?4:5):3,...groups.map(g=>g.strength));
    // Reward formation retains the original match score. Blast overlaps score once.
    const points=(plan.cells.length*10+groups.reduce((sum,g)=>sum+(g.strength>=5?50:g.strength===4?20:0),0))*tx.depth;
    // Thaw only after a clear has successfully claimed all transaction columns.
    // A direct special hit also breaks level-one ice; rejected swaps do nothing.
    for(const i of [...this.frozenCells.keys()])if(cells.some(j=>Math.abs(Math.floor(i/this.width)-Math.floor(j/this.width))+Math.abs(i%this.width-j%this.width)<=1))this.thawTerrain(i,'clear');
    const tiles=cells.map(index=>({index,tile:this.board[index]}));
    for(const i of cells)this.board[i]=null;
    for(const r of plan.rewards)this.board[r.index]=r.tile;
    this.score+=points;this.cleared+=cells.length;this.bestChain=Math.max(this.bestChain,tx.depth);
    // Only a successfully claimed player exchange consumes a move. Cascades
    // and rejected range claims never publish this event.
    if(Number.isInteger(tx.a)&&!tx.actionAccepted){tx.actionAccepted=true;this.emit('action-accepted',{txId:tx.id,a:tx.a,b:tx.b,matches:groups.map(g=>({strength:g.strength,cells:[...g.cells]})),activeIds:combo?[]:plan.blasts.filter(p=>active.includes(p.index)).map(p=>p.tile.id),comboType:combo?.type});}
    this.emit('clear',{tiles,strength,depth:tx.depth,points,duration,comboType:combo?.type});
    for(const [order,blast] of plan.blasts.entries())this.emit('special-trigger',{...blast,order,duration});
    for(const reward of plan.rewards)this.emit('special-create',{...reward,sources:[...plan.matched],duration});
    if(combo)this.emit('combo-trigger',{...combo,depth:tx.depth,points,duration});
    this.emit('score',{score:this.score,points,depth:tx.depth});return true;
  }
  release(tx) {for(const c of tx.columns)if(this.locks[c]===tx.id)this.locks[c]=null;this.transactions=this.transactions.filter(t=>t!==tx);}
  advance(tx) {
    if(tx.phase==='swap') {
      const combo=this.combination(tx.a,tx.b);
      const groups=combo?[]:findMatches(this.board,this.ruleTerrain).filter(g=>g.cells.includes(tx.a)||g.cells.includes(tx.b));
      const active=[tx.a,tx.b].filter(i=>this.board[i]?.special);
      if((groups.length||active.length)&&this.claim(tx,groups,active,combo))return;
      const moves=[{tile:this.board[tx.a],from:tx.a,to:tx.b},{tile:this.board[tx.b],from:tx.b,to:tx.a}];
      [this.board[tx.a],this.board[tx.b]]=[this.board[tx.b],this.board[tx.a]];
      tx.phase='revert';tx.end=this.now+TIMING.revert;this.emit('revert',{txId:tx.id,moves,duration:TIMING.revert,conflict:groups.length>0||active.length>0});
    } else if(tx.phase==='revert')this.release(tx);
    else if(tx.phase==='clear') {
      const moves=[];
      for(const c of tx.columns) {
        for(const {indices,top} of columnSegments(this.gravityTerrain,c)) {
          const survivors=indices.filter(i=>this.board[i]).map(i=>({tile:this.board[i],from:i}));
          indices.forEach(i=>this.board[i]=null);
          let slot=indices.length-1;
          for(let n=survivors.length-1;n>=0;n--){const {tile,from}=survivors[n],to=indices[slot--];this.board[to]=tile;if(from!==to)moves.push({tile,from,to,segmentTop:top});}
          const missing=slot+1,inlet=top*this.width+c;
          for(let n=slot;n>=0;n--){const queue=this.refills.get(c),tile=this.tile(queue?.length?queue.shift():undefined),to=indices[n];this.board[to]=tile;moves.push({tile,from:inlet-(missing-n)*this.width,to,refill:true,segmentTop:top});}
        }
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
    const groups=findMatches(this.board,this.ruleTerrain).filter(g=>g.columns.every(c=>this.locks[c]===null));
    for(const g of groups) {
      const tx={id:++this.nextTx,columns:[],depth:Math.max(...g.columns.map(c=>this.depths[c]))+1};
      if(this.claim(tx,[g]))this.transactions.push(tx);
    }
    // A cross-column cascade may wait for an independent animation. Preserve
    // its lineage and keep its affected free columns from accepting a new swap.
    this.pendingColumns=new Set(findMatches(this.board,this.ruleTerrain).flatMap(g=>this.resolution({},[g]).columns));
    for(let c=0;c<this.width;c++)if(this.locks[c]===null&&!this.pendingColumns.has(c))this.depths[c]=0;
    if(!this.transactions.length&&!findMatches(this.board,this.ruleTerrain).length){
      const moves=legalMoves(this.board,this.ruleTerrain).filter(([a,b])=>!this.frozenCells.has(a)&&!this.frozenCells.has(b));
      if(!moves.length&&!this.temporaryBlocks.size){
        const before=new Map(this.board.filter(Boolean).map(t=>[t.id,t.type]));
        const anchors=new Map([...this.frozenCells].map(([i,ice])=>[i,ice.tile]));
        this.board=this.arrange(this.board,true,anchors);
        this.emit('reshuffle',{preservedInventory:this.board.filter(Boolean).every(t=>before.get(t.id)===t.type),frozenAnchors:[...anchors.keys()]});
      }this.stableChecked=true;
    }
  }
  hint() {return legalMoves(this.board,this.ruleTerrain).find(([a,b])=>this.canSwap(a,b));}
}
