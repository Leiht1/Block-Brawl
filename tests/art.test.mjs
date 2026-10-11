import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {THEME,applyTheme} from '../dist/theme.mjs';
import {createArtAssets} from '../dist/art.mjs';
import {MAPS} from '../dist/maps.mjs';

test('late map loads cannot replace the current material and returning home reuses the original atlas',()=>{
  const a=assets();a.load();const atlas=a.images[0],forest=a.images[1];
  a.art.setMap(MAPS[1]);const cliff=a.images[2];a.art.setMap(MAPS[2]);const ice=a.images[4];
  cliff.complete=true;cliff.naturalWidth=512;cliff.onload();assert.equal(a.art.board(a.ctx,480),false);
  ice.complete=true;ice.naturalWidth=512;ice.onload();a.art.board(a.ctx,480);assert.equal(a.draws.at(-2)[0],ice);
  a.art.setMap(null);a.art.board(a.ctx,480);assert.equal(a.draws.at(-2)[0],forest);
  a.art.tile(a.ctx,{type:2,special:'bomb'},60);assert.equal(a.draws.at(-2)[0],atlas);assert.equal(a.art.obstacle(a.ctx,60),false);
});

function assets(theme=THEME){
  const images=[],canvases=[],draws=[];
  const art=createArtAssets({theme,makeImage:()=>{const image={complete:false,naturalWidth:0};images.push(image);return image;},makeCanvas:()=>{const canvas={getContext:()=>({drawImage:(...args)=>draws.push(args)})};canvases.push(canvas);return canvas;}});
  const ctx={drawImage:(...args)=>draws.push(args)};
  return{art,images,canvases,draws,ctx,load:()=>images.forEach(image=>{image.complete=true;image.naturalWidth=640;image.onload();})};
}
test('delayed and failed SVG loads stay renderable and a later load invalidates stale caches',()=>{
  const a=assets();assert.equal(a.art.tile(a.ctx,{type:0},60),false);assert.equal(a.art.board(a.ctx,480),false);
  a.images[0].onerror();assert.equal(a.art.snapshot().failed,1);assert.equal(a.art.tile(a.ctx,{type:0},60),false);
  a.load();assert.equal(a.art.snapshot().ready,2);assert.equal(a.art.tile(a.ctx,{type:0},60),true);
  assert.equal(a.art.snapshot().cached,1);a.images[0].onload();assert.equal(a.art.snapshot().cached,0);
});
test('every color and special uses its own atlas crop, cached across animated scales',()=>{
  const a=assets();a.load();
  for(let row=0;row<4;row++)for(let type=0;type<5;type++){
    const tile={type,special:row?THEME.tile.variants[row]:null};
    a.art.tile(a.ctx,tile,58,2);
    assert.deepEqual(a.draws.at(-2).slice(1,5),[type*128,row*128,128,128]);
  }
  assert.equal(a.canvases.length,20);a.art.tile(a.ctx,{type:0},58,2);assert.equal(a.canvases.length,20);
  a.art.tile(a.ctx,{type:0},58,1);assert.equal(a.canvases.at(-1).width,58);
  a.art.invalidate();assert.equal(a.art.snapshot().cached,0);
});
test('board raster is reused per resolution and keeps a square retina destination',()=>{
  const a=assets();a.load();a.art.board(a.ctx,338,2);assert.equal(a.canvases[0].width,676);assert.equal(a.canvases[0].height,676);
  a.art.board(a.ctx,338,2);assert.equal(a.canvases.length,1);assert.deepEqual(a.draws.at(-1).slice(1),[0,0,338,338]);
  a.art.board(a.ctx,480,1);assert.equal(a.canvases.length,2);
});
test('theme replacement supplies both canvas sources and CSS assets without engine dependencies',()=>{
  const theme={...THEME,assets:{...THEME.assets,atlas:'./custom/tiles.svg',board:'./custom/board.svg'}};
  const a=assets(theme);assert.equal(a.images[0].src,theme.assets.atlas);assert.equal(a.images[1].src,theme.assets.board);
  const css=new Map();applyTheme({documentElement:{style:{setProperty:(key,value)=>css.set(key,value)}}});
  assert.equal(css.get('--art-atlas'),`url("${THEME.assets.atlas}")`);
  assert.ok(!fs.readFileSync(new URL('../dist/engine.mjs',import.meta.url),'utf8').includes('theme.mjs'));
});
test('static theme resources exist, have no external SVG dependencies and fit the scenery download budget',()=>{
  let total=0;
  for(const path of Object.values(THEME.assets)){const bytes=fs.readFileSync(new URL('../dist/'+path,import.meta.url));total+=bytes.length;if(path.endsWith('.webp')){assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}else{const data=bytes.toString();assert.match(data,/<svg/);assert.doesNotMatch(data,/(?:(?:href|src)="(?:https?:|data:)|<script|<foreignObject|<image\b)/);}}
  assert.ok(total<600000,`theme resources ${total} bytes`);
});
