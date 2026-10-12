import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url),modules='C:/Users/HT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(modules+'/sharp'),{chromium}=require(modules+'/playwright');
const previous=JSON.parse(await fs.readFile(new URL('../../round2/spec/manifest.json',import.meta.url),'utf8'));
const rows=[{kind:'attack',name:'进攻',ref:'attack',ids:['fire','meteor','quake','bomb']},{kind:'control',name:'控制',ref:'control',ids:['freeze','blackhole','storm','fog']},{kind:'enhance',name:'强化',ref:'enhance',ids:['rainbow','sage','overload','luck']}];
const metadata=[];
const embeddedAssets={};
const embed=async file=>embeddedAssets[file]??(embeddedAssets[file]='data:image/png;base64,'+(await fs.readFile(path.join(root,file))).toString('base64'));
function shell(content){return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>方块乱斗 · 按示意图调整卡片</title><style>body{margin:0;background:#eee9df;color:#3f3224;font-family:'Microsoft YaHei',sans-serif}main{max-width:1500px;margin:auto;padding:28px}h1{font-size:28px}p{line-height:1.7}section{margin:40px 0}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}figure{margin:0;padding:14px;background:#fffaf0;border:1px solid #d7c9b1;border-radius:8px;text-align:center}figure>a>img{width:100%;aspect-ratio:2/3;object-fit:contain;display:block}figcaption{margin-top:10px}a{color:#216d70}.mini{display:block;width:100px;height:150px;object-fit:contain;margin:16px auto 0}.refs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.refs img{width:100%;max-height:450px;object-fit:contain}.note{padding:14px;background:#fff8e8}.badge{font-size:12px;color:#776348}footer{padding:20px 0;border-top:1px solid #d7c9b1}@media(max-width:700px){main{padding:16px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.refs{grid-template-columns:1fr}figure{padding:8px}h1{font-size:23px}}</style><main><h1>卡片外观 · 以你这三张示意图为准</h1><p>顶部图标居中；类型标签统一放在原画下方；标题、说明、目标文字居中。红金进攻、蓝金控制、青金强化沿用示意图的卡通手绘和美术字形。</p><p class="note">本页只审核卡片外观。时间冻结、彩虹核心直接保留你发来的原图；其余卡牌依据对应示意图调整。每张附100px小图。地图、棋盘、玩法均未修改。</p>${content}<footer><a href="spec/REPORT.md">本轮说明</a> · <a href="spec/prompts.json">图像编辑提示词</a></footer></main></html>`;}
let online='<details><summary>查看你给的三张示意图</summary><div class="refs">',offline=online;
for(const row of rows){online+=`<img src="references/${row.ref}.png" alt="${row.name}示意图">`;offline+=`<img src="${await embed('references/'+row.ref+'.png')}" alt="${row.name}示意图">`;}
online+='</div></details>';offline+='</div></details>';
for(const row of rows){online+=`<section><h2>${row.name}</h2><div class="cards">`;offline+=`<section><h2>${row.name}</h2><div class="cards">`;
 for(const id of row.ids){const c=previous.cards.find(c=>c.id===id),file='cards/'+id+'.png',m=await sharp(path.join(root,file)).metadata();
  metadata.push({id,name:c.name,kind:row.kind,file,width:m.width,height:m.height,alpha:m.hasAlpha,originalReference:['freeze','rainbow'].includes(id)});
  const make=src=>`<figure data-card="${id}"><a href="${src}" target="_blank"><img src="${src}" alt="${c.name}"></a><figcaption>${c.name}</figcaption><span class="badge">${['freeze','rainbow'].includes(id)?'你提供的原图':'按示意图调整'}</span><img class="mini" src="${src}" alt="${c.name}100px小图"></figure>`;
  online+=make(file);offline+=make(await embed(file));
 }
 online+='</div></section>';offline+='</div></section>';
}
await fs.writeFile(path.join(root,'index.html'),shell(online));
const offlineMarkup=online.replace(/src="((?:cards|references)\/[^"]+)"/g,'data-asset-src="$1"').replace(/href="(cards\/[^"]+)"/g,'data-asset-href="$1"');
const offlineScript=`<script>const assets=${JSON.stringify(embeddedAssets)};document.querySelectorAll('[data-asset-src]').forEach(e=>e.src=assets[e.dataset.assetSrc]);document.querySelectorAll('[data-asset-href]').forEach(e=>e.href=assets[e.dataset.assetHref]);</script>`;
await fs.writeFile(path.join(root,'卡片离线预览.html'),shell(offlineMarkup).replace('</main>','</main>'+offlineScript));
await fs.writeFile(path.join(root,'spec/manifest.json'),JSON.stringify({scope:'cards only; reference style',cards:metadata},null,2));
await fs.writeFile(path.join(root,'spec/REPORT.md'),'# 卡片外观调整\n\n以用户的三张示意图为准。统一顶部居中图标、原画下方类型牌、居中标题/说明/目标；保留红金/蓝金/青金分类。图像编辑直接以示意图为输入，文字为原画内美术字，不使用之前的普通系统字体覆盖。\n\n时间冻结、彩虹核心原图原样保留，其余十张按对应示意图调整。完整卡片位于 cards/{fire,meteor,quake,bomb,freeze,blackhole,storm,fog,rainbow,sage,overload,luck}.png。\n\n本轮为卡片外观审稿稿件，未接入正式游戏，未修改地图、棋盘、逻辑和动画。生成图的文字是烘焙的；后续接入前仍需将确认的字形与卡框提取为可复用素材，并检查透明外缘，不把本页直接宣称为最终生产素材。\n\n用户“绝对不默认生成太写实的图片”的偏好已记录到全局 AGENTS.md 与 docs/CARD-ART-REFERENCE.md。\n');
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[];
try{for(const url of ['http://127.0.0.1:4187/art-preproduction/card-reference-v3/index.html',pathToFileURL(path.join(root,'卡片离线预览.html')).href]){
 const page=await browser.newPage({viewport:{width:1450,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.url());});
 await page.goto(url);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});assert.equal(await page.locator('[data-card]').count(),12);assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).length),0);assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(root,'spec',url.startsWith('http')?'review-desktop.png':'offline-desktop.png'),fullPage:true});
 if(url.startsWith('http')){const styles=await page.locator('style').textContent();const samples=await page.evaluate(()=>['fire','freeze','rainbow'].map(id=>document.querySelector('[data-card="'+id+'"]').outerHTML).join(''));await page.setContent('<style>'+styles+'.cards{grid-template-columns:repeat(3,minmax(0,1fr))}</style><main><div class="cards">'+samples+'</div></main>');await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});await page.locator('main').screenshot({path:path.join(root,'spec/three-category-preview.png')});}
 await page.setViewportSize({width:390,height:844});await page.goto(url);await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks.push({url,cards:12,images:27,failedImages:0,mobileOverflow:false,errors});await page.close();
 }await fs.writeFile(path.join(root,'spec/loading-qa.json'),JSON.stringify(checks,null,2));}finally{await browser.close();}
console.log('12-card online/offline previews ready; desktop/mobile image loading passed.');
