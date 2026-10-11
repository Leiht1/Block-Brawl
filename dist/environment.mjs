import {legalMoves} from './engine.mjs';
// Theme adapters contain rules; maps contain tuning and art, never lifecycle logic.
export const MAP_EVENT_TYPES=Object.freeze({
  rockfall:{prefix:'rock',apply:(e,i,s,c,n)=>e.sealTerrain(i,s.owner,s.round,c.duration,c.type,c.art,s.targets[n],false),recover:(e,i)=>e.restoreTerrain(i)},
  freeze:{prefix:'map',apply:(e,i,s,c)=>e.freezeTerrain(i,s.owner,s.round,c.duration,c.art,false),recover:(e,i)=>e.thawTerrain(i,'cleanup')},
  mechanism:{prefix:'map',apply:(e,i,s,c,n)=>i!==s.targets[n][0]||e.turnMechanism(s.targets[n],s.owner,s.round,c.duration,c.art),recover:()=>true},
  fire:{prefix:'map',apply:(e,i,s,c)=>e.sealTerrain(i,s.owner,s.round,c.duration,c.type,c.art,[i],false),recover:(e,i)=>e.restoreTerrain(i)}
});
export class MapEventFramework {
  constructor(engines,config,random=Math.random){
    this.engines=Object.values(engines);this.config={enabled:true,count:1,waitLimit:5000,...config};
    this.adapter=MAP_EVENT_TYPES[config.type];if(!this.adapter)throw Error('Unknown map event type');
    if(this.config.spreadInterval&&(!Number.isFinite(this.config.spreadInterval)||!Number.isFinite(this.config.spreadWarning)||this.config.spreadWarning<=0||this.config.spreadWarning>=this.config.spreadInterval))throw Error('Invalid fire spread tuning');
    if(!Number.isInteger(this.config.count)||this.config.count<1||['firstDelay','warning','impact','duration','intervalMin','intervalMax','waitLimit'].some(k=>!Number.isFinite(this.config[k])||this.config[k]<0)||this.config.duration===0||this.config.intervalMin===0||this.config.intervalMax<this.config.intervalMin)throw Error('Invalid map event tuning');
    if(this.config.footprints&&(!Array.isArray(this.config.footprints)||!this.config.footprints.length||this.config.footprints.some(p=>!Number.isFinite(p.weight)||p.weight<=0||!p.cells?.length||new Set(p.cells.map(x=>x.join(','))).size!==p.cells.length||!p.cells.every(v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isInteger(n)&&n>=0)))))throw Error('Invalid event footprints');
    this.random=random;this.pendingFootprint=null;this.round=0;this.counts={blocked:0,restored:0,skipped:0};this.active=false;this.state=null;this.next=null;this.checkAt=null;
  }
  start(now){this.active=this.config.enabled;this.next=this.active?now+this.config.firstDelay:null;}
  get deadline(){const s=this.state;return this.checkAt??(s?Math.min(s.end,s.spread?.end??s.nextSpreadAt??Infinity):(this.active?this.next:Infinity));}
  emit(phase,targets,data={}){this.engines.forEach((e,n)=>(targets?.[n]||[undefined]).forEach(index=>e.emit(`${this.adapter.prefix}-${phase}`,{index,type:this.config.type,art:this.config.art,round:this.round,cells:targets?.[n],tiles:this.config.type==='mechanism'?targets?.[n]?.map(i=>({index:i,tile:e.board[i],state:e.terrain.cells[i]})):undefined,...data})));}
  candidates(e,selected=[]){
    const candidates=[];
    for(let i=0;i<e.board.length;i++){
      if(!e.canSeal(i)||selected.includes(i))continue;
      // Preserve a playable command, without valuing scores or special regions.
      const blocked=new Set([...selected,i,...e.frozenCells.keys()]);
      const terrain={...e.ruleTerrain,cells:e.ruleTerrain.cells.map((s,j)=>blocked.has(j)?'obstacle':s)},board=[...e.board];
      if(!legalMoves(board,terrain).some(([a,b])=>e.canSwap(a,b)))continue;
      candidates.push(i);
    }return candidates;
  }
  playable(e,targets){
    const blocked=new Set([...targets,...e.frozenCells.keys()]);
    const terrain={...e.ruleTerrain,cells:e.ruleTerrain.cells.map((s,i)=>blocked.has(i)?'obstacle':s)};
    return legalMoves([...e.board],terrain).some(([a,b])=>e.canSwap(a,b));
  }
  footprintCandidates(e,pattern){
    const out=[];
    for(let row=0;row<e.height;row++)for(let col=0;col<e.width;col++){
      if(!pattern.cells.every(([x,y])=>col+x<e.width&&row+y<e.height))continue;
      const cells=pattern.cells.map(([x,y])=>(row+y)*e.width+col+x);
      if(cells.every(i=>e.canSeal(i))&&this.playable(e,cells))out.push(cells);
    }return out;
  }
  selectFootprint(){
    const patterns=this.config.footprints;if(!patterns)return null;
    const sum=patterns.reduce((n,p)=>n+p.weight,0);let roll=this.random()*sum;
    for(const p of patterns){roll-=p.weight;if(roll<0)return p;}return patterns.at(-1);
  }
  reschedule(at){this.pendingFootprint=null;this.next=at+this.config.intervalMin+Math.floor(this.random()*(this.config.intervalMax-this.config.intervalMin+1));}
  trigger(now){
    if(this.config.footprints&&!this.pendingFootprint)this.pendingFootprint=this.selectFootprint();
    const pattern=this.pendingFootprint,count=pattern?.cells.length||this.config.count;
    let targets=this.engines.map(e=>{
      if(this.config.type==='mechanism')return [];
      if(pattern){const pool=this.footprintCandidates(e,pattern);return pool.length?pool[Math.floor(this.random()*pool.length)]:[];}
      const chosen=[];for(let n=0;n<count;n++){const pool=this.candidates(e,chosen);if(!pool.length)break;chosen.push(pool[Math.floor(this.random()*pool.length)]);}return chosen;
    });
    if(this.config.type==='mechanism'){
      const pool=[];
      const e=this.engines[0];
      for(let r=0;r<e.height-1;r++)for(let c=0;c<e.width-1;c++){
        const i=r*e.width+c,cells=[i,i+1,i+e.width,i+e.width+1];
        if(this.engines.every(engine=>engine.canTurnMechanism(cells)))pool.push(cells);
      }
      const cells=pool.length?pool[Math.floor(this.random()*pool.length)]:[];
      targets=this.engines.map(()=>[...cells]);
    }
    if(targets.some(t=>t.length!==count)){
      if(now>=this.next+this.config.waitLimit){this.round++;this.counts.skipped++;this.emit('skip',null);this.reschedule(now);}else this.checkAt=now+25;
      return false;
    }
    this.round++;this.state={phase:'warning',footprint:pattern?.name,count,targets,indexes:targets.map(t=>t[0]),round:this.round,end:now+this.config.warning};this.warning();this.reschedule(now);return true;
  }
  warning(){this.emit('warning',this.state.targets,{duration:this.config.warning});}
  execute(now){
    const s=this.state;
    if(!this.engines.every((e,n)=>{
      if(this.config.type==='mechanism')return e.canTurnMechanism(s.targets[n]);
      if(!s.targets[n].every(i=>e.canSeal(i)))return false;
      const blocked=new Set([...s.targets[n],...e.frozenCells.keys()]);
      const terrain={...e.ruleTerrain,cells:e.ruleTerrain.cells.map((v,i)=>blocked.has(i)?'obstacle':v)};
      return legalMoves([...e.board],terrain).some(([a,b])=>e.canSwap(a,b));
    })){
      if(now>=s.end+this.config.waitLimit){this.emit('cancel',s.targets);this.counts.skipped++;this.state=null;}else this.checkAt=now+25;
      return;
    }
    s.owner=`map:${this.config.type}:${this.round}`;
    this.engines.forEach((e,n)=>this.config.type==='mechanism'?e.reserveMechanism(s.targets[n],s.owner):s.targets[n].forEach(i=>e.reserveTerrain(i,s.owner)));
    s.phase='fall';s.end=now+this.config.impact;this.emit('fall',s.targets,{duration:this.config.impact});
  }
  duration(now){
    const s=this.state;this.engines.forEach((e,n)=>{s.targets[n].forEach(i=>{if(!this.adapter.apply(e,i,s,this.config,n))throw Error('Map event reservation lost');});s.targets[n].forEach(i=>e.releaseTerrain(i,s.owner));});
    this.counts.blocked++;s.phase='blocked';s.end=now+this.config.duration;
    if(this.config.type==='fire'&&this.config.spreadInterval){s.litAt=now;s.nextSpreadAt=now+this.config.spreadInterval-this.config.spreadWarning;}
    // Ice remains in the engines across rounds. Its atmospheric cue can end
    // without recovering any tile or forcing the next cold front to wait.
    if(this.config.persistent||this.config.type==='mechanism')this.state=null;
  }
  spreadWarning(now){
    const s=this.state,c=this.config;
    const targets=this.engines.map((e,n)=>{
      const adjacent=new Set();
      for(const i of s.targets[n])for(const j of [i-1,i+1,i-e.width,i+e.width]){
        if(j>=0&&j<e.board.length&&Math.abs(i%e.width-j%e.width)+Math.abs(Math.floor(i/e.width)-Math.floor(j/e.width))===1&&e.canSeal(j))adjacent.add(j);
      }
      // Every burning cell expands one step in all four directions together.
      // Deduplicate overlapping fronts and keep a legal move after the wave.
      const chosen=[];for(const j of adjacent)if(this.playable(e,[...chosen,j]))chosen.push(j);return chosen;
    });
    const igniteAt=now+c.spreadWarning;s.nextSpreadAt=igniteAt+c.spreadInterval-c.spreadWarning;
    if(igniteAt>=s.end||targets.some(t=>!t.length))return;
    s.spread={targets,owner:s.owner+':spread',end:igniteAt};
    this.engines.forEach((e,n)=>targets[n].forEach(i=>e.reserveTerrain(i,s.spread.owner)));
    this.emit('spread-warning',targets,{duration:c.spreadWarning});
  }
  spreadIgnite(now){
    const s=this.state,wave=s.spread;
    this.engines.forEach((e,n)=>{
      for(const i of wave.targets[n]){if(!e.sealTerrain(i,wave.owner,s.round,s.end-now,'fire',this.config.art,[i],false,true))throw Error('Fire spread reservation lost');s.targets[n].push(i);}
      wave.targets[n].forEach(i=>e.releaseTerrain(i,wave.owner));
    });s.spread=null;
  }
  cancelSpread(){const wave=this.state?.spread;if(!wave)return;this.engines.forEach((e,n)=>wave.targets[n].forEach(i=>e.releaseTerrain(i,wave.owner)));this.emit('spread-cancel',wave.targets);this.state.spread=null;}
  recover(now){
    const s=this.state;
    // Timed hazards and match teardown recover together at safe boundaries.
    // Persistent ice never reaches this barrier during ordinary play.
    this.engines.forEach((e,n)=>s.targets[n].forEach(i=>e.recoveryColumns.add(i%e.width)));
    if(!this.engines.every((e,n)=>s.targets[n].every(i=>e.terrainBoundary(i)))){this.checkAt=now+25;return;}
    this.engines.forEach((e,n)=>s.targets[n].forEach(i=>{if(s.phase==='cleanup'&&this.config.persistent)e.thawTerrain(i,'cleanup');else this.adapter.recover(e,i);e.recoveryColumns.delete(i%e.width);}));
    this.counts.restored++;this.state=null;
  }
  update(now){
    if(this.checkAt!==null&&now<this.checkAt)return;this.checkAt=null;
    if(this.state){
      const s=this.state;
      if(s.phase==='blocked'&&now<s.end){if(s.spread&&now>=s.spread.end)this.spreadIgnite(now);else if(!s.spread&&now>=s.nextSpreadAt)this.spreadWarning(now);return;}
      if(now<this.state.end)return;
      if(['blocked','cleanup'].includes(this.state.phase))this.recover(now);
      else if(this.state.phase==='warning')this.execute(now);
      else if(this.state.phase==='fall')this.duration(now);
      return;
    }
    if(this.active&&now>=this.next)this.trigger(now);
  }
  stop(now){
    this.active=false;this.next=null;this.checkAt=null;this.cancelSpread();const s=this.state;
    if(this.config.persistent){
      if(s){this.engines.forEach((e,n)=>s.targets[n].forEach(i=>e.releaseTerrain(i,s.owner)));this.emit('cancel',s.targets);}
      const targets=this.engines.map(e=>[...e.frozenCells.keys()]);
      this.state=targets.some(t=>t.length)?{phase:'cleanup',targets,end:now}:null;return;
    }
    if(!s)return;
    if(s.phase==='blocked'){s.phase='cleanup';s.end=now;}
    else{this.engines.forEach((e,n)=>s.targets[n].forEach(i=>e.releaseTerrain(i,s.owner)));this.emit('cancel',s.targets);this.state=null;}
  }
  dispose(){
    this.stop(this.engines[0].now);const s=this.state;
    if(s){this.engines.forEach((e,n)=>s.targets[n].forEach(i=>{
      const b=e.temporaryBlocks.get(i);if(b){e.board[i]=b.tile;e.temporaryBlocks.delete(i);}e.frozenCells.delete(i);e.recoveryColumns.delete(i%e.width);e.refreshTerrain();
    }));this.emit('cancel',s.targets);}
    this.state=null;this.checkAt=null;this.pendingFootprint=null;
  }
  get clean(){return !this.state&&!this.engines.some(e=>e.temporaryBlocks.size||e.frozenCells.size);}
}
// Existing integrations may retain the old constructor name.
export const RockfallEnvironment=MapEventFramework;
