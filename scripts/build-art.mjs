// Original SVG artwork: shared geometry and palette, built with Node only.
import fs from 'node:fs';
import {THEME} from '../dist/theme.mjs';
const target=new URL('../dist/assets/',import.meta.url);fs.mkdirSync(target,{recursive:true});
const glyphs={
  diamond:'M64 38 Q67 38 71 43 L86 58 Q91 63 86 68 L71 83 Q64 90 57 83 L42 68 Q37 63 42 58 L57 43 Q61 38 64 38Z',
  star:'M64 36 Q67 36 69 42 L74 53 88 55 Q94 56 89 62 L79 72 81 86 Q82 92 76 89 L64 82 52 89 Q46 92 47 86 L49 72 39 62 Q34 56 40 55 L54 53 59 42 Q61 36 64 36Z',
  ring:'M64 38 A25 25 0 1 1 63.99 38Z M64 51 A12 12 0 1 0 64.01 51Z',
  square:'M52 40H76Q88 40 88 52V76Q88 88 76 88H52Q40 88 40 76V52Q40 40 52 40Z M56 53Q53 53 53 56V72Q53 75 56 75H72Q75 75 75 72V56Q75 53 72 53Z',
  triangle:'M59 40 Q64 31 69 40 L90 77 Q95 86 85 86 H43 Q33 86 38 77Z'
};
const body='M36 11H92C110 11 117 21 117 39V88C117 108 107 117 89 117H39C21 117 11 108 11 89V39C11 20 20 11 36 11Z';
const face='M36 11Q64 9 91 11C107 12 115 21 115 37V77C115 96 106 105 88 105Q64 107 39 105C21 104 13 96 13 79V37C13 20 21 12 36 11Z';
const defs=THEME.palette.map((p,i)=>`
<linearGradient id="side${i}" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="${p.mid}"/><stop offset=".55" stop-color="${p.dark}"/><stop offset="1" stop-color="${p.edge}"/></linearGradient>
<radialGradient id="front${i}" cx=".3" cy=".18" r=".95" fx=".28" fy=".16"><stop stop-color="${p.light}"/><stop offset=".25" stop-color="${p.color}"/><stop offset=".65" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.dark}"/></radialGradient>
<linearGradient id="rim${i}" x1=".1" y1="0" x2=".75" y2="1"><stop stop-color="#ffffff" stop-opacity=".8"/><stop offset=".32" stop-color="${p.light}" stop-opacity=".45"/><stop offset=".7" stop-color="${p.color}" stop-opacity=".05"/><stop offset="1" stop-color="${p.edge}" stop-opacity=".4"/></linearGradient>
<linearGradient id="shine${i}" x2=".15" y2="1"><stop stop-color="#ffffff" stop-opacity=".5"/><stop offset=".45" stop-color="${p.light}" stop-opacity=".13"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<radialGradient id="contact${i}"><stop stop-color="#061226" stop-opacity=".65"/><stop offset="1" stop-color="#061226" stop-opacity="0"/></radialGradient>
<linearGradient id="glyph${i}" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="${p.light}"/><stop offset=".28" stop-color="${p.color}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient>
<g id="base${i}">
 <ellipse cx="65" cy="120" rx="55" ry="7" fill="url(#contact${i})"/>
 <path d="${body}" fill="url(#side${i})" stroke="${p.edge}" stroke-width="1.5"/>
 <path d="M109 34Q119 49 116 89Q116 108 100 114L97 103Q109 92 109 77Z" fill="${p.edge}" opacity=".24"/>
 <path d="M21 98Q30 109 46 110H86Q104 109 114 97Q112 114 90 118H39Q24 115 18 107Z" fill="${p.dark}" opacity=".48"/>
 <path d="${face}" fill="url(#front${i})" stroke="url(#rim${i})" stroke-width="2"/>
 <path d="M26 22Q48 11 84 17Q103 20 108 35Q110 44 102 49Q88 34 65 33Q39 33 19 47Q16 31 26 22Z" fill="url(#shine${i})"/>
 <path d="M20 62V38Q20 22 36 19Q54 15 76 18" fill="none" stroke="${p.light}" stroke-width="3" stroke-linecap="round" opacity=".62"/>
 <path d="M28 23Q37 18 48 19" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".88"/>
 <path d="M29 99Q55 106 85 102Q99 100 107 91" fill="none" stroke="${p.light}" stroke-width="2" stroke-linecap="round" opacity=".3"/>
 <path d="M38 114Q64 120 89 113" fill="none" stroke="${p.color}" stroke-width="2" stroke-linecap="round" opacity=".28"/>
 <path d="${glyphs[p.symbol]}" transform="translate(0 4)" fill="${p.edge}" opacity=".55" fill-rule="evenodd"/>
 <path d="${glyphs[p.symbol]}" fill="url(#glyph${i})" fill-rule="evenodd" stroke="${p.dark}" stroke-width="1.5" stroke-linejoin="round"/>
 <path d="M52 46 Q58 41 63 42" fill="none" stroke="${p.light}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
</g>`).join('');
// Light lives on the toy surface: cached gradient halos, no mechanical sockets.
const energyDefs=`
 <linearGradient id="rowRim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#efa5ff"/><stop offset=".45" stop-color="#ff51ee"/><stop offset="1" stop-color="#c895ff"/></linearGradient>
 <linearGradient id="columnRim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c6ffff"/><stop offset=".45" stop-color="#39d5ff"/><stop offset="1" stop-color="#8cb9ff"/></linearGradient>
 <linearGradient id="blastRim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffecac"/><stop offset=".4" stop-color="#ff8e84"/><stop offset="1" stop-color="#ff75e3"/></linearGradient>
 <linearGradient id="lightBand" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f29aff" stop-opacity="0"/><stop offset=".25" stop-color="#f872ff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff5ff" stop-opacity=".85"/><stop offset=".75" stop-color="#f872ff" stop-opacity=".25"/><stop offset="1" stop-color="#f29aff" stop-opacity="0"/></linearGradient>
 <linearGradient id="lightCore" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ffeaff" stop-opacity="0"/><stop offset=".16" stop-color="#ffd8ff"/><stop offset=".5" stop-color="#fff"/><stop offset=".84" stop-color="#ffd8ff"/><stop offset="1" stop-color="#ffeaff" stop-opacity="0"/></linearGradient>
 <linearGradient id="columnBand" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#7adaff" stop-opacity="0"/><stop offset=".25" stop-color="#5bdcff" stop-opacity=".25"/><stop offset=".5" stop-color="#efffff" stop-opacity=".85"/><stop offset=".75" stop-color="#5bdcff" stop-opacity=".25"/><stop offset="1" stop-color="#7adaff" stop-opacity="0"/></linearGradient>
 <linearGradient id="columnCore" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#eaffff" stop-opacity="0"/><stop offset=".16" stop-color="#c9ffff"/><stop offset=".5" stop-color="#fff"/><stop offset=".84" stop-color="#c9ffff"/><stop offset="1" stop-color="#eaffff" stop-opacity="0"/></linearGradient>
 <radialGradient id="starHalo"><stop stop-color="#fffcd4" stop-opacity=".85"/><stop offset=".4" stop-color="#ffe176" stop-opacity=".45"/><stop offset=".7" stop-color="#ff9396" stop-opacity=".18"/><stop offset="1" stop-color="#ff79d9" stop-opacity="0"/></radialGradient>
 <linearGradient id="starGold" x1=".2" y1="0" x2=".65" y2="1"><stop stop-color="#ffffe2"/><stop offset=".35" stop-color="#fff586"/><stop offset=".65" stop-color="#ffe044"/><stop offset="1" stop-color="#ffac37"/></linearGradient>`;
