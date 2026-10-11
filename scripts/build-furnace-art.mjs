import fs from 'node:fs/promises';
import {FURNACE_TERRAIN as terrain} from '../dist/maps.mjs';
const out=new URL('../dist/assets/maps/',import.meta.url);
const svg=(view,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}">${body}</svg>`;
const save=(name,view,body)=>fs.writeFile(new URL(name,out),svg(view,body));
const shape='M120 0H360V60H420V120H480V360H420V420H360V480H120V420H60V360H0V120H60V60H120Z';
const cells=terrain.cells.flatMap((s,i)=>s==='hole'?[]:[`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`]).join('');
const definitions=`<linearGradient id="metal" x2=".2" y2="1"><stop stop-color="#929091"/><stop offset=".22" stop-color="#656572"/><stop offset="1" stop-color="#323641"/></linearGradient><linearGradient id="obsidian" x2=".3" y2="1"><stop stop-color="#73707b"/><stop offset=".35" stop-color="#52525e"/><stop offset="1" stop-color="#383d49"/></linearGradient><linearGradient id="lava" x2="0" y2="1"><stop stop-color="#db9266"/><stop offset=".25" stop-color="#b66752"/><stop offset="1" stop-color="#6b4146"/></linearGradient>`;
const stage=`<defs>${definitions}<mask id="outside" maskUnits="userSpaceOnUse" x="-80" y="-40" width="640" height="600"><rect x="-80" y="-40" width="640" height="600" fill="white"/><g fill="black">${cells}</g></mask></defs><g mask="url(#outside)">
 <ellipse cx="240" cy="466" rx="292" ry="92" fill="#222d39" opacity=".65"/>
 <path d="M-75 399Q68 365 158 422T349 433T558 390V501Q417 541 299 510T-75 505Z" fill="url(#lava)"/>
 <path d="M-74 428Q71 398 151 452M327 474Q458 415 552 426M113 501Q208 529 320 505" fill="none" stroke="#e1a271" stroke-width="4" opacity=".45"/>
 <path d="M-80 151H58V179H-80ZM423 151H560V179H423ZM-80 304H58V332H-80ZM423 304H560V332H423Z" fill="url(#metal)" stroke="#8c8580" stroke-width="3"/>
 <path d="M-59 120V368M538 120V368" stroke="#363d47" stroke-width="32"/><path d="M-59 120V368M538 120V368" stroke="#737079" stroke-width="12"/>
 <path d="${shape}" transform="translate(0 44)" fill="#272e3a" stroke="#373b48" stroke-width="24" stroke-linejoin="round"/>
 <path d="${shape}" transform="translate(0 20)" fill="url(#obsidian)" stroke="#696475" stroke-width="20" stroke-linejoin="round"/>
 <path d="${shape}" fill="url(#obsidian)" stroke="url(#metal)" stroke-width="24" stroke-linejoin="round"/>
 <path d="${shape}" fill="none" stroke="#b1a69b" stroke-width="3" stroke-linejoin="round"/>
 <path d="M67 375L102 394L106 427L149 446M381 425L373 451L338 477M429 236L450 257L444 279" stroke="#d58a64" stroke-width="3" fill="none"/>
 <g fill="#c5b29c" stroke="#393e49" stroke-width="3">${[[120,-9],[360,-9],[-9,150],[489,150],[-9,330],[489,330],[120,489],[360,489]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>
 <path d="M120 502H360V526H120Z" fill="url(#metal)" stroke="#86808b" stroke-width="2"/><path d="M157 509V520M184 509V520M211 509V520M238 509V520M265 509V520M292 509V520M319 509V520" stroke="#292e39" stroke-width="7"/>
 </g>`;
