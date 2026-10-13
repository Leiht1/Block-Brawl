// Build one directly openable, self-contained review artifact; no runtime writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
import {CAST_TIMING} from '../dist/card-cast-vfx.mjs';
import {CARD_CONFIG} from '../dist/cards.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'validation/2026-10-13/card-audio-r1'),src=path.join(root,'scripts/card-audio-review-r1');
const manifest=JSON.parse(await fs.readFile(path.join(out,'candidate-manifest.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
async function embed(file){const b=await fs.readFile(file);return {dataUri:`data:audio/${file.endsWith('.ogg')?'ogg':'wav'};base64,${b.toString('base64')}`,sha256:sha(b)};}
const candidates=[];for(const c of manifest.candidates)candidates.push({...c,...await embed(path.join(out,c.clip))});
const references=[];
for(const id of ['bgm.battle','bgm.lobby','block.match3','special.line','special.bomb']){
 const entry=AUDIO_MANIFEST[id];references.push({id,...entry,...await embed(path.join(root,'dist',entry.src))});
}
for(const [key,value] of Object.entries(AUDIO_MANIFEST['special.combo'].variants)){
 const entry={...AUDIO_MANIFEST['special.combo'],...value};references.push({id:'special.combo.'+key,...entry,...await embed(path.join(root,'dist',entry.src))});
}
const reservedDetails=[
 {id:'skill.quake',name:'裂地横扫',note:'quake-start启动时；目标横排含特殊／万能块，按列间隔44ms推进。不可等末格清除后的effect才发声。'},
 {id:'skill.meteor',name:'陨石坠落',note:`下降与撞击分开；实际清除最早在${CARD_CONFIG.meteorMs}ms的队列结算，忙碌／冻结时顺延。撞击跟实际effect，不仅靠固定倒计时。`},
 {id:'skill.bomb',name:'炸弹投放',note:`先投放／轻引信；真正爆破最早${CARD_CONFIG.bombMs}ms，目标忙碌或冻结时可能推迟，跟真实effect。`},
 {id:'skill.storm',name:'混乱风暴',note:'实际card-change改变6个普通块颜色时反馈，空闲棋盘可立即提交；视觉本体不早于光团落地后80ms。'},
 {id:'skill.fog',name:'迷雾领域',note:`cast时立即生效${CARD_CONFIG.fogMs/1000}秒；当前代码是落点附近4×4区域、边缘贴边、空洞裁剪。1.2秒视觉消散不延长控制。`},
 {id:'skill.overload',name:'超载模式',note:`cast激活${CARD_CONFIG.overloadMs/1000}秒得分×${CARD_CONFIG.overloadMultiplier}；仅启动一次，状态期间安静。`},
 {id:'skill.sage',name:'贤者时间',note:`cast激活${CARD_CONFIG.sageMs/1000}秒，每${CARD_CONFIG.sageStepMs}ms尝试自动操作；只播激活反馈，后续操作沿用核心音。`},
 {id:'skill.rainbow',name:'彩虹核心',note:'实际card-change指定index变成万能块时反馈；目标tile id不符则转换失效，不伪造命中。忙碌时光团可悬停，实际落点确定后继续飞180ms。'}
];
const officialCredits=await fs.readFile(path.join(root,'dist/assets/audio/CREDITS.md'),'utf8');
const data={...manifest,candidates,references,reservedDetails,officialCredits,timing:{releaseMs:CAST_TIMING.release,flightStartMs:CAST_TIMING.flightStart,flightMs:CAST_TIMING.flight,impactAtMs:CAST_TIMING.flightStart+CAST_TIMING.flight,bodyVisualMs:CAST_TIMING.flightStart+CAST_TIMING.flight+80,fireStartMs:CARD_CONFIG.fireStartMs}};
let html=await fs.readFile(path.join(src,'template.html'),'utf8');
html=html.replace('/*STYLE*/',await fs.readFile(path.join(src,'style.css'),'utf8')).replace('/*DATA*/',JSON.stringify(data).replaceAll('<','\\u003c')).replace('/*APP*/',await fs.readFile(path.join(src,'app.js'),'utf8'));
await fs.writeFile(path.join(out,'index.html'),html);
await fs.writeFile(path.join(out,'FORMAL-AUDIO-CREDITS.md'),officialCredits);
await fs.writeFile(path.join(out,'runtime-reference-snapshot.json'),JSON.stringify({createdOn:'2026-10-13',references:references.map(({dataUri,...r})=>r),timing:data.timing,reservedDetails},null,2));
console.log(`Self-contained review built: ${candidates.length} candidates, ${references.length} official references, ${(Buffer.byteLength(html)/1048576).toFixed(2)} MiB.`);
