import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {SPECS,IDS} from '../art-preproduction/skill-body-complete-v1/skill-specs.mjs';
import {QUAKE_CANDIDATES} from '../art-preproduction/skill-body-complete-v1/quake-candidates.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(require.resolve('sharp',{paths:[deps]})),{chromium}=require(require.resolve('playwright',{paths:[deps]}));
const out=path.join(root,'validation/2026-10-12/skill-body-complete-v1');
const label=(width,height,rows)=>Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g font-family="Microsoft Yahei" font-size="19" fill="#655442">${rows.map(({x,y,text})=>`<text x="${x}" y="${y}">${text}</text>`).join('')}</g></svg>`);
const composite=async(width,height,parts,labels,file)=>sharp({create:{width,height,channels:4,background:'#f3efe7'}}).composite([...parts,{input:label(width,height,labels),left:0,top:0}]).png().toFile(path.join(out,file));
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const p=await browser.newPage();await p.goto('http://127.0.0.1:5178/art-preproduction/skill-body-complete-v1/index.html');await p.waitForFunction(()=>window.__skillReviewReady);
 const capture=async(id,t)=>{await p.evaluate(([id,t])=>{__skillReview.choose(id);__skillReview.seek(t);},[id,t]);return Buffer.from(await p.locator('#scene').evaluate(c=>c.toDataURL().split(',')[1]),'base64');};
 for(const id of IDS){const t={meteor:1650,bomb:2110,rainbow:1480,luck:2500,overload:2500,sage:2200,fog:2500}[id]??1180;await fs.writeFile(path.join(out,id+'-peak.png'),await capture(id,t));}
 const parts=[];
 for(const [n,id]of IDS.entries()){const input=await sharp(path.join(out,id+'-peak.png')).extract({left:SPECS[id].type==='buff'?185:815,top:190,width:440,height:460}).resize(352,368).toBuffer();parts.push({input,left:n%4*370+9,top:Math.floor(n/4)*410+31});}
 await composite(1480,1230,parts,IDS.map((id,n)=>({x:n%4*370+15,y:Math.floor(n/4)*410+23,text:`${String(n+1).padStart(2,'0')} ${SPECS[id].name}`})),'effect_skills_board_soft_v4_preview.png');
 const states=['luck','overload','sage','fog'],stateParts=[];
 for(const [n,id]of states.entries()){const input=await sharp(path.join(out,id+'-peak.png')).extract({left:id==='fog'?700:55,top:190,width:590,height:470}).resize(570,454).toBuffer();stateParts.push({input,left:n%2*600+15,top:Math.floor(n/2)*505+39});}
 await composite(1200,1010,stateParts,states.map((id,n)=>({x:n%2*600+20,y:Math.floor(n/2)*505+28,text:{luck:'幸运星 · 仅图标与倒计时',overload:'超载 · 仅图标与倒计时',sage:'贤者时间 · 背景透光＋金色蒙层',fog:'迷雾 · 落点一团大雾'}[id]})),'effect_buff_states_soft_v4_preview.png');
 const sagePair=[];for(const [n,variant]of ['veil','backlight'].entries()){await p.evaluate(v=>__skillReview.setSageVariant(v),variant);const input=await sharp(await capture('sage',2200)).extract({left:185,top:190,width:440,height:460}).toBuffer();sagePair.push({input,left:n*460+10,top:32});}
 await composite(920,505,sagePair,[{x:18,y:25,text:'之前：仅金色蒙层'},{x:478,y:25,text:'试稿：棋盘背景透光＋蒙层'}],'effect_sage_backlight_compare_soft_v1_preview.png');
 const candidates=[];
 for(const [n,id]of Object.keys(QUAKE_CANDIDATES).entries()){const input=await sharp(path.join(out,'quake-'+id+'-candidate.png')).extract({left:815,top:190,width:440,height:460}).toBuffer();candidates.push({input,left:n%2*460+10,top:Math.floor(n/2)*495+28});}
 await composite(920,990,candidates,Object.values(QUAKE_CANDIDATES).map((d,n)=>({x:n%2*460+18,y:Math.floor(n/2)*495+22,text:d.name+(d.selected?'（已选）':'')})),'effect_quake_candidates_soft_v1_preview.png');
 const lucky=[];for(const [n,t]of [620,1180,2500].entries()){const input=await sharp(await capture('luck',t)).extract({left:55,top:190,width:590,height:470}).resize(472,376).toBuffer();lucky.push({input,left:n*492+10,top:34});}
 await composite(1476,420,lucky,['光团飞向己方棋盘','亮金星光短暂展开','左侧增益倒计时 · 无棋盘光效'].map((text,n)=>({x:n*492+18,y:26,text})),'effect_luck_buff_soft_v5_preview.png');
 const fog=[];for(const [n,t]of [1180,3500,6840,7460].entries()){const frame=await capture('fog',t),input=await sharp(frame).extract({left:815,top:190,width:440,height:460}).resize(352,368).toBuffer();fog.push({input,left:n*370+9,top:34});await fs.writeFile(path.join(out,`fog-state-${t}.png`),frame);}
 await composite(1480,420,fog,['命中后聚成一团','原地持续遮蔽','持续结束 · 缓慢消散','消散完成'].map((text,n)=>({x:n*370+15,y:26,text})),'effect_fog_stages_soft_v2_preview.png');
}finally{await browser.close();}
const title='十二张技能本体 · 审核导出';
await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${title}</title><style>body{font:15px/1.6 system-ui;background:#f3efe7;color:#655442;margin:24px}main{max-width:1200px;margin:auto}img{max-width:100%}a{color:#88714f}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}section{margin:28px 0}table{border-collapse:collapse}td,th{padding:8px;border:1px solid #d0c4b0;text-align:left}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><main><h1>${title}</h1><p><a href="/art-preproduction/skill-body-complete-v1/index.html?skill=sage">打开互动审核页：单独播放 / 正常与慢速 / 原尺寸 / 裂地候选切换</a></p><p>全部待审，未接入正式游戏。幸运星恢复原10秒、22%特殊补充概率增益。幸运与超载持续状态仅使用左侧图标和倒计时；贤者时间保留金色蒙层，试加棋盘背景缓慢上涌的底光。裂地已选择横排方案。迷雾为落点一团大雾，连续12格范围仅在审核场景拟定，正式规则未改。</p><h2>贤者时间 · 两版对比</h2><img src="effect_sage_backlight_compare_soft_v1_preview.png"><div class="pair"><div><p>之前：金色蒙层</p><img src="sage-veil-v3-baseline/sage-complete.webp"></div><div><p>试稿：背景透光＋金色蒙层</p><img src="sage-complete.webp?v=4"></div></div><h2>当前状态反馈</h2><img src="effect_buff_states_soft_v4_preview.png"><h2>幸运星 · 亮金增益</h2><img src="effect_luck_buff_soft_v5_preview.png"><h2>迷雾 · 6秒持续与缓慢消散</h2><img src="effect_fog_stages_soft_v2_preview.png"><h2>全部技能</h2><img src="effect_skills_board_soft_v4_preview.png"><h2>已选裂地横扫 · 其他方案为历史回看</h2><table><tr><th>候选</th><th>效果</th><th>区别</th></tr>${Object.values(QUAKE_CANDIDATES).map(d=>`<tr><td>${d.name}${d.selected?'（已选）':''}</td><td>${d.rule}</td><td>${d.benefit}</td></tr>`).join('')}</table><img src="effect_quake_candidates_soft_v1_preview.png">${IDS.map(id=>`<section><h2>${SPECS[id].name}</h2><p>${SPECS[id].design}</p><div class="pair"><div><p>完整衔接 · 正常速度</p><img src="${id}-complete.webp?v=4"></div><div><p>独立本体 · 放大材质</p><img src="${id}-body.webp?v=4"></div></div><p><a href="${id}-peak.png">真实棋盘反馈</a> · <a href="${id}-storyboard.png">六阶段故事板</a> · <a href="${id}-rules.png">规则时序静帧</a></p></section>`).join('')}</main></html>`);
console.log('Gallery ready: simple gold Sage, countdown badges, one fog cloud, twelve skills and quake candidates.');
