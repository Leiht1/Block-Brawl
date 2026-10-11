import fs from 'node:fs/promises';
import {mapPreview} from './map-preview-art.mjs';
import {TEST_TERRAINS} from '../dist/terrain.mjs';
const out=new URL('../dist/assets/maps/',import.meta.url);
const svg=(view,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}">${body}</svg>`;
const save=(name,view,body)=>fs.writeFile(new URL(name,out),svg(view,body));
const rects=t=>t.cells.flatMap((s,i)=>s==='hole'?[]:[`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`]).join('');
const perimeter=t=>{const edges=[],has=(r,c)=>r>=0&&r<8&&c>=0&&c<8&&t.cells[r*8+c]!=='hole';for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(has(r,c)){let x=c*60,y=r*60;if(!has(r-1,c))edges.push([[x,y],[x+60,y]]);if(!has(r,c+1))edges.push([[x+60,y],[x+60,y+60]]);if(!has(r+1,c))edges.push([[x+60,y+60],[x,y+60]]);if(!has(r,c-1))edges.push([[x,y+60],[x,y]]);}let e=edges.shift(),points=[...e];while(edges.length){const p=points.at(-1),i=edges.findIndex(e=>e[0][0]===p[0]&&e[0][1]===p[1]);if(i<0)throw Error('Stage boundary');points.push(edges.splice(i,1)[0][1]);}return 'M'+points.map(p=>p.join(' ')).join('L')+'Z';};
const outside=t=>`<mask id="outside" maskUnits="userSpaceOnUse" x="-80" y="-40" width="640" height="600"><rect x="-80" y="-40" width="640" height="600" fill="white"/><g fill="black">${rects(t)}</g></mask>`;
const ice=TEST_TERRAINS.crystal;
let iceFaces='';
for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(ice.cells[r*8+c]==='cell'&&(r===7||ice.cells[(r+1)*8+c]==='hole')){
 const x=c*60-8,y=(r+1)*60,w=76,d=r===7?54:37;
 iceFaces+=`<path d="M${x} ${y-4}H${x+w}L${x+w-5} ${y+d*.5}L${x+w-18} ${y+d}L${x+7} ${y+d-4}Z" fill="url(#glass)" stroke="#91aeb5" stroke-width="1.5"/><path d="M${x+5} ${y+3}L${x+26} ${y+d-8}L${x+52} ${y+11}L${x+w-9} ${y+d*.6}" fill="#f4faf3" opacity=".3"/><path d="M${x+8} ${y+10}L${x+w-7} ${y+13}" stroke="#edf6f0" stroke-width="2" opacity=".55"/>`;
}
await save('crystal-stage.svg','-80 -40 640 600',`<defs><linearGradient id="glass" x2=".6" y2="1"><stop stop-color="#e0eee9" stop-opacity=".92"/><stop offset=".4" stop-color="#adc8cb" stop-opacity=".78"/><stop offset="1" stop-color="#739da9" stop-opacity=".65"/></linearGradient><linearGradient id="snow" x2=".2" y2="1"><stop stop-color="#fbfcf2"/><stop offset="1" stop-color="#c7d8d5"/></linearGradient>${outside(ice)}</defs>
 <g mask="url(#outside)"><ellipse cx="239" cy="408" rx="310" ry="142" fill="#91aaad" opacity=".24"/><ellipse cx="240" cy="422" rx="291" ry="128" fill="#acbec0" opacity=".38"/>
 <path d="M-80 430Q-2 393 64 428L113 470L171 494L243 514L309 500L373 459L432 413Q505 407 560 427Q523 491 433 495Q327 547 231 533Q111 505 47 491Q-48 486 -80 470Z" fill="url(#snow)"/><path d="M-80 451Q-9 421 73 455M393 452Q465 410 560 451" fill="none" stroke="#ffffff" stroke-width="7" opacity=".7"/>
 ${iceFaces}<path d="${perimeter(ice)}" fill="url(#glass)" stroke="#b7d4d3" stroke-width="21" stroke-linejoin="round"/><path d="${perimeter(ice)}" fill="none" stroke="#f0f6ec" stroke-width="4" stroke-linejoin="round"/>
 <g stroke="#dfece5" stroke-width="2"><path d="M104 95L117 38L135 73L131 112Z" fill="#9fbfc2"/><path d="M117 38L122 98L131 112L135 73Z" fill="#d6e4df"/><path d="M379 376L400 325L416 361L410 405Z" fill="#91b0b7"/><path d="M400 325L405 382L410 405L416 361Z" fill="#d9e8e2"/></g>
 <path d="M177 486L190 483L202 489L196 498L182 498Z" fill="#b4c9c8"/><path d="M76 325L96 326M396 104L412 101" stroke="#f4f8f1" stroke-width="5" stroke-linecap="round"/></g>`);

