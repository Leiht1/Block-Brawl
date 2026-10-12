import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {MAPS} from '../../dist/maps.mjs';
import {createRasterizer} from './browser-raster.mjs';
const dir=new URL('./',import.meta.url),root=fileURLToPath(new URL('../../',dir));
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(require.resolve('sharp',{paths:[deps]}));
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={changedFiles:[],maps:[],protectedFiles:0};
const protectedFiles=JSON.parse(await fs.readFile(new URL('../native-map-polish/protected.json',dir),'utf8'));
for(const [name,expected]of Object.entries(protectedFiles)){
 if(name.replaceAll('\\','/')==='dist/assets/jungle-scenery.webp')continue;
 assert.equal(hash(await fs.readFile(path.join(root,name))),expected,name+': unrelated file changed');report.protectedFiles++;
}
const raster=await createRasterizer();
try{for(const m of MAPS){
 for(const [kind,src]of Object.entries({backdrop:m.assets.backdrop,board:m.assets.board,frame:m.assets.frame,stageRight:m.assets.stageRight})){
  if(!src)continue;
  const ext=path.extname(src),oldKind=kind==='backdrop'?'backdrop':kind;
  const before=await fs.readFile(new URL('original/'+m.id+'-'+oldKind+ext,dir)),after=await fs.readFile(path.join(root,'dist',src));
  if(hash(before)!==hash(after))report.changedFiles.push(src);
  if(kind==='frame'&&m.id==='forest'){assert.equal(hash(after),hash(before));continue;}
  if(kind==='frame'||kind==='stageRight'){
   const a=before.toString(),b=after.toString();
   assert.equal(b.match(/viewBox="([^"]+)"/)[1],a.match(/viewBox="([^"]+)"/)[1],src+': bounds changed');
   assert.equal(b.match(/<mask id="outside"[\s\S]*?<\/mask>/)[0],a.match(/<mask id="outside"[\s\S]*?<\/mask>/)[0],src+': playable mask changed');
   assert.ok(b.includes('mask="url(#original-outline)"'),src+': original outline not enforced');
  }
  if(kind==='board'){
   const b=after.toString();
   const oldView=before.toString().match(/viewBox="([^"]+)"/)?.[1]||'0 0 512 512';
   assert.equal(b.match(/viewBox="([^"]+)"/)[1],oldView);
   if(m.id!=='forest'){
    const expected=m.terrain.cells.flatMap((s,i)=>s==='hole'?[]:[`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`]).join('');
    assert.equal(b.match(/<clipPath id="original-footprint">([\s\S]*?)<\/clipPath>/)[1],expected);
    const {data,info}=await sharp(await raster.render(after,{width:480,height:480})).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    for(let i=0;i<64;i++){
     const alpha=data[((Math.floor(i/8)*60+30)*info.width+(i%8*60+30))*4+3];
     if(m.terrain.cells[i]==='hole')assert.equal(alpha,0,m.id+' cell '+i+': original hole filled');
     else assert.ok(alpha>240,m.id+' cell '+i+': original well missing');
    }
   }
  }
 }
 report.maps.push({id:m.id,cells:m.terrain.cells.filter(s=>s==='cell').length,obstacles:m.terrain.cells.filter(s=>s==='obstacle').length,originalTerrainAndMasks:true});
}}finally{await raster.close();}
assert.equal(report.changedFiles.length,15);
await fs.writeFile(new URL('static-art-qa.json',dir),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
