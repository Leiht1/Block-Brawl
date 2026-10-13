// Encode existing painted selection components; keep the PNG masters intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[root,path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const dir=path.join(root,'dist/assets/selection');await fs.mkdir(dir,{recursive:true});
const entries=[];
for(const id of ['selection-background','title','deck-player','deck-ai','pool','slot','ready','timer','card-back']){
 const source='art-preproduction/round1/assets/'+id+'.png',bytes=await fs.readFile(path.join(root,source)),meta=await sharp(bytes).metadata();
 const file='ui_selection_'+id.replaceAll('-','_')+'_v1_preview.webp',encoded=await sharp(bytes).webp({lossless:true,effort:6}).toBuffer();
 await fs.writeFile(path.join(dir,file),encoded);entries.push({id,type:'selection-ui',version:1,status:'preview',source,runtime:'./assets/selection/'+file,width:meta.width,height:meta.height,sourceSha256:createHash('sha256').update(bytes).digest('hex'),bytes:encoded.length});
}
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({date:'2026-10-13',integration:'Requested by the user; existing paintings only, with editable live text.',scaling:'Preserve painted corner proportions with measured panel slices; cover-crop the title and ready button, contain slots and card backs.',entries},null,2));
console.log(JSON.stringify({components:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0)}));
