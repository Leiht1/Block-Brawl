import {STANDARD_TERRAIN} from './terrain.mjs';
import {LEVELS,TutorialProgress} from './levels.mjs';
import {TutorialSession} from './tutorial.mjs';
import {MAPS,FOREST_MAP} from './maps.mjs';
import {MatchEngine} from './engine.mjs';
import {ArenaSession} from './arena.mjs';
import {BotSource,DIFFICULTIES} from './bot.mjs';
import {MapReveal} from './map-reveal.mjs';
import {CardSelection,CARD_CONFIG} from './cards.mjs';
import {createCardUI} from './card-ui.mjs';

export function createGameFlow({engine,showHint,message,resize,onSandbox,opponentView,onOpponentEvent=()=>{},onCardEvent=()=>{},onMapChange=()=>{},reducedMotion=false}){
  const $=id=>document.getElementById(id);
  const practiceCaption=$('message').parentElement;
  let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('storage unavailable');},setItem(){throw Error('storage unavailable');}};}
  const progress=new TutorialProgress(storage);
  let cardUI,frontLogoBounds;
  const flow={screen:'home',session:null,arena:null,reveal:null,selection:null,difficulty:'normal',index:0,lastAuto:-1,
    get visibleGame(){return ['sandbox','tutorial','arena'].includes(this.screen);},
    get canInteract(){return this.visibleGame&&(!this.session||this.session.canAct)&&(this.arena?this.arena.status==='playing'&&!this.arena.cards?.manualBlocked('player',engine.now):true);},
    swap(a,b){return this.canInteract&&(this.session?this.session.swap(a,b):this.arena?this.arena.command('player',{kind:'swap',a,b}):engine.command({kind:'swap',a,b}));},
    canUseCard(id){return !this.session||this.session.canUseCard(id);},
    castCard(uid,side,index,now){return this.session?this.session.cast(uid,side,index,now):this.arena.cards.cast('player',uid,side,index,now);},
    paintCardUnderlay(ctx,side,now,width,height){cardUI?.paintUnderlay(ctx,side,now,width,height);},
    event(e){cardUI?.boardEvent('player',e);this.session?.event(e);if(this.session&&e.kind!=='reset')renderGoals();},
    update(now=performance.now()){
      if(this.reveal){const state=this.reveal.at(now);renderReveal(state);if(state.phase==='complete'){const map=this.reveal.map;this.reveal=null;this.enterArena(map,now);}return;}
      if(this.selection){this.selection.update(now);cardUI.render(now);if(this.selection.complete){
        if(this.session){const chosen=[...this.selection.player];this.selection=null;this.session.attach(this.arena,cardEvent,chosen);$('game-screen').inert=false;renderGoals();}
        else {this.arena.decks={player:[...this.selection.player],opponent:[...this.selection.opponent]};this.arena.start(now);this.selection=null;this.arena.ready('opponent',now);this.arena.ready('player',now);$('game-screen').inert=false;}
        $('board').focus({preventScroll:true});
      }else return;}
      if(this.arena){this.arena.update(now);renderArena(now);cardUI.render(now);if(!this.session)return;renderTutorialStatus(now);}
      const s=this.session;if(!s||s.finishedShown)return;
      if(s.status==='playing')s.update();
      if(s.status!=='playing'){
        s.finishedShown=true;if(s.status==='won')progress.finish(this.index);
        renderProgress();renderGoals();
        this.arena?.cards?.stop();this.arena?.environment?.stop(now);
        $('result-title').textContent=this.index===LEVELS.length-1?'教学全通关！':'关卡完成！';
        $('result-copy').textContent=progress.qualified?'四关已永久开放重玩 · 竞技资格已获得。':`${LEVELS[this.index].title}已完成，下一关已解锁。`;
        $('result-next').hidden=false;$('result-next').textContent=this.index===LEVELS.length-1?'回到主界面':'进入下一关';
        $('game-screen').inert=true;$('result').hidden=false;$('result-next').hidden?$('result-retry').focus():$('result-next').focus();
      }else if(this.lastAuto!==s.revision){renderGoals();if(!s.canAct||engine.stableChecked){this.lastAuto=s.revision;if(s.canAct)showHint();}}
    },
    start(index){
      if(!progress.unlocked(index))return;
      cleanup();this.index=index;this.lastAuto=-1;onMapChange(null);
      this.session=new TutorialSession(engine,LEVELS[index],{message});
      if(index>0){
        const opponent=new MatchEngine({onEvent:e=>{cardUI?.boardEvent('opponent',e);onOpponentEvent(e);opponentView.event(e);}});
        this.arena=new ArenaSession({player:engine,opponent,map:index===1?MAPS[1]:FOREST_MAP,target:Infinity,onMapChange});
        this.arena.start(performance.now(),219);this.arena.status='playing';
      }
      setScreen('tutorial');
      if(index===3){
        this.selection=new CardSelection(performance.now(),Math.random,{...CARD_CONFIG,selectionMs:Infinity});
        for(const id of ['fire','freeze','overload','fog','bomb'])this.selection.choose(id);
        this.selection.started-=CARD_CONFIG.aiPickMs*6;this.selection.update(performance.now());
        $('game-screen').inert=true;
      }else if(this.arena)this.session.attach(this.arena,cardEvent);
      cardUI.render(performance.now());
      $('mode-label').textContent=`教学 ${index+1} / ${LEVELS.length}`;$('play-sign').textContent='✦ 新手训练营 ✦';
      $('level-title').textContent=`${index+1}. ${LEVELS[index].title}`;$('level-copy').textContent=LEVELS[index].description;
      $('restart').textContent='↻ 重玩本关';$('exit-game').textContent='‹ 返回选关';$('hint').textContent='✧ 重播提示';renderGoals();
      if(this.session.canAct)showHint();
      $('board').focus({preventScroll:true});
    },
    startArena(difficulty=this.difficulty){
      this.selection?.cancel();this.selection=null;cardUI.reset();
      this.reveal?.cancel();this.arena?.dispose();this.arena=null;this.session=null;this.difficulty=difficulty;
      this.reveal=new MapReveal(performance.now(),Math.random,reducedMotion);onMapChange(null);setScreen('matching');renderReveal(this.reveal.at(performance.now()));$('map-reveal-cancel').focus();
    },
    enterArena(map,now){
      const opponent=new MatchEngine({onEvent:e=>{cardUI?.boardEvent('opponent',e);onOpponentEvent(e);opponentView.event(e);}});
      this.arena=new ArenaSession({player:engine,opponent,source:new BotSource(this.difficulty),map,onMapChange,target:CARD_CONFIG.targetScore,onCardChange:e=>{cardUI.event(e);onCardEvent(e);}});
      this.arena.start(now);setScreen('arena');
      this.selection=new CardSelection(now);$('game-screen').inert=true;cardUI.render(now);$('deck-cancel').focus();
      $('mode-label').textContent=`人机 · ${DIFFICULTIES[this.difficulty].label}`;$('play-sign').textContent='✦ 方块竞技场 ✦';
      $('restart').textContent='↻ 重新对战';$('exit-game').textContent='‹ 返回主界面';
      $('result-retry').textContent='↻ 再来一局';$('result-back').textContent='‹ 返回主界面';
      message(`先到 ${this.arena.target} 分获胜 · 初始手牌 0 张`);renderArena(now);
    },
    cancelCards(){leave(this.session?'levels':'difficulty');},
    retry(){this.session?this.start(this.index):this.startArena();}
  };
  cardUI=createCardUI(flow);
  function cardEvent(e){cardUI.event(e);onCardEvent(e);flow.session?.cardEvent(e);}
  function cleanup(){flow.selection?.cancel();flow.selection=null;flow.session=null;cardUI.reset();flow.reveal?.cancel();flow.reveal=null;flow.arena?.dispose();flow.arena=null;opponentView?.reset();document.querySelectorAll('.tutorial-focus').forEach(n=>n.classList.remove('tutorial-focus'));$('game-screen').classList.remove('tutorial-guide-open');$('tutorial-enemy-row').hidden=true;$('tutorial-effect-state').hidden=true;}
  function setScreen(screen){
    if(flow.screen==='home')frontLogoBounds=$('home-screen').querySelector('.game-logo').getBoundingClientRect();
    engine.now=performance.now();$('game-screen').inert=false;
    flow.screen=screen;$('home-screen').hidden=screen!=='home';$('level-screen').hidden=screen!=='levels';$('difficulty-screen').hidden=screen!=='difficulty';$('game-screen').hidden=!flow.visibleGame;
    $('scene-softener').hidden=screen!=='arena';
    const duel=screen==='arena'||screen==='tutorial'&&!!flow.arena;
    $('map-reveal').hidden=screen!=='matching';$('map-announcement').hidden=!duel;
    $('practice-panel').hidden=screen!=='sandbox';$('tutorial-panel').hidden=screen!=='tutorial';$('arena-panel').hidden=!duel;$('arena-gate').hidden=!duel;$('arena-scoreboard').hidden=!duel;$('opponent-gate').hidden=!duel;$('result').hidden=true;
    $('game-screen').classList.toggle('arena-mode',duel);$('game-screen').classList.toggle('tutorial-mode',screen==='tutorial');$('game-screen').classList.toggle('tutorial-duel',screen==='tutorial'&&duel);$('game-screen').classList.toggle('tutorial-map',screen==='tutorial'&&flow.index===1);$('hint').disabled=false;
    if(screen!=='tutorial')$('hint').textContent='✧ 提示一步';
    if(duel)practiceCaption.remove();else if(!practiceCaption.isConnected)$('board-wrap').after(practiceCaption);
    if(screen==='difficulty'&&frontLogoBounds){const heading=$('difficulty-screen').querySelector('h1');heading.style.transform='none';const rect=heading.querySelector('.game-logo').getBoundingClientRect();heading.style.transform=`translate(${frontLogoBounds.x-rect.x}px,${frontLogoBounds.y-rect.y}px)`;}
    if(screen!=='arena'){$('result-retry').textContent='↻ 重试本关';$('result-back').textContent='‹ 返回选关';}
    if(flow.visibleGame)resize();
  }
  function leave(screen){cleanup();cardUI.render(performance.now());onMapChange(null);engine.reset('free',STANDARD_TERRAIN);setScreen(screen);renderProgress();$(screen==='home'?'open-tutorial':screen==='difficulty'?'difficulty-back':'level-back').focus();}
  function renderReveal(state){
    const map=state.map;if(!map)return;
    const locked=state.phase!=='cycling';
    $('map-reveal').classList.toggle('locked',locked);
    $('map-reveal-status').textContent=locked?'本场地图已揭晓':'匹配准备 · 正在揭晓地图';
    $('map-reveal-name').textContent=`${map.icon} ${map.name}`;
    $('map-reveal-copy').textContent=locked?map.brief:'森林 · 悬崖 · 冰原 · 遗迹 · 熔炉';
    $('map-reveal-preview').style.backgroundImage=`url("${map.assets.backdrop}")`;
    $('map-reveal-platform').style.backgroundImage=`url("${map.assets.preview}")`;
    $('map-reveal-progress').style.transform=`scaleX(${state.progress})`;
  }
  function renderArena(now){
    const s=flow.arena;if(!s)return;
    $('opponent-score').textContent=s.engines.opponent.score;
    $('opponent-chain').textContent=`×${Math.max(1,s.engines.opponent.bestChain)}`;
    $('arena-map-name').textContent=s.map.name;
    $('arena-environment').textContent=s.map.description;
    const announcement=`${s.map.icon} ${s.map.name}`;
    if($('map-announcement').textContent!==announcement)$('map-announcement').textContent=announcement;
    $('map-announcement').hidden=false;
    $('arena-rule').textContent=flow.session?'按步骤完成即可通关':`目标 ${s.target} 分`;
    $('arena-player-score').textContent=engine.score;
    $('arena-player-chain').textContent=engine.bestChain?`×${engine.bestChain}`:'—';
    $('arena-mode-name').textContent=flow.session?'教学练习场':`${DIFFICULTIES[flow.difficulty].label} · 人机对战`;
    $('opponent-label').textContent=flow.session?'教学对手':`竞技对手 · ${DIFFICULTIES[flow.difficulty].label}`;
    const counting=s.status==='countdown',gated=s.status==='preparing'||counting;
    const phase=counting?Math.max(0,now-(s.deadline-3000))%1000/1000:0;
    const scale=counting&&!reducedMotion?1.45-.7*(1-(1-phase)**3):1;
    for(const side of ['arena','opponent']){
      const gate=$(side==='arena'?'arena-gate':'opponent-gate');gate.hidden=!gated;gate.classList.toggle('counting',counting);
      const digit=$(`${side}-countdown`),text=counting?String(s.countdown(now)):side==='arena'?'准备好了吗？':'已准备';
      if(digit.textContent!==text)digit.textContent=text;
      digit.style.transform=`scale(${scale})`;digit.classList.toggle('counting',counting);
    }
    $('arena-ready').hidden=!!flow.selection||s.status!=='preparing';$('hint').disabled=s.status!=='playing';
    if(s.status==='finishing')message('已锁定胜者 · 双方已提交操作继续结算');
    if(s.status==='finished'&&$('result').hidden){
      $('result-title').textContent=s.winner==='player'?'你赢了！':'对手获胜';
      $('result-copy').textContent=`你 ${s.result.player} 分 · 对手 ${s.result.opponent} 分。先到 ${s.target} 分获胜，已提交连击计入最终分数。`;
      $('result-next').hidden=true;$('game-screen').inert=true;$('result').hidden=false;$('result-retry').focus();
    }
  }
  function renderProgress(){
    $('home-progress').textContent=progress.qualified?'教学已完成 · 4关自由重玩':`训练进度 ${progress.completed} / ${LEVELS.length}`;
    $('tutorial-path-status').textContent=progress.qualified?'✦ 教学已完成 · 四关自由重玩 ✦':'✦ 四关短教学 · 约6–8分钟 ✦';
    $('qualification').textContent=progress.qualified?'竞技资格已获得 · 在线匹配尚未开放':'完成全部教学后获得竞技资格';
    $('progress-note').textContent=progress.saved?'通关进度自动保存在此浏览器':'浏览器存储不可用，进度仅在本次打开期间保留';
    document.querySelectorAll('[data-level]').forEach(b=>{const i=Number(b.dataset.level);b.disabled=!progress.unlocked(i);b.querySelector('small').textContent=i<progress.completed?'★ 已通关 · 可重玩':progress.unlocked(i)?'开始训练':'未解锁';});
  }
  function renderGoals(){
    const s=flow.session;if(!s)return;const guide=s.guide,guideOpen=!!guide&&!s.complete;
    const wasGuideOpen=$('game-screen').classList.contains('tutorial-guide-open');$('game-screen').classList.toggle('tutorial-guide-open',guideOpen);
    $('goal-list').textContent=guideOpen?`地图 ${s.guideIndex+1} / ${MAPS.length}`:`步骤 ${Math.min(s.step+1,s.total)} / ${s.total}`;
    $('level-copy').textContent=s.instruction[0];$('moves-left').textContent='';
    $('tutorial-tip').textContent=s.config.id==='strategy'&&s.stage!=='deck'?`练习场固定提供冻结＋火焰两张手牌。${s.limitsCopy}`:s.stage==='handGuide'?s.limitsCopy:'错误操作不会失败 · 可重播提示或退出重玩';
    $('tutorial-continue').hidden=!s.button;$('tutorial-continue').textContent=s.button||'继续';
    $('tutorial-map-guide').hidden=!guideOpen;
    if(guide){$('tutorial-map-image').src=guide.assets.preview;$('tutorial-map-name').textContent=`${guide.icon} ${guide.name}`;$('tutorial-map-copy').textContent=guide.description;}
    document.querySelectorAll('.tutorial-focus').forEach(n=>n.classList.remove('tutorial-focus'));
    const focus={player:$('board'),enemy:$('opponent-board'),energy:$('card-resource'),hand:$('card-hand'),buff:document.querySelector('[aria-label="己方增益"]'),guide:$('tutorial-map-guide')}[s.focus]||document.querySelector(`#card-hand [data-card-id="${s.focus}"]`);
    if(!s.complete)focus?.classList.add('tutorial-focus');
    const threat=s.config.id==='strategy'&&['threat','comboAttack'].includes(s.stage);$('tutorial-enemy-row').hidden=!threat;
    if(guideOpen&&!wasGuideOpen)$('tutorial-continue').focus({preventScroll:true});
  }
  function renderTutorialStatus(now){
    const s=flow.session,b=flow.arena.cards,node=$('tutorial-effect-state');
    node.hidden=!b||!['controlObserve','comboAttack','comboEffect'].includes(s.stage);
    if(!node.hidden){const seconds=Math.max(0,((b.sides.opponent.buffs.freeze||0)-now)/1000);node.textContent=seconds>0?`❄ 敌方冻结 · 剩余 ${seconds.toFixed(1)} 秒`:'冻结已结束 · 对方可继续交换';}
  }
  $('open-tutorial').addEventListener('click',()=>leave('levels'));
  $('open-arena').addEventListener('click',()=>leave('difficulty'));
  $('difficulty-back').addEventListener('click',()=>leave('home'));
  $('map-reveal-cancel').addEventListener('click',()=>leave('difficulty'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(flow.reveal||flow.selection))leave(flow.session?'levels':'difficulty');});
  document.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>flow.startArena(b.dataset.difficulty)));
  $('arena-ready').addEventListener('click',()=>{flow.arena?.ready('player',performance.now());renderArena(performance.now());$('board').focus({preventScroll:true});});
  $('open-sandbox').addEventListener('click',()=>{flow.session=null;onSandbox();engine.reset();setScreen('sandbox');$('play-sign').textContent='✦ 手感沙盒 ✦';$('restart').textContent='↻ 重新开始';$('exit-game').textContent='‹ 返回主界面';$('mode-label').textContent='自由练习';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='free'));message('拖动交换 · 点击相邻两格也可以');$('board').focus({preventScroll:true});});
  $('level-back').addEventListener('click',()=>leave('home'));
  $('exit-game').addEventListener('click',()=>leave(flow.session?'levels':'home'));
  $('result-retry').addEventListener('click',()=>flow.retry());
  $('result-back').addEventListener('click',()=>leave(flow.session?'levels':'home'));
  $('result-next').addEventListener('click',()=>flow.index===LEVELS.length-1?leave('home'):flow.start(flow.index+1));
  $('tutorial-continue').addEventListener('click',()=>{flow.session?.continue();renderGoals();});
  document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>flow.start(Number(b.dataset.level))));
  setScreen('home');renderProgress();return flow;
}
