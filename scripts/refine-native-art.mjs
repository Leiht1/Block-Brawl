import fs from 'node:fs/promises';
import {writeCliffPreview} from './map-preview-art.mjs';
// Enrich the existing vector silhouettes in place. No backdrop is replaced.
// Idempotent: remove only this script's additions before rebuilding them.
const root=new URL('../dist/assets/',import.meta.url);
const names=['maps/cliff-canyon.svg','maps/crystal-landscape.svg','maps/ruins-temple.svg','maps/furnace-hall.svg','maps/cliff-stage-left.svg','maps/cliff-stage-right.svg','maps/crystal-stage.svg','maps/ruins-stage.svg','maps/furnace-stage.svg','maps/cliff-board.svg','maps/crystal-board.svg','maps/ruins-board.svg','maps/furnace-board.svg','toy-board.svg'];
const shift=(hex,n)=>'#'+hex.slice(1).match(/../g).map(x=>Math.max(0,Math.min(255,parseInt(x,16)+n)).toString(16).padStart(2,'0')).join('');
const stroke=(d,color,width=2,opacity=.45)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
for(const name of names){
 let s=await fs.readFile(new URL(name,root),'utf8');
 s=s.replace(/<!-- native-defs -->[\s\S]*?<!-- end-native-defs -->/g,'').replace(/<!-- native-detail -->[\s\S]*?<!-- end-native-detail -->/g,'').replace(/<!-- native-face -->[\s\S]*?<!-- end-native-face -->/g,'').replace(/fill="url\(#native-([a-f\d]{6})\)"/g,'fill="#$1"');
 const split=s.indexOf('</defs>'),isBoard=name.includes('board'),isStage=name.includes('stage'),ice=name.includes('crystal'),fire=name.includes('furnace'),ruins=name.includes('ruins'),defs=[];
 let head=split<0?s.slice(0,s.indexOf('>')+1):s.slice(0,split+7),body=split<0?s.slice(s.indexOf('>')+1):s.slice(split+7);
 body=body.replace(/fill="(#[a-f\d]{6})"/g,(all,c)=>{const id='native-'+c.slice(1);if(!defs.some(d=>d.includes(`id="${id}"`)))defs.push(`<linearGradient id="${id}" x2=".35" y2="1"><stop stop-color="${shift(c,12)}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${shift(c,-12)}"/></linearGradient>`);return `fill="url(#${id})"`;});
 // Material grains follow the exact existing filled faces, including stage masks.
 defs.push(`<pattern id="native-grain" width="47" height="39" patternUnits="userSpaceOnUse"><path d="M4 6l4-1m17 12l6-1M8 30l3 1m27-8l5-2" stroke="${ice?'#f7fffa':fire?'#cec0ad':'#efe6cd'}" stroke-width=".8" opacity=".09"/><path d="M19 5l2 1m16 29l4 1M2 21l3-1" stroke="${ice?'#779aa9':fire?'#262c38':'#757c68'}" stroke-width=".8" opacity=".07"/></pattern>`);
 if(!isBoard)body=body.replace(/<path\b([^>]*?)fill="url\(#(?!native-grain)[^"]+\)"([^>]*?)\/>/g,(all,a,b)=>{const d=a.match(/\bd="([^"]+)"/)?.[1],t=a.match(/\btransform="([^"]+)"/)?.[0]||b.match(/\btransform="([^"]+)"/)?.[0]||'';return d?all+`<!-- native-face --><path d="${d}" ${t} fill="url(#native-grain)"/><!-- end-native-face -->`:all;});
 let detail='';
 if(isBoard){
   for(let i=0;i<64;i++){const x=i%8*60,y=Math.floor(i/8)*60,ox=8+i*7%14,oy=12+i*11%26;
    detail+=stroke(`M${x+ox} ${y+oy}l${5+i%7} -1`,ice?'#eaf7f6':fire?'#aa9c92':'#e5decd',.7,.35);
    detail+=stroke(`M${x+46} ${y+13+i%4}l-2 5 1 3`,ice?'#89aab7':fire?'#252f3b':'#8f9382',.8,.26);
    if(ice&&i%3===0)detail+=stroke(`M${x+8} ${y+49}l9-2 6 1m-8-1l4-4`,'#e6f6f5',.8,.5);
    if(ruins&&i%4===0)detail+=stroke(`M${x+18} ${y+53}l4-3 4 2 6-1`,'#918b74',.9,.4);
   }
 }else if(isStage){
   // Carving, wear and seams share the original rim and its outside mask.
   detail+=`<g mask="url(#outside)">`;
   for(let n=0;n<8;n++){const x=30+n*60;
    detail+=stroke(`M${x} 481v${10+n%3*3}l-4 5m5-5l8 2`,ice?'#f3ffff':fire?'#242b36':'#746f5b',1.4,.5);
    detail+=stroke(`M${x-15} 500l18-2`,ice?'#ddf1ec':fire?'#ab9690':'#e9dcc0',1,.45);
   }
   if(ice){for(const x of [-12,492])detail+=stroke(`M${x} 205l6 20 -4 16 9 14m-9-14l-8 6M${x} 280l5 8 -3 14`,'#e7fbf8',1.3,.65);}
   if(ruins){for(const x of [-30,510])detail+=stroke(`M${x} 145l8 8 -8 8 -8-8Zm0 20v18m-7 5h14M${x-7} 276h14v18h-14Z`,'#9a8b6b',1.6,.6);}
   if(fire){for(const x of [-59,538]){detail+=stroke(`M${x-8} 183h16m-16 68h16m-16 73h16`,'#c3b1a0',1,.5);for(const y of [192,264,343])detail+=`<circle cx="${x}" cy="${y}" r="2" fill="#b6a898" stroke="#2b303b" stroke-width="1"/>`;}}
   detail+='</g>';
 }else if(ice){
   detail+=stroke('M22 515Q168 470 276 508M305 527q74-18 111 3M1065 518q170-49 282-19M1358 511q90-27 214-4','#f3f6eb',3,.6);
   detail+=stroke('M151 219l-21 108 29-26 33 21m-33-21l-9 48M1235 221l-35 128 36-21 42 18m-42-18l-18 60','#8da7aa',2,.5);
   detail+=stroke('M268 808l96-34 47 19 43-31M364 774l-24-34M411 793l15 48M1060 884l60-27 37 9 70-32m-107 23l-15-34','#d6e5e3',1.6,.7);
   for(let n=0;n<23;n++){const x=30+n*71,y=550+(n*53)%157;detail+=stroke(`M${x} ${y}q14-5 25-2`,'#a6bfc0',1,.35);}
 }else if(ruins){
   detail+=stroke('M326 438h354m240 0h354M326 503h354m240 0h354M326 566h354m240 0h354M326 631h354m240 0h354M419 395v43m144 0v65m-106 0v63m156 0v65M1186 395v43m-142 0v65m106 0v63m-154 0v65','#939780',2,.5);
   detail+=stroke('M389 290h295m234 0h289M495 246v28m139-28v28m310-28v28m136-28v28M384 363l9 6h34M1158 376l12-10h24','#f0e2c3',2,.6);
   for(const x of [84,1437])detail+=stroke(`M${x} 326l24-5 21 4m-17-3l-5 16 8 13 -8 22m-16 57l26-2 11 3M${x} 621l13 4 20-5`,'#8d927b',2,.5);
   detail+=stroke('M237 743h1127M176 794h1246M99 852h1399M8 922h1582','#f1dfb9',2,.5);
   for(let n=0;n<12;n++){const x=45+n*137;detail+=stroke(`M${x} 911l-10 30m31-101l-8 27`,'#8c927e',1.5,.5);}
 }else if(fire){
   detail+=stroke('M359 350h278m328 0h280M359 425h275m332 0h278M359 498h275m332 0h278M359 574h275m332 0h278M465 307v43m117 0v74M1123 307v43m-117 0v74','#252f3b',3,.6);
   detail+=stroke('M369 310h253m358 0h250M98 263v460M1447 263v460','#a19796',2,.4);
   for(const x of [247,1341])for(const y of [301,374,451,531,589])detail+=`<circle cx="${x}" cy="${y}" r="4" fill="#a38f82" stroke="#292f38" stroke-width="2"/>`;
   detail+=stroke('M640 648l-20-74 7-25 -15-42M964 646l19-62 -8-28 13-31M458 897l24-4 7-16M1080 940l-15-21 -14-1','#bb785d',2,.55);
 }else{
   for(const side of [0,1]){const x=side?1450:65;detail+=stroke(`M${x} 345l25 40 -9 27 31 35 -12 59 37 37M${x+4} 439l45 5m-6 87l37-6M${x-30} 693l80-21 49 14`,'#525f60',2,.5);}
   detail+=stroke('M24 347l61-20 32 7M1450 358l78-32 66 11M39 741l124-35M1410 759l118-30','#d4c3a5',2,.5);
 }
 const additions='<!-- native-defs -->'+defs.join('')+'<!-- end-native-defs -->';
 head=split<0?head+'<defs>'+additions+'</defs>':head.replace('</defs>',additions+'</defs>');
 body=body.replace('</svg>','<!-- native-detail -->'+detail+'<!-- end-native-detail --></svg>');
 await fs.writeFile(new URL(name,root),head+body);
}
await writeCliffPreview();
console.log('Refined existing silhouettes and palette in 14 native assets; synchronized cliff preview.');
