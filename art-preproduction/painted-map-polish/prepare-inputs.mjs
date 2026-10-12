import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {MAPS} from '../../dist/maps.mjs';
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(require.resolve('sharp',{paths:[deps]}));
const root=new URL('../../',import.meta.url),dir=new URL('./',import.meta.url);
await fs.mkdir(new URL('inputs/',dir),{recursive:true});await fs.mkdir(new URL('original/',dir),{recursive:true});
for(const map of MAPS){
 for(const [key,src] of Object.entries(map.assets).filter(([k,v])=>v&&['backdrop','board','frame','stageRight'].includes(k))){
  const bytes=await fs.readFile(new URL('dist/'+src,root));const name=map.id+'-'+key+path.extname(src);
  await fs.writeFile(new URL('original/'+name,dir),bytes);
  if(key==='backdrop')await sharp(bytes).png().toFile(fileURLToPath(new URL('inputs/'+map.id+'-background.png',dir)));
 }
 if(map.id==='forest')continue;
 const source=await fs.readFile(new URL('dist/'+map.assets.frame,root),'utf8');
 const board=await fs.readFile(new URL('dist/'+map.assets.board,root));
 const clip=map.terrain.cells.flatMap((s,i)=>s==='hole'?[]:[`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`]).join('');
 const plate=`<defs><clipPath id="input-footprint">${clip}</clipPath></defs><g clip-path="url(#input-footprint)"><image x="0" y="0" width="480" height="480" href="data:image/svg+xml;base64,${board.toString('base64')}"/></g>`;
 const combined=source.replace('</svg>',plate+'</svg>');
 await fs.writeFile(new URL('inputs/'+map.id+'-platform.svg',dir),combined);
 const png=await sharp(Buffer.from(combined),{density:192}).png().toBuffer();
 await fs.writeFile(new URL('inputs/'+map.id+'-platform.png',dir),png);
}
await fs.copyFile('C:/Users/HT/AppData/Local/Temp/codex-clipboard-fe9a4c5c-a6b1-493a-a374-771e5c6c4d2d.png',new URL('approved-reference.png',dir));
console.log('Prepared exact native map compositions and masked irregular platform inputs.');
