import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const base=path.join(root,'art-preproduction/skill-body-soft-v1');
let activeRevision;try{activeRevision=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8')).revision;}catch{}
const durations={fire:720,freeze:760,blackhole:760,luck:800};
const manifest={version:1,status:'preview',userApproved:false,scope:['fire','freeze','blackhole','luck'],generator:'built-in image_gen; alpha-preserving atlas extraction with sharp',integration:'review-only; no production imports',castSource:'dist/effect_cast_soft_v3_final.mjs',bodyAfterCastMs:640,entries:{}};
for(const id of manifest.scope){
 const alias=id==='fire'?'firewave':id,source=`source/effect_${alias}_soft_v1_preview.png`;
 const {data,info}=await sharp(path.join(base,source)).raw().toBuffer({resolveWithObject:true});
 if(info.channels!==4||info.width!==1536||info.height!==1024)throw Error('Unexpected source layout '+id);
 const slots=[];
 for(let n=0;n<8;n++){
  const left=n%4*384,top=Math.floor(n/4)*512;let minX=384,minY=512,maxX=0,maxY=0;
  for(let y=0;y<512;y++)for(let x=0;x<384;x++)if(data[((y+top)*1536+x+left)*4+3]>30){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(minX>maxX)throw Error('Empty source frame');
  // Registration only: preserve original color/alpha and one common scale.
  slots.push({left,top,center:[(minX+maxX)/2,(minY+maxY)/2],bounds:[minX,minY,maxX,maxY]});
 }
 const extent=Math.max(...slots.flatMap(s=>[(s.bounds[2]-s.bounds[0]+1),(s.bounds[3]-s.bounds[1]+1)]));
 const scale=212/extent,composites=[],frames=[];
 for(let n=0;n<8;n++){
  const s=slots[n],w=Math.round(384*scale),h=Math.round(512*scale);
  const input=await sharp(path.join(base,source)).extract({left:s.left,top:s.top,width:384,height:512}).resize(w,h).toBuffer();
  const x=Math.round(128-s.center[0]*scale),y=Math.round(128-s.center[1]*scale);
  // Place on a larger canvas then crop; this avoids discarding transparent halos.
  const padded=await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite([{input,left:256+x,top:256+y}]).png().toBuffer();
  const cell=await sharp(padded).extract({left:256,top:256,width:256,height:256}).png().toBuffer();
  const frame=`assets/effect_${alias}_soft_v1_preview_${String(n+1).padStart(2,'0')}.png`;
  await fs.writeFile(path.join(base,frame),cell);frames.push(frame);composites.push({input:cell,left:n%4*256,top:Math.floor(n/4)*256});
 }
 const atlas=`assets/atlas_${alias}_soft_v1_preview.png`;
 await sharp({create:{width:1024,height:512,channels:4,background:'#00000000'}}).composite(composites).png().toFile(path.join(base,atlas));
 manifest.entries[id]={id,alias,version:1,status:'preview',source,prompt:`source/prompt_${id}_soft_v1_preview.txt`,runtimePath:null,reviewPath:atlas,frames,frameSize:[256,256],columns:4,rows:2,frameCount:8,frameMs:durations[id]/8,mainMs:durations[id],anchor:[.5,.5],loop:false,interpolation:'adjacent-keyframe alpha crossfade; source-over only',alphaMax:{fire:.72,freeze:.48,blackhole:.74,luck:.78}[id],registration:{threshold:30,sharedScale:scale,slots},stateMs:{fire:2200,freeze:3000,blackhole:420,luck:10000}[id]};
}
await fs.writeFile(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('4 alpha atlases + 32 registered keyframes prepared.');
// Rebuild original geometry first, then restore the manifest-selected color revision.
if(activeRevision==='tone-v2')await import('./adjust-skill-body-color.mjs');
if(activeRevision==='visibility-ice-v3')await import('./enhance-skill-body-v3.mjs');
