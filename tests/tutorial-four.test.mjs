import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,findMatches,legalMoves} from '../dist/engine.mjs';
import {ArenaSession} from '../dist/arena.mjs';
import {LEVELS,TutorialProgress,PROGRESS_KEY,LEGACY_PROGRESS_KEY} from '../dist/levels.mjs';
import {TutorialSession,PRACTICE_DECK} from '../dist/tutorial.mjs';
import {CardSelection,CARD_CONFIG} from '../dist/cards.mjs';
import {MAPS} from '../dist/maps.mjs';

function setup(index,chosen=PRACTICE_DECK){
  let lesson;const events=[],cards=[];
  const player=new MatchEngine({onEvent:e=>{events.push(e);lesson?.event(e);}});
  lesson=new TutorialSession(player,LEVELS[index]);
  let arena;
  if(index){arena=new ArenaSession({player,map:MAPS[index===1?1:0],target:Infinity});arena.start(0,219);lesson.attach(arena,e=>{cards.push(e);lesson.cardEvent(e);},chosen);}
  function advance(ms){for(let n=0;n<ms;n+=10){const time=player.now+10;arena?arena.update(time):player.tick(time);lesson.update();}}
  advance(10);return {player,lesson,arena,events,cards,advance};
}
function move(g){const pair=g.lesson.hint();assert.ok(pair);assert.ok(g.lesson.swap(...pair));g.advance(4000);}
function cast(g,id,index=27,target=id==='overload'?'player':'opponent'){
  const c=g.arena.cards.sides.player.hand.find(c=>c.id===id);assert.ok(c,`missing ${id}`);const result=g.lesson.cast(c.uid,target,index,g.player.now);assert.ok(result.ok,result.reason);g.advance(10);return c;
}
test('four lesson titles and three guaranteed basic operations with real manufacture and score',()=>{
  assert.deepEqual(LEVELS.map(l=>l.title),['方块入门','地图会捣乱','魔法卡牌','卡牌策略']);
  const g=setup(0);assert.equal(findMatches(g.player.board).length,0);const initial=[...g.player.board];assert.equal(g.lesson.swap(0,1),false);assert.deepEqual(g.player.board,initial);
  move(g);assert.equal(g.lesson.stage,'four');assert.equal(g.lesson.moves,1);assert.equal(findMatches(g.player.board).length,0);
  move(g);assert.equal(g.lesson.stage,'special');assert.equal(g.lesson.inner.counts.lineCreated,1);const score=g.player.score;
  move(g);assert.equal(g.lesson.status,'won');assert.equal(g.lesson.moves,3);assert.equal(g.lesson.inner.counts.lineActivated,1);assert.ok(g.player.score>score);assert.equal(g.lesson.canAct,false);
});
test('cliff uses the unchanged formal event mechanism through warning, seal, legal post-event elimination and five map briefs',()=>{
  const g=setup(1);assert.equal(g.lesson.stage,'mapIntro');g.advance(60000);assert.equal(g.arena.environment.round,0);
  const formal=MAPS[1].environment;for(const key of Object.keys(formal))assert.deepEqual(g.arena.environment.config[key],formal[key]);
  g.lesson.continue();g.advance(10);assert.equal(g.lesson.stage,'warning');g.advance(formal.warning);assert.equal(g.lesson.stage,'falling');g.advance(formal.impact);
  assert.equal(g.lesson.stage,'afterRock');assert.ok(g.player.temporaryBlocks.size);assert.ok(g.lesson.evidence.rockCells.every(i=>g.player.ruleTerrain.cells[i]==='obstacle'));
  assert.ok(legalMoves(g.player.board,g.player.ruleTerrain).length);move(g);assert.equal(g.lesson.stage,'mapGuide');const briefs=[];
  for(let n=0;n<5;n++){briefs.push(g.lesson.guide);g.lesson.continue();}
  assert.deepEqual(briefs,MAPS);assert.equal(g.lesson.status,'won');assert.equal(g.arena.environment.round,1);g.advance(30000);assert.equal(g.arena.environment.round,1);g.arena.dispose();assert.equal(g.player.temporaryBlocks.size,0);
});
test('energy, real draw, enemy attack/control and self buff complete without a target score',()=>{
  const g=setup(2);move(g);assert.equal(g.lesson.stage,'charge');assert.ok(g.lesson.evidence.clearEnergy>0);assert.ok(g.arena.cards.sides.player.energy>0);assert.equal(g.arena.cards.sides.player.hand.length,0);
  g.lesson.continue();assert.equal(g.lesson.stage,'attack');assert.ok(g.lesson.evidence.charged);assert.ok(g.lesson.evidence.draw);assert.equal(g.arena.cards.sides.player.generated.fire,1);
  const attack=g.arena.cards.sides.player.hand[0];assert.equal(g.lesson.cast(attack.uid,'player',27,g.player.now).ok,false);assert.equal(g.arena.cards.sides.player.hand.length,1);
  cast(g,'fire');assert.equal(g.lesson.stage,'attackEffect');g.advance(4000);assert.equal(g.lesson.stage,'control');assert.ok(g.events.every(e=>!e.card||e.points===0));
  cast(g,'freeze');assert.equal(g.lesson.stage,'controlObserve');assert.equal(g.lesson.evidence.freezeUntil,g.player.now-10+CARD_CONFIG.freezeMs);assert.equal(g.arena.command('opponent',{kind:'swap',a:11,b:3}),false);
  g.lesson.continue();cast(g,'overload',27,'player');assert.equal(g.lesson.stage,'buffObserve');assert.equal(g.lesson.evidence.buffUntil,g.player.now-10+CARD_CONFIG.overloadMs);
  assert.equal(g.arena.cards.sides.player.used.overload,1);g.lesson.practiceCard('overload');assert.equal(g.arena.cards.sides.player.generated.overload,1);
  g.lesson.continue();assert.equal(g.lesson.stage,'handGuide');g.lesson.continue();assert.equal(g.lesson.status,'won');assert.ok(g.player.score<15000);assert.equal(g.arena.target,Infinity);
});
test('strategy preserves cards, blocks a real opponent command, requires a timely enemy attack and completes on its effect',()=>{
  const g=setup(3);assert.equal(g.lesson.stage,'hold');assert.equal(g.arena.cards.sides.player.hand.length,2);assert.equal(g.arena.cards.sides.player.energy,60);
  const hand=[...g.arena.cards.sides.player.hand];assert.equal(g.lesson.cast(hand[0].uid,'opponent',3,g.player.now).ok,false);g.advance(60000);assert.deepEqual(g.arena.cards.sides.player.hand,hand);
  g.lesson.continue();assert.ok(g.lesson.evidence.held);cast(g,'freeze');assert.equal(g.lesson.stage,'comboAttack');assert.ok(g.lesson.evidence.blockedSwap);
  const fire=g.arena.cards.sides.player.hand.find(c=>c.id==='fire');assert.equal(g.lesson.cast(fire.uid,'opponent',27,g.player.now).ok,false);
  g.advance(CARD_CONFIG.freezeMs);assert.equal(g.lesson.stage,'threat');assert.equal(g.lesson.status,'playing');assert.ok(g.arena.cards.sides.player.hand.some(c=>c.id==='fire'));
  cast(g,'freeze');cast(g,'fire',3);assert.equal(g.lesson.stage,'comboEffect');g.advance(1000);assert.equal(g.lesson.status,'playing');g.advance(5000);assert.equal(g.lesson.status,'won');assert.ok(g.lesson.evidence.combo);assert.ok(g.player.score<15000);
});
test('normal six-unique-card selection accepts free type counts, and every valid deck can enter the explicit preset strategy exercise',()=>{
  for(const deck of [['fire','quake','meteor','bomb','freeze','blackhole'],['overload','sage','rainbow','luck','fire','quake']]){
    const s=new CardSelection(0,()=>.5);for(const id of deck)assert.ok(s.choose(id));assert.equal(s.choose(deck[0]),false);assert.ok(s.ready());s.update(4000);assert.ok(s.complete);
    const g=setup(3,deck);assert.deepEqual(g.lesson.chosenDeck,deck);assert.equal(g.arena.cards.sides.player.deck.length,6);assert.equal(new Set(g.arena.cards.sides.player.deck).size,6);assert.deepEqual(g.arena.cards.sides.player.hand.map(c=>c.id),['fire','freeze']);
  }
});
test('tutorial energy acceleration is instance-local; a subsequent formal match retains zero starts, two natural energy/sec and score victory',()=>{
  const g=setup(2);move(g);g.lesson.continue();assert.equal(CARD_CONFIG.naturalPerSecond,2);assert.equal(g.arena.cards.config.naturalPerSecond,0);g.arena.dispose();
  const arena=new ArenaSession({player:g.player,map:MAPS[0],target:CARD_CONFIG.targetScore,decks:{player:PRACTICE_DECK,opponent:PRACTICE_DECK}});arena.start(0,23);assert.equal(arena.cards.sides.player.energy,0);assert.equal(arena.cards.sides.player.hand.length,0);arena.ready('player',0);arena.ready('opponent',0);arena.update(3000);arena.update(4000);assert.equal(arena.cards.sides.player.energy,2);assert.equal(arena.target,15000);arena.dispose();
});
test('old fully completed users keep qualification; partial/corrupt legacy data does not bypass new lessons',()=>{
  for(const completed of [0,3,5,6,99,2.5]){
    const map=new Map([[LEGACY_PROGRESS_KEY,JSON.stringify({version:1,completed})]]),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
    const p=new TutorialProgress(storage);assert.equal(p.qualified,completed===6);assert.equal(p.completed,completed===6?4:0);assert.equal(p.unlocked(3),completed===6);
    assert.equal(JSON.parse(map.get(LEGACY_PROGRESS_KEY)).completed,completed);assert.equal(new TutorialProgress(storage).completed,p.completed);
  }
});
test('fresh progress saves immediately, replays never overwrite or reward progress, and blocked storage remains session-usable',()=>{
  let writes=0;const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>{writes++;map.set(k,v);}};
  let p=new TutorialProgress(storage);assert.equal(p.finish(1),false);for(let i=0;i<4;i++){assert.ok(p.finish(i));assert.equal(JSON.parse(map.get(PROGRESS_KEY)).completed,i+1);p=new TutorialProgress(storage);assert.equal(p.unlocked(Math.min(i+1,3)),true);}
  assert.equal(writes,4);for(let i=0;i<4;i++)assert.ok(p.finish(i));assert.equal(writes,4);assert.ok(p.qualified);
  p=new TutorialProgress({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});assert.equal(p.saved,false);assert.ok(p.finish(0));assert.equal(p.completed,1);assert.equal(p.saved,false);
});
