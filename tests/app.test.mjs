import {TEST_TERRAINS,STANDARD_TERRAIN} from '../dist/terrain.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MatchEngine,seeded,TIMING} from '../dist/engine.mjs';
import {THEME,applyTheme} from '../dist/theme.mjs';
import {createArtAssets} from '../dist/art.mjs';
import {createBoardPainter} from '../dist/board-painter.mjs';
import {MapEventPresentation,mapMotion} from '../dist/map-presentation.mjs';
import {audio} from '../dist/audio-manager.mjs';
import {createAudioEvents} from '../dist/audio-events.mjs';

const clearEnd=mode=>TIMING.swap+(mode?.startsWith('combo-')?TIMING.comboClear:TIMING.clear);
// Run the actual presentation code with a controlled frame clock and Canvas.
function presentation(reduced=false,{loaded=false,width=480,dpr=1}={}){
  let now=0,raf;const elements=new Map();
  const ctx=new Proxy({}, {get:(o,key)=>key in o?o[key]:['createLinearGradient','createRadialGradient'].includes(key)?()=>({addColorStop(){}}):()=>{}});
  const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',classList:{add(){},remove(){},toggle(){}},handlers:{},addEventListener(kind,fn){this.handlers[kind]=fn;},setAttribute(){},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width}),focus(){},setPointerCapture(){},hasPointerCapture:()=>false});return elements.get(id);};
  const buttons=['free','three','four','five','t-five','l-five','chain','row','column','blast','edge','special-chain','combo-lines','combo-cross','combo-column','combo-blasts'].map(mode=>({...element(mode),dataset:{mode}}));
  const sandbox={console,Math,TEST_TERRAINS,STANDARD_TERRAIN,THEME,applyTheme,MapEventPresentation,mapMotion,createMapScene:()=>({draw(){},reset(){}}),createBoardPainter,createOpponentView:()=>null,createGameFlow:()=>null,createArtAssets:()=>createArtAssets({makeImage:()=>({complete:loaded,naturalWidth:loaded?640:0}),makeCanvas:()=>({getContext:()=>ctx})}),performance:{now:()=>now},matchMedia:()=>({matches:reduced}),devicePixelRatio:dpr,ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>{raf=fn;},document:{getElementById:element,querySelectorAll:selector=>selector==='[data-terrain]'?[]:buttons,addEventListener(){}},window:{},MatchEngine:class extends MatchEngine{constructor(options){super({...options,random:seeded(9)});}}};
  Object.assign(sandbox,{audio,createAudioEvents});
  const context=vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''),context);
  return{read:code=>vm.runInContext(code,context),frame:t=>{now=t;raf(t);},mode:mode=>buttons.find(b=>b.dataset.mode===mode).handlers.click(),element, snapshot:()=>sandbox.window.blockBrawl.snapshot()};
}
test('audio integration forwards actual presentation events without synthesized sound',()=>{
  const p=presentation(),original=audio.play,calls=[];
  audio.play=id=>{calls.push(id);return false;};
  try{
    p.mode('four');p.read('engine.swap(...engine.practiceMove)');p.frame(100);
    assert.ok(calls.includes('block.swap'));assert.ok(calls.includes('block.match3'));assert.ok(calls.includes('special.create'));
    calls.length=0;p.mode('blast');p.read('engine.swap(...engine.practiceMove)');p.frame(200);assert.ok(calls.includes('special.bomb'));
    calls.length=0;p.mode('combo-lines');p.read('engine.swap(...engine.practiceMove)');p.frame(300);assert.ok(calls.includes('special.combo'));
    assert.equal(p.read('typeof tone'), 'undefined');assert.equal(p.read('typeof mechanismTone'),'undefined');
  }finally{audio.play=original;audio.stopAll();}
});

