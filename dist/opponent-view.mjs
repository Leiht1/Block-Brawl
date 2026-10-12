import {THEME} from './theme.mjs';
import {createArtAssets} from './art.mjs';
import {createBoardPainter} from './board-painter.mjs';
import {MapEventPresentation,mapMotion} from './map-presentation.mjs';

// A read-only view: real engine events, same painters and deadlines, fewer
// decorative particles. No commands, scoring or strategy live here.
export function createOpponentView(canvas,reduced=false){
  const ctx=canvas.getContext('2d'),art=createArtAssets(),painter=createBoardPainter({ctx,art,reduced});
  const presentation=new MapEventPresentation();
  let columns=8,map=null,rockVisual=null,rockRestores=[],shake=0;
  let motions=new Map(),ghosts=[],effects=[],formations=[],charges=[],floats=[],size=0;
  const xy=(i,cell)=>({x:(((i%columns)+columns)%columns+.5)*cell,y:(Math.floor(i/columns)+.5)*cell});
  function reset(){presentation.reset();shake=0;rockVisual=null;rockRestores=[];motions.clear();ghosts=[];effects=[];formations=[];charges=[];floats=[];}
  return {
    reset,
    setMap(next){map=next;art.setMap(next);reset();},
    event(e){
      presentation.event(e);
      if(['rock-warning','rock-fall','map-warning','map-fall','map-spread-warning'].includes(e.kind)){
        if(['rockfall','mechanism'].includes(e.type)&&e.cells&&e.index!==e.cells[0])return;
    const phase=e.kind==='map-spread-warning'?'spread-warning':e.kind.endsWith('warning')?'warning':'fall';
        rockVisual=(rockVisual||[]).filter(v=>v.index!==e.index);rockVisual.push({phase,index:e.index,cells:e.cells,type:e.type||'rockfall',art:e.art,tiles:e.tiles,start:e.time,duration:e.duration});
      }
      if(['rock-blocked','rock-cancel','map-blocked','map-cancel','map-spread-cancel'].includes(e.kind))rockVisual=(rockVisual||[]).filter(v=>v.index!==e.index);
      if(['rock-restored','map-restored'].includes(e.kind)&&(!e.cells||e.index===e.cells[0]))rockRestores.push({phase:'restore',index:e.index,cells:e.cells,reason:e.reason,type:e.type||'rockfall',art:e.art,tiles:e.tiles,start:e.time,duration:e.duration});
      if(['rock-blocked','map-blocked'].includes(e.kind)&&e.type==='rockfall'&&(!e.cells||e.index===e.cells[0]))rockRestores.push({phase:'impact',index:e.index,cells:e.cells,type:e.type||'rockfall',art:e.art,start:e.time,duration:650});
      if(e.kind==='reset'||e.kind==='reshuffle'){reset();return;}
      if(['swap','revert','fall'].includes(e.kind)||e.kind==='card-change'&&e.moves)for(const m of e.moves)motions.set(m.tile.id,{...m,start:e.time,duration:e.duration,fall:e.kind==='fall'});
      if(e.kind==='swap'&&e.combo)charges.push({...e.combo,sources:e.moves.map(m=>m.from),start:e.time,duration:e.duration});
      if(e.kind==='revert')charges=[];
      if(e.kind==='clear'){
        for(const t of e.tiles){motions.delete(t.tile.id);if(!e.comboType)ghosts.push({...t,start:e.time,duration:e.duration});}
        if(e.points>0)floats.push({text:`+${e.points}`,points:e.points,start:e.time});
      }
      if(e.kind==='special-create')formations.push({...e,start:e.time});
      if(e.kind==='special-trigger'){motions.delete(e.tile.id);effects.push({...e,start:e.time,combo:false});}
      if(e.kind==='combo-trigger'){charges=[];effects.push({...e,start:e.time,combo:true});}
    },
    draw(engine,now){
      columns=engine.width;
      const width=canvas.getBoundingClientRect().width||240,cell=width/columns,height=cell*engine.height,pixelRatio=Math.min(devicePixelRatio||1,2);
      if(size!==width*pixelRatio||canvas.height!==Math.round(height*pixelRatio)){size=width*pixelRatio;canvas.width=Math.round(size);canvas.height=Math.round(height*pixelRatio);if(canvas.style)canvas.style.height=height+'px';ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);art.invalidate();}
      painter.configure({width,cell,pixelRatio,visualNow:now,formations,terrain:engine.terrain,map});
      canvas.classList.toggle('terrain-outline',engine.terrain.cells.includes('hole'));
      ctx.clearRect(0,0,width,height);ctx.save();if(shake>.2){ctx.translate(Math.sin(now*.08)*shake,Math.cos(now*.07)*shake*.5);shake*=.83;}
      const cue=presentation.at(now),motion=mapMotion(cue,now,reduced);ctx.translate(motion.board,motion.board*.35);painter.drawTerrain(engine.terrain);
      painter.drawMapSurface(now,cue);
      painter.drawMechanism(cue);
      engine.board.forEach((t,i)=>{if(cue?.type==='mechanism'&&cue.phase==='fall'&&cue.cells.includes(i))return;
        if(!t)return;let p=xy(i,cell),m=motions.get(t.id),squash=0;
        if(m){const progress=Math.max(0,Math.min(1,(now-m.start)/m.duration));
          let f=1-(1-progress)**3;
          if(m.fall&&!reduced){f=Math.min(1,progress/.78)**2;if(progress>=.78)squash=Math.sin((progress-.78)/.22*Math.PI*2)*THEME.motion.landingSquash;}
          const from=xy(m.from,cell),to=xy(m.to,cell);p={x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f};if(m.control!==undefined&&!reduced){const c=xy(m.control,cell),s=1-f;p={x:s*s*from.x+2*s*f*c.x+f*f*to.x,y:s*s*from.y+2*s*f*c.y+f*f*to.y};}if(progress>=1)motions.delete(t.id);
        }
        ctx.save();if(m?.segmentTop!==undefined)painter.clipSegment(m.segmentTop);painter.tile(t,p.x,p.y,1,1,squash);ctx.restore();
      });
      ghosts=ghosts.filter(g=>{const t=(now-g.start)/g.duration;if(t>=1)return false;const p=xy(g.index,cell);painter.tile(g.tile,p.x,p.y,reduced?1:1+Math.sin(t*Math.PI)*THEME.motion.clearPop,(1-t)**1.8);return true;});
      for(const [list,paint] of [[charges,painter.drawCharge],[formations,painter.drawFormation],[effects,(e,t)=>e.combo?painter.drawCombo(e,t):painter.drawSpecial(e,t)]]){
        for(const e of list){const t=(now-e.start)/e.duration;if(t>=0&&t<1)paint(e,t);}
      }
      charges=charges.filter(e=>now<e.start+e.duration);formations=formations.filter(e=>now<e.start+e.duration);effects=effects.filter(e=>now<e.start+e.duration);
      painter.drawTemporaryBlocks(engine.temporaryBlocks);painter.drawFrozenCells(engine.frozenCells,now);
      painter.drawBoardAtmosphere(cue,now);
      (rockVisual||[]).forEach(e=>painter.drawEnvironment(e,now));
      rockRestores=rockRestores.filter(e=>now<e.start+e.duration);rockRestores.forEach(e=>painter.drawEnvironment(e,now));
      floats=floats.filter(f=>{const t=(now-f.start)/750;if(t>=1)return false;painter.drawScoreFloat({...f,x:width/2,y:height/2},t);return true;});
      ctx.restore();
    },
    cue:now=>presentation.at(now),
    snapshot:()=>({motions:motions.size,effects:effects.length,ghosts:ghosts.length,formations:formations.length,charges:charges.length})
  };
}
