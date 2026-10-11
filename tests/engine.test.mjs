import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,findMatches,legalMoves,seeded,TIMING} from '../dist/engine.mjs';
function setup(seed=1){const events=[];const game=new MatchEngine({random:seeded(seed),onEvent:e=>events.push(e)});return{game,events};}
function settle(game){for(let n=0;n<500&&(!game.stableChecked||game.transactions.length);n++)game.tick(game.now+50);assert.equal(game.transactions.length,0);assert.equal(findMatches(game.board).length,0);assert.equal(game.board.length,64);assert.ok(game.board.every(Boolean));assert.equal(new Set(game.board.map(t=>t.id)).size,64);assert.ok(legalMoves(game.board).length);assert.ok(game.locks.every(c=>c===null));}
test('fresh boards contain no initial matches and have legal moves',()=>{for(let seed=1;seed<=40;seed++){const{game}=setup(seed);settle(game);}});
test('horizontal and vertical runs merge a cross and count its center once',()=>{const board=Array.from({length:64},(_,i)=>({id:i,type:(Math.floor(i/8)+i%8)%5}));for(const i of [26,27,28,19,35])board[i].type=4;for(const i of [11,43,25,29])board[i].type=1;const g=findMatches(board).find(g=>g.cells.includes(27));assert.equal(g.cells.length,5);assert.equal(g.strength,5);});
test('invalid exchange returns within 190ms and leaves score and board unchanged',()=>{const{game,events}=setup();const valid=legalMoves(game.board);let pair;for(let a=0;a<64&&!pair;a++)for(const b of [a+1,a+8])if(game.canSwap(a,b)&&!valid.some(([i,j])=>i===a&&j===b)){pair=[a,b];break;}const before=game.board.map(t=>t.id);assert.ok(game.swap(...pair));game.tick(100);assert.equal(events.at(-1).kind,'revert');game.tick(190);assert.deepEqual(game.board.map(t=>t.id),before);assert.equal(game.score,0);assert.equal(game.transactions.length,0);});
test('nonadjacent, wrapped, out-of-bounds and busy swaps are refused',()=>{const{game}=setup();for(const pair of [[0,2],[7,8],[-1,0],[63,64],[0,0]])assert.equal(game.swap(...pair),false);assert.equal(game.swap(0,8),true);assert.equal(game.swap(16,24),false);});
for(const [mode,strength] of [['three',3],['four',4],['five',5]])test(`${mode} practice guarantees its intended feedback and score`,()=>{const{game,events}=setup(9);game.reset(mode);assert.equal(findMatches(game.board).length,0);assert.ok(game.swap(...game.practiceMove));game.tick(100);const clear=events.find(e=>e.kind==='clear');assert.equal(clear.strength,strength);assert.equal(clear.points,strength*10+(strength===4?20:strength===5?50:0));game.tick(TIMING.swap+160);assert.equal(game.transactions[0].phase,'clear');assert.equal(clear.duration,TIMING.clear);game.tick((TIMING.swap+TIMING.clear));assert.ok(game.board.every(Boolean));assert.ok(events.some(e=>e.kind==='fall'));settle(game);});
test('chain fixture refills into a second match with a larger multiplier',()=>{const{game,events}=setup(20);game.reset('chain');game.swap(...game.practiceMove);settle(game);const clears=events.filter(e=>e.kind==='clear');assert.ok(clears.length>=2);assert.equal(clears[0].depth,1);assert.equal(clears[1].depth,2);assert.ok(game.bestChain>=2);});
test('unaffected columns accept new swaps during clear and gravity',()=>{const{game}=setup();game.reset('three');game.swap(...game.practiceMove);game.tick(100);assert.ok(game.locks[1]!==null);assert.equal(game.swap(6,14),true);assert.equal(game.transactions.length,2);assert.equal(game.swap(1,9),false);game.tick((TIMING.swap+TIMING.clear));assert.ok(game.board.every(Boolean));assert.equal(game.swap(7,15),true);settle(game);});
test('concurrent cross-column matching safely reverts without stealing locks',()=>{const{game,events}=setup();game.reset('three');const before=game.board.map(t=>t.id);game.swap(...game.practiceMove);game.swap(42,50);game.tick(100);for(const tx of game.transactions)for(const c of tx.columns)assert.equal(game.locks[c],tx.id);settle(game);assert.ok(events.some(e=>e.kind==='revert'&&e.conflict));assert.equal(game.score,0);assert.deepEqual(game.board.map(t=>t.id),before);});
test('a blocked cascade preserves its depth and settles after the other column unlocks',()=>{const{game,events}=setup();game.reset('chain');game.swap(...game.practiceMove);game.tick(100);game.tick((TIMING.swap+TIMING.clear));game.tick((TIMING.swap+TIMING.clear+TIMING.fall-30));assert.ok(game.swap(44,52));game.board[4].type=1;game.board[5].type=1;game.tick((TIMING.swap+TIMING.clear+TIMING.fall));assert.equal(game.locks[1],null);assert.equal(game.canSwap(1,9),false);assert.equal(events.filter(e=>e.kind==='clear').length,1);settle(game);const cascade=events.filter(e=>e.kind==='clear')[1];assert.equal(cascade.depth,2);assert.ok(cascade.strength>=5);});
test('reset cancels active transactions and removes all old tiles',()=>{const{game}=setup();game.swap(...legalMoves(game.board)[0]);const old=new Set(game.board.map(t=>t.id));game.reset();assert.equal(game.score,0);assert.equal(game.transactions.length,0);assert.ok(game.board.every(t=>!old.has(t.id)));settle(game);});
test('dead boards reshuffle after settling and retain score',()=>{const{game,events}=setup();game.board=Array.from({length:64},(_,i)=>game.tile((Math.floor(i/8)+i%8)%5));assert.equal(legalMoves(game.board).length,0);game.score=320;game.tick(1);assert.equal(game.score,320);assert.ok(events.some(e=>e.kind==='reshuffle'));settle(game);});
test('seeded concurrent random play preserves tiles and resolves matches',()=>{const r=seeded(985);for(let seed=1;seed<=15;seed++){const{game}=setup(seed);for(let step=0;step<80;step++){if(step%3===0){const candidates=legalMoves(game.board).filter(([a,b])=>game.canSwap(a,b));if(candidates.length)game.swap(...candidates[Math.floor(r()*candidates.length)]);}else{const a=Math.floor(r()*64),b=a+(r()<.5?1:8);game.swap(a,b);}game.tick(game.now+60);assert.equal(new Set(game.board.filter(Boolean).map(t=>t.id)).size,game.board.filter(Boolean).length);}settle(game);}});

