// Rule lettering only; retain the approved painted window and frame.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(require.resolve('sharp',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const base='art-preproduction/cards-soft-c',source=base+'/card_face_quake_soft_v4_preview.png';
const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><defs><linearGradient id="paper" x2="0" y2="1"><stop stop-color="#f4e3c6"/><stop offset="1" stop-color="#eedabc"/></linearGradient></defs><rect x="282" y="222" width="460" height="116" rx="6" fill="url(#paper)"/><text x="512" y="315" text-anchor="middle" font-family="Microsoft YaHei" font-size="96" font-weight="900" fill="#560804">裂地横扫</text><rect x="228" y="1098" width="566" height="203" rx="6" fill="url(#paper)"/><g text-anchor="middle" font-family="Microsoft YaHei" font-size="65" font-weight="900" fill="#150b04"><text x="512" y="1182">横扫落点所在一排</text><text x="512" y="1275">清除有效普通方块</text></g></svg>`);
const target=base+'/card_face_quake_soft_v5_final.png',bytes=await sharp(source).composite([{input:svg}]).png().toBuffer();
await fs.writeFile(target,bytes);await sharp(bytes).resize(512,768).webp({lossless:true}).toFile('dist/assets/cards/quake.webp');
const p=base+'/manifest.json',m=JSON.parse(await fs.readFile(p,'utf8')),e=m.cards.find(e=>e.id==='quake');
Object.assign(e,{name:'裂地横扫',version:5,status:'final',final:true,preview:false,face:target,lettering:'Native text overlay for the selected-row rule; painted window and frame unchanged',previousFace:source});
await fs.writeFile(p,JSON.stringify(m,null,2)+'\n');console.log('Quake card lettering synchronized with selected-row rule.');
