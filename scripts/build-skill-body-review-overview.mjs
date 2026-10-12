import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url),sharp=require(require.resolve('sharp',{paths:[path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const out=path.join(root,'validation/2026-10-12/skill-body-soft-v1'),ids=['fire','freeze','blackhole','luck'],parts=[];
const version=JSON.parse(await fs.readFile(path.join(root,'art-preproduction/skill-body-soft-v1/manifest.json'),'utf8')).version;
for(let n=0;n<ids.length;n++){
 const id=ids[n],input=await sharp(path.join(out,id+'-board.png')).extract({left:id==='luck'?160:790,top:135,width:500,height:525}).resize(440,462).toBuffer();
 parts.push({input,left:n%2*460+10,top:Math.floor(n/2)*495+27});
}
const svg=Buffer.from(`<svg width="920" height="990" xmlns="http://www.w3.org/2000/svg"><g font-family="Microsoft Yahei, sans-serif" font-size="16" fill="#655442"><text x="18" y="20">01 火焰冲击 · 720ms</text><text x="478" y="20">02 时间冻结 · 760ms</text><text x="18" y="515">03 黑洞吸引 · 760ms</text><text x="478" y="515">04 幸运星 · 800ms</text></g></svg>`);
await sharp({create:{width:920,height:990,channels:4,background:'#f3efe7'}}).composite([...parts,{input:svg,left:0,top:0}]).png().toFile(path.join(out,`effect_skills_board_soft_v${version}_preview.png`));
await fs.writeFile(path.join(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>4技能审核导出</title><style>body{font:15px system-ui;background:#f3efe7;color:#655442;padding:24px}main{max-width:1200px;margin:auto}section{margin:25px 0}img{max-width:100%}a{color:#8b724c}.pair{display:grid;grid-template-columns:1fr 1fr;gap:15px}</style><main><h1>技能本体第一阶段 · v${version}技能审稿导出</h1><p><a href="/art-preproduction/skill-body-soft-v1/index.html">打开互动审核页（正常 / 慢速 / 上一版同帧对比 / 真实规则时序）</a></p><p>下方完整演示均为视觉衔接示意；黑洞的视觉重放延后640ms，请在互动审核页切换真实规则时序检查同步。</p>${ids.map((id,n)=>`<section><h2>${['火焰冲击','时间冻结','黑洞吸引','幸运星'][n]}</h2><div class="pair"><div><p>完整流程 · 1倍速度</p><img src="${id}-complete.webp"></div><div><p>独立本体 · 放大材质检查</p><img src="${id}-body.webp"></div></div><p><a href="${id}-board.png">原尺寸棋盘</a> · <a href="${id}-storyboard.png">6阶段故事板</a> · <a href="${id}-rules.png">真实规则静帧</a></p></section>`).join('')}</main>`);
console.log('Overview and animation gallery saved.');