const rim=kind=>`<g fill="none"><path d="${body}" stroke="url(#${kind}Rim)" stroke-width="18" opacity=".09"/><path d="${body}" stroke="url(#${kind}Rim)" stroke-width="10" opacity=".22"/><path d="${body}" stroke="url(#${kind}Rim)" stroke-width="5" opacity=".75"/><path d="${body}" stroke="#fff4ff" stroke-width="1.5" opacity=".95"/></g>`;
const row=`<g id="row">
 <rect x="5" y="40" width="118" height="46" rx="22" fill="url(#lightBand)"/>
 <rect x="12" y="54" width="104" height="18" rx="9" fill="url(#lightCore)" opacity=".35"/>
 <rect x="15" y="58" width="98" height="10" rx="5" fill="url(#lightCore)" opacity=".75"/>
 <rect x="18" y="61" width="92" height="4" rx="2" fill="url(#lightCore)"/>
 <path d="M9 49L15 56L11 63M117 64L113 70L119 77" fill="none" stroke="#ffe5ff" stroke-width="1.7" opacity=".7"/>
 <circle cx="14" cy="43" r="1.5" fill="#fff"/><circle cx="113" cy="83" r="2" fill="#ffd5ff"/>
</g>`;
const column=row.replace('id="row"','id="column"').replaceAll('lightBand','columnBand').replaceAll('lightCore','columnCore').replaceAll('#ffe5ff','#e5ffff').replaceAll('#ffd5ff','#c9ffff');
const star='M64 27L75 49L100 53L82 71L86 97L64 85L42 97L46 71L28 53L53 49Z';
const blast=`<g id="blast">
 <circle cx="64" cy="63" r="59" fill="url(#starHalo)"/>
 <path d="${star}" fill="none" stroke="#fff8b4" stroke-width="13" stroke-linejoin="round" opacity=".15"/>
 <path d="${star}" fill="none" stroke="#fff1a0" stroke-width="7" stroke-linejoin="round" opacity=".38"/>
 <path d="${star}" transform="translate(0 2)" fill="#ef9630" opacity=".45"/>
 <path d="${star}" fill="url(#starGold)" stroke="#ffffdc" stroke-width="2.3" stroke-linejoin="round"/>
 <path d="M64 30L64 64L32 54L54 51Z" fill="#ffffef" opacity=".55"/>
 <path d="M64 64L82 94L64 83L45 94Z" fill="#ffc43d" opacity=".6"/>
 <path d="M61 34L55 51L37 55" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>
 <path d="M22 29V39M17 34H27M106 86V94M102 90H110" stroke="#fff9d7" stroke-width="1.5" stroke-linecap="round"/>
 <circle cx="105" cy="33" r="2" fill="#fff"/><circle cx="22" cy="87" r="1.8" fill="#ffe0c7"/>
</g>`;
let tiles='';for(let rowIndex=0;rowIndex<4;rowIndex++)for(let i=0;i<5;i++)tiles+=`<g transform="translate(${i*128} ${rowIndex*128})"><use href="#base${i}"/>${rowIndex?rim(['','row','column','blast'][rowIndex]):''}${rowIndex===1?'<use href="#row"/>':rowIndex===2?'<use href="#column" transform="rotate(90 64 64)"/>':rowIndex===3?'<use href="#blast"/>':''}</g>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="512" viewBox="0 0 640 512"><title>方块乱斗原创玩具积木图集</title><defs>${energyDefs}${defs}${row}${column}${blast}</defs>${tiles}</svg>`;
fs.writeFileSync(new URL('toy-atlas.svg',target),svg);
if(!process.argv.includes('--atlas-only')){
const well=`<g id="pocket"><rect x="3" y="4" width="58" height="57" rx="13" fill="#0e1c31"/><rect x="4" y="6" width="56" height="54" rx="12" fill="url(#well)" stroke="#324966" stroke-width="1"/><path d="M13 9H51" stroke="#080f20" opacity=".5" stroke-width="2" stroke-linecap="round"/><path d="M15 58H49" stroke="#466183" opacity=".4" stroke-width="1" stroke-linecap="round"/><circle cx="10" cy="52" r="1.2" fill="#4b6484" opacity=".3"/></g>`;
let wells='';for(let r=0;r<8;r++)for(let c=0;c<8;c++)wells+=`<use href="#pocket" x="${c*64}" y="${r*64}"/>`;
fs.writeFileSync(new URL('toy-board.svg',target),`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="well" x2="0" y2="1"><stop stop-color="#1c2c45"/><stop offset="1" stop-color="#14243c"/></linearGradient>${well}</defs><rect width="512" height="512" fill="${THEME.board.base}"/>${wells}</svg>`);
fs.writeFileSync(new URL('arcade-backdrop.svg',target),`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><g fill="none" stroke="#94aac8" stroke-width="1" opacity=".12"><path d="M0 0H240V240H0Z M0 120H240 M120 0V240" opacity=".3"/><path d="M31 36H43 M37 30V42 M186 192H198 M192 186V198"/><circle cx="181" cy="48" r="5"/><path d="M43 173L51 181L43 189L35 181Z"/></g></svg>`);
fs.writeFileSync(new URL('brandmark.svg',target),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="3" y="8" width="58" height="54" rx="17" fill="#689237"/><rect x="3" y="2" width="58" height="54" rx="17" fill="#d4fb6a" stroke="#f0ffbc" stroke-width="2"/><path d="M12 12H29" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M18 25H28V18H36V25H46V34H36V44H28V34H18Z" fill="#203e43"/><circle cx="48" cy="45" r="3" fill="#8dba43"/></svg>`);
}
console.log('Built 20 tile variants'+(process.argv.includes('--atlas-only')?' only.':' and 3 shared SVG resources.'));
