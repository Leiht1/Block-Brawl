import fs from 'node:fs/promises';
import {TEST_TERRAINS} from '../dist/terrain.mjs';
const out=new URL('../dist/assets/maps/',import.meta.url);
// The miniature reuses the actual platform, then fills its playable footprint.
export function mapPreview(stage,terrain,base){
 let plate=`<g fill="${base}">`+terrain.cells.flatMap((s,i)=>s==='hole'?[]:[`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`]).join('')+'</g>';
 terrain.cells.forEach((state,i)=>{if(state==='hole')return;const x=i%8*60,y=Math.floor(i/8)*60;plate+=state==='obstacle'?`<rect x="${x+8}" y="${y+3}" width="46" height="52" rx="6" fill="#908b74"/><path d="M${x+20} ${y+20}L${x+30} ${y+12}L${x+40} ${y+20}L${x+30} ${y+29}Z" fill="#c6c2a4"/>`:`<rect x="${x+5}" y="${y+5}" width="50" height="50" rx="7" fill="#758577" opacity=".2" stroke="#56665b" stroke-opacity=".3"/>`;});
 return stage.replace('</svg>',plate+'</svg>');
}
export async function writeCliffPreview(){
 const stage=await fs.readFile(new URL('cliff-stage-left.svg',out),'utf8');
 await fs.writeFile(new URL('cliff-preview.svg',out),mapPreview(stage,TEST_TERRAINS.cliff,'#b5b4a1'));
}
