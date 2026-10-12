/* Independent art review. No game engine, card UI or effects module is loaded.
   Every magic pixel comes from the exported painted atlases. */
(()=>{
  'use strict';
  const M=window.CAST_FX_MANIFEST,$=id=>document.getElementById(id);
  if(!M){$('load-state').textContent='素材清单未加载，请保持预览文件夹完整。';return;}
  const images=new Map(),pending=new Map(),names={activation:'卡牌激活',release:'松手释放',orb:'光团循环',trail:'飞行拖尾',impact:'命中与收尾'};
  const state={type:'attack',card:'fire',map:'forest',stage:'all',quality:'runtime',time:0,elapsed:0,speed:1,playing:false,ready:false,compare:false,repeat:true,targetIndices:{self:27,enemy:27},origin:{x:275,y:548},lastDrop:null,drag:null,draws:[],loadSerial:0};
  const geometry={width:960,height:680,origin:{x:275,y:548},boards:{self:{x:125,y:100,size:300},enemy:{x:535,y:100,size:300}}};
  let previous=performance.now(),gallery=[];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const card=id=>M.cards.find(c=>c.id===id),map=()=>M.maps.find(m=>m.id===state.map),selected=()=>card(state.card);
  const primary=()=>state.compare&&state.type==='buff'?card('fire'):selected(),secondary=()=>state.type==='buff'?selected():card('rainbow');
  const atlasPath=a=>state.quality==='png'?a.atlas:a.runtimeAtlas;
  const fileSize=b=>b>=1048576?(b/1048576).toFixed(2)+' MB':(b/1024).toFixed(0)+' KB';
  for(const id of ['battle','battle-compare'])Object.assign($(id).style,{maxWidth:'960px',maxHeight:'none',margin:'auto'});
  function image(file){
    if(images.has(file))return Promise.resolve(images.get(file));if(pending.has(file))return pending.get(file);
    const p=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(file,im);resolve(im);};im.onerror=()=>reject(new Error('无法加载 '+file));im.src=file;});pending.set(file,p);return p;
  }
  async function ensureAssets(){
    const serial=++state.loadSerial;state.ready=false;$('load-state').textContent='正在加载绘制素材…';
    const types=new Set([state.type,primary().type,secondary().type]),urls=new Set([M.shared.tiles,M.shared.logo,...Object.values(map().assets)]);
    for(const c of M.cards)if(types.has(c.type))urls.add(c.file);
    for(const type of types)for(const a of Object.values(M.animations[type]))urls.add(atlasPath(a));
    try{await Promise.all([...urls].map(image));if(serial!==state.loadSerial)return;state.ready=true;$('load-state').textContent='';previous=performance.now();render();}
    catch(e){if(serial!==state.loadSerial)return;state.playing=false;$('load-state').textContent=e.message+'。请保持预览页与素材的目录关系。';updateControls();}
  }
  function fillCards(){
    $('card').replaceChildren(...M.cards.filter(c=>c.type===state.type).map(c=>new Option(c.name,c.id)));$('card').value=state.card;
    for(const b of document.querySelectorAll('[data-type]'))b.setAttribute('aria-pressed',String(b.dataset.type===state.type));
  }
  function duration(){return state.stage==='all'?M.timeline.completeMs:M.animations[state.type][state.stage].durationMs;}
  function loopPeriod(){const a=M.animations[state.type][state.stage];return duration()+(state.stage==='all'?M.timeline.repeatGapMs:a.loop?0:280);}
  function reset({play=true,at=0}={}){state.elapsed=state.time=at;state.playing=play;state.drag=null;previous=performance.now();render();}
  function updateControls(){
    $('play').textContent=state.playing?'暂停':'播放';$('seek').max=duration();$('seek').value=Math.min(state.time,duration());$('time').textContent=Math.round(state.time)+' / '+duration()+' ms';
    $('route').textContent=state.compare?'对比：'+primary().category+' → 敌方 / 强化 → 己方':selected().category+' → '+(selected().target==='self'?'己方':'敌方')+'棋盘';
    $('scenes').classList.toggle('comparing',state.compare);$('comparison').hidden=!state.compare;
    $('scene-caption').textContent=primary().name+' · 96px宽普通手牌 · 从原手牌位置释放';$('compare-caption').textContent=secondary().name+' → 己方棋盘 · 相同时间线';
    const ranges=state.stage==='all'?[[0,240],[240,440],[420,800],[800,1200]]:[];
    [...$('timeline').children].forEach((el,i)=>el.classList.toggle('active',ranges[i]&&state.time>=ranges[i][0]&&state.time<ranges[i][1]));
  }
  function target(c){
    const b=geometry.boards[c.target],plans=map().plans[c.id];let requested=state.targetIndices[c.target];if(!plans[requested]?.valid)requested=plans.findIndex(p=>p.valid);
    const plan=plans[requested],index=plan?.visualLanding??requested;
    return {requested,index,plan,x:b.x+(index%8+.5)*b.size/8,y:b.y+(Math.floor(index/8)+.5)*b.size/8};
  }
  function frameAt(a,t){return clamp(Math.floor(Math.max(0,t)/a.frameDurationMs),0,a.frameCount-1);}
  function sprite(ctx,type,phase,t,p,{width,height,angle=0,alpha=1,record=false,scene='primary'}={}){
    const a=M.animations[type][phase],im=images.get(atlasPath(a));if(!im||alpha<=0)return;
    const index=frameAt(a,a.loop?t%a.durationMs:t),f=a.frames[index],w=width??a.recommendedDrawSize[0],h=height??a.recommendedDrawSize[1];
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(p.x,p.y);if(angle)ctx.rotate(angle);ctx.drawImage(im,f.rect.x,f.rect.y,f.rect.w,f.rect.h,-a.anchorNormalized[0]*w,-a.anchorNormalized[1]*h,w,h);ctx.restore();
    if(record)state.draws.push({scene,type,phase,index,file:f.file,atlas:atlasPath(a),x:p.x,y:p.y,angle,alpha});
  }
  function bezier(s,e,p){
    const a={x:s.x,y:s.y-230},b={x:e.x,y:e.y+140},q=1-p;
    const x=q*q*q*s.x+3*q*q*p*a.x+3*q*p*p*b.x+p*p*p*e.x,y=q*q*q*s.y+3*q*q*p*a.y+3*q*p*p*b.y+p*p*p*e.y;
    const dx=3*q*q*(a.x-s.x)+6*q*p*(b.x-a.x)+3*p*p*(e.x-b.x),dy=3*q*q*(a.y-s.y)+6*q*p*(b.y-a.y)+3*p*p*(e.y-b.y);
    return {x,y,angle:Math.atan2(dy,dx)};
  }
  function cover(ctx,im,w,h){const s=Math.max(w/im.width,h/im.height),sw=w/s,sh=h/s;ctx.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,0,0,w,h);}
  function text(ctx,s,x,y,size=16){ctx.save();ctx.font='700 '+size+'px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff9e7';ctx.strokeStyle='#3a493a';ctx.lineWidth=4;ctx.lineJoin='round';ctx.strokeText(s,x,y);ctx.fillText(s,x,y);ctx.restore();}
  function paintCard(ctx,c,p,w=96,h=144,angle=0,alpha=1){const im=images.get(c.file);if(!im||alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();}
  function board(ctx,side){
    const b=geometry.boards[side],m=map(),frame=images.get(side==='enemy'&&m.assets.stageRight?m.assets.stageRight:m.assets.frame),surface=images.get(m.assets.board),tiles=images.get(M.shared.tiles);
    if(frame)ctx.drawImage(frame,b.x-28,b.y-28,b.size+56,b.size+56);if(surface)ctx.drawImage(surface,b.x,b.y,b.size,b.size);
    for(let i=0;i<64;i++)if(m.terrain[i]==='cell'){
      const size=b.size/8*.91,x=b.x+(i%8+.5)*b.size/8,y=b.y+(Math.floor(i/8)+.5)*b.size/8,type=(i*3+Math.floor(i/8)+(side==='enemy'?2:0))%5;
      ctx.drawImage(tiles,type*128,0,128,128,x-size/2,y-size/2,size,size);
    }else if(m.terrain[i]==='obstacle'&&m.assets.obstacle){const im=images.get(m.assets.obstacle);if(im)ctx.drawImage(im,b.x+i%8*b.size/8,b.y+Math.floor(i/8)*b.size/8,b.size/8,b.size/8);}
    text(ctx,side==='self'?'己方棋盘':'敌方棋盘',b.x+b.size/2,65,20);
  }
  function drawMagic(ctx,c,t,scene){
    const o=c.id===state.card?state.origin:geometry.origin,to=target(c),type=c.type,opt={record:true,scene};
    if(state.stage!=='all'){
      const phase=state.stage;if(t>=duration()&&phase==='impact')return;
      const p=['activation','release'].includes(phase)?o:phase==='impact'?to:{x:480,y:480};
      sprite(ctx,type,phase,t,p,{...opt,...(phase==='impact'&&t<75?{width:102,height:102}:{})});return;
    }
    if(t<240)sprite(ctx,type,'activation',t,o,opt);
    if(t>=240&&t<440){const local=t-240,shape=clamp(local/75,0,1);sprite(ctx,type,'release',local,o,{...opt,width:144+shape*20,height:208-shape*24,alpha:t<=420?1:(440-t)/20});}
    if(t>=420&&t<800){const local=t-420,p=bezier(o,to,local/380),alpha=Math.min(1,local/45,(800-t)/30);sprite(ctx,type,'trail',local,p,{...opt,angle:p.angle,alpha});sprite(ctx,type,'orb',local,p,{...opt,alpha:Math.min(1,local/20)});}
    if(t>=800&&t<1200){const local=t-800,early=local<75;sprite(ctx,type,'impact',local,to,{...opt,width:early?102:194,height:early?102:194});}
  }
  function drawScene(canvas,c,t,scene){
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);if(!state.ready)return;
    cover(ctx,images.get(map().assets.backdrop),960,680);board(ctx,'self');board(ctx,'enemy');const logo=images.get(M.shared.logo);if(logo)ctx.drawImage(logo,392,15,176,44);
    const family=M.cards.filter(x=>x.type===c.type&&x.id!==c.id),o=c.id===state.card?state.origin:geometry.origin;
    paintCard(ctx,family[0],{x:o.x-58,y:o.y+8},96,144,-.13);paintCard(ctx,family[1],{x:o.x+58,y:o.y+8},96,144,.13);
    let alpha=1;if(state.stage==='all'&&t>=240)alpha=clamp(1-(t-240)/80,0,1);
    const shake=state.stage==='activation'||state.stage==='all'&&t<240?[0,.8,-1.1,1.4,-1.6,.9,-.5,0][frameAt(M.animations[c.type].activation,t)]:0;
    paintCard(ctx,c,{x:o.x+shake,y:o.y},96,144,0,state.drag&&scene==='primary'?.45:alpha);
    const to=target(c),b=geometry.boards[c.target],i=to.index;
    // Thin dashed outline is a target annotation, never a magic effect.
    ctx.save();ctx.strokeStyle='#fff4cb';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.strokeRect(b.x+i%8*b.size/8+2,b.y+Math.floor(i/8)*b.size/8+2,b.size/8-4,b.size/8-4);ctx.restore();
    drawMagic(ctx,c,t,scene);if(state.drag&&scene==='primary')paintCard(ctx,c,state.drag.point,110,165,0,.9);
    text(ctx,c.name+' → '+(c.target==='self'?'己方':'敌方')+' '+(Math.floor(i/8)+1)+'行'+(i%8+1)+'列',480,647,14);
    if(c.id==='meteor')text(ctx,'实际贯穿落点：目标列最后一个有效格',480,670,11);
    else if(c.id==='quake')text(ctx,'实际作用位置：棋盘最底部有效行',480,670,11);
    else if(c.id==='rainbow')text(ctx,'演示按现有随机选格规则确定万能块生成格',480,670,11);
    else if(state.stage==='all'&&t>=1000)text(ctx,t>=1200?'通用演出结束 · 无特效残留':'已到技能视觉衔接点',480,670,11);
  }
  function createGallery(){
    for(const [phase,name] of Object.entries(names)){
      const article=document.createElement('article'),canvas=document.createElement('canvas');canvas.width=canvas.height=256;
      const button=document.createElement('button');button.textContent=name;button.addEventListener('click',()=>{state.stage=phase;$('stage').value=phase;reset();});
      const info=document.createElement('small');article.append(canvas,button,info);$('stage-gallery').append(article);gallery.push({phase,canvas,info});
    }
  }
  function drawGallery(){
    for(const g of gallery){
      const ctx=g.canvas.getContext('2d');ctx.clearRect(0,0,256,256);if(!state.ready)continue;const a=M.animations[state.type][g.phase],local=state.stage===g.phase?state.time:state.time%(a.durationMs+(a.loop?0:280));
      if(g.phase==='activation')paintCard(ctx,selected(),{x:128,y:128});
      if(local<a.durationMs||state.stage===g.phase){const p=g.phase==='trail'?{x:232,y:128}:{x:128,y:128},sizes=g.phase==='activation'?{width:144,height:208}:g.phase==='trail'?{width:240,height:200}:{width:228,height:228};sprite(ctx,state.type,g.phase,local,p,sizes);}
      g.info.textContent=a.frameCount+'帧 · '+a.durationMs+'ms · '+(a.loop?'循环':'单次');
    }
  }
  function render(){
    state.draws=[];drawScene($('battle'),primary(),state.time,'primary');if(state.compare)drawScene($('battle-compare'),secondary(),state.time,'comparison');drawGallery();updateControls();
    const draws=state.draws.filter(d=>d.scene==='primary');$('frame-info').textContent=draws.length?draws.map(d=>names[d.phase]+' '+(d.index+1)+'/'+M.animations[d.type][d.phase].frameCount).join(' · '):state.time>=duration()?'演出已结束，画面中无通用特效。':'等待绘制素材';
  }
  function boundaries(){
    if(state.stage!=='all'){const a=M.animations[state.type][state.stage];return Array.from({length:a.frameCount+1},(_,n)=>n*a.frameDurationMs);}
    const list=[0,1200];for(const [phase,start] of [['activation',0],['release',240],['orb',420],['impact',800]]){const a=M.animations[state.type][phase],end=phase==='orb'?800:start+a.durationMs;for(let t=start;t<=end;t+=a.frameDurationMs)list.push(t);}return [...new Set(list)].sort((a,b)=>a-b);
  }
  function step(direction){state.playing=false;const list=boundaries(),t=direction>0?list.find(t=>t>state.time+.01):list.findLast(t=>t<state.time-.01);state.elapsed=state.time=t??(direction>0?duration():0);render();}
  function seek(t){state.playing=false;state.elapsed=state.time=clamp(t,0,duration());state.drag=null;render();}
  function point(e){const r=$('battle').getBoundingClientRect();return {x:(e.clientX-r.left)*960/r.width,y:(e.clientY-r.top)*680/r.height};}
  function hit(p,c=selected()){
    for(const [side,b] of Object.entries(geometry.boards))if(p.x>=b.x&&p.x<b.x+b.size&&p.y>=b.y&&p.y<b.y+b.size){const index=Math.floor((p.y-b.y)/b.size*8)*8+Math.floor((p.x-b.x)/b.size*8);return {side,index,valid:side===c.target&&map().plans[c.id][index].valid};}return null;
  }
  $('battle').addEventListener('pointerdown',e=>{
    if(!state.ready||e.button>0)return;const p=point(e),o=geometry.origin;
    if(Math.abs(p.x-o.x)<48&&Math.abs(p.y-o.y)<72){state.compare=false;$('compare').checked=false;state.stage='all';$('stage').value='all';state.playing=false;state.time=state.elapsed=0;state.origin={...o};state.drag={origin:{...o},point:p,pressed:p,pointer:e.pointerId,started:performance.now()};$('battle').setPointerCapture(e.pointerId);$('feedback').textContent='按住卡牌蓄势，拖向'+(selected().target==='self'?'己方':'敌方')+'棋盘后松手。';render();}
    else{const h=hit(p);if(h?.valid){state.targetIndices[h.side]=h.index;$('feedback').textContent='落点已选择。可重新播放，也可从手牌拖动释放。';reset();}else if(h)$('feedback').textContent='请选择'+(selected().target==='self'?'己方':'敌方')+'棋盘的有效方块格。';}
  });
  $('battle').addEventListener('pointermove',e=>{const d=state.drag;if(!d||d.pointer!==e.pointerId)return;d.point=point(e);const h=hit(d.point);$('feedback').textContent=h?.valid?'目标有效 · 松手后光团仍从原手牌位置释放':'拖向对应棋盘的有效方块格';render();});
  function cancel(){state.drag=null;reset({play:false});$('feedback').textContent='已取消，卡牌返回原手牌位置。';}
  $('battle').addEventListener('pointerup',e=>{
    const d=state.drag;if(!d||d.pointer!==e.pointerId)return;const p=point(e),h=hit(p),distance=Math.hypot(p.x-d.pressed.x,p.y-d.pressed.y);state.drag=null;if($('battle').hasPointerCapture(e.pointerId))$('battle').releasePointerCapture(e.pointerId);
    if(h?.valid&&distance>=48){state.origin={...d.origin};state.lastDrop={...p};state.targetIndices[h.side]=h.index;reset({at:240});$('feedback').textContent='有效释放：起点为原手牌中心，落点按卡牌规则确定。';}else cancel();
  });
  $('battle').addEventListener('pointercancel',cancel);$('battle').addEventListener('lostpointercapture',()=>{if(state.drag)cancel();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.drag)cancel();});
  for(const b of document.querySelectorAll('[data-type]'))b.addEventListener('click',async()=>{state.type=b.dataset.type;state.card={attack:'fire',control:'freeze',buff:'rainbow'}[state.type];state.origin={...geometry.origin};fillCards();reset();await ensureAssets();});
  $('card').addEventListener('change',async()=>{state.card=$('card').value;state.origin={...geometry.origin};reset();await ensureAssets();});
  $('map').replaceChildren(...M.maps.map(m=>new Option(m.name,m.id)));$('map').addEventListener('change',async()=>{state.ready=false;state.map=$('map').value;state.targetIndices={self:27,enemy:27};reset();await ensureAssets();});
  $('stage').addEventListener('change',()=>{state.stage=$('stage').value;reset();});$('quality').addEventListener('change',async()=>{state.quality=$('quality').value;await ensureAssets();});
  $('compare').addEventListener('change',async()=>{state.compare=$('compare').checked;state.stage='all';$('stage').value='all';reset();await ensureAssets();});
  $('replay').addEventListener('click',()=>reset());$('play').addEventListener('click',()=>{if(state.time>=duration())state.elapsed=state.time=0;state.playing=!state.playing;previous=performance.now();updateControls();});
  $('prev').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));$('seek').addEventListener('input',()=>seek(Number($('seek').value)));
  $('speed').addEventListener('change',()=>{state.speed=Number($('speed').value);previous=performance.now();});$('repeat').addEventListener('change',()=>{state.repeat=$('repeat').checked;});$('backdrop').addEventListener('change',()=>{$('stage-gallery').dataset.backdrop=$('backdrop').value;});
  for(const [type,animations] of Object.entries(M.animations))for(const [phase,a] of Object.entries(animations)){const tr=document.createElement('tr');tr.innerHTML='<td>'+M.types[type].name+' / '+a.name+'</td><td>'+a.frameCount+'</td><td>256 × 256</td><td>'+a.durationMs+'ms / '+(a.loop?'循环':'单次')+'</td><td>'+fileSize(a.atlasBytes)+'</td><td>'+fileSize(a.runtimeBytes)+'</td><td><a href="'+a.atlas+'" target="_blank">PNG图集</a><a href="'+a.frames[0].file+'" target="_blank">首帧</a></td>';$('inventory').append(tr);}
  function tick(now){
    if(state.ready&&state.drag)state.elapsed=state.time=Math.min(239,now-state.drag.started);
    else if(state.ready&&state.playing){state.elapsed+=(now-previous)*state.speed;if(state.repeat){state.elapsed%=loopPeriod();state.time=Math.min(state.elapsed,duration());}else{state.time=Math.min(state.elapsed,duration());if(state.elapsed>=duration())state.playing=false;}}
    previous=now;render();requestAnimationFrame(tick);
  }
  window.castFxReview={seek,step,reset,state,geometry,manifest:M,target:()=>target(selected()),snapshot:()=>({type:state.type,card:state.card,map:state.map,stage:state.stage,time:state.time,playing:state.playing,ready:state.ready,origin:{...state.origin},lastDrop:state.lastDrop,target:target(selected()),draws:state.draws.map(d=>({...d}))})};
  fillCards();createGallery();ensureAssets().then(()=>{if(state.ready)reset();});requestAnimationFrame(tick);
})();
