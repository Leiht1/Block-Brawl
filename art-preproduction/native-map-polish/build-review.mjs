import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {MAPS} from '../../dist/maps.mjs';
const dir=fileURLToPath(new URL('./',import.meta.url)),root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(require.resolve('sharp',{paths:[deps]}));
const descriptions={
 forest:'保留原森林背景和藤蔓石框；底板略微提亮，补细窄格边反光，凹槽仍保持安静。',
 cliff:'保留48格异形断层及左右独立石台；天空和远山更通透，石台上沿受光与朝下断面层次更清楚。',
 crystal:'保留40格冰台及原冰晶簇；蓝白光色更清透，浅槽、冰层和雪沿保持不同明暗。',
 ruins:'保留54个可玩格及10座原封印柱；暖石板、祭坛切面和台阶分层，格边刻痕克制。',
 furnace:'保留52格收口平台、支架、炉口和管道；耐火石与包边略微提亮，岩浆暖光仍只作陪衬。'
};
// Show the actual playable footprint, never the square source texture as a board.
for(const m of MAPS){
 const board=await fs.readFile(path.join(root,'dist',m.assets.board));
 const uri='data:image/svg+xml;base64,'+board.toString('base64');
 const clip=m.terrain.cells.flatMap((s,i)=>s==='hole'?[]:[`<rect x="${i%8*60}" y="${Math.floor(i/8)*60}" width="60" height="60"/>`]).join('');
 let obstacles='';
 if(m.assets.obstacle){const source=await fs.readFile(path.join(root,'dist',m.assets.obstacle));const obstacleURI='data:image/svg+xml;base64,'+source.toString('base64');obstacles=m.terrain.cells.flatMap((s,i)=>s!=='obstacle'?[]:[`<image x="${i%8*60+1.8}" y="${Math.floor(i/8)*60+1.8}" width="56.4" height="56.4" href="${obstacleURI}"/>`]).join('');}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><defs><clipPath id="footprint">${clip}</clipPath></defs><g clip-path="url(#footprint)"><image width="480" height="480" href="${uri}"/>${obstacles}</g></svg>`;
 await sharp(Buffer.from(svg)).resize(600,600).png().toFile(path.join(dir,`${m.id}-body.png`));
}
const enc=async name=>'data:image/png;base64,'+(await fs.readFile(path.join(dir,name))).toString('base64');
const sections=[];
for(const m of MAPS){
 const images=Object.fromEntries(await Promise.all(['before','after','background','frame','body','board'].map(async k=>[k,await enc(`${m.id}-${k}.png`)])));
 sections.push(`<section id="${m.id}"><h2>${m.name}</h2><p>${descriptions[m.id]}</p><div class="comparison"><img alt="${m.name}实际战斗画面" src="${images.after}" data-before="${images.before}" data-after="${images.after}"><div class="switch"><button data-mode="before">原版</button><button data-mode="after" class="selected">本轮精修</button></div></div><details open><summary>背景 · 原轮廓外框 · 棋盘本体</summary><div class="parts">${[['background','背景'],['frame','外框（透明装饰层）'],['body','棋盘本体（按原地形裁剪）']].map(([k,t])=>`<figure><img alt="${m.name}${t}" src="${images[k]}"><figcaption>${t}</figcaption></figure>`).join('')}</div><figure class="closeup"><img alt="${m.name}棋盘实装近景" src="${images.board}"><figcaption>实际棋盘近景</figcaption></figure></details></section>`);
}
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>方块乱斗 · 原背景与棋盘精修</title><style>*{box-sizing:border-box}body{margin:0;background:#edf4ed;color:#344747;font:16px/1.65 "Microsoft YaHei",sans-serif}main{max-width:1450px;margin:auto;padding:28px}h1{font-size:27px;margin-bottom:8px}p{margin:8px 0 18px}nav{display:flex;gap:12px;flex-wrap:wrap;position:sticky;top:0;padding:12px 0;background:#edf4edf5;z-index:2}a,button{color:#325251;background:#fff9e8;border:1px solid #b6c7b8;border-radius:8px;padding:8px 16px;text-decoration:none;font:inherit;cursor:pointer}section{padding:20px 0;scroll-margin-top:80px}h2{font-size:23px;margin:0}.comparison{border-radius:12px;overflow:hidden;background:#d0dfda}.comparison img{width:100%;display:block}.switch{display:flex;gap:12px;padding:12px}.selected{background:#315e58;color:white}details{padding:18px 0}summary{cursor:pointer;font-weight:bold}.parts{display:grid;grid-template-columns:1.7fr 1fr 1fr;gap:18px;margin-top:18px}figure{margin:0}figure img{width:100%;height:320px;object-fit:contain;background:repeating-conic-gradient(#dfe7e3 0 25%,#eef3ef 0 50%) 0/24px 24px;border-radius:9px}figcaption{text-align:center;margin-top:6px;color:#59706a;font-size:14px}.closeup{max-width:700px;margin:24px auto 0}.closeup img{height:auto}footer{font-size:14px;padding:24px 0}@media(max-width:750px){main{padding:16px}.parts{grid-template-columns:1fr}figure img{height:auto;max-height:480px}}</style><main><h1>原背景与棋盘 · 本轮精修</h1><p>沿用原构图、原平台和各地图地形，只调整静态美术。下方可以切换原版与精修画面；截图采用相同开局，方便直接对照。图片全部内嵌，离线打开即可查看。</p><nav>${MAPS.map(m=>`<a href="#${m.id}">${m.name}</a>`).join('')}</nav>${sections.join('')}<footer>本轮14个原生美术文件已原位更新。森林背景和藤蔓框沿用原成品。原地形、原遮罩、卡片、文字、按钮和玩法文件已核对保持不变。</footer></main><script>document.querySelectorAll('.switch button').forEach(b=>b.onclick=()=>{const box=b.closest('.comparison');box.querySelector('img').src=box.querySelector('img').dataset[b.dataset.mode];box.querySelectorAll('button').forEach(n=>n.classList.toggle('selected',n===b));});</script></html>`;
await fs.writeFile(path.join(dir,'背景棋盘精修预览.html'),html);
await fs.writeFile(path.join(dir,'index.html'),html);
// A compact real screenshot comparison for inline review.
const inputs=[];
for(const [i,side] of ['before','after'].entries())inputs.push({input:await sharp(path.join(dir,`cliff-${side}.png`)).resize(1000).png().toBuffer(),left:0,top:i*583+20});
const labels=Buffer.from('<svg width="1000" height="1186"><text x="16" y="16" font-family="Microsoft YaHei" font-size="14" fill="#344747">原版</text><text x="16" y="599" font-family="Microsoft YaHei" font-size="14" fill="#344747">本轮精修 · 48格原异形石台</text></svg>');
inputs.push({input:labels,left:0,top:0});
await sharp({create:{width:1000,height:1186,channels:4,background:'#edf4ed'}}).composite(inputs).png().toFile(path.join(dir,'cliff-comparison.png'));
await fs.writeFile(path.join(dir,'REPORT.md'),`# 背景与棋盘静态精修\n\n${MAPS.map(m=>'- '+m.name+'：'+descriptions[m.id]).join('\n')}\n\n已原位更新 dist/assets 下14个原生SVG，地址与尺寸保持。森林背景／外框沿用成品；其余四图背景、外框和本体同步细修。原版快照在 original/，实际战斗前后截图及各层PNG可单独查看。预览HTML内嵌全部图片，无外部依赖。\n\n逐项校验14份原形状与有效格遮罩保持一致，五张地图实际UI位置不变，无页面错误或缺图；其余dist文件哈希一致。改动仅静态美术及制作／审查脚本。当前为克制精修版，可沿用现有绑定直接加载；光色与材质细节仍可继续审稿。\n`);
console.log('Built self-contained five-map review and real screenshot comparison.');
