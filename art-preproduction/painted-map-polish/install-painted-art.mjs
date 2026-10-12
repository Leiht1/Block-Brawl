import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {MAPS} from '../../dist/maps.mjs';
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(require.resolve('sharp',{paths:[deps]}));
const dir=new URL('./',import.meta.url),root=new URL('../../dist/',import.meta.url);
const uri=buffer=>'data:image/svg+xml;base64,'+buffer.toString('base64');
const uriWebp=buffer=>'data:image/webp;base64,'+buffer.toString('base64');
const alphaFilter='<filter id="shape-alpha" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>';
for(const map of MAPS){
 const bg=new URL(map.id+'-background-painted.png',dir),platform=new URL(map.id+'-platform-painted.png',dir);
 try{await fs.access(bg);}catch{continue;}
 const bgWebp=await sharp(await fs.readFile(bg)).webp({quality:90}).toBuffer();
 if(map.id==='forest'){
  await fs.writeFile(new URL(map.assets.backdrop,root),bgWebp);
  const board=await sharp(await fs.readFile(new URL('forest-board-painted.png',dir))).webp({quality:94}).toBuffer();
  await fs.writeFile(new URL(map.assets.board,root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image width="512" height="512" preserveAspectRatio="none" href="${uriWebp(board)}"/></svg>`);
  console.log('Installed painted forest background / original square board; existing vine frame retained.');
  continue;
 }
 else await fs.writeFile(new URL(map.assets.backdrop,root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><image width="1600" height="1000" preserveAspectRatio="none" href="${uriWebp(bgWebp)}"/></svg>`);
 try{await fs.access(platform);}catch{continue;}
 const art=uriWebp(await sharp(await fs.readFile(platform)).webp({quality:94}).toBuffer());
 const source=await fs.readFile(new URL('original/'+map.id+'-frame.svg',dir),'utf8');
 const [left,top,width,height]=source.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
 // The original platform alpha and original black playable mask enforce its
 // authored edge and transparent active cells. Paint does not define hit geometry.
 for(const [side,src] of [['frame',map.assets.frame],['stageRight',map.assets.stageRight]]){
  if(!src)continue;
  const original=await fs.readFile(new URL('original/'+map.id+'-'+side+'.svg',dir),'utf8');
  const view=original.match(/viewBox="([^"]+)"/)[1],bounds=view.split(' ').map(Number);
  const mask=original.match(/<mask id="outside"[\s\S]*?<\/mask>/)[0];
  const silhouette=`<mask id="original-outline" maskUnits="userSpaceOnUse" x="${bounds[0]}" y="${bounds[1]}" width="${bounds[2]}" height="${bounds[3]}"><image x="${bounds[0]}" y="${bounds[1]}" width="${bounds[2]}" height="${bounds[3]}" href="${uri(Buffer.from(original))}" filter="url(#shape-alpha)"/></mask>`;
  await fs.writeFile(new URL(src,root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}"><defs>${mask}${alphaFilter}${silhouette}</defs><g mask="url(#outside)"><image x="${left}" y="${top}" width="${width}" height="${height}" preserveAspectRatio="none" href="${art}" mask="url(#original-outline)"/></g></svg>`);
 }
 const footprint=map.terrain.cells.flatMap((s,i)=>s==='hole'?[]:[`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`]).join('');
 await fs.writeFile(new URL(map.assets.board,root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480"><defs><clipPath id="original-footprint">${footprint}</clipPath></defs><image x="${left}" y="${top}" width="${width}" height="${height}" preserveAspectRatio="none" href="${art}" clip-path="url(#original-footprint)"/></svg>`);
 console.log('Installed painted original background / platform / board:',map.id);
}
