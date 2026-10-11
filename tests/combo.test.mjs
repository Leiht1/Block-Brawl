import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,findMatches,legalMoves,seeded,TIMING} from '../dist/engine.mjs';
const pairs=[['line-line','row','column'],['line-blast','row','blast'],['line-blast','column','blast'],['blast-blast','blast','blast']];
function setup(){const events=[];const game=new MatchEngine({random:seeded(42),onEvent:e=>events.push(e)});fixture(game);return{game,events};}
function fixture(game){game.board=Array.from({length:64},(_,i)=>game.tile((Math.floor(i/8)+i%8)%5));game.stableChecked=false;}
function settle(game){for(let n=0;n<600&&(!game.stableChecked||game.transactions.length);n++)game.tick(game.now+50);assert.equal(game.transactions.length,0);assert.ok(game.board.every(Boolean));assert.equal(new Set(game.board.map(t=>t.id)).size,64);assert.equal(findMatches(game.board).length,0);assert.ok(game.locks.every(c=>c===null));assert.ok(legalMoves(game.board).length);}
function expected(type,index,lineAxis=null){const row=Math.floor(index/8),col=index%8,result=new Set();
  if(type==='blast-blast'){for(let r=row-2;r<=row+2;r++)for(let c=col-2;c<=col+2;c++)if(r>=0&&r<8&&c>=0&&c<8)result.add(r*8+c);}
  else{const offsets=type==='line-line'?[0]:[-1,0,1];for(const d of offsets)for(let n=0;n<8;n++){if((type==='line-line'||lineAxis==='row')&&row+d>=0&&row+d<8)result.add((row+d)*8+n);if((type==='line-line'||lineAxis==='column')&&col+d>=0&&col+d<8)result.add(n*8+col+d);}}
  return [...result].sort((a,b)=>a-b);
}
for(const [type,first,second] of pairs)for(const axis of ['horizontal','vertical'])for(const same of [false,true])test(`${type} ${axis} exchange with ${same?'same':'different'} colors consumes participants and scores once`,()=>{
  const{game,events}=setup();const a=axis==='horizontal'?26:19,b=27;
  game.board[a].special=first;game.board[b].special=second;game.board[a].type=0;game.board[b].type=same?0:4;
  const consumed=[game.board[a].id,game.board[b].id];assert.ok(game.swap(a,b));game.tick(100);
  const combo=events.find(e=>e.kind==='combo-trigger'),clear=events.find(e=>e.kind==='clear');assert.ok(combo);assert.equal(combo.type,type);assert.equal(combo.index,b);
  const lineAxis=type==='line-blast'?first:null;assert.equal(combo.lineAxis,lineAxis);
  assert.deepEqual(combo.cells,expected(type,b,lineAxis));assert.equal(clear.tiles.length,expected(type,b,lineAxis).length);assert.equal(clear.points,expected(type,b,lineAxis).length*10);
  assert.equal(combo.duration,TIMING.comboClear);assert.equal(game.transactions[0].end,100+TIMING.comboClear);
  assert.equal(events.filter(e=>e.kind==='special-trigger').length,0);assert.equal(events.filter(e=>e.kind==='special-create').length,0);
  assert.ok(consumed.every(id=>!game.board.some(t=>t?.id===id)));game.tick((TIMING.swap+TIMING.comboClear));assert.ok(game.board.every(Boolean));assert.ok(events.find(e=>e.kind==='fall'));assert.equal(game.transactions[0].end,(TIMING.swap+TIMING.comboClear)+TIMING.fall);
  settle(game);assert.equal(game.score,events.filter(e=>e.kind==='score').reduce((sum,e)=>sum+e.points,0));
});
for(const [type,first,second] of pairs)test(`${type} clips exact combo area at every target, edge, corner and reversed direction`,()=>{
  const{game,events}=setup();
  for(let b=0;b<64;b++)for(const a of [b%8?b-1:b+1,b>=8?b-8:b+8]){
    game.transactions=[];game.locks.fill(null);game.pendingColumns.clear();fixture(game);game.score=0;
    game.board[a].special=first;game.board[b].special=second;game.swap(a,b);game.tick(game.now+100);
    const combo=events.findLast(e=>e.kind==='combo-trigger'),clear=events.findLast(e=>e.kind==='clear');
    const lineAxis=type==='line-blast'?first:null;
    assert.equal(combo.index,b);assert.deepEqual(combo.cells,expected(type,b,lineAxis));assert.equal(clear.points,expected(type,b,lineAxis).length*10);
  }
});
test('all line orientations and mixed pair orders use the destination as the combo center',()=>{
  const{game}=setup();for(const first of ['row','column','blast'])for(const second of ['row','column','blast']){
    fixture(game);game.board[26].special=first;game.board[27].special=second;
    const combo=game.combination(26,27);assert.deepEqual(combo.cells,expected(first==='blast'&&second==='blast'?'blast-blast':first==='blast'||second==='blast'?'line-blast':'line-line',27,first==='blast'?second:first));
  }
});
for(const lineAxis of ['row','column'])test(`${lineAxis} plus blast keeps its direction when blast is the dragged source`,()=>{
  const{game,events}=setup();game.board[26].special='blast';game.board[27].special=lineAxis;game.swap(26,27);game.tick(100);
  const combo=events.find(e=>e.kind==='combo-trigger');assert.equal(combo.lineAxis,lineAxis);assert.deepEqual(combo.cells,expected('line-blast',27,lineAxis));assert.equal(events.find(e=>e.kind==='clear').points,240);settle(game);
});
test('vertical line plus blast keeps unrelated columns interactive while horizontal spans all columns',()=>{
  for(const mode of ['combo-cross','combo-column']){
    const{game}=setup();game.reset(mode);game.swap(...game.practiceMove);game.tick(100);
    assert.deepEqual(game.locks.map((id,c)=>id===null?null:c).filter(c=>c!==null),mode==='combo-column'?[2,3,4]:[0,1,2,3,4,5,6,7]);
    assert.equal(game.swap(0,8),mode==='combo-column');game.tick((TIMING.swap+TIMING.comboClear));assert.equal(game.swap(7,15),mode==='combo-column');settle(game);
  }
});
test('combo wins over an ordinary four-match and does not generate or award a match bonus',()=>{
  const{game,events}=setup();for(const i of [26,27,28,29])game.board[i].type=0;game.board[26].special='row';game.board[27].special='column';
  game.swap(26,27);game.tick(100);assert.equal(events.filter(e=>e.kind==='special-create').length,0);assert.equal(events.find(e=>e.kind==='clear').points,150);settle(game);
});
test('combo expands through multiple special effects without re-triggering consumed participants',()=>{
  const{game,events}=setup();game.board[26].special=game.board[27].special='blast';
  for(const [i,special] of [[28,'row'],[44,'blast'],[46,'column'],[6,'blast'],[7,'row']])game.board[i].special=special;
  const ids=new Set([26,27].map(i=>game.board[i].id));game.swap(26,27);game.tick(100);
  const combo=events.find(e=>e.kind==='combo-trigger'),triggers=events.filter(e=>e.kind==='special-trigger'),clear=events.find(e=>e.kind==='clear');
  assert.equal(triggers.length,5);assert.equal(new Set(triggers.map(e=>e.tile.id)).size,5);assert.ok(triggers.every(e=>!ids.has(e.tile.id)));
  const cells=new Set([...combo.cells,...triggers.flatMap(e=>e.cells)]);assert.equal(clear.tiles.length,cells.size);assert.equal(clear.points,cells.size*10);settle(game);
});
test('combo gravity produces a scored depth-two refill match without duplicate tile IDs',()=>{
  const{game,events}=setup();game.board[26].special=game.board[27].special='blast';
  for(const c of [1,2,3])game.refills.set(c,[0,0,0,0,1]);game.swap(26,27);settle(game);
  assert.ok(events.filter(e=>e.kind==='clear').some(e=>e.depth>=2));
  assert.equal(game.score,events.filter(e=>e.kind==='score').reduce((sum,e)=>sum+e.points,0));
});
test('5×5 combo leaves unrelated columns interactive during clear and gravity',()=>{
  const{game,events}=setup();game.board[26].special=game.board[27].special='blast';game.swap(26,27);game.tick(100);
  assert.deepEqual(game.locks.map((id,c)=>id===null?null:c).filter(c=>c!==null),[1,2,3,4,5]);
  assert.ok(game.swap(0,8));assert.equal(game.swap(1,9),false);game.tick((TIMING.swap+TIMING.comboClear));assert.ok(game.swap(7,15));
  for(const tx of game.transactions)for(const c of tx.columns)assert.equal(game.locks[c],tx.id);settle(game);
  assert.ok(events.some(e=>e.kind==='combo-trigger'));
});
test('combo conflict and a conflict reached only through chained specials both revert atomically',()=>{
  for(const chain of [false,true]){
    const{game,events}=setup();game.board[26].special=game.board[27].special='blast';if(chain)game.board[28].special='row';
    const before=game.board.map(t=>({...t}));game.swap(26,27);const column=chain?7:1;assert.ok(game.swap(column,column+8));game.tick(100);
    assert.equal(game.score,0);assert.equal(events.filter(e=>e.kind==='combo-trigger'||e.kind==='special-trigger').length,0);assert.ok(events.some(e=>e.kind==='revert'&&e.conflict));
    game.tick(190);assert.deepEqual(game.board,before);settle(game);
  }
});
for(const [mode,type,count] of [['combo-lines','line-line',15],['combo-cross','line-blast',24],['combo-column','line-blast',24],['combo-blasts','blast-blast',25]])test(`${mode} fixture reliably exposes a ${count}-cell combo`,()=>{
  const{game,events}=setup();for(let n=0;n<5;n++){game.reset(mode);assert.equal(findMatches(game.board).length,0);assert.ok(game.swap(...game.practiceMove));game.tick(game.now+100);assert.equal(events.findLast(e=>e.kind==='combo-trigger').type,type);assert.equal(events.findLast(e=>e.kind==='clear').points,count*10);settle(game);}
});
test('rapid seeded concurrent commands preserve lock ownership and tile identity after combos',()=>{
  const random=seeded(713);for(const mode of ['combo-lines','combo-cross','combo-column','combo-blasts'])for(let seed=0;seed<8;seed++){
    const{game,events}=setup();game.reset(mode);game.swap(...game.practiceMove);
    for(let step=0;step<100;step++){
      const candidates=legalMoves(game.board).filter(([a,b])=>game.canSwap(a,b));if(candidates.length)game.swap(...candidates[Math.floor(random()*candidates.length)]);
      game.tick(game.now+40);const tiles=game.board.filter(Boolean);assert.equal(new Set(tiles.map(t=>t.id)).size,tiles.length);
      for(const tx of game.transactions)for(const c of tx.columns)assert.equal(game.locks[c],tx.id);
    }settle(game);assert.equal(game.score,events.filter(e=>e.kind==='score').reduce((sum,e)=>sum+e.points,0));
  }
});
