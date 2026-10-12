import {STANDARD_TERRAIN} from './terrain.mjs';
import {LEVELS,LevelSession,TutorialProgress} from './levels.mjs';
import {MatchEngine} from './engine.mjs';
import {ArenaSession} from './arena.mjs';
import {BotSource,DIFFICULTIES} from './bot.mjs';
import {MapReveal} from './map-reveal.mjs';
import {CardSelection,CARD_CONFIG} from './cards.mjs';
import {createCardUI} from './card-ui.mjs';

export function createGameFlow({engine,showHint,message,resize,onSandbox,opponentView,onOpponentEvent=()=>{},onCardEvent=()=>{},onMapChange=()=>{},reducedMotion=false}){
  const $=id=>document.getElementById(id);
  let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('storage unavailable');},setItem(){throw Error('storage unavailable');}};}
  const progress=new TutorialProgress(storage);
  let cardUI;
  const flow={screen:'home',session:null,arena:null,reveal:null,selection:null,difficulty:'normal',index:0,lastAuto:-1,
    get visibleGame(){return ['sandbox','tutorial','arena'].includes(this.screen);},
    get canInteract(){return this.visibleGame&&(this.arena?this.arena.status==='playing'&&!this.arena.cards?.manualBlocked('player',engine.now):!this.session||this.session.canAct);},
    swap(a,b){return this.canInteract&&(this.arena?this.arena.command('player',{kind:'swap',a,b}):this.session?this.session.swap(a,b):engine.command({kind:'swap',a,b}));},
    paintCardUnderlay(ctx,side,now,width,height){cardUI?.paintUnderlay(ctx,side,now,width,height);},
    event(e){cardUI?.boardEvent('player',e);this.session?.event(e);if(this.session&&e.kind!=='reset')renderGoals();},
    update(now=performance.now()){
      if(this.reveal){const state=this.reveal.at(now);renderReveal(state);if(state.phase==='complete'){const map=this.reveal.map;this.reveal=null;this.enterArena(map,now);}return;}
      if(this.selection){this.selection.update(now);cardUI.render(now);if(this.selection.complete){this.arena.decks={player:[...this.selection.player],opponent:[...this.selection.opponent]};this.arena.start(now);this.selection=null;this.arena.ready('opponent',now);this.arena.ready('player',now);$('game-screen').inert=false;$('board').focus({preventScroll:true});}else return;}
      if(this.arena){this.arena.update(now);renderArena(now);cardUI.render(now);return;}
      const s=this.session;if(!s||s.status!=='playing')return;
      s.update();
      if(s.status!=='playing'){
        if(s.status==='won')progress.finish(this.index);
        renderProgress();renderGoals();
        $('result-title').textContent=s.status==='won'?(progress.qualified&&this.index===5?'教学全通关！':'关卡完成！'):'再试一次';
        $('result-copy').textContent=s.status==='won'?`${s.moves} 次有效操作 · ${engine.score} 分。${this.index===5?'已获得竞技资格，竞技匹配尚未开放。':'下一关已解锁。'}`:`步数用完，获得 ${engine.score} / ${s.config.targetScore} 分。试试利用组合技。`;
        $('result-next').hidden=s.status!=='won';$('result-next').textContent=this.index===5?'回到主界面':'进入下一关';
        $('game-screen').inert=true;$('result').hidden=false;$('result-next').hidden?$('result-retry').focus():$('result-next').focus();
      }else if(s.config.autoHint&&engine.stableChecked&&this.lastAuto!==s.moves){this.lastAuto=s.moves;showHint();}
    },
    start(index){
      if(!progress.unlocked(index))return;
      this.session=null;this.index=index;this.lastAuto=-1;
      this.session=new LevelSession(engine,LEVELS[index]);setScreen('tutorial');
      $('mode-label').textContent=`教学 ${index+1} / 6`;$('play-sign').textContent='✦ 新手训练营 ✦';
      $('level-title').textContent=`${index+1}. ${LEVELS[index].title}`;$('level-copy').textContent=LEVELS[index].description;
      $('restart').textContent='↻ 重试本关';$('exit-game').textContent='‹ 返回选关';renderGoals();
      message(index<2?'观察亮框，沿箭头交换；也可以自由尝试':'自由观察棋盘 · 需要时点「提示一步」');
      if(LEVELS[index].autoHint){this.lastAuto=0;showHint();}
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
    cancelCards(){leave('difficulty');},
    retry(){this.arena?this.startArena():this.start(this.index);}
  };
  cardUI=createCardUI(flow);
  function setScreen(screen){
    engine.now=performance.now();$('game-screen').inert=false;
    flow.screen=screen;$('home-screen').hidden=screen!=='home';$('level-screen').hidden=screen!=='levels';$('difficulty-screen').hidden=screen!=='difficulty';$('game-screen').hidden=!flow.visibleGame;
    $('scene-softener').hidden=screen!=='arena';
    $('map-reveal').hidden=screen!=='matching';$('map-announcement').hidden=screen!=='arena';
    $('practice-panel').hidden=screen!=='sandbox';$('tutorial-panel').hidden=screen!=='tutorial';$('arena-panel').hidden=screen!=='arena';$('arena-gate').hidden=screen!=='arena';$('arena-scoreboard').hidden=screen!=='arena';$('opponent-gate').hidden=screen!=='arena';$('result').hidden=true;
    $('game-screen').classList.toggle('arena-mode',screen==='arena');$('hint').disabled=false;
    if(screen!=='arena'){$('result-retry').textContent='↻ 重试本关';$('result-back').textContent='‹ 返回选关';}
    if(flow.visibleGame)resize();
  }
  function leave(screen){flow.selection?.cancel();flow.selection=null;cardUI.reset();flow.reveal?.cancel();flow.reveal=null;flow.session=null;flow.arena?.dispose();flow.arena=null;cardUI.render(performance.now());onMapChange(null);opponentView?.reset();engine.reset('free',STANDARD_TERRAIN);setScreen(screen);renderProgress();$(screen==='home'?'open-tutorial':screen==='difficulty'?'difficulty-back':'level-back').focus();}
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
    $('arena-rule').textContent=`目标 ${s.target} 分`;
    $('arena-player-score').textContent=engine.score;
    $('arena-player-chain').textContent=engine.bestChain?`×${engine.bestChain}`:'—';
    $('arena-mode-name').textContent=`${DIFFICULTIES[flow.difficulty].label} · 人机对战`;
    $('opponent-label').textContent=`竞技对手 · ${DIFFICULTIES[flow.difficulty].label}`;
    $('opponent-state').textContent=s.status==='preparing'?'对手已准备':s.status==='countdown'?'等待开赛':s.status==='playing'?'寻找下一步…':s.status==='finishing'?'目标已达成，结算已提交操作…':'比赛结束';
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
    $('home-progress').textContent=`训练进度 ${progress.completed} / 6`;
    $('qualification').textContent=progress.qualified?'竞技资格已获得 · 匹配尚未开放':'完成全部教学后获得竞技资格';
    $('progress-note').textContent=progress.saved?'通关进度自动保存在此浏览器':'浏览器存储不可用，进度仅在本次打开期间保留';
    document.querySelectorAll('[data-level]').forEach(b=>{const i=Number(b.dataset.level);b.disabled=!progress.unlocked(i);b.querySelector('small').textContent=i<progress.completed?'★ 已通关 · 可重玩':progress.unlocked(i)?'开始训练':'未解锁';});
  }
  function renderGoals(){
    const s=flow.session;if(!s)return;
    $('goal-list').replaceChildren(...s.goals.map(g=>{const row=document.createElement('div');row.className='goal-row';const label=document.createElement('span');label.textContent=g.label;const count=document.createElement('strong');count.textContent=`${Math.min(g.target,s.counts[g.kind])} / ${g.target}`;row.append(label,count);return row;}));
    $('moves-left').textContent=s.remaining===null?`有效操作 ${s.moves} 次 · 不限步数`:`剩余 ${s.remaining} 步 / ${s.config.moveLimit} 步`;
    $('tutorial-tip').textContent=s.complete?'目标达成，等待棋盘结算…':s.remaining===0?'最后一步结算中…':flow.index<2?'跟随亮框学习，也可以尝试其他有效交换':'自由操作 · 提示只在需要时出现';
  }
  $('open-tutorial').addEventListener('click',()=>leave('levels'));
  $('open-arena').addEventListener('click',()=>leave('difficulty'));
  $('difficulty-back').addEventListener('click',()=>leave('home'));
  $('map-reveal-cancel').addEventListener('click',()=>leave('difficulty'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(flow.reveal||flow.selection))leave('difficulty');});
  document.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>flow.startArena(b.dataset.difficulty)));
  $('arena-ready').addEventListener('click',()=>{flow.arena?.ready('player',performance.now());renderArena(performance.now());$('board').focus({preventScroll:true});});
  $('open-sandbox').addEventListener('click',()=>{flow.session=null;onSandbox();engine.reset();setScreen('sandbox');$('play-sign').textContent='✦ 手感沙盒 ✦';$('restart').textContent='↻ 重新开始';$('exit-game').textContent='‹ 返回主界面';$('mode-label').textContent='自由练习';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='free'));message('拖动交换 · 点击相邻两格也可以');$('board').focus({preventScroll:true});});
  $('level-back').addEventListener('click',()=>leave('home'));
  $('exit-game').addEventListener('click',()=>leave(flow.session?'levels':'home'));
  $('result-retry').addEventListener('click',()=>flow.retry());
  $('result-back').addEventListener('click',()=>leave(flow.arena?'home':'levels'));
  $('result-next').addEventListener('click',()=>flow.index===5?leave('home'):flow.start(flow.index+1));
  document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>flow.start(Number(b.dataset.level))));
  setScreen('home');renderProgress();return flow;
}