const altar=TEST_TERRAINS.ruins;
await save('ruins-stage.svg','-80 -40 640 600',`<defs><linearGradient id="stone" x2=".4" y2="1"><stop stop-color="#e6d9b7"/><stop offset=".4" stop-color="#b5a88d"/><stop offset="1" stop-color="#887e6b"/></linearGradient><linearGradient id="steps" x2="0" y2="1"><stop stop-color="#b8ae93"/><stop offset="1" stop-color="#8b8b79"/></linearGradient>${outside(altar)}</defs><g mask="url(#outside)">
 <path d="M-80 397H560V560H-80Z" fill="#b5ad95"/><path d="M-80 429H560V463H-80Z" fill="#ded1b0"/><path d="M-80 451H560V466H-80Z" fill="#938e7a"/><path d="M-54 467H534V505H-54Z" fill="#d2c4a2"/><path d="M-54 494H534V509H-54Z" fill="#817e6d"/><path d="M-25 511H505V548H-25Z" fill="#c3b796"/><path d="M-25 538H505V554H-25Z" fill="#83816e"/>
 <path d="M-10 -10H490V483L479 524H0L-10 483Z" fill="url(#stone)" stroke="#8b816c" stroke-width="2"/><path d="M-10 -10H490V0H-10Z" fill="#efe3c6"/><path d="M2 492H478M10 511H470" stroke="#e2d0ae" stroke-width="3" opacity=".6"/>
 <path d="M52 484V509M149 507V525M330 484V509M433 507V525" stroke="#8b806a" stroke-width="3"/>
 <path d="M-13 28H-55V376H-13M493 28H535V376H493" fill="url(#stone)" stroke="#9b917b" stroke-width="2"/><path d="M-63 21H-6V44H-63ZM486 21H543V44H486Z" fill="#d9c9a6"/><path d="M-61 362H-6V392H-61ZM486 362H541V392H486Z" fill="#a3977e"/><path d="M-43 55V346M507 55V346" stroke="#f2e3c3" stroke-opacity=".5" stroke-width="7"/>
 <path d="M-12 94L-27 109L-12 124M492 94L507 109L492 124M227 492L240 485L253 492L240 500Z" stroke="#867e67" stroke-width="3" fill="none"/>
 <path d="M-10 388Q-35 378 -46 404L-13 416ZM482 12Q506 5 524 28L498 41Z" fill="#8c9c70"/><path d="M-43 408Q-17 403 -8 424M507 20L496 36" stroke="#b0bc8a" stroke-width="3" fill="none"/>
 </g>`);
