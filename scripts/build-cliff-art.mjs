// Cliff-only authored geometry. No stochastic texture; the rule footprint is the SSoT.
import fs from 'node:fs/promises';
import {writeCliffPreview} from './map-preview-art.mjs';
import {TEST_TERRAINS} from '../dist/terrain.mjs';
const out=new URL('../dist/assets/maps/',import.meta.url);
const save=(name,body)=>fs.writeFile(new URL(name,out),body);
const svg=(view,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}">${body}</svg>`;
const cells=TEST_TERRAINS.cliff.cells;
const occupied=(r,c)=>r>=0&&r<8&&c>=0&&c<8&&cells[r*8+c]==='cell';
const footprint=cells.map((s,i)=>s==='cell'?`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`:'').join('');
const defs=`<defs>
 <linearGradient id="cap" x2=".3" y2="1"><stop stop-color="#d9cdb2"/><stop offset="1" stop-color="#aaa591"/></linearGradient>
 <linearGradient id="face" x2=".18" y2="1"><stop stop-color="#b29b7f"/><stop offset=".32" stop-color="#998772"/><stop offset=".36" stop-color="#766e63"/><stop offset=".64" stop-color="#8a7c69"/><stop offset="1" stop-color="#514f4b"/></linearGradient>
 <linearGradient id="wall" x2=".7" y2="1"><stop stop-color="#c0ac8b"/><stop offset=".36" stop-color="#928674"/><stop offset="1" stop-color="#46545a"/></linearGradient>
 <linearGradient id="shade" x2="0" y2="1"><stop stop-color="#253c44" stop-opacity=".5"/><stop offset="1" stop-color="#253c44" stop-opacity="0"/></linearGradient>
 <mask id="outside" maskUnits="userSpaceOnUse" x="-480" y="-40" width="1520" height="600"><rect x="-480" y="-40" width="1520" height="600" fill="white"/><g fill="black">${footprint}</g></mask>
 </defs>`;
