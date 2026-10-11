// Card rules are an arena adapter. The match engine and existing bot stay intact.
import {TIMING,seeded} from './engine.mjs';
import {chooseMove,evaluateMove} from './bot.mjs';

export const CARD_CONFIG=Object.freeze({deckSize:6,categoryLimit:2,handLimit:6,selectionMs:60000,targetScore:15000,initialHand:0,
  energyMax:100,naturalPerSecond:8,energyPerTile:.8,gapPer1000:1.5,gapMaxPerSecond:6,
  aiPickMs:550,aiPlayMs:4200,minDrag:48,fireMs:2200,meteorMs:1600,bombMs:1800,
  freezeMs:3000,fogMs:6000,overloadMs:10000,overloadMultiplier:2,sageMs:5000,sageStepMs:650,
  luckMs:10000,luckSpecialChance:.22});
export const CARDS=Object.freeze([
  {id:'fire',name:'火焰冲击',color:'red',icon:'♨',text:'燃烧敌方 3 个随机格子，2.2 秒后烧毁。'},
  {id:'quake',name:'地裂冲击',color:'red',icon:'裂',text:'破坏敌方棋盘最底部的一行方块。'},
  {id:'meteor',name:'陨石坠落',color:'red',icon:'☄',text:'标记敌方随机区域，1.6 秒后爆炸。'},
  {id:'bomb',name:'炸弹投放',color:'red',icon:'✹',text:'指定敌方落点，1.8 秒后引爆周围 3×3 区域。'},
  {id:'freeze',name:'时间冻结',color:'blue',icon:'❄',text:'冻结敌方棋盘 3 秒，暂停新的交换操作。'},
  {id:'blackhole',name:'黑洞吸引',color:'blue',icon:'◉',text:'牵引敌方随机 6 个普通方块，打乱它们的位置。'},
  {id:'storm',name:'混乱风暴',color:'blue',icon:'↯',text:'随机改变敌方 6 个普通方块的颜色。'},
  {id:'fog',name:'迷雾领域',color:'blue',icon:'☁',text:'迷雾遮挡敌方部分棋盘，持续 6 秒。'},
  {id:'overload',name:'超载模式',color:'yellow',icon:'ϟ',text:'10 秒内，自己的消除得分翻倍。'},
  {id:'sage',name:'贤者时间',color:'yellow',icon:'✧',text:'自动寻找最佳消除并操作自己的棋盘，持续 5 秒。'},
  {id:'rainbow',name:'彩虹核心',color:'yellow',icon:'✦',text:'生成 1 个万能方块；与相邻方块交换，清除所有同色。'},
  {id:'luck',name:'幸运星',color:'yellow',icon:'★',text:'10 秒内，补充方块有 22% 概率变为特殊方块。'}
].map(c=>Object.freeze({...c,target:c.color==='yellow'?'self':'enemy',category:{red:'进攻',blue:'控制',yellow:'强化'}[c.color]})));
export const cardById=id=>CARDS.find(c=>c.id===id);
const shuffle=(list,random)=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const categoryCounts=deck=>deck.reduce((counts,id)=>{counts[cardById(id).color]++;return counts;},{red:0,blue:0,yellow:0});
const fillDeck=(deck,random,config)=>{const result=[...deck],counts=categoryCounts(result);for(const c of shuffle(CARDS,random)){if(result.length===config.deckSize)break;if(!result.includes(c.id)&&counts[c.color]<config.categoryLimit){result.push(c.id);counts[c.color]++;}}return result;};
const other=side=>side==='player'?'opponent':'player';
const atRest=e=>e.stableChecked&&!e.transactions.length&&e.locks.every(lock=>lock===null)&&!e.pendingColumns.size&&!e.recoveryColumns.size;

