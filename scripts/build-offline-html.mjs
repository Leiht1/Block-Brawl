// Package the current dist into one file; production modules remain unchanged.
import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const output=path.join(root,'方块乱斗-最新版.html');
const mime={'.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const assets={},hashes={};
const hash=b=>createHash('sha256').update(b).digest('hex');
async function collect(dir){
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);if(entry.isDirectory()){await collect(p);continue;}
  if(!mime[path.extname(p)])continue;
  const bytes=await fs.readFile(p),name='./'+path.relative(dist,p).replaceAll('\\','/');
  assets[name]={mime:mime[path.extname(p)],base64:bytes.toString('base64')};hashes[name]=hash(bytes);
 }
}
await collect(path.join(dist,'assets'));
const result=await build({entryPoints:[path.join(dist,'app.mjs')],bundle:true,write:false,format:'iife',target:'es2022',minify:true,
 plugins:[{name:'embedded-local-assets',setup(api){api.onLoad({filter:/\.mjs$/},async({path:p})=>{
  const bytes=await fs.readFile(p);hashes[path.relative(root,p).replaceAll('\\','/')]=hash(bytes);
  let contents=bytes.toString();
  if(path.basename(p)==='audio-manager.mjs')contents=contents.replaceAll('new URL(entry.src,import.meta.url).href','__blockAsset(entry.src)');
  contents=contents.replace(/(['"])(\.\/assets\/[^'"\n]+\.(?:svg|webp|png))\1/g,(_,q,src)=>`__blockAsset(${JSON.stringify(src)})`);
  contents=contents.replace('`./assets/maps/${id}-preview.svg`','__blockAsset(`./assets/maps/${id}-preview.svg`)');
  return {contents,loader:'js'};
 });}}]});
const dataUrl=src=>{const a=assets[src.startsWith('./')?src:'./'+src];if(!a)throw Error('Missing asset '+src);return `data:${a.mime};base64,${a.base64}`;};
const cssBytes=await fs.readFile(path.join(dist,'style.css'));hashes['dist/style.css']=hash(cssBytes);
const css=cssBytes.toString().replace(/url\((['"]?)(\.\/assets\/[^)'"\s]+)\1\)/g,(_,q,src)=>`url("${dataUrl(src)}")`);
const htmlBytes=await fs.readFile(path.join(dist,'index.html'));hashes['dist/index.html']=hash(htmlBytes);
const runtime=`const __blockFiles=${JSON.stringify(assets)},__blockUrls=new Map();function __blockAsset(src){if(__blockUrls.has(src))return __blockUrls.get(src);const a=__blockFiles[src];if(!a)throw Error('Missing embedded asset: '+src);const bytes=Uint8Array.from(atob(a.base64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:a.mime}));__blockUrls.set(src,url);return url;}`;
const license=await fs.readFile(path.join(dist,'assets/audio/CREDITS.md'),'utf8');
const metadata={builtAt:new Date().toISOString(),source:'current dist',musicVolumes:{lobby:AUDIO_MANIFEST['bgm.lobby'].volume,battle:AUDIO_MANIFEST['bgm.battle'].volume},sources:hashes,audioCredits:license};
const escapeScript=s=>s.replace(/<\/script/gi,'<\\/script');
// Function replacements preserve literal $&, $' and $` in bundled JS/CSS.
let html=htmlBytes.toString().replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`)
 .replace(/(href|src)="(assets\/[^" ]+)"/g,(_,attr,src)=>`${attr}="${dataUrl(src)}"`)
 .replace('href="./"','href=""')
 .replace('<script type="module" src="app.mjs"></script>',()=>`<script>${escapeScript(runtime+result.outputFiles[0].text)}</script><script type="application/json" id="offline-build">${escapeScript(JSON.stringify(metadata))}</script>`);
await fs.writeFile(output,html);
const report={file:output,bytes:Buffer.byteLength(html),embeddedMedia:Object.keys(assets).length,...metadata};
await fs.mkdir(path.join(root,'validation/2026-10-11/offline'),{recursive:true});
await fs.writeFile(path.join(root,'validation/2026-10-11/offline/build.json'),JSON.stringify(report,null,2));
console.log('Built',output,Math.round(report.bytes/1024/1024*100)/100+' MB;',report.embeddedMedia,'embedded media files');
