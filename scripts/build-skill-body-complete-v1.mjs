import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {SPECS,IDS} from '../art-preproduction/skill-body-complete-v1/skill-specs.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base=path.join(root,'art-preproduction/skill-body-complete-v1'),prior=path.join(root,'art-preproduction/skill-body-soft-v1'),require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const current=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
// Once adopted, the registered sources are authoritative. Do not reset approval,
// reconstruct the former fog/rule proposals or silently replace a final atlas.
if(current.userApproved){console.log('Approved selection preserved; use sync-skill-body-assets.mjs to publish registered assets.');process.exit(0);}
const old=JSON.parse(await fs.readFile(path.join(prior,'manifest.json'),'utf8')),manifest={version:4,revision:'complete-review-sage-backlight-v4',status:'preview',userApproved:false,scope:IDS,integration:'review-only; no production imports',castSource:'dist/effect_cast_soft_v3_final.mjs',generator:'built-in image_gen keyframes; native gold veil and board underlight',entries:{}};
for(const id of IDS){
 if(['fire','freeze','blackhole'].includes(id)){const e=structuredClone(old.entries[id]);delete e.previousAssets;for(const f of new Set([e.reviewPath,...e.frames,e.source,e.prompt,e.colorSource].filter(Boolean)))await fs.copyFile(path.join(prior,f),path.join(base,f));manifest.entries[id]=e;continue;}
 const version=id==='luck'?5:id==='fog'?2:1,source=`source/effect_${id}_soft_v${version}_preview.png`;
 try{await fs.access(path.join(base,source));}catch{if(process.argv.includes('--partial'))continue;throw Error('Missing '+source);}
 const {data,info}=await sharp(path.join(base,source)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width%4||info.height%2||!info.hasAlpha&&info.channels!==4)throw Error('Sheet layout '+id);const sw=info.width/4,sh=info.height/2,slots=[];
 for(let n=0;n<8;n++){const left=n%4*sw,top=Math.floor(n/4)*sh;let minX=sw,minY=sh,maxX=-1,maxY=-1;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data[((y+top)*info.width+x+left)*4+3]>45){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}if(maxX<0)throw Error('Empty slot '+id+' '+n);
  slots.push({left,top,center:[(minX+maxX)/2,(minY+maxY)/2],bounds:[minX,minY,maxX,maxY]});}
 const extent=Math.max(...slots.flatMap(s=>[s.bounds[2]-s.bounds[0]+1,s.bounds[3]-s.bounds[1]+1])),scale=212/extent,parts=[],frames=[];
 for(let n=0;n<8;n++){const s=slots[n],input=await sharp(path.join(base,source)).extract({left:s.left,top:s.top,width:sw,height:sh}).resize(Math.round(sw*scale),Math.round(sh*scale)).toBuffer();
  const padded=await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite([{input,left:256+Math.round(128-s.center[0]*scale),top:256+Math.round(128-s.center[1]*scale)}]).png().toBuffer(),cell=await sharp(padded).extract({left:256,top:256,width:256,height:256}).png().toBuffer(),f=`assets/effect_${id}_soft_v${version}_preview_${String(n+1).padStart(2,'0')}.png`;
  await fs.writeFile(path.join(base,f),cell);frames.push(f);parts.push({input:cell,left:n%4*256,top:Math.floor(n/4)*256});}
 const atlas=`assets/atlas_${id}_soft_v${version}_preview.png`;await sharp({create:{width:1024,height:512,channels:4,background:'#00000000'}}).composite(parts).png().toFile(path.join(base,atlas));
 manifest.entries[id]={id,alias:id,version,status:'preview',source,prompt:`source/prompt_${id}_soft_v${version}_preview.txt`,runtimePath:null,reviewPath:atlas,frames,frameSize:[256,256],columns:4,rows:2,frameCount:8,frameMs:SPECS[id].mainMs/8,mainMs:SPECS[id].mainMs,anchor:[.5,.5],loop:false,alphaMax:1,presentation:'premultiplied-keyframe-blend',registration:{threshold:45,sharedScale:scale,slots}};
}
manifest.scope=IDS.filter(id=>manifest.entries[id]);
if(manifest.entries.rainbow){
 const frame=manifest.entries.rainbow.frames[4],{data}=await sharp(path.join(base,frame)).raw().toBuffer({resolveWithObject:true});let minX=256,minY=256,maxX=-1,maxY=-1;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(data[(y*256+x)*4+3]>235){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const left=Math.max(0,minX-5),top=Math.max(0,minY-5),width=Math.min(256,maxX+6)-left,height=Math.min(256,maxY+6)-top;
 const input=await sharp(path.join(base,frame)).extract({left,top,width,height}).resize(116,116,{fit:'contain',background:'#00000000'}).toBuffer(),reviewPath='assets/tile_wild_star_soft_v1_preview.png';
 await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([{input,left:6,top:6}]).png().toFile(path.join(base,reviewPath));
 manifest.specialTile={status:'preview',source:frame,reviewPath,frameSize:[128,128],anchor:[.5,.5],runtimePath:null,uses:['rainbow'],sourceCrop:{left,top,width,height}};
}
manifest.stateAssets={};manifest.stateStyles={sage:{style:'uniform gold veil plus optional rising backlight behind tiles',source:'effect_sage_backlight_soft_v1_preview.mjs',color:'#ffc53a',alphaMax:.29,backlightAlphaMax:.94,backlightLayer:'after terrain; before tiles',backlightCycleMs:2400,stateMs:5000,anchor:'board bounds',runtimePath:null,userApproved:false,variants:['veil','backlight'],defaultVariant:'backlight'},luck:{style:'left badge and countdown only',stateMs:10000},overload:{style:'left badge and countdown only',stateMs:10000}};
manifest.rejectedStateAssets=['sage','luck','overload'].map(id=>({source:`source/effect_${id}_aura_soft_v1_preview.png`,status:'rejected by user: flowing ribbons too busy; not loaded or rendered'}));
manifest.statusBadges={luck:{side:'left',iconSize:80,stateMs:10000,detail:'22%'},overload:{side:'left',iconSize:80,stateMs:10000,detail:'×2'}};
manifest.previewRules={luck:{userSpecified:true,effect:'restored original ten-second 22% special-refill buff; no wild tile generated',productionChanged:false},fog:{userSpecified:true,effect:'one cloud at landing; local contiguous twelve-cell footprint in preview instead of production random twelve; six-second state then 1200ms visual fade',productionChanged:false},quake:{userSelected:true,selected:'row',name:'裂地横扫',effect:'clear ordinary tiles on selected target row, up to eight; other candidates retained for history',productionChanged:false}};
await fs.writeFile(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2));console.log(manifest.scope.length+' review atlases ready.');