export class CardSelection {
  constructor(now=0,random=Math.random,config=CARD_CONFIG){this.config=config;this.random=random;this.started=now;this.deadline=now+config.selectionMs;this.player=[];this.opponent=[];this.playerReady=false;this.opponentReady=false;this.complete=false;this.cancelled=false;this.error='';this.aiPool=fillDeck([],random,config);}
  choose(id,slot=null){
    if(this.complete||this.cancelled||this.playerReady||!cardById(id))return false;
    if(this.player.includes(id))return false;
    if(slot!==null&&(!Number.isInteger(slot)||slot<0||slot>=this.player.length))return false;
    const card=cardById(id),counts=categoryCounts(this.player.filter((_,i)=>i!==slot));
    if(counts[card.color]>=this.config.categoryLimit){this.error=`${card.category}类最多选择 ${this.config.categoryLimit} 张，请先替换或移除同类卡牌。`;return false;}
    if(slot===null){if(this.player.length>=this.config.deckSize){this.error='先点击一个已选卡槽，再选择替换卡牌。';return false;}this.player.push(id);}
    else this.player[slot]=id;
    this.error='';
    return true;
  }
  remove(slot){if(this.playerReady||this.complete||this.cancelled)return false;this.error='';return !!this.player.splice(slot,1).length;}
  ready(){if(this.cancelled||this.player.length!==this.config.deckSize)return false;this.playerReady=true;this.complete=this.opponentReady;return true;}
  update(now){
    if(this.complete||this.cancelled)return;
    this.opponent=this.aiPool.slice(0,Math.min(this.config.deckSize,Math.floor((now-this.started)/this.config.aiPickMs)));
    this.opponentReady=this.opponent.length===this.config.deckSize;
    if(now>=this.deadline){this.player=fillDeck(this.player,this.random,this.config);this.playerReady=true;this.opponent=[...this.aiPool];this.opponentReady=true;}
    this.complete=this.playerReady&&this.opponentReady;
  }
  seconds(now){return Math.max(0,Math.ceil((this.deadline-now)/1000));}
  cancel(){this.cancelled=true;}
}

