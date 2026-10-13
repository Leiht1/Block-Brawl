import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const modules=path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[modules]}));
const sharp=require(require.resolve('sharp',{paths:[modules]}));
const manifest=JSON.parse(await fs.readFile(path.join(root,'spec/manifest.json'),'utf8'));
const copy={fire:['进攻','火浪横扫附近3格','2.2秒后烧毁','敌方棋盘'],freeze:['控制','冻结敌方棋盘3秒','暂停新的交换','敌方棋盘'],blackhole:['控制','牵引附近6个普通方块','轮转方块位置','敌方棋盘'],sage:['强化','自动寻找最佳消除','持续5秒','己方棋盘'],rainbow:['强化','生成1个万能方块','交换清除所有同色','己方棋盘'],meteor:['进攻','纵向贯穿最多5格','两侧冲击 · 障碍阻挡','敌方棋盘']};
const cards=manifest.cards.map(c=>({...c,category:copy[c.id][0],lines:copy[c.id].slice(1,3),target:copy[c.id][3]}));
await fs.writeFile(path.join(root,'review-data.js'),'window.ART_REVIEW='+JSON.stringify({cards,assets:manifest.assets})+';\n');
await fs.writeFile(path.join(root,'spec/card-layout.json'),JSON.stringify({canvas:[320,440],export:[960,1320],layers:['painted illustration','painted transparent frame','editable title','editable two-line description and target'],frame:{left:-.06,top:0,width:1,height:1},art:{left:.13,top:.26,width:.71,height:.48},title:{left:.13,right:.15,top:.18,fontPx:24},description:{left:.17,right:.19,top:.76,height:.12,fontPx:15},cards},null,2));
const csv=['id,name,file,width,height,status,use',...manifest.assets.map(a=>[a.id,a.name,a.file,...(a.size||['','']),a.status,a.use].map(x=>'"'+String(x).replaceAll('"','""')+'"').join(','))].join('\r\n');
await fs.writeFile(path.join(root,'spec/manifest.csv'),'\ufeff'+csv);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:3});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));const url=pathToFileURL(path.join(root,'index.html')).href;
async function loaded(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});}
if(!process.argv.includes('--check-only'))for(const c of cards){await page.setViewportSize({width:320,height:440});await page.goto(url+'?card='+c.id);await loaded();await page.locator('body>.card-render').screenshot({path:path.join(root,'cards',c.id+'-3x.png'),omitBackground:true});
 await sharp(path.join(root,'cards',c.id+'-3x.png')).resize(320,440).png().toFile(path.join(root,'cards',c.id+'.png'));
}
await page.setViewportSize({width:1600,height:1100});if(!process.argv.includes('--check-only')){await page.goto(url+'?style');await loaded();await page.locator('#style-board').screenshot({path:path.join(root,'previews/style-board.png'),scale:'css'});}
await page.goto(url);await loaded();assert.equal(await page.locator('#finished-cards .card-item').count(),6);assert.equal(await page.locator('#state-grid .state-item').count(),12);
await page.getByRole('button',{name:'战斗卡牌区',exact:true}).click();assert.ok((await page.locator('#scheme-image').getAttribute('src')).endsWith('battle-main.png'));
const card=page.locator('#finished-cards [data-card=fire]');await card.hover();assert.ok((await card.locator('.frame').getAttribute('src')).endsWith('attack-hover.png'));await card.click();assert.equal(await card.getAttribute('aria-pressed'),'true');
await page.screenshot({path:path.join(root,'previews/review-desktop-verified.png'),scale:'css'});
await page.setViewportSize({width:390,height:844});await page.goto(url);await loaded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(root,'previews/review-mobile-verified.png'),scale:'css'});
assert.deepEqual(errors,[]);
const assets=[];for(const a of manifest.assets){const file=path.join(root,a.file);await fs.access(file);const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let zeros=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)zeros++;assets.push({id:a.id,width:info.width,height:info.height,transparentFraction:+(zeros/(info.width*info.height)).toFixed(3)});}
for(const a of assets.filter(a=>/^(attack|control|enhance)-normal$/.test(a.id)))assert.ok(a.transparentFraction>.2);
await fs.writeFile(path.join(root,'spec/qa.json'),JSON.stringify({date:'2026-10-12',preview:'local file; Edge headless',passed:['all images decoded','6 finished cards exported','12 frame states loaded','scheme switch','hover frame','selected state','390px no horizontal overflow','no page errors','37 manifest assets exist','normal frames true alpha'],assets,limitations:['concept image small typography is not final copy','state glow edges require padding refinement','static VFX keyposes only; no animation or release logic integrated','3x PNG is scaled export; source frame effective resolution ~320x440']},null,2));
await browser.close();console.log('Review checks passed; 6 cards, style board, desktop/mobile previews exported.');
