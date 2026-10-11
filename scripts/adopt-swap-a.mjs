import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'validation/2026-10-11/audio-swap/',ref=root+'references/audio-swap/';
const sha=b=>createHash('sha256').update(b).digest('hex');
const list=JSON.parse(await fs.readFile(out+'candidates.json','utf8')),choice=list.find(c=>c.candidate==='A');
const body=await fs.readFile(out+choice.file);assert.equal(sha(body),choice.sha256);
assert.equal(sha(await fs.readFile(root+choice.source.recording)),choice.source.recordingSha256);
const baseline=JSON.parse(await fs.readFile(out+'game-before.json','utf8'));
try{await fs.writeFile(ref+'before-adoption.json',JSON.stringify(baseline,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
const target='dist/assets/audio/block/block-swap-v2.wav';
await fs.writeFile(root+target,body);assert.equal(sha(await fs.readFile(root+target)),choice.sha256);
for(const c of list){c.installed=c.candidate==='A';c.status=c.installed?'user-selected-and-installed':'not-selected';if(c.installed)c.targetFile=target;}
await fs.writeFile(out+'candidates.json',JSON.stringify(list,null,2));
await fs.writeFile(ref+'selection.json',JSON.stringify({...choice,id:'block.swap',targetFile:target,auditionFile:'validation/2026-10-11/audio-swap/'+choice.file,approvedBy:'user',approvedOn:'2026-10-11',reason:'用户试听后明确选择 A：极短轻挥，替换原有偏硬木质打击。',installed:true,status:'user-selected-and-installed'},null,2));
console.log('Copied user-selected A exactly; adoption provenance saved.');
