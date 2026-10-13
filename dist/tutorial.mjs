import {LevelSession,LEGACY_LEVELS} from './levels.mjs';
import {legalMoves,seeded} from './engine.mjs';
import {CardBattle,CARD_CONFIG,cardById} from './cards.mjs';
import {MAPS} from './maps.mjs';

export const PRACTICE_DECK=['fire','freeze','overload','bomb','fog','luck'];
const ready=e=>e.stableChecked&&!e.transactions.length;
const instructions={
  triple:['交换亮框中的两个方块，连成三个同色。','player'],
  four:['再交换一次：四个同色会生成光束块。','player'],
  special:['交换刚生成的光束块，看看清除和得分。','player'],
  mapIntro:['地图会影响棋盘。先在悬崖看一次真实落石。','player','观察落石'],
  warning:['亮起的格子即将落石，留意预警。','player'],
  falling:['落石正在砸入棋盘。','player'],
  afterRock:['岩块暂时不能交换。沿亮框，在剩余格子完成一次消除。','player'],
  mapGuide:['其他地图也有各自的环境特点。','guide','继续'],
  energyMatch:['先交换亮框，消除方块获得能量。','player'],
  charge:['能量光点飞向能量槽。练习场帮你补满这一次。','energy','补满能量，抽一张卡'],
  attack:['把火焰冲击拖向敌方棋盘，用魔法准星瞄准后松手。','fire'],
  attackEffect:['火浪划过时逐格烧毁。攻击作用于敌方，不直接给你加分。','enemy'],
  control:['把时间冻结拖向敌方，暂停对方的新交换。','freeze'],
  controlObserve:['敌方出现冰封和3秒状态倒计时；已提交操作继续，卡牌仍可使用。','enemy','继续'],
  buff:['把超载模式拖向自己的棋盘。强化卡帮助自己。','overload'],
  buffObserve:['己方Buff图标与倒计时已亮起：10秒内消除得分×2。','buff','继续'],
  handGuide:['手牌最多6张。下一张可预览；满手新卡依次暂存，出牌后入手。可以留牌等时机。','energy','完成练习'],
  deck:['开局自由选择6张不同卡，三种类型没有数量配额。','guide'],
  hold:['先把卡留在手里。点击继续，看看对方的机会。','hand','保留卡牌，观察对方'],
  threat:['对方已经有四消机会。先用时间冻结，阻止新的交换。','freeze'],
  comboAttack:['冻结争取了时间，接着拖出火焰冲击，瞄准敌方亮框一排。','fire'],
  comboEffect:['两张牌已连续施放；火浪会在冻结结束后的安全时刻烧毁目标。','enemy']
};