await save('furnace-stage.svg','-80 -40 640 600',stage);
let board=`<defs>${definitions}</defs><rect width="480" height="480" fill="#414550"/>`;
for(let i=0;i<64;i++){const x=i%8*60,y=Math.floor(i/8)*60;board+=`<g transform="translate(${x} ${y})"><rect x="2" y="2" width="56" height="56" rx="8" fill="#252c37"/><rect x="3" y="3" width="54" height="50" rx="8" fill="url(#obsidian)"/><path d="M9 5H44M6 14V24" stroke="#a099a2" stroke-width="1.5" opacity=".4"/><path d="M12 55H47" stroke="#242934" stroke-width="2"/>${i%3===0?'<path d="M0 27L3 33L1 40M57 0L55 8L59 17" stroke="#bf755e" stroke-width="2" fill="none"/>':''}</g>`;}
await save('furnace-board.svg','0 0 480 480',board);
await save('furnace-preview.svg','-80 -40 640 600',stage+`<g fill="#51535f" stroke="#373d47" stroke-width="3">${cells}</g><path d="M180 0L177 65L182 121M360 180L356 237L363 300M120 300L116 363L125 421" stroke="#bd7b60" stroke-width="3" fill="none"/>`);
await save('furnace-rock.svg','0 0 128 128',`<defs>${definitions}</defs><ellipse cx="64" cy="112" rx="48" ry="10" fill="#18242d" opacity=".6"/><path d="M18 33L39 14L86 10L112 35L111 91L86 115L34 110L14 86Z" fill="url(#obsidian)" stroke="#272c39" stroke-width="4"/><path d="M18 33L39 14L86 10L112 35L76 47L40 42Z" fill="#827985"/><path d="M76 47L112 35L111 91L86 115L74 91Z" fill="#383842"/><path d="M43 21L48 49L36 65L50 80L44 106M48 49L71 56L76 76L100 83" stroke="#d59068" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M26 35L38 25M24 44L27 60" stroke="#b4a59e" stroke-width="3" stroke-linecap="round"/>`);
await save('furnace-hall.svg','0 0 1600 1000',`<defs><linearGradient id="cave" x2="0" y2="1"><stop stop-color="#313b49"/><stop offset=".6" stop-color="#4b4651"/><stop offset="1" stop-color="#333c46"/></linearGradient>${definitions}</defs><rect width="1600" height="1000" fill="url(#cave)"/>
 <path d="M0 0H1600V196L1501 174L1365 204L1280 134L1123 158L1060 122L928 156L852 98L748 129L644 100L505 160L381 116L253 177L144 133L0 194Z" fill="#252f3c"/>
 <path d="M0 151Q255 45 454 182Q799 39 1110 165Q1375 62 1600 166" fill="none" stroke="#65626b" stroke-width="47"/><path d="M0 157Q255 51 454 188Q799 45 1110 171Q1375 68 1600 172" fill="none" stroke="#353c49" stroke-width="23"/>
 <path d="M357 283H1244V675H357Z" fill="#353b46"/><path d="M382 272H1217V306H382Z" fill="#777078"/>
 <path d="M634 676V395Q800 238 966 395V676Z" fill="#272e39" stroke="#5a555f" stroke-width="22"/>
 <path d="M694 609Q704 525 751 483Q730 560 778 546Q821 477 807 419Q887 483 885 551Q921 526 922 486Q963 569 933 620Z" fill="#866456" opacity=".6"/><path d="M754 610Q752 566 789 548Q787 588 822 563Q854 530 850 490Q903 559 889 610Z" fill="#a37658" opacity=".48"/>
 <g fill="url(#metal)" stroke="#292f3a" stroke-width="4"><path d="M89 74H163V813H89ZM1437 74H1511V813H1437Z"/><path d="M42 214H210V257H42ZM1390 214H1558V257H1390ZM40 743H212V798H40ZM1388 743H1560V798H1388Z"/></g>
 <path d="M184 292H263V612H347M1416 292H1337V612H1253" fill="none" stroke="#2a323d" stroke-width="39" stroke-linejoin="round"/><path d="M184 282H253V602H347M1416 282H1347V602H1253" fill="none" stroke="#69636d" stroke-width="20" stroke-linejoin="round"/>
 <path d="M0 766Q800 682 1600 766V1000H0Z" fill="#343d48"/><path d="M0 821Q231 768 452 826L504 888L408 945L0 966ZM1600 821Q1374 768 1148 826L1096 888L1192 945L1600 966Z" fill="url(#lava)" opacity=".62"/>
 <path d="M0 854Q237 809 381 864M1231 887Q1420 817 1600 863" stroke="#c88964" stroke-width="6" opacity=".35" fill="none"/>
 <path d="M374 1000L548 766H1052L1226 1000Z" fill="#414550"/><path d="M504 825H1096M465 877H1135M418 940H1182" stroke="#67616b" stroke-width="12"/>
 <g fill="#92847c" opacity=".45">${[[126,230],[1474,230],[126,771],[1474,771],[403,290],[1197,290]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>
 `);
console.log('Built cartoon underground furnace, obsidian mechanism, lava seams and cooled rock.');