for(const [kind,base,dark,mid,highlight] of [['crystal','#c2d0d0','#859da6','#b7c9cc','#f2f5eb'],['ruins','#c2b699','#8c8675','#aea68e','#e9dec1']]){
 let body=`<defs><linearGradient id="well" x2=".2" y2="1"><stop stop-color="${dark}"/><stop offset=".3" stop-color="${mid}"/><stop offset="1" stop-color="${base}"/></linearGradient></defs><rect width="480" height="480" fill="${base}"/>`;
 for(let r=0;r<8;r++)for(let c=0;c<8;c++)body+=`<g transform="translate(${c*60} ${r*60})"><rect x="2" y="3" width="56" height="55" rx="8" fill="${dark}"/><rect x="3" y="5" width="54" height="52" rx="7" fill="url(#well)"/><path d="M9 57H50Q56 57 57 51" stroke="${highlight}" stroke-width="1.5" fill="none" opacity=".6"/></g>`;
 await save(kind+'-board.svg','0 0 480 480',body);
}
await save('ruins-pillar.svg','0 0 128 128',`<defs><linearGradient id="s" x2=".6" y2="1"><stop stop-color="#e1d2ac"/><stop offset=".45" stop-color="#b7a789"/><stop offset="1" stop-color="#817c6b"/></linearGradient></defs><ellipse cx="64" cy="113" rx="50" ry="9" fill="#596052" opacity=".4"/><path d="M17 32L38 13H92L112 33V96L92 114H35L16 96Z" fill="url(#s)" stroke="#716e5c" stroke-width="3"/><path d="M17 32L38 13H92L112 33L88 47H37Z" fill="#e5d8b8"/><path d="M89 47L112 33V96L92 114Z" fill="#8d8570"/><path d="M31 43H91V54H31ZM25 98H91V107H25Z" fill="#968b71"/><path d="M42 71L62 56L82 71L62 87Z" fill="#807f69"/><path d="M51 71L62 63L73 71L62 80Z" fill="#b4c1a0"/><path d="M31 91H85M28 40L38 23H82" fill="none" stroke="#f0e3c4" stroke-width="3"/>`);

// Deliberately different scene silhouettes; no shared recoloured scenery template.
await save('crystal-landscape.svg','0 0 1600 1000',`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#b8cbc9"/><stop offset="1" stop-color="#edf0e4"/></linearGradient><linearGradient id="lake" x2="0" y2="1"><stop stop-color="#bccfce"/><stop offset="1" stop-color="#92adb4"/></linearGradient><linearGradient id="snow" x2=".4" y2="1"><stop stop-color="#f5f4e8"/><stop offset="1" stop-color="#c8d5d0"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#sky)"/>
 <g fill="#e7ede3" opacity=".8"><path d="M0 140Q170 88 330 130Q590 58 774 113Q1030 67 1220 129Q1472 77 1600 120V188H0Z"/><path d="M0 264Q330 225 690 251Q1070 207 1600 243V283H0Z"/></g>
 <path d="M0 414L164 192L351 377L465 245L669 438L850 292L1000 428L1244 188L1465 387L1600 252V651H0Z" fill="#abbfbd"/><path d="M106 269L164 192L243 274L211 271L179 304L155 280ZM407 310L465 245L540 321L502 304L479 334L451 319ZM1174 273L1244 188L1343 288L1285 268L1255 306L1226 278Z" fill="#f0f1e6"/>
 <path d="M0 503Q213 391 388 504T745 502T1096 500T1600 476V1000H0Z" fill="url(#snow)"/>
 <ellipse cx="801" cy="776" rx="708" ry="255" fill="#e8eee5"/><ellipse cx="801" cy="792" rx="630" ry="220" fill="url(#lake)"/><path d="M262 777Q443 710 580 752M1026 856Q1200 873 1376 801M611 913Q797 934 959 921" stroke="#e2ece5" stroke-width="5" fill="none" opacity=".55"/>
 <path d="M0 748Q164 656 266 693L231 761L154 833L0 883ZM1600 679Q1455 650 1382 714L1412 821L1600 850Z" fill="url(#snow)"/>
 <g fill="#8fa7a7" stroke="#dde8df" stroke-width="3"><path d="M100 640L128 542L152 612L146 667Z"/><path d="M1415 591L1449 489L1472 547L1469 620Z"/></g><path d="M94 664Q134 645 168 665M1393 618Q1445 604 1493 625" fill="none" stroke="#f3f5eb" stroke-width="13" stroke-linecap="round"/>
 <path d="M0 944Q210 906 404 981H0M1600 913Q1429 905 1269 1000H1600Z" fill="#d6ded4"/>`);
