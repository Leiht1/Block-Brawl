import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'validation/2026-10-13/card-audio-r1');
const raw=path.join(root,'references/audio-cards-r1');
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await fs.readFile(path.join(out,'candidate-manifest.json')));
const report={createdOn:'2026-10-13',scope:'仅候选、授权记录、离线试听页与混合；未运行游戏全量回归',checks:[],plays:[],compares:[],sequences:[],stress:[]};
async function hashFile(base,file,hash){assert.equal(sha(await fs.readFile(path.join(base,file))),hash,file);}
const baseline=JSON.parse(await fs.readFile(path.join(raw,'runtime-before.json')));
for(const [file,hash] of Object.entries(baseline))await hashFile(root,file,hash);
report.checks.push(`${Object.keys(baseline).length} 个正式资源／配置／技能实现文件与任务前哈希一致`);
assert.equal(manifest.candidates.length,21);assert.equal(new Set(manifest.candidates.map(c=>c.sha256)).size,21);
for(const c of manifest.candidates){
 await hashFile(out,c.clip,c.sha256);assert.equal(c.implemented,false);assert.equal(c.selected,false);
 for(const s of c.sources){
  assert(['CC0-1.0','CC-BY-3.0'].includes(s.license));assert(s.author&&s.download&&s.page&&s.obligations);
  for(const [p,h] of [['originalFile','originalSha256'],['archive','archiveSha256'],['evidence','evidenceSha256'],['licenseEvidence','licenseEvidenceSha256']])if(s[p])await hashFile(raw,s[p],s[h]);
 }
}
for(const g of manifest.groups){const cs=manifest.candidates.filter(c=>c.group===g.id);assert.equal(cs.length,3);assert.equal(new Set(cs.map(c=>c.sources[0].source)).size,3);assert.equal(new Set(cs.map(c=>c.auditionVolume)).size,1);assert(Math.max(...cs.map(c=>c.shortRms50ms))/Math.min(...cs.map(c=>c.shortRms50ms))<1.002);}
report.checks.push('21 条独立文件、组内三种来源、许可／附件／原件证据哈希、统一短窗强度与倍率通过');
const req=createRequire(import.meta.url);
const playwright=req(req.resolve('playwright',{paths:['C:/Users/HT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const browser=await playwright.chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:1365,height:960},acceptDownloads:true});
const page=await context.newPage();const errors=[],network=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
try{
 await page.goto(pathToFileURL(path.join(out,'index.html')).href);
 assert.equal(await page.locator('[data-play]').count(),21);
 const embedded=await page.evaluate(()=>[...review.data.candidates,...review.data.references].map(({id,dataUri,sha256})=>({id,dataUri,sha256})));
 for(const a of embedded)assert.equal(sha(Buffer.from(a.dataUri.split(',')[1],'base64')),a.sha256);
 async function run(selector){await page.locator(selector).click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('试听结束'),{},{timeout:12000});const s=await page.evaluate(()=>review.snapshot());assert.equal(s.active,0);assert.equal(s.timers,0);assert(!s.history.some(e=>e.kind==='error'));return s;}
 for(const c of manifest.candidates){const s=await run(`[data-play="${c.id}"]`);const p=s.history.filter(e=>e.kind==='playing');assert.equal(p.length,1);assert.equal(p[0].id,c.id);assert(Math.abs(p[0].duration-c.seconds)<.0001);assert(s.peak>0);report.plays.push({id:c.id,seconds:p[0].duration,peak:s.peak});}
 console.log('21 candidate buttons decoded and played to completion.');
 for(const g of manifest.groups){const s=await run(`[data-compare="${g.id}"]`);assert.deepEqual(s.history.filter(e=>e.kind==='playing').map(e=>e.id),['a','b','c'].map(x=>g.id+'.'+x));report.compares.push(g.id);}
 await page.locator('[data-compare="skill.luck"]').click();await page.waitForTimeout(160);await page.locator('#stop').click();const stopped=await page.evaluate(()=>review.snapshot());await page.waitForTimeout(1100);const after=await page.evaluate(()=>review.snapshot());assert.equal(after.active,0);assert.equal(after.timers,0);assert.equal(after.history.length,stopped.history.length);
 await page.locator('#policy').selectOption('overlap');
 for(const skill of ['fire','freeze','blackhole','luck']){await page.locator('#skill').selectOption(skill);const s=await run('#sequence');const ps=s.history.filter(e=>e.kind==='playing');assert.equal(ps.length,4);const base=ps.find(e=>e.id==='cast.release.a').seconds;for(const [id,t] of [['cast.travel.a',.18],['cast.impact.a',.56],['skill.'+skill+'.a',skill==='fire'?.64:0]])assert(Math.abs(ps.find(e=>e.id===id).seconds-base-t)<.065);report.sequences.push({skill,events:ps});}
 await page.locator('input[name="cast.release"][value="B"]').check();await page.locator('#timing').selectOption('story');const story=await run('#sequence');assert.deepEqual(story.history.filter(e=>e.kind==='playing').map(e=>e.id),['cast.release.b','cast.travel.a','cast.impact.a','skill.luck.a']);
 for(const id of ['bgm','normal','special'])await page.locator('#'+id).check();await page.locator('#timing').selectOption('real');await page.locator('#special-kind').selectOption('special.combo.line-blast');
 for(const policy of ['limited','overlap']){await page.locator('#policy').selectOption(policy);const s=await run('#duel');assert(s.history.some(e=>e.kind==='music'));assert(s.maxVoices<=(policy==='limited'?3:8));assert(s.peak<1);report.stress.push({policy,maxVoices:s.maxVoices,skipped:s.skipped,peak:s.peak,played:s.history.filter(e=>e.kind==='playing').length});}
 assert(report.stress[0].skipped>0);assert(report.stress[1].skipped<report.stress[0].skipped);
 await page.locator('#music').selectOption('bgm.lobby');await run('#reference');
 await page.locator('#duel').click();await page.waitForTimeout(1050);await page.keyboard.press('Escape');const esc=await page.evaluate(()=>review.snapshot());assert.equal(esc.active,0);assert.equal(esc.music,null);assert.equal(esc.timers,0);
 await page.locator('#notes').fill('测试意见：仅试听，未确认正式版本');const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);const opinion=JSON.parse(await fs.readFile(await download.path()));assert.equal(opinion.choices['cast.release'],'B');assert(opinion.status.includes('未确认'));
 console.log('Comparison, timing, stop, export and reference/stress playback checks passed.');
 report.offlineMix=await page.evaluate(async()=>{
  const data=review.data,ctx=new OfflineAudioContext(2,44100*6,44100),buffers=new Map();for(const a of [...data.candidates,...data.references])buffers.set(a.id,await ctx.decodeAudioData(Uint8Array.from(atob(a.dataUri.split(',')[1]),c=>c.charCodeAt(0)).buffer));
  const metrics=[];
  for(const letter of ['a','b','c'])for(const kind of ['fire','freeze','blackhole','luck','duel']){
   const mix=new OfflineAudioContext(2,44100*6,44100);const events=[];
   const casts=kind==='duel'?['fire','freeze','blackhole','luck','fire','blackhole']:[kind];
   casts.forEach((skill,i)=>{const start=.95+i*.42;for(const [group,at] of [['cast.release',0],['cast.travel',.18],['cast.impact',.56],['skill.'+skill,skill==='fire'?.64:0]])events.push({id:group+'.'+letter,at:start+at});});
   for(let t=1.18;t<4;t+=.72)events.push({id:'block.match3',at:t});for(let t=1.53;t<4;t+=1.3)events.push({id:'special.combo.line-blast',at:t});events.push({id:'bgm.battle',at:0});
   for(const e of events){const a=[...data.candidates,...data.references].find(a=>a.id===e.id),s=mix.createBufferSource(),g=mix.createGain();s.buffer=buffers.get(e.id);g.gain.value=a.auditionVolume??a.volume;s.connect(g);g.connect(mix.destination);if(e.id.startsWith('bgm.'))s.loop=true;s.start(e.at);}
   const rendered=await mix.startRendering();let peak=0,sum=0,clipped=0;for(let ch=0;ch<2;ch++)for(const x of rendered.getChannelData(ch)){peak=Math.max(peak,Math.abs(x));sum+=x*x;if(Math.abs(x)>=1)clipped++;}metrics.push({letter,kind,peak,rms:Math.sqrt(sum/(rendered.length*2)),clipped});
  }return {condition:'保守上界：不压低BGM、不限制重叠；实际文件按页面倍率渲染',metrics};
 });
 assert(report.offlineMix.metrics.every(m=>m.clipped===0));
 await page.reload();await page.locator('[data-play="cast.release.a"]').click();await page.waitForFunction(()=>review.snapshot().decoded===29);await page.locator('#stop').click();await page.screenshot({path:path.join(out,'preview-desktop.png')});
 await page.locator('#skill-fire').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'preview-candidates.png')});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'preview-mobile.png')});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(network.length,0);report.checks.push('29条嵌入音频离线解码；21单播、7连续对比、四技能真实时序、顺序对照、组合选择、停止/Esc、导出、正式参照与双边混合均通过','390px移动端无横向溢出；无页面异常、无网络请求');
 for(const [file,hash] of Object.entries(baseline))await hashFile(root,file,hash);
 report.result='PASS';await fs.writeFile(path.join(out,'validation-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,stress:report.stress,worstOfflinePeak:Math.max(...report.offlineMix.metrics.map(m=>m.peak))},null,2));
}finally{await browser.close();}
