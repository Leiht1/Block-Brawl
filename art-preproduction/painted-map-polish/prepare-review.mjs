import fs from 'node:fs/promises';
const dir=new URL('./',import.meta.url),old=new URL('../native-map-polish/',dir);
for(const id of ['forest','cliff','crystal','ruins','furnace'])await fs.copyFile(new URL(id+'-after.png',old),new URL(id+'-before.png',dir));
let source=await fs.readFile(new URL('build-review.mjs',old),'utf8');
const descriptions={
 forest:'保留64格和原植物石框。背景按原构图重绘为明亮卡通环境；本体补上暖石倒角、浅凹槽及柔和接缝阴影。',
 cliff:'保留48格异形断层和原缺口。沿参考图绘制蓝天峡谷与水面；石台补厚度、圆润包边、砂岩切面和少量原位置植物。',
 crystal:'保留40格阶梯菱形及原冰台结构。雪山与冰湖保持原构图；本体补蓝白冰层、浅槽受光、冰面侧切和积雪边缘。',
 ruins:'保留54个可玩格和10座原障碍柱。原神庙、石柱和台阶重绘为明亮石构；本体补暖石板倒角、槽内阴影、祭坛切面。',
 furnace:'保留52格收口平台、原支架和炉口。原炉厅重绘为卡通石构与暖光；本体补耐火石材层次、柔和包边、厚实侧面与边缝热光。'
};
source=source.replace(/const descriptions=\{[\s\S]*?\};/,'const descriptions='+JSON.stringify(descriptions,null,2)+';');
source=source.replace("import {MAPS} from '../../dist/maps.mjs';","import {MAPS} from '../../dist/maps.mjs';\nimport {createRasterizer} from './browser-raster.mjs';");
source=source.replace('// Show the actual playable footprint, never the square source texture as a board.','const raster=await createRasterizer();\ntry{\n// Show the actual playable footprint, never the square source texture as a board.');
source=source.replace("const enc=async name=>",'}finally{await raster.close();}\nconst enc=async name=>');
source=source.replace('await sharp(Buffer.from(svg)).resize(600,600).png().toFile(path.join(dir,`${m.id}-body.png`));','await fs.writeFile(path.join(dir,`${m.id}-body.png`),await raster.render(Buffer.from(svg)));\n for(const [kind,src]of Object.entries({background:m.assets.backdrop,frame:m.assets.frame})){\n  const bytes=await fs.readFile(path.join(root,\'dist\',src)),mime=src.endsWith(\'.webp\')?\'image/webp\':\'image/svg+xml\';\n  let width=kind===\'background\'?1000:600,height;\n  if(mime===\'image/svg+xml\'){const v=bytes.toString().match(/viewBox="([^"]+)"/)[1].split(\' \').map(Number);height=Math.round(width*v[3]/v[2]);}\n  else {const meta=await sharp(bytes).metadata();height=Math.round(width*meta.height/meta.width);}\n  await fs.writeFile(path.join(dir,`${m.id}-${kind}.png`),await raster.render(bytes,{mime,width,height}));\n }');
source=source.replaceAll('>原版<','>上一版<').replaceAll('>本轮精修<','>本轮原画精修<').replaceAll('原背景与棋盘精修','背景棋盘原画精修').replaceAll('原背景与棋盘 · 本轮精修','背景与棋盘 · 实际游戏审查');
source=source.replace('沿用原构图、原平台和各地图地形，只调整静态美术。下方可以切换原版与精修画面；截图采用相同开局，方便直接对照。图片全部内嵌，离线打开即可查看。','按认可截图的明亮卡通质感，在原地图基础上重绘背景与棋盘材质。各图均为实际游戏截图，采用相同开局；可切换上一版与本轮。原地形、卡片、按钮及玩法保持。所有图片内嵌，离线打开即可查看。');
source=source.replace('本轮14个原生美术文件已原位更新。森林背景和藤蔓框沿用原成品。原地形、原遮罩、卡片、文字、按钮和玩法文件已核对保持不变。','本轮15个静态美术文件已原位更新：五张背景、五张本体、五个外框文件（含悬崖左右框）；森林藤蔓框沿用原成品。原地形、有效格遮罩、卡片、文字、按钮和玩法文件已核对保持。');
const ref='data:image/png;base64,'+(await fs.readFile(new URL('approved-reference.png',dir))).toString('base64');
source=source.replace("${sections.join('')}<footer>","<details><summary>你认可的美术基准（历史概念图，用于对照风格）</summary><img style=\"width:100%;display:block\" alt=\"已确认美术基准\" src=\""+ref+"\"></details>${sections.join('')}<footer>");
source=source.replace('>原版</text>','>上一版</text>').replace('本轮精修 · 48格原异形石台','本轮原画精修 · 保留48格异形石台');
source=source.slice(0,source.indexOf("await fs.writeFile(path.join(dir,'REPORT.md')"))+"console.log('Built embedded five-map painted-art review.');\n";
await fs.writeFile(new URL('build-review.mjs',dir),source);
await import('./build-review.mjs');
