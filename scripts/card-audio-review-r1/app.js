(() => {
 'use strict';
 const data=window.REVIEW_DATA,$=id=>document.getElementById(id);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const choices=Object.fromEntries(data.groups.map(g=>[g.id,'A']));
 const candidates=new Map(data.candidates.map(c=>[c.id,c]));
 const assets=new Map([...data.candidates,...data.references].map(a=>[a.id,a]));
 let context,master,musicGain,analyser,loading,serial=0,clock=0,sceneStart=0,peak=0,music=null;
 let buffers=new Map(),voices=new Set(),timers=new Set(),lastPlayed=new Map(),history=[],skipped=0,maxVoices=0;
 const policy=()=> $('policy').value;
 function log(kind,id,extra={}){
  const event={kind,id,seconds:context?+(context.currentTime-sceneStart).toFixed(3):0,...extra};
  history.push(event);history=history.slice(-500);
  const li=document.createElement('li');li.textContent=`${event.seconds.toFixed(3)}s · ${kind} · ${id}${extra.reason?' · '+extra.reason:''}${extra.side?' · '+extra.side:''}`;
  $('log').append(li);while($('log').children.length>100)$('log').firstChild.remove();
  $('voices').textContent=`活动 ${voices.size} · 跳过 ${skipped}`;
 }
 function refreshSelection(){
  $('selection-text').textContent='本次临时组合：'+data.groups.map(g=>`${g.name} ${choices[g.id]}`).join(' / ')+'。尚未确认正式版本。';
  const skill=$('skill').value,g=data.groups.find(g=>g.id==='skill.'+skill);
  $('timing-note').textContent=($('timing').value==='real'?'真实动作时序：':'顺序对照：本体统一放在640ms，仅用于比较声音衔接，不代表真实结算。')+g.timing;
 }
 for(const g of data.groups){
  const section=document.createElement('section');section.className='panel';section.id=g.id.replace('.','-');
  section.innerHTML=`<div class="group-head"><div><span class="badge">${escape(g.kind)}</span><h2>${escape(g.name)} <span class="id">${g.id}</span></h2></div><button data-compare="${g.id}">连续对比 A → B → C</button></div><p>${escape(g.difference)}</p><p class="muted small">${escape(g.timing)}</p><div class="cards"></div>`;
  for(const c of data.candidates.filter(c=>c.group===g.id)){
   const card=document.createElement('article');card.className='candidate';card.dataset.candidate=c.id;
   card.innerHTML=`<h3><span class="letter">${c.letter}</span>${escape(c.label)}</h3><div class="meta-top">${c.seconds.toFixed(3)} 秒 · 倍率 ${c.auditionVolume.toFixed(2)} · 待确认</div><canvas class="wave" width="300" height="48" aria-label="${escape(c.label)}的波形"></canvas><button data-play="${c.id}">播放 ${c.letter} · ${escape(c.label)}</button><label class="use"><input type="radio" name="${g.id}" value="${c.letter}" ${c.letter==='A'?'checked':''}>用于本次组合</label><details><summary>来源、许可与处理记录</summary><div class="metadata"><p>${escape(c.processing)}</p><p>整段RMS ${c.rms.toFixed(4)}；最强50ms窗RMS ${c.shortRms50ms.toFixed(4)}；文件峰值 ${c.peak.toFixed(4)}。组内匹配短窗强度，保留自然衰减。</p>${c.sources.map(s=>`<p><strong>${escape(s.originalFilename)}</strong><br>作者：${escape(s.author)}<br><a href="${escape(s.page)}" target="_blank" rel="noopener">原始页面</a> · <a href="${escape(s.download)}" target="_blank" rel="noopener">原始附件</a> · <a href="${escape(s.licenseUrl)}" target="_blank" rel="noopener">${s.license}</a><br>${escape(s.obligations)}<br>原时长 ${s.edit.originalSeconds.toFixed(3)} 秒；${s.originalFilename.toLowerCase().endsWith('.ogg')?'发布者提供的OGG有损原件；WAV试听版并不恢复无损信息。':'原始格式见附件；试听统一导出PCM WAV。'}<br>截取 ${s.edit.cropStartSeconds.toFixed(4)}–${s.edit.cropEndSeconds.toFixed(4)} 秒；${s.edit.reverse?'反向；':''}高通 ${s.edit.highpassHz}Hz / 低通 ${s.edit.lowpassHz}Hz；淡入 ${s.edit.attackMs}ms / 淡出 ${s.edit.releaseMs}ms；层延迟 ${s.edit.mixDelaySeconds}s / 层增益 ${s.edit.mixGain}。<br>SHA-256：${s.originalSha256}</p>`).join('')}<p>统一校准线性增益 ${c.normalizationGain.toFixed(5)}；44.1kHz / 单声道 / PCM16。<br>输出SHA-256：${c.sha256}</p><a download="${c.clip.split('/').pop()}" href="${c.dataUri}">下载此候选WAV</a></div></details>`;
   section.querySelector('.cards').append(card);
  }
  $('groups').append(section);const a=document.createElement('a');a.href='#'+section.id;a.textContent=g.name;$('nav').append(a);
 }
 $('reserved').innerHTML=data.reservedDetails.map(r=>`<tr><td>${escape(r.name)}<br><span class="id">${r.id}</span></td><td>${escape(r.note)}</td></tr>`).join('');
 $('official-credits').textContent=data.officialCredits;
 function drawWaves(){
  for(const c of data.candidates){const canvas=document.querySelector(`[data-candidate="${c.id}"] canvas`),ctx=canvas.getContext('2d'),x=buffers.get(c.id).getChannelData(0),w=canvas.width,h=canvas.height;
   ctx.clearRect(0,0,w,h);ctx.strokeStyle='#557d6d';ctx.lineWidth=1.5;ctx.beginPath();
   for(let k=0;k<w;k+=3){let p=0;const end=Math.min(x.length,Math.ceil((k+3)*x.length/w));for(let i=Math.floor(k*x.length/w);i<end;i++)p=Math.max(p,Math.abs(x[i]));const y=p/.6*(h/2-3);ctx.moveTo(k,h/2-y);ctx.lineTo(k,h/2+y);}ctx.stroke();
  }
 }
 async function ready(){
  if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=+$('master').value;analyser=context.createAnalyser();analyser.fftSize=2048;master.connect(analyser);analyser.connect(context.destination);musicGain=context.createGain();musicGain.connect(master);}
  await context.resume();
  if(!loading)loading=Promise.all([...assets.values()].map(async a=>{const b64=a.dataUri.split(',')[1],binary=atob(b64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));const decoded=await context.decodeAudioData(bytes.buffer);buffers.set(a.id,decoded);})).then(drawWaves).catch(e=>{loading=null;throw e;});
  await loading;
 }
 function later(fn,ms){const timer=setTimeout(()=>{timers.delete(timer);fn();},Math.max(0,ms));timers.add(timer);return timer;}
 function updateMusic(){if(!musicGain||!context)return;const at=context.currentTime,p=musicGain.gain;const target=voices.size?.65:1;p.cancelScheduledValues(at);p.setTargetAtTime(target,at,target<p.value?.025:.16);}
 function finish(v,kind='ended'){
  if(!voices.delete(v))return;v.source.onended=null;
  const disconnect=()=>{v.source.disconnect();v.gain.disconnect();};
  try{if(kind==='stopped'){const at=context.currentTime;v.gain.gain.cancelScheduledValues(at);v.gain.gain.setValueAtTime(v.gain.gain.value,at);v.gain.gain.linearRampToValueAtTime(0,at+.012);v.source.onended=disconnect;v.source.stop(at+.015);}else{v.source.stop();disconnect();}}catch{disconnect();}
  if(v.card&&! [...voices].some(x=>x.card===v.card))v.card.classList.remove('playing');log(kind,v.id);updateMusic();
 }
 function stopNodes(){
  for(const t of timers)clearTimeout(t);timers.clear();cancelAnimationFrame(clock);clock=0;
  for(const v of [...voices])finish(v,'stopped');
  if(music){const old=music;try{const at=context.currentTime;old.gain.gain.cancelAndHoldAtTime(at);old.gain.gain.linearRampToValueAtTime(0,at+.012);old.source.onended=()=>{old.source.disconnect();old.gain.disconnect();};old.source.stop(at+.015);}catch{}music=null;}
  lastPlayed.clear();$('voices').textContent=`活动 0 · 跳过 ${skipped}`;
 }
 function stop(){serial++;stopNodes();$('status').textContent='已停止全部声音与后续播放';}
 function play(id,side='单独试听'){
  const a=assets.get(id),buffer=buffers.get(id),now=context.currentTime;
  if(!a||!buffer)throw Error('音频尚未解码：'+id);
  const group=a.mergeGroup||a.group||id,limit=policy()==='limited'?3:8;
  let reason='';
  if(voices.size>=limit)reason=`达到${limit}条音效上限`;
  else if(policy()==='limited'&&now-(lastPlayed.get(group)??-Infinity)<(a.cooldownMs??80)/1000)reason='同组冷却合并';
  else if(policy()==='limited'&&[...voices].filter(v=>v.group===group).length>=(a.voiceLimit??1))reason='同组已有声音';
  if(reason){skipped++;log('skipped',id,{reason,side});return;}
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=a.auditionVolume??a.volume;source.connect(gain);gain.connect(master);
  const card=document.querySelector(`[data-candidate="${id}"]`),v={id,group,source,gain,card};voices.add(v);maxVoices=Math.max(maxVoices,voices.size);lastPlayed.set(group,now);if(card)card.classList.add('playing');
  source.onended=()=>finish(v);source.start();log('playing',id,{side,duration:buffer.duration,volume:gain.gain.value});updateMusic();
 }
 function startMusic(){
  const id=$('music').value,a=assets.get(id),source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(id);source.loop=true;source.connect(gain);gain.connect(musicGain);
  gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(a.volume,context.currentTime+.9);musicGain.gain.value=1;source.start();music={id,source,gain};log('music',id,{volume:a.volume});
 }
 function measure(){
  const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);let current=0;for(const n of samples)current=Math.max(current,Math.abs(n));peak=Math.max(peak,current);
  const db=peak?20*Math.log10(peak):-Infinity;$('meter').textContent=`本次峰值 ${Number.isFinite(db)?db.toFixed(1)+' dBFS':'—'}`;$('meter').classList.toggle('hot',peak>=.98);$('voices').textContent=`活动 ${voices.size} · 跳过 ${skipped}`;
  clock=requestAnimationFrame(measure);
 }
 function chosen(group){return group+'.'+choices[group].toLowerCase();}
 function castEvents(skill,offset=0,side='己方'){
  const real=$('timing').value==='real';const body=real?(skill==='fire'?data.timing.fireStartMs:0):data.timing.bodyVisualMs;
  return [{at:offset,id:chosen('cast.release'),side},{at:offset+data.timing.flightStartMs/1000,id:chosen('cast.travel'),side},{at:offset+data.timing.impactAtMs/1000,id:chosen('cast.impact'),side},{at:offset+body/1000,id:chosen('skill.'+skill),side}];
 }
 async function launch(label,events,{referenceOnly=false}={}){
  const token=++serial;stopNodes();$('status').textContent='准备声音，请稍候…';
  try{await ready();if(token!==serial)return;
   history=[];skipped=0;maxVoices=0;peak=0;$('log').replaceChildren();sceneStart=context.currentTime;
   const useMusic=$('bgm').checked||referenceOnly,warm=useMusic?.95:.03;if(useMusic)startMusic();
   let end=referenceOnly?3.4:Math.max(...events.map(e=>e.at+buffers.get(e.id).duration));
   const all=[...events];
   if($('normal').checked||referenceOnly)for(let t=.23;t<end;t+=.72)all.push({at:t,id:'block.match3',side:'普通消除参照'});
   if($('special').checked||referenceOnly)for(let t=.58;t<end;t+=1.3)all.push({at:t,id:$('special-kind').value,side:'特殊消除参照'});
   end=Math.max(end,...all.map(e=>e.at+buffers.get(e.id).duration));
   $('status').textContent=label;log('scenario',label,{timing:$('timing').value,policy:policy()});
   for(const e of all.sort((a,b)=>a.at-b.at))later(()=>{if(token===serial)play(e.id,e.side);},(e.at+warm)*1000);
   measure();later(()=>{if(token!==serial)return;stopNodes();$('status').textContent=`试听结束 · 峰值 ${peak?(20*Math.log10(peak)).toFixed(1):'—'} dBFS · 跳过 ${skipped} 条`;},(warm+end+.15)*1000);
  }catch(e){if(token!==serial)return;stopNodes();$('status').textContent='播放失败：'+e.message;log('error',label,{reason:e.message});}
 }
 document.addEventListener('click',e=>{
  const playButton=e.target.closest('[data-play]');if(playButton){const id=playButton.dataset.play;launch('单独试听 · '+candidates.get(id).label,[{at:0,id}]);return;}
  const compare=e.target.closest('[data-compare]');if(compare){let at=0;const events=data.candidates.filter(c=>c.group===compare.dataset.compare).map(c=>{const v={at,id:c.id,side:'A/B/C连续对比'};at+=c.seconds+.5;return v;});launch('连续对比 · A → B → C',events);}
 });
 document.addEventListener('change',e=>{if(e.target.matches('input[type=radio]')){choices[e.target.name]=e.target.value;refreshSelection();}});
 $('skill').addEventListener('change',refreshSelection);$('timing').addEventListener('change',refreshSelection);
 $('master').addEventListener('input',()=>{$('master-value').textContent=Math.round(+$('master').value*100)+'%';if(master)master.gain.setTargetAtTime(+$('master').value,context.currentTime,.01);});
 $('sequence').onclick=()=>launch('完整施法 · '+$('skill').selectedOptions[0].text,castEvents($('skill').value));
 $('duel').onclick=()=>launch('双方连续施法 · 6次固定声音压力场景',['fire','freeze','blackhole','luck','fire','blackhole'].flatMap((skill,i)=>castEvents(skill,i*.42,i%2?'敌方':'己方')));
 $('reference').onclick=()=>launch('正式BGM＋普通／特殊消除参照',[],{referenceOnly:true});
 $('stop').onclick=stop;document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify({status:'仅试听意见，未确认正式版本',choices,notes:$('notes').value,createdAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='card-audio-r1-listening-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 window.review={snapshot:()=>({decoded:buffers.size,active:voices.size,music:music?.id??null,history:[...history],skipped,maxVoices,peak,choices:{...choices},timers:timers.size,contextTime:context?.currentTime??0}),data};
 refreshSelection();
})();
