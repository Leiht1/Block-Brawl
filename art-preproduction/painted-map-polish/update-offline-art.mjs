import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir=new URL('./',import.meta.url),root=new URL('../../',dir),game=new URL('方块乱斗-最新版.html',root);
const before=await fs.readFile(game,'utf8');
try{await fs.access(new URL('original-offline.html',dir));}catch{await fs.writeFile(new URL('original-offline.html',dir),before);}
const names=JSON.parse(await fs.readFile(new URL('static-art-qa.json',dir),'utf8')).changedFiles;
const sha=b=>createHash('sha256').update(b).digest('hex');
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
let after=before;const replacements=[];
for(const name of names){
 const pattern=new RegExp(escape(JSON.stringify(name))+':\\{"mime":"([^"]+)","base64":"([^"]+)"\\}');
 const match=after.match(pattern);assert.ok(match,name+': embedded source absent');
 const bytes=await fs.readFile(new URL('dist/'+name.replace(/^\.\//,''),root)),old=match[2],next=bytes.toString('base64');
 const oldHash=sha(Buffer.from(old,'base64')),nextHash=sha(bytes);
 assert.ok(after.includes(JSON.stringify(name)+':"'+oldHash+'"'),name+': metadata mismatch');
 const count=after.split(old).length-1;
 after=after.replaceAll(old,next).replaceAll(oldHash,nextHash);
 replacements.push({name,old,next,oldHash,nextHash,count,bytes:bytes.length});
}
// Nothing outside the 15 artwork payloads and corresponding hashes may change.
let restored=after;
for(const r of replacements)restored=restored.replaceAll(r.next,r.old).replaceAll(r.nextHash,r.oldHash);
assert.equal(restored,before,'Offline logic, CSS or other embedded assets changed');
await fs.writeFile(game,after);
await fs.writeFile(new URL('offline-art-update.json',dir),JSON.stringify({file:game.pathname,onlyStaticArtChanged:true,assets:replacements.map(({name,count,bytes,nextHash})=>({name,count,bytes,sha256:nextHash}))},null,2));
console.log('Updated only 15 static-art payloads and hashes in latest offline game.');