await save('ruins-temple.svg','0 0 1600 1000',`<defs><linearGradient id="haze" x2="0" y2="1"><stop stop-color="#cbcdb8"/><stop offset="1" stop-color="#e4dfcb"/></linearGradient><linearGradient id="stone" x2=".5" y2="1"><stop stop-color="#dfd1b0"/><stop offset="1" stop-color="#aaa68c"/></linearGradient><linearGradient id="floor" x2="0" y2="1"><stop stop-color="#c4bda4"/><stop offset="1" stop-color="#a2a38f"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#haze)"/>
 <path d="M0 337Q219 195 426 298Q586 160 794 286Q1045 165 1246 294Q1431 198 1600 282V718H0Z" fill="#aeb9a3" opacity=".55"/>
 <path d="M326 385H1274V751H326Z" fill="#b9b89f"/><path d="M311 353H1290V394H311Z" fill="#d0c8ac"/><path d="M387 271H1213V357H387Z" fill="#cbc4a8"/><path d="M467 237H1133V280H467Z" fill="#dfd4b7"/><path d="M681 427Q800 326 919 427V721H681Z" fill="#929d8c"/><path d="M712 431Q800 358 888 431V721H712Z" fill="#778b7c" opacity=".45"/>
 <g fill="url(#stone)" stroke="#a4a28a" stroke-width="3"><path d="M68 148H179V761H68ZM1421 149H1532V761H1421Z"/><path d="M284 410H354V742H284ZM1246 410H1316V742H1246Z"/></g>
 <g fill="#d7caaa"><path d="M47 125H200V180H47ZM1400 125H1553V180H1400ZM45 725H201V786H45ZM1399 725H1555V786H1399Z"/></g>
 <path d="M93 194V689M1446 194V689" stroke="#eee0bf" stroke-width="14" opacity=".55"/><path d="M153 200V694M1505 200V694" stroke="#8e937e" stroke-width="11" opacity=".3"/>
 <path d="M0 715H1600V1000H0Z" fill="url(#floor)"/><path d="M236 728H1364V758H236ZM173 780H1427V808H173ZM96 839H1504V871H96ZM0 909H1600V944H0Z" fill="#dfd1ad"/><path d="M236 755H1364M173 807H1427M96 870H1504M0 943H1600" stroke="#979b85" stroke-width="8"/>
 <path d="M54 169Q44 190 74 203L115 182L102 166ZM1468 758Q1438 738 1410 761L1409 780L1468 784ZM1160 359Q1134 337 1108 361L1116 378L1158 374Z" fill="#8d9f74"/>
 <g fill="none" stroke="#8d9279" stroke-width="3" opacity=".6"><path d="M104 252L121 240L140 252L121 270ZM1455 252L1474 240L1493 252L1474 270ZM471 310H536M1063 310H1129"/></g>`);
console.log('Built authored ice platform, sealed altar, two quiet cartoon environments');
for(const [kind,terrain,base] of [['cliff',TEST_TERRAINS.cliff,'#b5b4a1'],['crystal',ice,'#c2d0d0'],['ruins',altar,'#c2b699'],['forest',TEST_TERRAINS.standard,'#b5b094']]){
 let stage=kind==='forest'?svg('-80 -40 640 600','<rect x="-12" y="-12" width="504" height="504" rx="24" fill="#9f967b"/><path d="M-10 4Q-33 50 -17 82M475 365Q502 400 485 445" stroke="#76865b" stroke-width="14" fill="none"/>'):await fs.readFile(new URL(kind==='cliff'?'cliff-stage-left.svg':kind+'-stage.svg',out),'utf8');
 await fs.writeFile(new URL(kind+'-preview.svg',out),mapPreview(stage,terrain,base));
}