// Continuous silhouette boundary, including setbacks; not a rectangular surround.
const edges=[];
for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(occupied(r,c)){
 const x=c*60,y=r*60;
 if(!occupied(r-1,c))edges.push([[x,y],[x+60,y]]);
 if(!occupied(r,c+1))edges.push([[x+60,y],[x+60,y+60]]);
 if(!occupied(r+1,c))edges.push([[x+60,y+60],[x,y+60]]);
 if(!occupied(r,c-1))edges.push([[x,y+60],[x,y]]);
}
const contour=[];let edge=edges.shift();contour.push(edge[0],edge[1]);
while(edges.length){const p=contour.at(-1),n=edges.findIndex(e=>e[0][0]===p[0]&&e[0][1]===p[1]);if(n<0)throw Error('Disconnected cliff perimeter');edge=edges.splice(n,1)[0];contour.push(edge[1]);}
const path='M'+contour.map(p=>p.join(' ')).join('L')+'Z';
// Broad faces follow contiguous south-facing ledges. Lower tongues are heavier.
let faces='';
for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(occupied(r,c)&&!occupied(r+1,c)){
 const start=c;while(c+1<8&&occupied(r,c+1)&&!occupied(r+1,c+1))c++;
 const x=start*60-7,y=(r+1)*60+5,w=(c-start+1)*60+14,depth=[33,37,49,43,56,40,51,73][r];
 faces+=`<path d="M${x} ${y-9}L${x+w} ${y-9}L${x+w-4} ${y+depth*.36}L${x+w-17} ${y+depth*.74}L${x+w*.63} ${y+depth}L${x+16} ${y+depth-7}L${x-3} ${y+depth*.3}Z" fill="url(#face)" stroke="#655f53" stroke-width="2"/>
 <path d="M${x+2} ${y+10}L${x+w*.42} ${y+13}L${x+w*.59} ${y+9}L${x+w-6} ${y+12}M${x+11} ${y+depth*.62}L${x+w*.46} ${y+depth*.65}L${x+w-15} ${y+depth*.58}" fill="none" stroke="#d3bea0" stroke-opacity=".28" stroke-width="3"/>
 <path d="M${x+w-12} ${y+3}L${x+w-4} ${y+depth*.36}L${x+w-17} ${y+depth*.74}L${x+w*.63} ${y+depth}L${x+w*.7} ${y+depth*.57}Z" fill="#394a47" opacity=".16"/>
 <path d="M${x} ${y+depth}Q${x+w*.5} ${y+depth+27} ${x+w} ${y+depth}L${x+w} ${y+depth+35}H${x}Z" fill="url(#shade)"/>`;
}
const rim=`<path d="${path}" fill="url(#cap)" stroke="#c1b297" stroke-width="17" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="#f1e0be" stroke-width="2" stroke-linejoin="round"/>`;
const vine=(x,y,length)=>`<g transform="translate(${x} ${y})"><path d="M0 0C-12 22 9 37 -1 57S-10 ${length-15} -3 ${length}" fill="none" stroke="#40594a" stroke-width="4"/><path d="M-3 11Q-27 5 -18 27Q-3 31 -3 11M-3 37Q16 24 20 41Q11 56 -3 37M-5 62Q-24 56 -22 75Q-11 85 -5 62" fill="#729475" stroke="#486957" stroke-width="1.5"/><path d="M-17 12L-9 22M12 35L4 42" stroke="#b2c39a" stroke-width="2"/></g>`;
for(const side of ['left','right']){
 // The canyon wall belongs to the backdrop; only the platform moves here.
 const root='';
 // Only three fractures, tied to the thin right ledge, root shear and lower tongue.
 const sparse=vine(54,130,103)+vine(438,369,120)+`<path d="M459 121L455 129L465 132L458 146M90 306L80 326L90 335L84 345M337 483L324 500L334 505L324 538" stroke="#4d5750" stroke-width="2.5" fill="none"/><path d="M475 91L487 104L478 114Z" fill="#7c8070"/><path d="M173 425L167 441L177 449Z" fill="#667365"/><path d="M73 245L82 239L97 244L100 252L80 254Z" fill="#cec1a4"/><path d="M397 494L412 488L429 499L421 514L404 511Z" fill="#8e8571" stroke="#595c52" stroke-width="2"/><path d="M398 494L412 488L423 498L408 501Z" fill="#c4b193"/>`;
 const rubble=`<path d="M474 152L489 145L501 154L492 163L479 161Z" fill="#a89d84" stroke="#777c6b" stroke-width="1.5"/><path d="M474 152L489 145L495 153L482 155Z" fill="#d4c4a2"/><path d="M30 321L39 313L49 320L46 327L35 330Z" fill="#a99c82"/><path d="M147 446L154 439L167 447L162 458L152 455Z" fill="#c0b18e"/>`;
 await save(`cliff-stage-${side}.svg`,svg(side==='left'?'-90 -40 650 600':'-80 -40 640 600',defs+`<g mask="url(#outside)">${root}${faces}${rim}${sparse}${rubble}</g>`));
}
// Quiet shallow carved wells: no repeated fissures or decorative symbols.
let board=`<defs><linearGradient id="well" x2=".15" y2="1"><stop stop-color="#76796f"/><stop offset=".22" stop-color="#929588"/><stop offset="1" stop-color="#a6a798"/></linearGradient></defs><rect width="480" height="480" fill="#b5b4a1"/>`;
for(let r=0;r<8;r++)for(let c=0;c<8;c++)board+=`<g transform="translate(${c*60} ${r*60})"><rect x="2" y="2" width="56" height="56" rx="9" fill="#646d64"/><rect x="3" y="4" width="54" height="53" rx="8" fill="url(#well)"/><path d="M8 57H51Q57 57 57 51" fill="none" stroke="#dbd5bd" stroke-opacity=".6" stroke-width="1.5"/></g>`;
await save('cliff-board.svg',svg('0 0 480 480',board));
await writeCliffPreview();
console.log('Built cliff platforms without clipped backdrop walls');