export class CardBattle {
  constructor(session,{config=CARD_CONFIG,onChange=()=>{},random=seeded(981),decks}={}){
    this.session=session;this.config=config;this.random=random;this.onChange=onChange;this.serial=0;this.queue=[];this.cues=[];this.active=false;this.bonus={};this.last=null;
    this.sides={};this.originalTiles={};
    for(const [side,e] of Object.entries(session.engines)){
      const deck=decks?.[side];if(!deck||deck.length!==config.deckSize||new Set(deck).size!==config.deckSize||deck.some(id=>!cardById(id))||Object.values(categoryCounts(deck)).some(n=>n>config.categoryLimit))throw Error('A card deck must contain six unique basic cards, at most two per category');
      const state=this.sides[side]={deck:[...deck],pile:[],hand:[],preview:null,next:null,energy:0,buffs:{},fogCells:[],autoDue:0};
      state.next=this.pull(side);for(let i=0;i<config.initialHand;i++)this.draw(side,0,false);
      this.originalTiles[side]=e.tile;
      e.tile=(type)=>{const tile=this.originalTiles[side].call(e,type);if(this.active&&e.now<(state.buffs.luck||0)&&this.random()<config.luckSpecialChance)tile.special=['row','column','blast'][Math.floor(this.random()*3)];return tile;};
    }
  }
  pull(side){const s=this.sides[side];if(!s.pile.length)s.pile=shuffle(s.deck,this.random);return {uid:++this.serial,id:s.pile.pop()};}
  start(now){this.active=true;this.last=now;this.aiDue=now+this.config.aiPlayMs;}
  draw(side,now,animate=true){const s=this.sides[side],card=s.next;s.next=this.pull(side);const destination=s.hand.length<this.config.handLimit?'hand':'preview';if(destination==='hand')s.hand.push(card);else s.preview=card;if(animate)this.onChange({kind:'draw',side,card,destination,now});return card;}
  gain(side,amount,now){if(!this.active||this.session.status!=='playing')return;const s=this.sides[side];s.energy+=amount;if(s.energy>=this.config.energyMax){s.energy=0;this.draw(side,now);}}
  event(side,e){
    if(!this.active||this.session.status!=='playing')return;
    const s=this.sides[side],engine=this.session.engines[side];
    if(e.kind==='clear'&&e.points>0){
      if(e.time<(s.buffs.overload||0)){const bonus=e.points*(this.config.overloadMultiplier-1);engine.score+=bonus;e.points+=bonus;this.bonus[side]=bonus;}
      this.gain(side,e.tiles.length*this.config.energyPerTile,e.time);
    }
    if(e.kind==='score'){e.score=engine.score;e.points+=this.bonus[side]||0;this.bonus[side]=0;}
  }
  blocked(side,now){const b=this.sides[side].buffs;return now<(b.freeze||0);}
  manualBlocked(side,now){return this.blocked(side,now)||now<(this.sides[side].buffs.sage||0);}
  allowed(side,command){const e=this.session.engines[side],s=this.sides[side];return !this.blocked(side,e.now)&&!this.queue.some(a=>a.targetSide===side&&a.due<=e.now)&&(side!=='opponent'||!command||!s.fogCells.includes(command.a)&&!s.fogCells.includes(command.b)||e.now>=(s.buffs.fog||0));}
  get deadline(){
    if(!this.active||this.session.status!=='playing')return Infinity;
    return Math.min(Infinity,...this.queue.map(a=>{const due=Math.max(a.due,this.sides[a.targetSide].buffs.freeze||0);return due>this.last?due:atRest(this.session.engines[a.targetSide])?this.last:Infinity;}));
  }
  target(side,card){return card.target==='self'?side:other(side);}
  cast(side,uid,targetSide,index,now){
    if(!this.active||this.session.status!=='playing'||!this.sides[side])return {ok:false,reason:'当前无法释放卡牌'};
    const s=this.sides[side],slot=s.hand.findIndex(c=>c.uid===uid),instance=s.hand[slot],card=cardById(instance?.id);
    if(!card||targetSide!==this.target(side,card))return {ok:false,reason:'红蓝卡拖向敌方，黄卡拖向自己'};
    const e=this.session.engines[targetSide];if(!Number.isInteger(index)||e.ruleTerrain.cells[index]!=='cell'||!e.board[index])return {ok:false,reason:'请拖到棋盘的有效格子'};
    s.hand.splice(slot,1);this.onChange({kind:'cast',side,card:instance,targetSide,index,now});
    if(s.preview){const next=s.preview;s.preview=null;s.hand.push(next);this.onChange({kind:'promote',side,card:next,destination:'hand',now});}
    const target=this.sides[targetSide];
    const duration={freeze:this.config.freezeMs,fog:this.config.fogMs,overload:this.config.overloadMs,sage:this.config.sageMs,luck:this.config.luckMs}[card.id];
    if(duration){target.buffs[card.id]=now+duration;if(card.id==='sage')target.autoDue=now;if(card.id==='fog')target.fogCells=this.pick(e,12);}
    else{
      let cells=[];if(card.id==='fire')cells=this.pick(e,3);if(card.id==='meteor')index=this.pick(e,1)[0]??index;
      const delay={fire:this.config.fireMs,meteor:this.config.meteorMs,bomb:this.config.bombMs}[card.id]||0;
      if(['meteor','bomb'].includes(card.id))cells=this.area(e,index);
      if(card.id==='quake')cells=e.board.flatMap((t,i)=>t&&Math.floor(i/e.width)===e.height-1&&e.ruleTerrain.cells[i]==='cell'?[i]:[]);
      const action={side,targetSide,id:card.id,index,cells,due:now+delay,created:now};this.queue.push(action);
      if(delay)this.cues.push({...action,until:now+delay});
    }
    this.updateEffects(now);return {ok:true};
  }
  pick(e,count){return shuffle(e.board.flatMap((t,i)=>t&&e.ruleTerrain.cells[i]==='cell'&&!e.frozenCells.has(i)&&!t.special&&!t.wild?[i]:[]),this.random).slice(0,count);}
  area(e,index){return e.board.flatMap((t,i)=>t&&e.ruleTerrain.cells[i]==='cell'&&Math.abs(i%e.width-index%e.width)<=1&&Math.abs(Math.floor(i/e.width)-Math.floor(index/e.width))<=1?[i]:[]);}
  // Use the existing clear -> fall transaction, without granting attack points.
  clear(e,cells,points=0){
    cells=[...new Set(cells)].filter(i=>e.board[i]&&e.ruleTerrain.cells[i]==='cell');if(!cells.length)return false;
    for(const i of cells)if(e.frozenCells.has(i))e.thawTerrain(i,'clear');
    const tx={id:++e.nextTx,columns:[...new Set(cells.map(i=>i%e.width))],depth:1,phase:'clear',end:e.now+TIMING.clear,groups:[]};
    const tiles=cells.map(index=>({index,tile:e.board[index]}));for(const c of tx.columns)e.locks[c]=tx.id;
    for(const i of cells)e.board[i]=null;e.stableChecked=false;e.transactions.push(tx);e.cleared+=cells.length;
    e.score+=points;e.emit('clear',{tiles,strength:3,depth:1,points,duration:TIMING.clear,card:true});if(points)e.emit('score',{score:e.score,points,depth:1});return true;
  }
  swap(side,command){
    const e=this.session.engines[side],wild=[command.a,command.b].find(i=>e.board[i]?.wild);
    if(wild===undefined)return null;
    if(!atRest(e)||!e.canSwap(command.a,command.b))return false;
    const adjacent=wild===command.a?command.b:command.a,type=e.board[adjacent].type;
    const cells=e.board.flatMap((t,i)=>t&&(t.type===type||i===wild)&&e.ruleTerrain.cells[i]==='cell'?[i]:[]);
    return this.clear(e,cells,cells.length*10);
  }
  bestMove(side){
    const e=this.session.engines[side],allowed=(a,b)=>e.canSwap(a,b)&&this.allowed(side,{a,b});
    let best=chooseMove(e.board,'hard',this.random,e.ruleTerrain,allowed),points=best?evaluateMove(e.board,best,e.ruleTerrain).points:0;
    for(const [i,t] of e.board.entries())if(t?.wild)for(const j of [i-1,i+1,i-e.width,i+e.width])if(allowed(i,j)){
      const value=e.board.filter(t=>t?.type===e.board[j].type).length*10;if(value>points){best=[i,j];points=value;}
    }
    return best;
  }
  updateEffects(now){
    if(this.session.status!=='playing')return;
    for(const a of [...this.queue]){
      const e=this.session.engines[a.targetSide];if(now<a.due||!atRest(e)||this.blocked(a.targetSide,now))continue;
      if(['fire','quake','meteor','bomb'].includes(a.id))this.clear(e,a.cells);
      else if(a.id==='rainbow'){const i=this.pick(e,1)[0];if(i!==undefined){e.board[i]={...e.board[i],wild:true};e.emit('card-change',{index:i,card:a.id});}}
      else{
        const cells=this.pick(e,6);if(a.id==='blackhole'){const tiles=cells.map(i=>e.board[i]);cells.forEach((i,n)=>e.board[i]=tiles[(n+1)%tiles.length]);}
        if(a.id==='storm')for(const i of cells)e.board[i]={...e.board[i],type:(e.board[i].type+1+Math.floor(this.random()*4))%5};
        e.stableChecked=false;e.emit('card-change',{cells,card:a.id});
      }
      this.queue=this.queue.filter(q=>q!==a);this.cues=this.cues.filter(q=>q.created!==a.created||q.id!==a.id||q.targetSide!==a.targetSide);
      this.onChange({kind:'effect',side:a.side,targetSide:a.targetSide,id:a.id,now});
      if(this.session.status!=='playing')break;
    }
  }
  update(now){
    if(!this.active||this.session.status!=='playing')return;
    const dt=Math.max(0,now-this.last)/1000;this.last=now;
    for(const side of ['player','opponent']){
      const s=this.sides[side],e=this.session.engines[side],gap=Math.max(0,this.session.engines[other(side)].score-e.score);
      const rate=this.config.naturalPerSecond+Math.min(this.config.gapMaxPerSecond,gap/1000*this.config.gapPer1000);
      let amount=dt*rate;while(amount+s.energy>=this.config.energyMax-1e-9){amount-=this.config.energyMax-s.energy;s.energy=0;this.draw(side,now);}s.energy=Math.max(0,Math.round((s.energy+amount)*1e9)/1e9);
      if(now>=(s.buffs.fog||0))s.fogCells=[];
    }
    this.updateEffects(now);
    for(const side of ['player','opponent']){
      if(this.session.status!=='playing')return;
      const s=this.sides[side],e=this.session.engines[side];
      if(now<(s.buffs.sage||0)&&now>=s.autoDue&&atRest(e)&&!this.blocked(side,now)){
        const move=this.bestMove(side);s.autoDue=now+this.config.sageStepMs;
        if(move)this.session.command(side,{kind:'swap',a:move[0],b:move[1]});
      }
    }
    const ai=this.sides.opponent,engine=this.session.engines.opponent;
    if(this.session.status==='playing'&&now>=(ai.wildDue||0)&&atRest(engine)&&engine.board.some(t=>t?.wild)&&!this.blocked('opponent',now)){
      const move=this.bestMove('opponent');ai.wildDue=now+this.config.sageStepMs;
      if(move?.some(i=>engine.board[i]?.wild))this.session.command('opponent',{kind:'swap',a:move[0],b:move[1]});
    }
    if(now>=this.aiDue&&this.session.status==='playing'){
      this.aiDue=now+this.config.aiPlayMs;const hand=this.sides.opponent.hand;
      if(hand.length){const instance=hand[Math.floor(this.random()*hand.length)],card=cardById(instance.id),side=this.target('opponent',card),e=this.session.engines[side];
        const cells=e.board.flatMap((t,i)=>t&&e.ruleTerrain.cells[i]==='cell'?[i]:[]);if(cells.length)this.cast('opponent',instance.uid,side,cells[Math.floor(this.random()*cells.length)],now);}
    }
  }
  stop(){this.active=false;this.queue=[];this.cues=[];for(const s of Object.values(this.sides)){s.buffs={};s.fogCells=[];}}
  dispose(){this.stop();for(const [side,e] of Object.entries(this.session.engines))e.tile=this.originalTiles[side];}
}
