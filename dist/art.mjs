import {THEME} from './theme.mjs';
// One decoded atlas; tiles and board are raster-cached at the viewport DPR.
// Missing resources use the same theme, never block engine or input.
export function createArtAssets({makeImage=()=>new Image(),makeCanvas=()=>document.createElement('canvas'),theme=THEME}={}){
  const images={},cache=new Map(),sources=new Map();let ready=0,failed=0,mapId='forest';
  for(const key of ['atlas','board']){
    const img=makeImage();images[key]=img;img.onload=()=>{ready++;cache.clear();};img.onerror=()=>{failed++;};img.src=theme.assets[key];sources.set(theme.assets[key],img);
  }
  function surface(key,size,paint){
    const fullKey=key+':'+size;if(cache.has(fullKey))return cache.get(fullKey);
    const canvas=makeCanvas();canvas.width=canvas.height=size;paint(canvas.getContext('2d'),size);cache.set(fullKey,canvas);return canvas;
  }
  return{
    theme,
    setMap(map){
      const assets=map?.assets||theme.assets;mapId=map?.id||'forest';
      for(const key of ['board','obstacle']){
        const url=assets[key];if(!url){images[key]=null;continue;}
        let img=sources.get(url);if(!img){img=makeImage();img.onload=()=>{ready++;cache.clear();};img.onerror=()=>{failed++;};img.src=url;sources.set(url,img);}images[key]=img;
      }
      cache.clear();
    },
    snapshot:()=>({ready,failed,cached:cache.size}),
    invalidate:()=>cache.clear(),
    tile(ctx,tile,size,dpr=1){
      const source=images.atlas;if(!source.complete||!source.naturalWidth)return false;
      const row=Math.max(0,theme.tile.variants.indexOf(tile.special||'normal')),unit=theme.tile.sourceSize;
      const raster=Math.max(32,Math.min(256,Math.ceil(size*dpr)));
      const sprite=surface(`tile:${tile.type}:${row}`,raster,(c,s)=>c.drawImage(source,tile.type*unit,row*unit,unit,unit,0,0,s,s));
      ctx.drawImage(sprite,-size/2,-size/2,size,size);return true;
    },
    obstacle(ctx,size,dpr=1){
      const source=images.obstacle;if(!source?.complete||!source.naturalWidth)return false;
      const raster=Math.ceil(size*dpr),sprite=surface('obstacle:'+mapId,raster,(c,s)=>c.drawImage(source,0,0,s,s));ctx.drawImage(sprite,-size/2,-size/2,size,size);return true;
    },
    board(ctx,width,dpr=1){
      const source=images.board;if(!source.complete||!source.naturalWidth)return false;
      const raster=Math.ceil(width*dpr),board=surface('board:'+mapId,raster,(c,s)=>c.drawImage(source,0,0,s,s));ctx.drawImage(board,0,0,width,width);return true;
    }
  };
}