function fixture(game){game.board=Array.from({length:64},(_,i)=>game.tile((Math.floor(i/8)+i%8)%5));game.stableChecked=false;}
function shapeFixture(game,shape,rotation){
  const rotate=([x,y])=>{for(let n=0;n<rotation;n++)[x,y]=[-y,x];return (3+y)*8+3+x;};
  const cells=(shape==='T'?[[-1,0],[0,0],[1,0],[0,1],[0,2]]:[[0,0],[1,0],[2,0],[0,1],[0,2]]).map(rotate);
  const target=27,source=rotate(shape==='T'?[0,-1]:[-1,0]);
  for(let attempt=0;attempt<2000;attempt++){
    game.board=game.freshBoard();for(const i of cells)game.board[i].type=i===target?2:0;game.board[source].type=0;
    if(findMatches(game.board).length)continue;
    [game.board[source],game.board[target]]=[game.board[target],game.board[source]];
    const groups=findMatches(game.board);const ready=groups.length===1&&groups[0].cells.length===5&&cells.every(i=>groups[0].cells.includes(i));
    [game.board[source],game.board[target]]=[game.board[target],game.board[source]];
    if(ready)return{cells,source,target};
  }
  assert.fail('could not build shape fixture');
}
for(const shape of ['T','L'])for(let rotation=0;rotation<4;rotation++)test(`${shape} five-match rotation ${rotation} generates one blast at swap destination and scores once`,()=>{
  const{game,events}=setup(31+rotation);const{source,target,cells}=shapeFixture(game,shape,rotation);
  const id=game.board[source].id;assert.ok(game.swap(source,target));game.tick(100);
  const rewards=events.filter(e=>e.kind==='special-create'),clear=events.find(e=>e.kind==='clear');
  assert.equal(rewards.length,1);assert.equal(rewards[0].index,target);assert.equal(rewards[0].tile.special,'blast');assert.equal(rewards[0].tile.type,0);assert.equal(rewards[0].tile.id,id);
  assert.equal(clear.strength,5);assert.equal(clear.points,100);assert.equal(clear.tiles.length,4);assert.equal(game.cleared,4);
  assert.ok(clear.tiles.every(t=>cells.includes(t.index)));assert.equal(events.filter(e=>e.kind==='special-trigger').length,0);
  settle(game);assert.equal(game.score,events.filter(e=>e.kind==='score').reduce((sum,e)=>sum+e.points,0));
});
for(const mode of ['t-five','l-five'])test(`${mode} practice is repeatable and forms exactly five matching cells`,()=>{
  const{game,events}=setup(24);
  for(let n=0;n<10;n++){
    game.reset(mode);assert.equal(findMatches(game.board).length,0);assert.ok(game.swap(...game.practiceMove));game.tick(game.now+100);
    const clear=events.findLast(e=>e.kind==='clear'),reward=events.findLast(e=>e.kind==='special-create');assert.equal(clear.points,100);assert.equal(clear.strength,5);assert.equal(reward.tile.special,'blast');assert.equal(reward.index,game.practiceMove[1]);
    settle(game);
  }
});
test('natural L five-match generates one blast without a player swap',()=>{
  const{game,events}=setup();const{source,target}=shapeFixture(game,'L',0);
  [game.board[source],game.board[target]]=[game.board[target],game.board[source]];game.tick(1);
  assert.equal(events.filter(e=>e.kind==='special-create').length,1);assert.equal(events.find(e=>e.kind==='special-create').tile.special,'blast');assert.equal(events.find(e=>e.kind==='clear').points,100);settle(game);
});
test('intersecting three and four runs prioritize one blast over a line reward',()=>{
  const{game,events}=setup();game.board=Array(64).fill(null);for(const i of [26,27,28,19,35,43])game.board[i]=game.tile(0);
  const groups=findMatches(game.board);assert.equal(groups.length,1);assert.equal(groups[0].strength,5);
  game.claim({id:++game.nextTx,columns:[],depth:1},groups);
  assert.equal(events.filter(e=>e.kind==='special-create').length,1);assert.equal(events.find(e=>e.kind==='special-create').tile.special,'blast');assert.equal(events.find(e=>e.kind==='clear').points,110);
});
test('two separate triples do not become a five-match by summing their cells',()=>{
  const{game,events}=setup();game.board=Array(64).fill(null);for(const i of [0,1,2,61,62,63])game.board[i]=game.tile(0);
  const groups=findMatches(game.board);assert.equal(groups.length,2);assert.ok(groups.every(g=>g.strength===3));
  game.claim({id:++game.nextTx,columns:[],depth:1},groups);assert.equal(events.filter(e=>e.kind==='special-create').length,0);assert.equal(events.find(e=>e.kind==='clear').points,60);
});
for(const axis of ['row','column'])for(const length of [4,5,6])test(`${axis} ${length}-match creates one colored reward at the exchange destination`,()=>{
  const{game,events}=setup();fixture(game);
  const cells=Array.from({length},(_,i)=>axis==='row'?16+i:i*8+2);
  const target=cells[1],source=axis==='row'?target+8:target+1;
  for(const i of cells)game.board[i].type=4;
  game.board[target].type=0;game.board[source].type=4;
  const id=game.board[source].id;
  assert.ok(game.swap(source,target));game.tick(100);
  const reward=events.filter(e=>e.kind==='special-create');assert.equal(reward.length,1);
  assert.equal(reward[0].index,target);assert.equal(game.board[target].id,id);
  assert.equal(game.board[target].type,4);assert.equal(game.board[target].special,length>=5?'blast':axis);
  assert.equal(events.filter(e=>e.kind==='clear')[0].tiles.length,length-1);settle(game);
});
test('crossed four and five runs award only one blast',()=>{
  const{game,events}=setup();fixture(game);
  for(const i of [25,26,27,28,29,11,19,35])game.board[i].type=4;
  game.tick(1);const rewards=events.filter(e=>e.kind==='special-create');
  assert.equal(rewards.length,1);assert.equal(rewards[0].tile.special,'blast');settle(game);
});
for(const mode of ['row','column','blast','edge','special-chain'])test(`${mode} fixture activates, clips, scores unique cells and settles`,()=>{
  const{game,events}=setup();game.reset(mode);assert.equal(findMatches(game.board).length,0);
  const move=game.practiceMove;assert.ok(legalMoves(game.board).some(([a,b])=>[a,b].includes(move[0])&&[a,b].includes(move[1])));
  assert.ok(game.swap(...move));game.tick(100);
  const triggers=events.filter(e=>e.kind==='special-trigger'),clear=events.find(e=>e.kind==='clear');
  assert.equal(triggers.length,mode==='special-chain'?3:1);
  assert.equal(new Set(triggers.map(e=>e.tile.id)).size,triggers.length);
  const cells=new Set(triggers.flatMap(e=>e.cells));assert.equal(clear.tiles.length,cells.size);assert.equal(clear.points,cells.size*10);
  if(mode==='row'||mode==='column')assert.equal(cells.size,8);
  if(mode==='blast')assert.equal(cells.size,13);if(mode==='edge')assert.equal(cells.size,6);if(mode==='special-chain')assert.equal(cells.size,23);
  assert.ok([...cells].every(i=>i>=0&&i<64));settle(game);
  assert.equal(game.score,events.filter(e=>e.kind==='score').reduce((sum,e)=>sum+e.points,0));
});
test('matching an existing special activates it once without converting it into a reward',()=>{
  const{game,events}=setup();fixture(game);
  for(const i of [24,25,26])game.board[i].type=4;game.board[25].special='column';
  game.tick(1);assert.equal(events.filter(e=>e.kind==='special-trigger').length,1);
  assert.equal(events.filter(e=>e.kind==='special-create').length,0);
  const clear=events.find(e=>e.kind==='clear');assert.equal(clear.tiles.length,10);assert.equal(clear.points,100);settle(game);
});
test('same-color swaps of two specials consume both in one combo and deduplicate intersections',()=>{
  const{game,events}=setup();fixture(game);
  game.board[27].type=game.board[28].type=0;game.board[27].special='row';game.board[28].special='column';
  game.swap(27,28);game.tick(100);
  assert.equal(events.filter(e=>e.kind==='special-trigger').length,0);
  assert.equal(events.filter(e=>e.kind==='combo-trigger').length,1);
  const clear=events.find(e=>e.kind==='clear');assert.equal(clear.tiles.length,15);assert.equal(clear.points,150);settle(game);
});
test('special expansion conflicts revert atomically without effects or scores',()=>{
  const{game,events}=setup();game.reset('row');const before=game.board.map(t=>({...t}));
  game.swap(...game.practiceMove);game.swap(7,15);game.tick(100);
  assert.ok(events.some(e=>e.kind==='revert'&&e.conflict));assert.equal(game.score,0);
  assert.equal(events.filter(e=>e.kind==='special-trigger').length,0);
  game.tick(190);assert.deepEqual(game.board,before);settle(game);
});
test('extended blast locks only its five affected columns and refill sources remain above them',()=>{
  const{game,events}=setup();game.reset('blast');game.swap(...game.practiceMove);game.tick(100);
  assert.deepEqual(game.locks.map((id,c)=>id===null?null:c).filter(c=>c!==null),[0,1,2,3,4]);
  assert.equal(game.swap(6,14),true);assert.equal(game.swap(1,9),false);game.tick((TIMING.swap+TIMING.clear));
  const moves=events.find(e=>e.kind==='fall').moves;assert.ok(moves.some(m=>m.from<0));
  for(const m of moves){assert.equal(((m.from%8)+8)%8,m.to%8);assert.ok(Math.floor(m.from/8)<Math.floor(m.to/8));}
  settle(game);
});
test('special-containing stable board has activation moves and avoids unnecessary reshuffle',()=>{
  const{game,events}=setup();fixture(game);game.board[0].special='blast';game.score=90;game.tick(1);
  assert.ok(game.hint());assert.equal(events.filter(e=>e.kind==='reshuffle').length,0);assert.equal(game.score,90);
});
test('13-cell blast has exact side extensions and clips correctly at all 64 positions',()=>{
  const offsets=[[-2,0],[-1,-1],[-1,0],[-1,1],[0,-2],[0,-1],[0,0],[0,1],[0,2],[1,-1],[1,0],[1,1],[2,0]];
  const{game}=setup();
  for(let index=0;index<64;index++){
    fixture(game);game.board[index].special='blast';const row=Math.floor(index/8),col=index%8;
    const expected=offsets.map(([dr,dc])=>[row+dr,col+dc]).filter(([r,c])=>r>=0&&r<8&&c>=0&&c<8).map(([r,c])=>r*8+c).sort((a,b)=>a-b);
    const plan=game.resolution({},[],[index]);assert.equal(plan.blasts.length,1);assert.deepEqual(plan.blasts[0].cells,expected);
    assert.deepEqual([...plan.cells].sort((a,b)=>a-b),expected);
    if([0,7,56,63].includes(index))assert.equal(expected.length,6);
    if(index===3)assert.equal(expected.length,9);if(index===27)assert.equal(expected.length,13);
  }
});
test('an extended side cell triggers its special once while outer diagonals stay untouched',()=>{
  const{game,events}=setup();fixture(game);game.board[27].special='blast';game.board[11].special='column';game.board[9].special='row';
  game.claim({id:++game.nextTx,columns:[],depth:1},[],[27]);
  const triggers=events.filter(e=>e.kind==='special-trigger'),clear=events.find(e=>e.kind==='clear');
  assert.equal(triggers.length,2);assert.deepEqual(triggers.map(e=>e.index),[27,11]);
  const unique=new Set(triggers.flatMap(e=>e.cells));assert.equal(clear.tiles.length,unique.size);assert.equal(clear.points,unique.size*10);assert.equal(game.board[9].special,'row');
});
test('the new outer blast column participates in atomic conflict protection',()=>{
  const{game,events}=setup();game.reset('blast');const original=game.board.map(t=>({...t}));
  game.swap(...game.practiceMove);assert.ok(game.swap(0,8));game.tick(100);
  assert.ok(events.some(e=>e.kind==='revert'&&e.conflict));assert.equal(game.score,0);assert.equal(events.filter(e=>e.kind==='special-trigger').length,0);
  game.tick(190);assert.deepEqual(game.board,original);settle(game);
});
test('a cascade waits for every column in its expanded blast and preserves multiplier',()=>{
  const{game,events}=setup();game.reset('blast');game.swap(...game.practiceMove);game.tick(100);game.tick((TIMING.swap+TIMING.clear));
  // A matching special in a free row can reach a separately owned column.
  assert.ok(game.swap(7,15));for(const i of [32,33,34])game.board[i].type=4;game.board[32].special='row';
  game.tick((TIMING.swap+TIMING.clear+TIMING.fall));assert.equal(events.filter(e=>e.kind==='special-trigger').length,1);
  assert.ok(game.pendingColumns.has(0));assert.equal(game.swap(0,8),false);
  settle(game);const trigger=events.filter(e=>e.kind==='special-trigger').find(e=>e.index===32);assert.ok(trigger);
  assert.ok(events.filter(e=>e.kind==='clear').some(e=>e.depth>=2));
});