test('negative refill coordinates stay centered above their own columns',()=>{
  const p=presentation();for(let index=-64;index<0;index++){const v=p.read(`xy(${index})`);assert.equal(v.x,(((index%8)+8)%8+.5)*60);assert.ok(v.y<0);}
});
test('shared white score feedback grows with earned points and stays inside the board',()=>{
  const p=presentation();p.frame(0);
  p.read(`var scorePaints=[];ctx.fillText=(text,x,y)=>scorePaints.push({text,x,y,color:ctx.fillStyle,font:ctx.font});
    for(const points of [30,60,150,250,1000])painter.drawScoreFloat({text:'+'+points,points,x:30,y:180},.2);`);
  const paints=p.read('scorePaints'),sizes=Array.from(paints,r=>Number(r.font.split(' ')[1].slice(0,-2)));
  assert.ok(paints.every(r=>r.color==='#ffffff'));
  for(let i=1;i<sizes.length;i++)assert.ok(sizes[i]>sizes[i-1]);
  assert.ok(paints.every(r=>r.x>0&&r.x<480));
});
test('actual refill animation preserves order and spacing in parallel columns within 250ms',()=>{
  const p=presentation();p.mode('blast');p.read('engine.swap(...engine.practiceMove)');p.frame(100);p.frame(clearEnd(p.snapshot().mode));
  assert.equal(p.read('motions.size>0'),true);
  for(let time=clearEnd('blast');time<=clearEnd('blast')+TIMING.fall;time+=5){p.frame(time);const tiles=p.read(`engine.board.filter(Boolean).map(t=>{const m=motions.get(t.id);if(!m)return null;const progress=Math.max(0,Math.min(1,(${time}-m.start)/m.duration));const f=Math.min(1,progress/.78)**2;return {x:m.from.x+(m.to.x-m.from.x)*f,y:m.from.y+(m.to.y-m.from.y)*f,end:m.start+m.duration};}).filter(Boolean)`);
    for(const tile of tiles)assert.equal(tile.end,clearEnd('blast')+TIMING.fall);
    for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)if(tiles[i].x===tiles[j].x)assert.ok(Math.abs(tiles[i].y-tiles[j].y)>=60*.84,`overlap at ${time}`);
  }
  assert.equal(p.read('engine.transactions.some(tx=>tx.id===1)'),false);
});
test('creation, chained trigger and motion effects expire and restart clears every visual',()=>{
  const p=presentation();p.mode('four');p.read('engine.swap(...engine.practiceMove)');p.frame(100);assert.equal(p.read('formations.length'),1);
  p.mode('special-chain');assert.equal(p.snapshot().animations,0);p.read('engine.swap(...engine.practiceMove)');p.frame(200);assert.equal(p.read('effects.length'),3);
  for(let time=250;time<=5000;time+=50)p.frame(time);
  assert.equal(p.snapshot().animations,0);assert.equal(p.read('particles.length+rings.length+floats.length'),0);
  p.mode('blast');p.read('engine.swap(...engine.practiceMove)');p.frame(5100);p.mode('four');assert.equal(p.snapshot().animations,0);assert.equal(p.read('particles.length+rings.length+floats.length'),0);
});
test('reduced-motion presentation completes special effects without errors or leftovers',()=>{
  const p=presentation(true);p.mode('edge');p.read('engine.swap(...engine.practiceMove)');for(let time=100;time<=3000;time+=50)p.frame(time);
  assert.equal(p.snapshot().animations,0);assert.equal(p.snapshot().transactions,0);assert.ok(p.snapshot().score>=60);
});
for(const mode of ['combo-lines','combo-cross','combo-column','combo-blasts'])for(const reduced of [false,true])test(`${mode} ${reduced?'reduced':'normal'} presentation charges, clears tiles immediately and expires before refill`,()=>{
  const p=presentation(reduced);p.mode(mode);p.read('var consumedIds=engine.practiceMove.map(i=>engine.board[i].id); var drawnIds=[]; var drawTile=tile; tile=(t,...args)=>{drawnIds.push(t.id);drawTile(t,...args);}; engine.swap(...engine.practiceMove)');
  p.frame(50);assert.equal(p.read('charges.length'),1);assert.equal(p.read('combos.length'),0);
  p.read('drawnIds=[]');p.frame(100);assert.equal(p.read('charges.length'),0);assert.equal(p.read('combos.length'),1);
  assert.equal(p.read('drawnIds.some(id=>consumedIds.includes(id))'),false);assert.equal(p.read('ghosts.length'),0);assert.equal(p.read('consumedIds.some(id=>motions.has(id))'),false);
  p.frame(TIMING.swap+160);assert.equal(p.read('combos.length'),1);assert.equal(p.read('engine.transactions[0].phase'),'clear');
  p.frame(clearEnd(p.snapshot().mode));assert.equal(p.read('combos.length'),0);assert.equal(p.read('charges.length'),0);
  assert.ok(p.read('[...motions.values()].every(m=>m.from.x===m.to.x&&m.from.y<m.to.y)'));
  for(let time=clearEnd(mode)+50;time<=6000;time+=50)p.frame(time);assert.equal(p.snapshot().animations,0);assert.equal(p.read('particles.length+rings.length+floats.length'),0);
});
test('conflicted combo cancels charge with no lingering combo visuals',()=>{
  const p=presentation();p.mode('combo-blasts');p.read('engine.swap(...engine.practiceMove);engine.swap(1,9)');p.frame(50);assert.equal(p.read('charges.length'),1);
  p.frame(100);assert.equal(p.read('charges.length+combos.length'),0);assert.equal(p.snapshot().score,0);p.frame(190);assert.equal(p.snapshot().animations,0);
});
test('restart during combo charge or detonation cancels every visual and score',()=>{
  const p=presentation();p.mode('combo-cross');p.read('engine.swap(...engine.practiceMove)');p.frame(50);p.mode('combo-cross');assert.equal(p.snapshot().animations,0);
  p.read('engine.swap(...engine.practiceMove)');p.frame(150);assert.equal(p.read('combos.length'),1);p.mode('combo-blasts');assert.equal(p.snapshot().animations,0);assert.equal(p.snapshot().score,0);assert.equal(p.read('particles.length+rings.length+floats.length'),0);
});
for(const [mode,axis,count] of [['row','row',1],['column','column',1],['combo-cross','row',3],['combo-column','column',3]])test(`${mode} renders only its affected beam direction and clears on time`,()=>{
  const p=presentation();p.mode(mode);p.read('var beamCalls=[];var actualBeam=painter.drawBeam;painter.drawBeam=(p,axis,...args)=>{beamCalls.push(axis);actualBeam(p,axis,...args);};engine.swap(...engine.practiceMove)');p.frame(100);p.read('beamCalls=[]');p.frame(150);
  assert.equal(p.read('beamCalls.length'),count);assert.ok(p.read(`beamCalls.every(axis=>axis==='${axis}')`));
  p.read('beamCalls=[]');p.frame(clearEnd(p.snapshot().mode));assert.equal(p.read('beamCalls.length'),0);
});

