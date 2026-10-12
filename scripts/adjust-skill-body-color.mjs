// Pixel-only color/alpha correction: no generation, resampling, crop or registration.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const base=path.join(root,'art-preproduction/skill-body-soft-v1'),manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
const recipes={
 fire:{tone:[211,104,34],blend:.24,saturation:1.14,alphaGain:1.6,render:{main:.94,state:.42,mark:.7,markColor:'#b66c2f',settle:.5}},
 freeze:{tone:[51,136,196],blend:.36,saturation:1.12,alphaGain:1.8,render:{main:.76,state:.4,thaw:.46}},
 blackhole:{tone:[65,83,165],blend:.32,saturation:1.16,alphaGain:1.7,render:{main:.94,trail:.55,trailColor:'#638abe'}},
 luck:{tone:[193,131,35],blend:.32,saturation:1.14,alphaGain:1.65,render:{main:.95,state:.72,speck:.42}}
};
const report={change:'color and alpha only',revision:'tone-v2',entries:{}};
async function adjust(from,to,r){
 const {data,info}=await sharp(path.join(base,from)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),result=Buffer.from(data);let changed=0,support=0,beforeAlpha=0,afterAlpha=0;
 const byte=v=>Math.max(0,Math.min(255,Math.round(v)));
 for(let p=0;p<data.length;p+=4){const a=data[p+3];if(!a)continue;support++;beforeAlpha+=a;
  const rgb=r.tone.map((tone,c)=>data[p+c]*(1-r.blend)+tone*r.blend),luma=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  for(let c=0;c<3;c++)result[p+c]=byte((luma+(rgb[c]-luma)*r.saturation-127.5)*1.04+127.5);
  result[p+3]=byte(a*r.alphaGain);afterAlpha+=result[p+3];if(result.subarray(p,p+4).compare(data.subarray(p,p+4)))changed++;
 }
 await sharp(result,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(path.join(base,to));
 return {from,to,size:[info.width,info.height],alphaSupportUnchanged:true,nonzeroPixels:support,changedPixels:changed,meanAlphaBefore:beforeAlpha/support,meanAlphaAfter:afterAlpha/support};
}
const only=process.argv.find(a=>a.startsWith('--skill='))?.split('=')[1];
for(const id of manifest.scope){
 if(only&&only!==id)continue;
 const e=manifest.entries[id],r=recipes[id],alias=e.alias;
 e.previousAssets??={version:1,reviewPath:`assets/atlas_${alias}_soft_v1_preview.png`,frames:Array.from({length:8},(_,n)=>`assets/effect_${alias}_soft_v1_preview_${String(n+1).padStart(2,'0')}.png`),renderAlpha:e.renderAlpha??null};
 const atlas=`assets/atlas_${alias}_soft_v2_preview.png`,framePaths=e.previousAssets.frames.map(f=>f.replace('_v1_','_v2_'));
 const records=[await adjust(e.previousAssets.reviewPath,atlas,r)];for(let n=0;n<8;n++)records.push(await adjust(e.previousAssets.frames[n],framePaths[n],r));
 const colorSource=`source/effect_${alias}_soft_v2_preview.png`;records.push(await adjust(e.source,colorSource,r));
 Object.assign(e,{version:2,reviewPath:atlas,frames:framePaths,colorSource,alphaMax:r.render.main,renderAlpha:r.render,colorCorrection:{...r,source:e.source,method:'deterministic RGB/saturation and alpha point mapping; unchanged pixel coordinates and empty alpha mask'}});
 report.entries[id]={recipe:r,files:records};
}
manifest.version=2;manifest.revision='tone-v2';manifest.generator='Original built-in image_gen masters; user-requested deterministic color/alpha-only correction';manifest.colorRevisionReport='color-revision-v2.json';
await fs.writeFile(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2));
const reportPath=path.join(base,'color-revision-v2.json');let previous={entries:{}};try{previous=JSON.parse(await fs.readFile(reportPath,'utf8'));}catch{}
await fs.writeFile(reportPath,JSON.stringify({...report,entries:{...previous.entries,...report.entries}},null,2));
console.log('Color-only revision saved: '+Object.keys(report.entries).join(', '));
