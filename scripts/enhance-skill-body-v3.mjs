import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const base=path.join(root,'art-preproduction/skill-body-soft-v1');
const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest-v2.json'),'utf8'));
const recipes={
 fire:{tone:[226,93,20],blend:.55,saturation:1.28,alphaGain:2.3,render:{main:1,state:.65,mark:.9,markColor:'#b84d16',settle:.75}},
 blackhole:{tone:[56,65,162],blend:.62,saturation:1.3,alphaGain:2.4,render:{main:1,trail:.85,trailColor:'#3b61a2'}},
 luck:{tone:[189,118,15],blend:.65,saturation:1.32,alphaGain:2.3,render:{main:1,state:.94,speck:.68}}
};
const byte=v=>Math.max(0,Math.min(255,Math.round(v)));
async function color(from,to,r){const {data,info}=await sharp(path.join(base,from)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),out=Buffer.from(data);
 for(let p=0;p<data.length;p+=4){if(!data[p+3])continue;const rgb=r.tone.map((tone,c)=>data[p+c]*(1-r.blend)+tone*r.blend),l=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  for(let c=0;c<3;c++)out[p+c]=byte((l+(rgb[c]-l)*r.saturation-127.5)*1.08+127.5);out[p+3]=byte(data[p+3]*r.alphaGain);}
 await sharp(out,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(path.join(base,to));}
for(const id of ['fire','blackhole','luck']){
 const e=manifest.entries[id],r=recipes[id],a=e.alias;e.previousAssets={version:2,reviewPath:e.reviewPath,frames:[...e.frames],renderAlpha:e.renderAlpha,presentation:e.presentation??null};
 const priorOriginal=`assets/atlas_${a}_soft_v1_preview.png`,atlas=`assets/atlas_${a}_soft_v3_preview.png`,frames=[];
 await color(priorOriginal,atlas,r);for(let n=1;n<=8;n++){const old=`assets/effect_${a}_soft_v1_preview_${String(n).padStart(2,'0')}.png`,next=old.replace('_v1_','_v3_');await color(old,next,r);frames.push(next);}
 const source=`source/effect_${a}_soft_v3_preview.png`;await color(e.source,source,r);
 Object.assign(e,{version:3,reviewPath:atlas,frames,colorSource:source,alphaMax:1,renderAlpha:r.render,colorCorrection:r,presentation:'premultiplied-keyframe-blend',geometryChanged:false});
}
// Freeze is the only new shape authorized this round: faceted ice shell.
{
 const e=manifest.entries.freeze,source='source/effect_freeze_soft_v3_preview.png';e.previousAssets={version:2,reviewPath:e.reviewPath,frames:[...e.frames],renderAlpha:e.renderAlpha,presentation:null};
 const {data,info}=await sharp(path.join(base,source)).raw().toBuffer({resolveWithObject:true});if(info.width!==1536||info.height!==1024||info.channels!==4)throw Error('Freeze source layout');
 const slots=[];for(let n=0;n<8;n++){const left=n%4*384,top=Math.floor(n/4)*512;let minX=384,minY=512,maxX=0,maxY=0;
  for(let y=0;y<512;y++)for(let x=0;x<384;x++)if(data[((y+top)*1536+x+left)*4+3]>40){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}slots.push({left,top,center:[(minX+maxX)/2,(minY+maxY)/2],bounds:[minX,minY,maxX,maxY]});}
 const extent=Math.max(...slots.flatMap(s=>[s.bounds[2]-s.bounds[0]+1,s.bounds[3]-s.bounds[1]+1])),scale=212/extent,parts=[],frames=[];
 for(let n=0;n<8;n++){const s=slots[n],w=Math.round(384*scale),h=Math.round(512*scale),raw=await sharp(path.join(base,source)).extract({left:s.left,top:s.top,width:384,height:512}).resize(w,h).toBuffer();
  const padded=await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite([{input:raw,left:256+Math.round(128-s.center[0]*scale),top:256+Math.round(128-s.center[1]*scale)}]).png().toBuffer();
  const cell=await sharp(padded).extract({left:256,top:256,width:256,height:256}).png().toBuffer(),frame=`assets/effect_freeze_soft_v3_preview_${String(n+1).padStart(2,'0')}.png`;await fs.writeFile(path.join(base,frame),cell);frames.push(frame);parts.push({input:cell,left:n%4*256,top:Math.floor(n/4)*256});}
 const atlas='assets/atlas_freeze_soft_v3_preview.png';await sharp({create:{width:1024,height:512,channels:4,background:'#00000000'}}).composite(parts).png().toFile(path.join(base,atlas));
 Object.assign(e,{version:3,source,prompt:'source/prompt_freeze_soft_v3_preview.txt',reviewPath:atlas,frames,colorSource:source,alphaMax:.96,renderAlpha:{main:.96,state:.68,thaw:.70},registration:{threshold:40,sharedScale:scale,slots},presentation:'premultiplied-keyframe-blend',geometryChanged:true,colorCorrection:null,design:'faceted glacier-blue ice casing, corner crystals, frost cracks; center open'});
}
manifest.version=3;manifest.revision='visibility-ice-v3';manifest.generator='Freeze: built-in image_gen ice-shell edit; other three: deterministic color/alpha adjustment; opacity-preserving keyframe blend';
delete manifest.colorRevisionReport;
manifest.revisionRecipe='scripts/enhance-skill-body-v3.mjs';
for(const e of Object.values(manifest.entries))e.interpolation='linear premultiplied keyframe blend on transparent scratch; final board draw source-over';
await fs.writeFile(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2));console.log('v3: ice casing + stronger three palettes.');
