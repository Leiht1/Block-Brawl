// Local documentation/ear-check page. It is not part of the game UI or event code.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {AUDIO_MANIFEST} from '../dist/audio-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),ref=path.join(root,'references/audio-stage2'),out=path.join(root,'validation/2026-10-11/audio-selected');
await fs.mkdir(out,{recursive:true});
const edits=JSON.parse(await fs.readFile(path.join(ref,'derivatives.json'),'utf8'));
const sourceDefinitions=[
  {author:'Kenney',title:'Impact Sounds 1.0',license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',page:'https://kenney.nl/assets/impact-sounds',evidence:'impact-sounds.html',archive:'impact-sounds.zip',download:'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',files:['impact-sounds/Audio/impactWood_light_000.ogg','impact-sounds/Audio/impactWood_light_002.ogg','impact-sounds/Audio/impactGlass_light_001.ogg']},
  {author:'trezegames',title:'Pop effect sounds',license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',page:'https://opengameart.org/content/pop-effect-sounds',evidence:'pop-effect-sounds.html',files:['p_1.ogg','p_2.ogg','p_3.ogg']},
  {author:'Sam Gossner & Simon Dalzell; sample cutting: Elan Hickler / Soundemote',title:'VSCO 2 Community Edition — Marimba',license:'CC0-1.0',licenseUrl:'https://github.com/sgossner/VSCO-2-CE/blob/440300901dfe9275fd84e0b7763af1f8443ae62e/LICENSE',page:'https://github.com/sgossner/VSCO-2-CE',evidence:'vsco-README.md',licenseEvidence:'vsco-LICENSE.txt',revision:'440300901dfe9275fd84e0b7763af1f8443ae62e',files:['marimba-c4.wav','marimba-g4.wav'],downloads:Object.fromEntries(['C4','G4'].map(note=>[`marimba-${note.toLowerCase()}.wav`,`https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Percussion/Marimba/Marimba_hit_Outrigger_${note}_loud_01.wav`]))},
  {author:'Blender Foundation / YoFrankie! (c) 2008',title:'Funny Comic Cartoon Bounce Sound',license:'CC-BY-3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',page:'https://opengameart.org/content/funny-comic-cartoon-bounce-sound',evidence:'funny-comic-cartoon-bounce-sound.html',files:['BounceYoFrankie.flac']},
  {author:'The Berklee College of Music',title:'Shimmer glitter magic',license:'CC-BY-3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',page:'https://opengameart.org/content/shimmer-glitter-magic',evidence:'shimmer-glitter-magic.html',files:['shimmer_1.flac']}
  ,{author:'ViRiX Dreamcore (David Mckee)',title:'Magic SFX Sample — individual finished magic cues',license:'CC-BY-3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',page:'https://opengameart.org/content/magic-sfx-sample',evidence:'magic/magic-sfx-sample.html',archive:'magic/magic-sfx.zip',download:'https://opengameart.org/sites/default/files/Magic%20SFX%20Preview%20Pack.zip',files:['magic/virix/Misc 02.wav','magic/virix/Ice attack 2.wav','magic/virix/Fire impact 1.wav','magic/virix/Healing Full.wav']}

];
const sha=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
const sources=[];
for(const source of sourceDefinitions){
  const files=[];
  for(const file of source.files)files.push({file,sha256:await sha(path.join(ref,file)),download:source.downloads?.[file]||source.download||`https://opengameart.org/sites/default/files/${path.basename(file)}`});
  sources.push({...source,checkedOn:'2026-10-11',files,evidenceSha256:await sha(path.join(ref,source.evidence)),...(source.licenseEvidence?{licenseEvidenceSha256:await sha(path.join(ref,source.licenseEvidence))}:{}),...(source.archive?{archiveSha256:await sha(path.join(ref,source.archive))}:{})});
}
await fs.writeFile(path.join(ref,'sources.json'),JSON.stringify(sources,null,2));
const reasons={
  'block.swap':'120ms 轻木碰撞，提供积木接触感；保留明确起音和短尾。',
  'block.invalid':'卡通反弹，采用圆润回弹表达返回；没有错误警报。',
  'block.fall':'单次轻木落位，100ms 短促；按整批事件播放，默认最轻。',
  'block.match3':'90ms 单次气泡爆破，去掉玻璃和积木敲击，避免打砖块感。',
  'block.combo':'同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。',
  'special.create':'360ms 单次魔法显现，ViRiX Misc 02；比消除更轻，倍率 0.40。',
  'special.line':'原生成音逐样本原样移入：400ms shimmer／晶莹释放，用户已认可这段用于整行列。倍率 0.66。',
  'special.bomb':'500ms 独立元素魔法爆破，ViRiX Ice attack 2；移除气球和气泡层，倍率 0.68。',
  'special.combo':'线线：复用已认可的整行列 400ms 魔法音，倍率 0.72；线爆：用户选定 D 光系法术，1200ms、倍率 0.78，原试听录音不变；爆爆：950ms 单次大型火魔法冲击，倍率 0.90。',
  'ui.countdown':'自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。'
};
const assets=[],seen=new Set();
for(const [id,e] of Object.entries(AUDIO_MANIFEST))if(e.src){
  for(const [variant,entry] of [['default',e],...Object.entries(e.variants||{})]){
    if(seen.has(entry.src))continue;seen.add(entry.src);
    const file=entry.src.replace('./assets/audio/',''),edit=edits.find(x=>x.file===file);
    const licenses=sources.filter(s=>s.files.some(f=>edit.sources.includes(f.file))).map(s=>s.license);
    const record={id,variant,...edit,volume:entry.volume,channel:e.channel,mergeGroup:e.mergeGroup,voiceLimit:e.voiceLimit,cooldownMs:e.cooldownMs,maxDurationMs:e.maxDurationMs,license:licenses.includes('CC-BY-3.0')?'CC-BY-3.0':'CC0-1.0',reason:reasons[id],bytes:(await fs.stat(path.join(root,'dist/assets/audio',file))).size};
    if(await sha(path.join(root,'dist/assets/audio',file))!==edit.sha256)throw Error(`Edited asset checksum mismatch: ${file}`);
    assets.push(record);
  }
}
await fs.writeFile(path.join(out,'audio-assets.json'),JSON.stringify(assets,null,2));
const creditSections=sources.map(s=>{
  const used=assets.filter(a=>s.files.some(f=>a.sources.includes(f.file)));
  return `## ${s.title}\n\n作者：${s.author}。${s.author.startsWith('ViRiX')?'作者主页：https://soundcloud.com/virix。':''}\n[来源](${s.page}) · [许可](${s.licenseUrl})（${s.license}）。\n\n原件：${s.files.map(f=>`\`${f.file}\``).join('、')}。\n\n${used.map(a=>`- \`${a.file}\`：${a.edits}。`).join('\n')}`;
}).join('\n\n');
await fs.writeFile(path.join(root,'dist/assets/audio/CREDITS.md'),`# 方块乱斗 · 核心音效来源与授权\n\n核验日期：2026-10-11。${assets.length} 个正式文件是本项目的剪辑／混音版本，不表示原作者为本游戏制作或背书。原件、下载链接、授权网页和 SHA-256 见仓库 references/audio-stage2/sources.json；逐文件编辑记录见 derivatives.json。\n\n${creditSections}\n\n## 分发约定\n\n含 CC BY 3.0 素材的以下 ${assets.filter(a=>a.license==='CC-BY-3.0').length} 个文件以 CC BY 3.0 分发，保留作者、来源、许可和修改说明：${assets.filter(a=>a.license==='CC-BY-3.0').map(a=>`\`${a.file}\``).join('、')}。其余 ${assets.filter(a=>a.license==='CC0-1.0').length} 个现用文件源素材为 CC0。所有修改均离线完成；新增魔法 cue 每条只剪辑一个完整原始素材，不叠两次爆破。\n\nViRiX 的公开包名包含 Preview，网页明确以 CC BY 3.0 授权单条成品供使用，没有演示用途限制。本项目未购买或使用其完整商业包。\n\n本文件随 assets/audio/ 部署，发布时保留。旧气球／竹杆和替换的生成音只在 references/audio-stage2/ 存档。地图、按钮、返回、独立开始和结算仍为空引用。\n`);
// Only the selected D source enters deployed credits; other candidates remain audition-only.
const choices=path.join(root,'validation/2026-10-11/audio-choices');
const candidates=JSON.parse(await fs.readFile(path.join(choices,'candidate-manifest.json'),'utf8')).candidates;
const cards=candidates.map(c=>`<article><div class="letter">${c.key}</div><h2>${c.label}</h2><p class="muted">${c.title} · ${c.seconds.toFixed(1)} 秒</p><button data-play="${c.key}">▶ 试听 ${c.key}</button> <button class="secondary" data-tier="${c.key}">听层级对比</button><p class="credit">${c.author} · <a href="${c.page}" target="_blank" rel="noreferrer">来源</a> · <a href="${c.licenseUrl}" target="_blank" rel="noreferrer">${c.license}</a>${c.authorUrl?` · <a href="${c.authorUrl}" target="_blank" rel="noreferrer">作者主页</a>`:''}<br><a href="${c.clip}">音频文件</a></p></article>`).join('');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>方块乱斗 · 线＋爆试听选音</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f7f2e7;color:#443724;font:16px/1.65 system-ui,'Microsoft YaHei',sans-serif}main{max-width:960px;margin:36px auto;padding:0 24px 48px}h1{font-size:30px;margin:8px 0}h2{font-size:21px;margin:0}a{color:#6951a3}p{margin:8px 0 18px}.tag{color:#7957a9;font-weight:700}.banner{background:#ede3ff;border:1px solid #d5c2ed;border-radius:14px;padding:18px 22px}.toolbar,.references{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:20px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}article{position:relative;border:1px solid #e1d3bc;background:#fffdf7;border-radius:18px;padding:24px;padding-top:56px;box-shadow:0 5px 18px #55452c08}.letter{position:absolute;top:16px;left:24px;background:#eadfff;color:#69509a;border-radius:10px;width:30px;height:30px;text-align:center;font-weight:800}button{border:1px solid #7659a2;background:#7659a2;color:white;border-radius:10px;padding:10px 16px;font:inherit;cursor:pointer}button:hover{background:#664a91}button.secondary{background:#fffdf7;color:#69509a;border-color:#c8b7dc}button.secondary:hover{background:#f2ecfb}button:focus-visible,a:focus-visible{outline:3px solid #e7a749;outline-offset:3px}.muted,.credit{color:#81705c;font-size:14px}.credit{margin:18px 0 0}.status{min-height:28px;color:#69509a;font-weight:600}input{max-width:130px;vertical-align:middle}details{margin-top:24px;font-size:14px;color:#81705c}@media(max-width:650px){main{margin:20px auto;padding:0 16px 28px}.grid{grid-template-columns:1fr}h1{font-size:25px}article{padding:20px;padding-top:54px}}</style></head><body><main>
<div class="tag">方块乱斗 · 音效选择</div><h1>线＋爆，已采用 D 光系法术</h1>
<div class="banner">你选定的 <strong>D 光系法术已接入线＋爆</strong>，保留试听版本的音色、尾音和音量。线＋线已更换，爆＋爆仍为最强。A／B／C 保留用于对比，没有接入游戏。</div>
<div class="toolbar"><button id="all">▶ 连听 A → B → C → D</button><button id="stop" class="secondary">停止</button><label>试听音量 <input id="gain" type="range" min="0" max="1" step="0.05" value="1"> <span id="gain-value">100%</span></label></div>
<p id="status" class="status" aria-live="polite">点击任意候选开始试听。</p>
<div class="grid">${cards}</div>
<div class="references"><strong>当前参考音：</strong><button class="secondary" data-play="line">线＋线（已更换）</button><button class="secondary" data-play="blasts">爆＋爆（最强）</button><a id="game" href="/">打开游戏</a></div>
<p class="muted">“听层级对比”按普通消除 → 线＋线 → 当前候选 → 爆＋爆播放，每声结束后间隔 300 毫秒。每次只播一声，便于比较。</p>
<details><summary>来源与试听说明</summary><p>A、B 来自 JaggedStone 的 Magic Spell SFX；C 来自 Ogrebane 的 Teleport Spell；D 来自 ViRiX Dreamcore（David Mckee）的 Healing Full。来源与许可在各卡片中。ViRiX 作者主页：<a href="https://soundcloud.com/virix">soundcloud.com/virix</a>。</p><p>每条保留原素材起音与发展，截短至 1.2 秒并淡出，整理为单声道，调整试听电平。没有叠加双爆、改音高或加均衡滤镜。D 已按选定的试听版本接入；A／B／C 仅保留对比。浏览器加载／播放验证不代表听感验收。</p><a href="candidate-manifest.json">试听文件记录</a></details>
</main><script>
const candidates=${JSON.stringify(candidates.map(c=>({key:c.key,src:c.clip,volume:c.auditionVolume})))};
const base=location.protocol==='file:'?'../../../dist/assets/audio/':'/assets/audio/';
const definitions=[...candidates,{key:'match',src:base+'block/block-match3-v2.wav',volume:.46},{key:'line',src:base+'special/special-line-v3.wav',volume:.72},{key:'blasts',src:base+'special/special-combo-blasts-v3.wav',volume:.90}];
const clips=new Map(definitions.map(d=>{const a=new Audio(d.src);a.preload='none';return[d.key,{audio:a,volume:d.volume}];}));
const gain=document.getElementById('gain'),status=document.getElementById('status');let sequence=0,cancelWait=null;
if(location.protocol==='file:')document.getElementById('game').href='../../../dist/index.html';
function stop(){sequence++;if(cancelWait){cancelWait();cancelWait=null;}for(const {audio}of clips.values()){audio.pause();audio.currentTime=0;}}
function finished(a){return new Promise(resolve=>{const timeout=setTimeout(done,4000);function done(){clearTimeout(timeout);a.removeEventListener('ended',done);a.removeEventListener('error',done);if(cancelWait===done)cancelWait=null;resolve();}cancelWait=done;a.addEventListener('ended',done);a.addEventListener('error',done);});}
async function audition(keys){stop();const token=sequence;try{for(const key of keys){if(token!==sequence)return;const c=clips.get(key);status.textContent=key==='line'?'正在播放：线＋线':key==='blasts'?'正在播放：爆＋爆':key==='match'?'正在播放：普通消除':key==='D'?'正在播放：D（已接入）':'正在播放：候选 '+key;c.audio.volume=c.volume*Number(gain.value);const end=finished(c.audio);await c.audio.play();await end;if(token!==sequence)return;await new Promise(r=>setTimeout(r,300));}if(token===sequence)status.textContent='试听结束。D 已接入，可打开游戏体验。';}catch{if(token===sequence){stop();status.textContent='播放失败，请刷新后重试或打开音频文件。';}}}
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>audition([b.dataset.play]));
document.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>audition(['match','line',b.dataset.tier,'blasts']));
document.getElementById('all').onclick=()=>audition(['A','B','C','D']);document.getElementById('stop').onclick=()=>{stop();status.textContent='已停止。';};
gain.oninput=()=>{document.getElementById('gain-value').textContent=Math.round(gain.value*100)+'%';for(const c of clips.values())c.audio.volume=c.volume*Number(gain.value);};
</script></body></html>`;
await fs.writeFile(path.join(choices,'index.html'),html);
console.log(`Updated active provenance/credits for ${assets.length} files and built four-candidate audition page.`);