for(const reduced of [false,true])test(`loaded art renders all fixtures at mobile retina size (${reduced?'reduced':'normal'}) without residual animations`,()=>{
  for(const mode of ['three','four','five','t-five','l-five','chain','row','column','blast','edge','special-chain','combo-lines','combo-cross','combo-column','combo-blasts']){
    const p=presentation(reduced,{loaded:true,width:338,dpr:3});
    assert.equal(p.read('canvas.width'),676);assert.equal(p.read('cell'),338/8);
    p.mode(mode);p.read('engine.swap(...engine.practiceMove)');for(let time=0;time<=6000;time+=50)p.frame(time);
    assert.equal(p.snapshot().animations,0,mode);assert.equal(p.snapshot().transactions,0,mode);assert.equal(p.read('particles.length+rings.length+floats.length'),0,mode);
    assert.ok(p.snapshot().art.cached<=21);
  }
});
test('exchange stretch follows its axis, landing recovers within the existing timing and reduced motion disables both',()=>{
  for(const reduced of [false,true])for(const axis of ['row','column']){
    const p=presentation(reduced,{loaded:true});p.read(`engine.swap(0,${axis==='row'?1:8});var stretches=[];var originalTile=tile;tile=(...args)=>{stretches.push(args);originalTile(...args);};`);p.frame(50);
    const drawn=p.read('stretches.filter(a=>a[6]||a[7])');assert.equal(drawn.length,reduced?0:2);
    if(!reduced)for(const a of drawn){assert.ok(a[axis==='row'?6:7]>0);assert.ok(a[axis==='row'?7:6]<0);}
    p.frame(100);p.frame(190);assert.equal(p.read('motions.size'),0);
    const landing=presentation(reduced,{loaded:true});landing.mode('blast');landing.read('engine.swap(...engine.practiceMove);var stretches=[];var originalTile=tile;tile=(...args)=>{stretches.push(args);originalTile(...args);};');landing.frame(100);landing.frame(clearEnd('blast'));landing.read('stretches=[]');landing.frame(clearEnd('blast')+TIMING.fall-40);
    assert.equal(landing.read('stretches.some(a=>Math.abs(a[5]||0)>0)'),!reduced);
    landing.frame(clearEnd('blast')+TIMING.fall);assert.equal(landing.read('motions.size'),0);
  }
});
test('touch pointers use the original grid threshold, capture and cancel across a narrow board',()=>{
  const p=presentation(false,{loaded:true,width:338,dpr:2});p.mode('combo-column');
  const [a,b]=p.read('[...engine.practiceMove]'),cell=338/8,board=p.element('board');
  const event=(index,id=7)=>({pointerId:id,pointerType:'touch',button:0,clientX:(index%8+.5)*cell,clientY:(Math.floor(index/8)+.5)*cell,preventDefault(){}});
  board.handlers.pointerdown(event(a));board.handlers.pointermove({...event(a),clientX:event(a).clientX+cell*.21});assert.equal(p.snapshot().transactions,0);
  board.handlers.pointercancel();assert.equal(p.read('drag'),null);
  board.handlers.pointerdown(event(a));board.handlers.pointermove(event(b));assert.equal(p.snapshot().transactions,1);assert.equal(p.read('drag'),null);
  p.frame(100);assert.equal(p.snapshot().score,240);assert.equal(p.read('combos.length'),1);
});
test('dense overlapping visual events have bounded particles and restart immediately removes them',()=>{
  const p=presentation(false,{loaded:true});p.read(`for(let i=0;i<20;i++)onEvent({kind:'clear',time:0,duration:160,depth:1,strength:5,points:0,tiles:engine.board.map((tile,index)=>({tile,index}))});`);
  assert.equal(p.read('particles.length'),THEME.effects.particleLimit);assert.equal(p.read('rings.length'),THEME.effects.ringLimit);
  p.frame(10);p.mode('four');assert.equal(p.read('particles.length+rings.length+ghosts.length'),0);
});

