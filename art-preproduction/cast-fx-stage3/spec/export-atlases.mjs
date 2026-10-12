import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {CARDS, CardBattle} from '../../../dist/cards.mjs';
import {MAPS} from '../../../dist/maps.mjs';

const require=createRequire(import.meta.url);
let sharp;
try {sharp=require('sharp');} catch {
  sharp=require('C:/Users/HT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const size=256,padding=16,content=size-padding*2;
const sourceLayouts=JSON.parse(await fs.readFile(path.join(root,'spec/source-layouts.json')));
const types={attack:{name:'进攻',palette:'红金',texture:'卷曲炽烈魔力、锐利碎光、冲击卷流'},control:{name:'控制',palette:'蓝紫',texture:'流动旋纹、交织弧带、晶光碎屑'},buff:{name:'强化',palette:'金青',texture:'祝福编织丝带、叶形能量、柔和星光'}};
const stages={
  activation:{name:'卡牌激活',sheet:'charge',offset:0,count:8,frameMs:30,loop:false,anchor:[128,128],drawSize:[144,208]},
  release:{name:'松手释放',sheet:'charge',offset:8,count:8,frameMs:25,loop:false,anchor:[128,128],drawSize:[164,184]},
  orb:{name:'魔法光团',sheet:'flight',offset:0,count:8,frameMs:40,loop:true,anchor:[128,128],drawSize:[102,102]},
  trail:{name:'飞行拖尾',sheet:'flight',offset:8,count:8,frameMs:40,loop:true,anchor:[220,128],drawSize:[190,140]},
  impact:{name:'命中与收尾',sheet:'impact',offset:0,count:16,frameMs:25,loop:false,anchor:[128,128],drawSize:[194,194]}
};
const manifest={version:1,date:'2026-10-12',status:'review-only',artBaseline:'../card-reference-v3/cards/',
  format:'RGBA PNG, lossless, straight alpha, sRGB',frameSize:[size,size],atlasColumns:4,nominalPadding:padding,
  frameOrder:'row-major; zero-based metadata; one-based PNG filenames',blendMode:'source-over',
  timeline:{activation:[0,240],release:[240,440],flight:[420,800],impact:[800,1200],skillHandoffMs:1000,completeMs:1200,releaseToEndMs:960,repeatGapMs:600},
  types,animations:{},sources:[],cards:[],maps:[],totals:{}};
const qa={scope:'new painted frames, alpha, atlas registration, frame ordering and resource sizes only',frames:[],sourceEdges:[],duplicates:[]};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function lightPivot(data,width,height,trail=false){
  let sum=0,sx=0,sy=0;
  for(let y=Math.floor(height*.25);y<height*.8;y++)for(let x=Math.floor(width*(trail?.64:.27));x<width*(trail?.98:.75);x++){
    const i=(y*width+x)*4,a=data[i+3]/255,l=(data[i]+data[i+1]+data[i+2])/3;
    const weight=Math.max(0,l-200)**4*a*a;sum+=weight;sx+=x*weight;sy+=y*weight;
  }
  return sum?{x:sx/sum,y:sy/sum}:{x:width*(trail?.85:.5),y:height*.5};
}
let atlasBytes=0,frameBytes=0,sourceBytes=0,runtimeBytes=0;
for(const [type,meta] of Object.entries(types)){
  manifest.animations[type]={};
  const contacts=[];
  let contactRow=0;
  for(const [stage,def] of Object.entries(stages)){
    const sourceFile=`sources/${type}-${def.sheet}.png`;
    const source=await sharp(path.join(root,sourceFile)).metadata();
    const layout=sourceLayouts[type+'-'+def.sheet];
    const xs=layout?layout.x.map(v=>Math.round(v*source.width/1254)):Array.from({length:5},(_,n)=>Math.round(n*source.width/4));
    const ys=layout?layout.y.map(v=>Math.round(v*source.height/1254)):Array.from({length:5},(_,n)=>Math.round(n*source.height/4));
    const phaseRows=[...new Set(Array.from({length:def.count},(_,n)=>Math.floor((def.offset+n)/4)))];
    let scale=content/Math.max(...xs.slice(1).map((v,n)=>v-xs[n]),...phaseRows.map(r=>ys[r+1]-ys[r]));
    const cells=[];
    for(let n=0;n<def.count;n++){
      const sourceIndex=def.offset+n,col=sourceIndex%4,row=Math.floor(sourceIndex/4);
      const left=xs[col],top=ys[row],width=xs[col+1]-left,height=ys[row+1]-top;
      const crop=await sharp(path.join(root,sourceFile)).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let pivot={x:width/2,y:height/2};
      if(stage==='orb'||stage==='trail')pivot=lightPivot(crop.data,width,height,stage==='trail');
      else if(stage==='impact')pivot={x:layout.centersX[col]*source.width/1254-left,y:layout.centersY[row]*source.height/1254-top};
      let minX=width,minY=height,maxX=-1,maxY=-1;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(crop.data[(y*width+x)*4+3]>2){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      // Use one scale for the whole phase, including its registered pivot.
      // Fit the painted bounds on both sides of the pivot with a clear gutter.
      if(maxX>=0)for(const [available,extent] of [[def.anchor[0]-8,pivot.x-minX],[size-8-def.anchor[0],maxX+1-pivot.x],[def.anchor[1]-8,pivot.y-minY],[size-8-def.anchor[1],maxY+1-pivot.y]])if(extent>0)scale=Math.min(scale,available/extent);
      cells.push({sourceIndex,left,top,width,height,crop,pivot});
    }
    if(!manifest.sources.some(s=>s.file===sourceFile)){
      const bytes=(await fs.stat(path.join(root,sourceFile))).size;
      manifest.sources.push({file:sourceFile,width:source.width,height:source.height,bytes,sha256:hash(await fs.readFile(path.join(root,sourceFile)))});sourceBytes+=bytes;
    }
    const composites=[],frames=[],seen=new Map();
    const label=Buffer.from(`<svg width="1024" height="24"><text x="8" y="18" font-family="sans-serif" font-size="14" fill="#ffe7bc">${xml(meta.name+' · '+def.name)}</text></svg>`);
    contacts.push({input:label,left:0,top:contactRow*154});
    let sequenceBytes=0,minimumGutterPx=size;
    for(let n=0;n<def.count;n++){
      const {sourceIndex,left,top,width,height,crop,pivot}=cells[n];
      // Export each newly painted source cell once. No interpolation, morphing,
      // hue conversion, synthetic intermediate frames, particles or blur layers.
      let edgeMax=0,edgeSum=0,edgeCount=0;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x<2||y<2||x>=width-2||y>=height-2){const a=crop.data[(y*width+x)*4+3];edgeMax=Math.max(edgeMax,a);edgeSum+=a;edgeCount++;}
      qa.sourceEdges.push({type,stage,frame:n+1,edgeMax,edgeMean:+(edgeSum/edgeCount).toFixed(2)});
      const rw=Math.round(width*scale),rh=Math.round(height*scale);
      const resized=await sharp(crop.data,{raw:{width,height,channels:4}}).resize(rw,rh,{kernel:'lanczos3'}).raw().toBuffer();
      const dx=Math.round(def.anchor[0]-pivot.x*rw/width),dy=Math.round(def.anchor[1]-pivot.y*rh/height),rgba=Buffer.alloc(size*size*4);
      let clippedAlpha=0;
      for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){
        const from=(y*rw+x)*4,a=resized[from+3];if(a<=2)continue;
        const tx=x+dx,ty=y+dy;if(tx<0||ty<0||tx>=size||ty>=size){clippedAlpha+=a;continue;}
        const to=(ty*size+tx)*4;resized.copy(rgba,to,from,from+4);
      }
      // The generated final cell contains only alpha=1 encoder noise. A clear
      // terminal frame guarantees independent one-shot playback leaves no residue.
      if(stage==='impact'&&n===15)rgba.fill(0);
      const png=await sharp(rgba,{raw:{width:size,height:size,channels:4}}).png({compressionLevel:9}).toBuffer();
      const file=`frames/${type}/${stage}/${String(n+1).padStart(3,'0')}.png`;
      await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),png);
      const x=(n%4)*size,y=Math.floor(n/4)*size;
      composites.push({rgba,left:x,top:y});
      const pixels=await sharp(png).raw().toBuffer();let visible=0,alphaSum=0,partial=0,minX=size,minY=size,maxX=-1,maxY=-1;
      for(let i=3;i<pixels.length;i+=4){const a=pixels[i];if(a>0){visible++;const p=(i-3)/4,x=p%size,y=Math.floor(p/size);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}if(a>0&&a<255)partial++;alphaSum+=a;}
      const contentBounds=maxX<0?null:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
      if(contentBounds)minimumGutterPx=Math.min(minimumGutterPx,minX,minY,size-1-maxX,size-1-maxY);
      const rgbaHash=hash(pixels),bytes=png.length;sequenceBytes+=bytes;
      if(seen.has(rgbaHash))qa.duplicates.push({type,stage,frames:[seen.get(rgbaHash),n+1]});else seen.set(rgbaHash,n+1);
      frames.push({index:n,order:n+1,file,rect:{x,y,w:size,h:size},contentBounds,durationMs:def.frameMs,anchorPx:def.anchor,terminal:stage==='impact'&&n===15,source:{file:sourceFile,index:sourceIndex,rect:{x:left,y:top,w:width,h:height},pivot,scale},bytes,sha256:hash(png)});
      qa.frames.push({type,stage,frame:n+1,visiblePixels:visible,partialAlphaPixels:partial,alphaSum,clippedAlpha,rgbaSha256:rgbaHash});
      contacts.push({input:await sharp(png).resize(128,128).png().toBuffer(),left:(n%8)*128,top:contactRow*154+26+Math.floor(n/8)*154});
    }
    const atlasFile=`atlases/${type}-${stage}.png`,atlasHeight=Math.ceil(def.count/4)*size;
    const atlasPixels=Buffer.alloc(4*size*atlasHeight*4);
    for(const item of composites)for(let y=0;y<size;y++)item.rgba.copy(atlasPixels,((item.top+y)*4*size+item.left)*4,y*size*4,(y+1)*size*4);
    const atlas=await sharp(atlasPixels,{raw:{width:4*size,height:atlasHeight,channels:4}}).png({compressionLevel:9}).toBuffer();
    await fs.writeFile(path.join(root,atlasFile),atlas);atlasBytes+=atlas.length;frameBytes+=sequenceBytes;
    const runtimeFile=atlasFile.replace('.png','.webp');
    const webp=await sharp(atlas).webp({quality:95,alphaQuality:100,effort:6}).toBuffer();
    await fs.writeFile(path.join(root,runtimeFile),webp);runtimeBytes+=webp.length;
    const drawSize=type==='control'&&stage==='trail'?[280,160]:def.drawSize;
    manifest.animations[type][stage]={name:def.name,atlas:atlasFile,runtimeAtlas:runtimeFile,runtimeBytes:webp.length,atlasSize:[1024,atlasHeight],atlasBytes:atlas.length,sequenceBytes,minimumGutterPx,frameSize:[size,size],frameCount:def.count,durationMs:def.count*def.frameMs,frameDurationMs:def.frameMs,fps:1000/def.frameMs,loop:def.loop,anchorPx:def.anchor,anchorNormalized:def.anchor.map(v=>v/size),recommendedDrawSize:drawSize,frames};
    contactRow+=Math.ceil(def.count/8);
  }
  const checker=Buffer.from(`<svg width="1024" height="${contactRow*154}"><defs><pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#172d40"/><path d="M0 0h16v16H0zM16 16h16v16H16z" fill="#223b50"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`);
  await sharp(checker).composite(contacts).png().toFile(path.join(root,`qa/${type}-contact.png`));
}
manifest.cards=CARDS.map(c=>({id:c.id,name:c.name,category:c.category,type:{red:'attack',blue:'control',yellow:'buff'}[c.color],target:c.target,file:`../card-reference-v3/cards/${c.id}.png`}));
for(const map of MAPS){
  const engine=()=>({width:8,height:8,ruleTerrain:map.terrain,frozenCells:new Set(),board:map.terrain.cells.map((cell,i)=>cell==='cell'?{type:i%5,id:i+1}:null),tile:type=>({type})});
  const engines={player:engine(),opponent:engine()};
  const deck=['fire','meteor','quake','bomb','freeze','blackhole'];
  const battle=new CardBattle({engines},{decks:{player:deck,opponent:deck},random:()=>0.61803398875});
  const resolvedRainbow=battle.pick(engines.player,1)[0];
  const plans={};
  for(const c of CARDS){
    const side=c.target==='self'?'player':'opponent';
    plans[c.id]=Array.from({length:64},(_,index)=>{
      const plan=battle.previewTarget(side,c.id,index);
      let visualLanding=plan.landing;
      if(c.id==='quake'&&plan.valid)visualLanding=plan.cells[Math.floor(plan.cells.length/2)];
      if(c.id==='rainbow'&&plan.valid)visualLanding=resolvedRainbow;
      return {...plan,visualLanding};
    });
  }
  const asset=s=>'../../dist/'+s.replace(/^\.\//,'');
  manifest.maps.push({id:map.id,name:map.name,terrain:[...map.terrain.cells],assets:Object.fromEntries(Object.entries(map.assets).filter(([,v])=>v).map(([k,v])=>[k,asset(v)])),plans,resolvedRainbow});
}
manifest.shared={tiles:'../../dist/assets/toy-atlas.svg',logo:'../../dist/assets/game-logo.svg'};
manifest.totals={paintedFrames:141,frameFiles:144,transparentTerminalFrames:3,atlases:15,sourceSheets:9,atlasBytes,runtimeBytes,sequenceBytes:frameBytes,sourceBytes,decodedAtlasBytes:36*1024*1024};
await fs.writeFile(path.join(root,'spec/manifest.json'),JSON.stringify(manifest,null,2));
await fs.writeFile(path.join(root,'preview-data.js'),'window.CAST_FX_MANIFEST='+JSON.stringify(manifest)+';\n');
await fs.writeFile(path.join(root,'qa/assets.json'),JSON.stringify(qa,null,2));
console.log(JSON.stringify({root,totals:manifest.totals,duplicates:qa.duplicates.length,worstSourceEdgeMean:Math.max(...qa.sourceEdges.map(e=>e.edgeMean))},null,2));
