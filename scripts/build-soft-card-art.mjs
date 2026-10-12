// Compose generated illustrations into the existing card windows; preserve the original frame and lettering.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {CARDS} from '../dist/cards.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[root,path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const dir=path.join(root,'art-preproduction/cards-soft-c');
const aliases={fire:'firewave',freeze:'freeze',blackhole:'blackhole',quake:'quake',rainbow:'rainbow',luck:'luck',meteor:'meteor',bomb:'bomb',storm:'storm',fog:'fog',overload:'overload',sage:'sage'};
// Each window follows its established frame, including the raised type badge.
const windows={
 red:{box:[80,366,864,642],path:'M80 412 Q80 377 122 369 Q512 382 902 369 Q944 377 944 412 L944 926 Q944 989 852 1006 L677 1006 L652 985 L372 985 L347 1006 L172 1006 Q80 989 80 926 Z'},
 blue:{box:[92,300,840,678],path:'M92 328 Q92 303 126 300 L898 300 Q932 303 932 328 L932 938 Q930 969 894 977 L677 977 L653 956 L371 956 L347 977 L130 977 Q94 969 92 938 Z'},
 yellow:{box:[68,274,888,700],path:'M68 342 Q68 307 119 293 L174 282 Q190 296 255 283 Q512 264 768 283 Q830 296 850 282 L906 295 Q956 311 956 342 L956 898 Q950 944 879 968 L697 968 Q675 937 634 935 L549 935 L512 923 L475 935 L390 935 Q349 937 327 968 L156 968 Q78 944 68 898 Z'}
};
const entries=[];let parts=[],thumbs=[];
const current=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
for(const c of CARDS){
 const adopted=current.cards.find(e=>e.id===c.id&&e.final);
 if(adopted){const full=await fs.readFile(path.join(root,adopted.face));await sharp(full).resize(512,768).webp({lossless:true,effort:6}).toFile(path.join(root,adopted.runtime));entries.push(adopted);const i=parts.length;parts.push({input:await sharp(full).resize(256,384).png().toBuffer(),left:i%4*256,top:Math.floor(i/4)*384});thumbs.push({input:await sharp(full).resize(116,153,{fit:'contain',background:'#f1ece3'}).png().toBuffer(),left:i%6*136+10,top:Math.floor(i/6)*173+10});continue;}
 const source=`card_skill_${aliases[c.id]}_soft_v4_preview.png`;
 try{await fs.access(path.join(dir,source));}catch{continue;}
 const original=await sharp(path.join(root,'art-preproduction/card-reference-v3/cards',c.id+'.png')).resize(1024,1536).png().toBuffer();
 const w=windows[c.color],illustration=await fs.readFile(path.join(dir,source)),[x,y,width,height]=w.box;
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><defs><clipPath id="art"><path d="${w.path}"/></clipPath></defs><image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#art)" href="data:image/png;base64,${illustration.toString('base64')}"/></svg>`);
 const overlay=await sharp(svg).png().toBuffer();
 const composed=await sharp(original).composite([{input:overlay}]).ensureAlpha().raw().toBuffer(),base=await sharp(original).ensureAlpha().raw().toBuffer(),alpha=await sharp(overlay).ensureAlpha().raw().toBuffer();
 // Preserve even invisible RGB and translucent edge pixels outside the window;
 // normal alpha composition can otherwise round the old frame edges by 1 byte.
 for(let i=0;i<composed.length;i+=4)if(alpha[i+3]===0)base.copy(composed,i,i,i+4);
 const full=await sharp(composed,{raw:{width:1024,height:1536,channels:4}}).png().toBuffer(),name=`card_face_${c.id}_soft_v4_preview`;
 await fs.writeFile(path.join(dir,name+'.png'),full);
 await fs.writeFile(path.join(root,'dist/assets/cards',c.id+'.webp'),await sharp(full).resize(512,768).webp({lossless:true,effort:6}).toBuffer());
 entries.push({id:c.id,name:c.name,type:'card_face',category:c.category,version:4,status:'preview',final:false,preview:true,source:'art-preproduction/cards-soft-c/'+source,face:'art-preproduction/cards-soft-c/'+name+'.png',runtime:'dist/assets/cards/'+c.id+'.webp',original:'art-preproduction/card-reference-v3/cards/'+c.id+'.png',window:w,method:'built-in imagegen illustration + original window composition; frame and text preserved outside mask'});
 const i=parts.length;parts.push({input:await sharp(full).resize(256,384).png().toBuffer(),left:i%4*256,top:Math.floor(i/4)*384});
 thumbs.push({input:await sharp(full).resize(116,153,{fit:'contain',background:'#f1ece3'}).png().toBuffer(),left:i%6*136+10,top:Math.floor(i/6)*173+10});
}
if(entries.length){
 await sharp({create:{width:1024,height:Math.ceil(entries.length/4)*384,channels:3,background:'#f1ece3'}}).composite(parts).png().toFile(path.join(dir,'card_preview_soft_v4_preview.png'));
 await sharp({create:{width:816,height:Math.ceil(entries.length/6)*173,channels:3,background:'#f1ece3'}}).composite(thumbs).png().toFile(path.join(dir,'card_hand_soft_v4_preview.png'));
}
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({direction:'方案C：克制雅致',status:'integrated preview, pending user review',cards:entries},null,2));
console.log('Composed',entries.length,'card windows; original masters preserved.');