test('special fragments follow beam travel, preserve earlier overlap hits and expire independently of gravity',()=>{
  const p=presentation();p.mode('row');p.read('engine.swap(...engine.practiceMove)');p.frame(100);
  const delay=p.read(`effects[0].cells.map(index=>({index,start:particles.find(p=>p.index===index).start,expected:100+impactDelay(effects[0],index)}))`);
  for(const d of delay){assert.equal(d.start,d.expected);assert.ok(d.start>=100&&d.start<clearEnd('row'));}
  assert.ok(new Set(delay.map(d=>d.start)).size>2);
  const before=p.read('particles.map(p=>p.start)');p.read('scheduleImpact({...effects[0],time:100},36)');assert.deepEqual(p.read('particles.map(p=>p.start)'),before);
  p.frame(clearEnd(p.snapshot().mode));assert.equal(p.read('effects.length'),0);assert.ok(p.read('motions.size>0'));assert.ok(p.read('particles.length>0'));
});

test('blast light masks use precisely the rule cells, including edge clipping and the large combo',()=>{
  for(const mode of ['blast','edge','combo-blasts']){
    const p=presentation();p.mode(mode);p.read(`engine.swap(...engine.practiceMove);var masks=[];var mask=painter.clipCells;painter.clipCells=cells=>{masks.push([...cells]);mask(cells);};`);p.frame(100);p.read('masks=[]');p.frame(150);
    const actual=p.read('masks'),expected=p.read('mode==="combo-blasts"?combos[0].cells:effects[0].cells');
    assert.equal(actual.length,1);assert.deepEqual(Array.from(actual[0]),Array.from(expected));assert.equal(expected.length,mode==='edge'?6:mode==='blast'?13:25);
    p.frame(clearEnd(p.snapshot().mode));assert.equal(p.read('effects.length+combos.length'),0);
  }
});

test('staggered chained effects share the original clear deadline and reduced motion removes impact travel',()=>{
  for(const reduced of [false,true]){
    const p=presentation(reduced);p.mode('special-chain');p.read('engine.swap(...engine.practiceMove)');p.frame(100);
    assert.ok(p.read('effects.every(e=>e.start+e.duration===engine.transactions[0].end)'));
    if(reduced)assert.ok(p.read('particles.every(p=>p.start===100)'));
    p.frame(clearEnd(p.snapshot().mode));assert.equal(p.read('effects.length'),0);
  }
});

test('variable player grid uses real dimensions and ignores hole input',()=>{
  const p=presentation();p.read("engine.reset('free',{width:7,height:9,cells:Array.from({length:63},(_,i)=>i===6?'hole':'cell')});resize();");p.frame(0);
  assert.equal(p.read('cell'),480/7);assert.equal(p.read('height'),480/7*9);
  const point=p.read('point({clientX:cell*6.5,clientY:cell*.5})');assert.equal(point.index,6);
  p.element('board').handlers.pointerdown({clientX:point.x,clientY:point.y,button:0,pointerId:1,preventDefault(){}});assert.equal(p.read('drag'),null);
  const last=p.read('xy(62)');assert.equal(last.x,(6.5)*480/7);assert.equal(last.y,8.5*480/7);
});
test('obstacle-segment refill animation clips above its inlet and retains the 250ms deadline',()=>{
  const p=presentation();p.read("engine.reset('free',{width:9,height:8,cells:Array.from({length:72},(_,i)=>[20,29,47].includes(i)?'obstacle':'cell')});resize();engine.board[38]=null;engine.board[56]=null;engine.advance({id:1,phase:'clear',columns:[2],depth:1});var clips=[];painter.clipSegment=top=>clips.push(top);");
  p.frame(20);assert.ok(p.read('clips.some(top=>top>0)'));
  assert.ok(p.read('Array.from(motions.values()).every(m=>m.start+m.duration===250)'));
  assert.ok(p.read('engine.board[20]===null&&engine.board[29]===null&&engine.board[47]===null'));
  p.frame(250);assert.equal(p.read('motions.size'),0);
});