// Tutorial-only orchestration. All effects, energy, draws, targeting and map
// hazards still run through the production adapters. No score-based victory.
export class TutorialSession {
  constructor(engine,config,{message=()=>{}}={}){
    this.engine=engine;this.config=config;this.message=message;this.status='playing';this.moves=0;this.step=0;this.revision=0;this.arena=null;this.inner=null;this.stage='';this.lastPrompt=engine.now;this.guideIndex=0;this.castPending=null;this.didSwap=false;this.evidence={};
    if(config.id==='basics'){this.loadBasic(0);this.setStage('triple');}
    else this.setStage({maps:'mapIntro',cards:'energyMatch',strategy:'deck'}[config.id]);
  }
  get complete(){return this.status==='won';}
  get remaining(){return null;}
  get total(){return {basics:3,maps:5,cards:6,strategy:4}[this.config.id];}
  get instruction(){return instructions[this.stage]||['目标完成','guide'];}
  get focus(){return this.instruction[1];}
  get button(){return this.instruction[2]||null;}
  get goals(){return [{kind:'steps',label:`当前步骤 ${Math.min(this.step+1,this.total)} / ${this.total}`,target:this.total}];}
  get counts(){return {steps:this.step};}
  get canAct(){return this.status==='playing'&&['triple','four','special','afterRock','energyMatch'].includes(this.stage)&&!this.didSwap&&(!this.inner||this.inner.canAct);}
  setStage(stage,advance=false){this.stage=stage;if(advance)this.step++;this.revision++;this.lastPrompt=this.engine.now;this.message(this.instruction[0]);}
  loadBasic(index){const score=this.engine.score;const config={...LEGACY_LEVELS[index],goals:[{kind:index?'lineCreated':'triples',target:1,label:'当前操作'}]};this.inner=new LevelSession(this.engine,config);if(index){this.engine.score=score;this.engine.emit('score',{score,points:0,depth:1});}}
  attach(arena,onCardChange=()=>{},chosenDeck=null){
    this.arena=arena;arena.status='playing';arena.target=Infinity;arena.source=null;
    if(this.config.id==='maps'){
      arena.environment.start(this.engine.now);arena.environment.next=Infinity;return;
    }
    // The chosen deck obeys CardSelection's normal six-unique-card rule. The
    // isolated tactic exercise explicitly supplies its two named practice cards.
    this.chosenDeck=chosenDeck?[...chosenDeck]:null;
    const deck=this.config.id==='strategy'?['fire','freeze',...(chosenDeck||PRACTICE_DECK).filter(id=>!['fire','freeze'].includes(id))].slice(0,6):PRACTICE_DECK;
    arena.cards=new CardBattle(arena,{decks:{player:deck,opponent:PRACTICE_DECK},config:{...CARD_CONFIG,naturalPerSecond:0,aiPlayMs:Infinity},random:seeded(73),onChange:onCardChange});
    arena.cards.start(this.engine.now);
    this.engine.loadLevel({...LEGACY_LEVELS[0],id:'tutorial-cards'});
    if(this.config.id==='strategy'){
      arena.engines.opponent.loadLevel({...LEGACY_LEVELS[1],id:'tutorial-threat'});
      this.practiceCard('fire');this.practiceCard('freeze');arena.cards.sides.player.energy=60;
      this.setStage('hold',true);
    }
  }
  hint(){
    if(!this.canAct)return null;
    if(this.inner)return this.inner.hint();
    if(this.stage==='energyMatch'&&this.engine.canSwap(11,3))return [11,3];
    return legalMoves(this.engine.board,this.engine.ruleTerrain).find(pair=>this.engine.canSwap(...pair))||null;
  }
  swap(a,b){
    if(!this.canAct)return false;
    const pair=this.hint();
    if(!pair||!([a,b].every(i=>pair.includes(i)))){this.replay('跟着亮框完成这一步；错误操作不会失败。');return false;}
    return this.inner?this.inner.swap(a,b):this.arena.command('player',{kind:'swap',a,b});
  }
  event(e){
    if(this.status!=='playing')return;
    this.inner?.event(e);
    if(e.kind==='action-accepted'){this.moves++;if(!this.inner)this.didSwap=true;}
    if(this.config.id==='maps'){
      if(e.kind==='rock-warning'){this.evidence.warning=true;this.arena.environment.active=false;this.setStage('warning');}
      if(e.kind==='rock-fall'&&this.stage!=='falling')this.setStage('falling',true);
      if(e.kind==='rock-blocked'){this.evidence.rockCells=[...e.cells];if(this.stage!=='afterRock')this.setStage('afterRock',true);}
    }
  }
  practiceCard(id){
    const b=this.arena.cards,s=b.sides.player;
    if(s.hand.some(c=>c.id===id))return;
    if(!b.eligible('player').includes(id))return;
    s.next={id,uid:++b.serial};
    b.gain('player',b.config.energyMax-s.energy,this.engine.now);
  }
  canUseCard(id){return this.status==='playing'&&({attack:'fire',control:'freeze',buff:'overload',threat:'freeze',comboAttack:'fire'}[this.stage]===id);}
  cast(uid,targetSide,index,now){
    const instance=this.arena.cards.sides.player.hand.find(c=>c.uid===uid);
    if(!instance||!this.canUseCard(instance.id))return {ok:false,reason:'先完成当前提示；这张卡可以继续留在手里。'};
    if(this.stage==='comboAttack'){
      if(!this.arena.cards.blocked('opponent',now)){this.retryControl();return {ok:false,reason:'冻结已结束。再冻住对方，然后接进攻卡。'};}
      if(Math.floor(index/8)!==0)return {ok:false,reason:'将准星移到敌方最上方亮框一排，阻断四消机会。'};
    }
    return this.arena.cards.cast('player',uid,targetSide,index,now);
  }
  cardEvent(e){
    if(this.status!=='playing'||e.side!=='player')return;
    if(e.kind==='clear-energy')this.evidence.clearEnergy=e.amount;
    if(e.kind==='charged')this.evidence.charged=true;
    if(e.kind==='draw')this.evidence.draw=true;
    if(e.kind==='cast'){this.castPending={stage:this.stage,id:e.card.id,index:e.index,now:e.now};this.evidence.casts=(this.evidence.casts||[]).concat(e.card.id);}
    if(e.kind==='effect'&&e.id==='fire'){this.evidence.fireEffect=true;this.effectDone=true;}
  }
  retryControl(){this.practiceCard('freeze');this.setStage('threat');this.replay('可以继续留牌。准备好后再用冻结＋火焰冲击，没有失败惩罚。');}
  continue(){
    if(this.status!=='playing')return;
    switch(this.stage){
      case 'mapIntro':this.arena.environment.next=this.engine.now;this.setStage('warning',true);break;
      case 'mapGuide':if(++this.guideIndex>=MAPS.length)this.win();else this.revision++;break;
      case 'charge':this.practiceCard('fire');this.setStage('attack',true);break;
      case 'controlObserve':this.practiceCard('overload');this.setStage('buff',true);break;
      case 'buffObserve':this.setStage('handGuide',true);break;
      case 'handGuide':this.win();break;
      case 'hold':this.evidence.held=this.arena.cards.sides.player.hand.length===2;this.setStage('threat',true);break;
    }
  }
  replay(text=this.instruction[0]){this.lastPrompt=this.engine.now;this.message(text);this.revision++;}
  update(){
    if(this.status!=='playing')return this.status;
    const now=this.engine.now;
    if(this.inner){
      this.inner.update();
      if(this.inner.status==='won'){
        if(this.stage==='triple'){this.loadBasic(1);this.setStage('four',true);}
        else if(this.stage==='four'){this.inner.config={...this.inner.config,goals:[{kind:'lineActivated',target:1,label:'触发特殊方块'}]};this.inner.status='playing';this.setStage('special',true);}
        else this.win();
      }
    }
    if(this.didSwap&&ready(this.engine)){
      this.didSwap=false;
      if(this.stage==='afterRock'){this.evidence.afterRock=true;this.setStage('mapGuide',true);}
      else if(this.stage==='energyMatch')this.setStage('charge',true);
    }
    const cast=this.castPending;
    if(cast){
      this.castPending=null;
      if(cast.stage==='attack'){this.effectDone=false;this.setStage('attackEffect');}
      if(cast.stage==='control'){this.evidence.freezeUntil=this.arena.cards.sides.opponent.buffs.freeze;this.setStage('controlObserve');}
      if(cast.stage==='buff'){this.evidence.buffUntil=this.arena.cards.sides.player.buffs.overload;this.setStage('buffObserve');}
      if(cast.stage==='threat'){
        this.evidence.blockedSwap=!this.arena.command('opponent',{kind:'swap',a:11,b:3});
        this.setStage('comboAttack',true);
      }
      if(cast.stage==='comboAttack'){this.effectDone=false;this.evidence.combo=true;this.setStage('comboEffect');}
    }
    if(this.stage==='attackEffect'&&this.effectDone&&ready(this.arena.engines.opponent)){this.practiceCard('freeze');this.setStage('control',true);}
    if(this.stage==='comboEffect'&&this.effectDone&&ready(this.arena.engines.opponent))this.win();
    if(this.stage==='comboAttack'&&!this.arena.cards.blocked('opponent',now))this.retryControl();
    if(now-this.lastPrompt>=12000)this.replay();
    return this.status;
  }
  win(){this.step=this.total;this.status='won';this.revision++;}
  get guide(){return this.stage==='mapGuide'?MAPS[this.guideIndex]:null;}
  get limitsCopy(){const c=cardById('overload');return `强化卡有限额：如${c.name}，本局最多生成${c.maxGenerationsPerMatch}张、使用${c.maxUsesPerMatch}次。正式对局从你选择的6张卡抽牌。`;}
}
