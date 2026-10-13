import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {MAPS} from '../../../dist/maps.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),project=path.resolve(root,'../..');
const sharp=createRequire(import.meta.url)('C:/Users/HT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const data=JSON.parse(await fs.readFile(path.join(root,'spec/manifest.json'),'utf8'));
data.mode='Native map restoration; existing card typography reused';delete data.board;delete data.assets;
await fs.mkdir(path.join(root,'assets/native'),{recursive:true});
for(const m of data.maps){
 const original=MAPS.find(x=>x.id===m.id);m.nativeAssets={};
 for(const key of ['backdrop','board','frame','stageRight','obstacle']){
  const source=original.assets[key];if(!source)continue;
  const name=path.basename(source),dest='assets/native/'+name;
  await fs.copyFile(path.join(project,'dist',source),path.join(root,dest));m.nativeAssets[key]=dest;
 }
 // Preserve all native silhouettes, masks, gradients and decorations. This pass
 // restores the map foundation; no replacement platform is presented as finished.
 m.background=m.nativeAssets.backdrop;m.frame=m.nativeAssets.frame;
 let board=await fs.readFile(path.join(root,m.nativeAssets.board),'utf8');
 const size=board.match(/viewBox="([^"]+)"/)?.[1].split(' ').map(Number)[2]||Number(board.match(/width="(\d+)"/)[1]);
 const cells=m.terrain.map((cell,i)=>cell==='hole'?'':`<rect x="${i%8*size/8}" y="${Math.floor(i/8)*size/8}" width="${size/8}" height="${size/8}"/>`).join('');
 board=board.replace(/(<svg[^>]*>)/,'$1<defs><clipPath id="review-native-terrain">'+cells+'</clipPath></defs><g clip-path="url(#review-native-terrain)">').replace('</svg>','</g></svg>');
 m.body='assets/native/'+m.id+'-body-preview.svg';await fs.writeFile(path.join(root,m.body),board);
 delete m.source;delete m.board;delete m.wellSourceRect;
 m.status='original-restored; further polish pending';m.notes='Original native map, structure and materials restored. Body preview clipped to original terrain.';
}
await fs.writeFile(path.join(root,'spec/manifest.json'),JSON.stringify(data,null,2));
await fs.writeFile(path.join(root,'review-data.js'),'window.REVIEW='+JSON.stringify(data)+';\n');
const oldCSS=await fs.readFile(path.join(root,'../round1/review.css'),'utf8');
const rules=[...oldCSS.matchAll(/\.card-render(?:\s+\.(?:painting|frame|card-name|description)(?:\s+small)?|\.(?:control|enhance))?\{[^}]*\}/g)].map(m=>m[0]).join('\n');
let css=await fs.readFile(path.join(root,'review.css'),'utf8');
css=css.replace(/\.description>span\{[^}]*\}\.description\{[^}]*\}/g,'');
await fs.writeFile(path.join(root,'review.css'),css+'\n/* Exact typography and layout rules from the approved first round. */\n'+rules+'\n:root{font-synthesis:none}\n');
let js=await fs.readFile(path.join(root,'review.js'),'utf8');
js=js.replace("${c.category} · ${c.target==='self'?'己方棋盘':'敌方棋盘'}","${c.target==='self'?'己方棋盘':'敌方棋盘'}${c.kind==='enhance'?' · 单局1次':''}");
js=js.replace(/const notes=\{[^;]+;/,"const notes={forest:'恢复原有森林背景、植物石框与棋盘材质。',cliff:'恢复断层棋盘、左右独立岩壁与岩层断面。',crystal:'恢复冰川原有冰台轮廓、霜纹和冰晶外缘。',ruins:'恢复古代石构、原有障碍柱与机关镶嵌。',furnace:'恢复耐火平台、金属边缘与原有热缝。'};");
js=js.replace(/<details><summary>棋盘绘画源板[\s\S]*?<\/details>/,'');
await fs.writeFile(path.join(root,'review.js'),js);
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
html=html.replace('同一片明亮的奇幻世界','回到原有地图与卡牌样式').replace('以已确认战斗截图为准。五张地图、棋盘外框与本体、六张新原画。本页为静态美术审核，战斗整合图来自现有游戏界面。','本次纠正：撤下统一石框方案，恢复五张地图原有背景、平台和棋盘。六张新卡复用第一轮字体与居中排版。地图后续精修仍需在这些原素材上进行。').replace('绘画源板与全部地图整合图','全部原地图整合图').replace('棋盘本体 / 浅槽 / 原地图边界','原有棋盘本体 / 原地图边界');
await fs.writeFile(path.join(root,'index.html'),html);
let exp=await fs.readFile(path.join(root,'spec/export-preview.mjs'),'utf8');
exp=exp.replace(/for\(const m of data.maps\)await sharp[^\n]+\n/,'');
exp=exp.replace(/const previewCSS=`[\s\S]*?\$\{cardRules\}`;/,'const previewCSS=`.card-face strong,.card-face .card-description{text-align:center}${cardRules}`;');
exp=exp.replace("flow.enterArena({...m,assets:{...m.assets,backdrop:'/art-preproduction/round2/assets/maps/'+id+'-background.png',board:'/art-preproduction/round2/assets/maps/'+id+'-body-grid.png',frame:'/art-preproduction/round2/assets/maps/'+id+'-frame.png'}},0)","flow.enterArena(m,0)");
exp=exp.replace(/  const raw=await sharp[^\n]+\n/,'');
exp=exp.replace("alphaCenters:'pass'","nativeStructure:'original assets and original CSS restored'");
exp=exp.replace(/limitations:\[[^\]]*\]/,"limitations:['Map polish remains pending; current map previews restore original native assets.','No production asset bindings changed.']");
exp=exp.replace(' for(const c of data.cards){await page.goto'," for(const c of data.cards){if(!c.isNew){await fs.copyFile(path.join(root,'../round1/cards',c.id+'.png'),path.join(root,'previews','card-'+c.id+'.png'));qa.cards.push({id:c.id,unchangedOriginal:true});continue;}await page.goto");
exp=exp.replace(/qa.checks=\[[^\]]*\]/,"qa.checks=['5 original map structures restored','Original six card exports copied unchanged','New six cards use first-round CSS typography','Dual boards and card dock bounds checked','All images decode; desktop/mobile review checked']");
// Export new cards at the same 3x resolution and downsample as round one.
exp=exp.replace("const browser=await chromium.launch", "const browser=await chromium.launch");
exp=exp.replace("deviceScaleFactor:1","deviceScaleFactor:3");
exp=exp.replace("await page.screenshot({path:path.join(root,'previews',m.id+'-battle.png')})","await page.screenshot({path:path.join(root,'previews',m.id+'-battle.png'),scale:'css'})");
exp=exp.replace("path:path.join(root,'previews','card-'+c.id+'.png'),omitBackground:true", "path:path.join(root,'previews','card-'+c.id+'-3x.png'),omitBackground:true");
exp=exp.replace("qa.cards.push({id:c.id,art:c.art,new:c.isNew});", "await sharp(path.join(root,'previews','card-'+c.id+'-3x.png')).resize(320,440).png().toFile(path.join(root,'previews','card-'+c.id+'.png'));qa.cards.push({id:c.id,art:c.art,new:c.isNew});");
await fs.writeFile(path.join(root,'spec/export-preview.mjs'),exp);
await fs.writeFile(path.join(root,'spec/REPORT.md'),'# 本次纠正\n\n撤下上一版统一棋盘方案。五张地图已恢复项目原背景、平台、棋盘、障碍与布局。该部分是恢复基线，不应声称已完成五地图正式精修。后续只在原素材上细修，保留各地图结构。\n\n前六张卡牌使用第一轮原成品，六张新卡复用第一轮微软雅黑、24px标题、15px居中说明、12px目标文字、原间距与卡框。原画保留。\n\n新卡成品：previews/card-quake.png、card-bomb.png、card-storm.png、card-fog.png、card-overload.png、card-luck.png。\n\n地图旧生成图与统一石框不再列为接入候选；新卡仍需用户审稿。本轮未改正式游戏流程。\n');
await fs.writeFile(path.join(root,'spec/ASSET-LIST.md'),'# 当前有效素材\n\n地图：assets/native/ 下原项目素材的副本；*-body-preview.svg 仅用于显示原有异形区域。正式游戏继续用原素材。\n\n六张新原画：assets/cards/{quake,bomb,chaos,fog,overload,luck}.png（chaos对应storm）。成品卡：previews/card-{quake,bomb,storm,fog,overload,luck}.png。\n\nassets/maps/ 下上一版生成背景、源板、石框和格槽均已撤出当前审核，不作为可接入素材。\n');
console.log('Native map foundation and approved typography restored.');
