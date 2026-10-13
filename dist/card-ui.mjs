import {CARDS,cardById,CARD_CONFIG} from './cards.mjs';
import {createCardEffects} from './card-effects.mjs';
import {CARD_ART} from './card-cast-assets.mjs';
import {audio} from './audio-manager.mjs';
const CARD_BACK='./assets/selection/ui_selection_card_back_v1_preview.webp';
const AIM_RETICLE='./assets/ui/ui_aim_reticle_soft_v1_preview.png';
const boardWide=id=>['freeze','storm','overload','sage','luck'].includes(id);

// Presentation copy only: each line retains the card's rule and numeric values.
const CARD_COPY={fire:'火浪扫附近<b>3格</b><br>逐格烧毁',quake:'横扫落点一排<br>含特殊／万能块',meteor:'贯穿一列最多<b>5格</b><br>冲击两侧·障碍止',bomb:'<b>1.8秒</b>后爆炸<br>敌方落点<b>3×3</b>区域',freeze:'敌方停止新交换<br>持续<b>3秒</b>',blackhole:'附近<b>6个</b>普通块<br>牵引并轮转位置',storm:'敌方<b>6个</b>普通块<br>随机变色',fog:'落点附近<b>4×4</b><br>迷雾持续<b>6秒</b>',overload:'己方消除得分<b>×2</b><br>持续<b>10秒</b>',sage:'己方自动最佳消除<br>持续<b>5秒</b>',rainbow:'选中普通块变万能<br>相邻交换清全同色',luck:'补充块<b>22%</b>变特殊<br>持续<b>10秒</b>'};
const face=instance=>{const c=cardById(typeof instance==='string'?instance:instance.id);return `<span class="card-painting ${c.color}"><img class="card-illustration" src="${CARD_ART[c.id]}" alt="${c.name}：${c.text}" draggable="false"><span class="card-copy-name" aria-hidden="true">${c.name}</span><span class="card-copy-kind" aria-hidden="true">${c.category}</span><span class="card-copy-description" aria-hidden="true">${CARD_COPY[c.id]}</span></span>`;};
export function createCardUI(flow){
  const $=id=>document.getElementById(id),dock=$('card-dock'),hand=$('card-hand'),enemyDock=$('opponent-card-dock'),enemyHand=$('opponent-card-hand');
  let replaceSlot=null,selected=null,drag=null,selectionSignature='',handSignature='',previewSignature='',lastBattle=null,flights=new Set();
  const arrivals=new Map();let enemySignature='';
  const boards={player:$('board'),opponent:$('opponent-board')};
  const effects=createCardEffects(flow,boards,$('card-energy'));
  const aimLayers={};for(const side of ['player','opponent']){const layer=document.createElement('div');layer.className='card-aim-layer';layer.setAttribute('aria-hidden','true');boards[side].parentElement.append(layer);aimLayers[side]=layer;}
  $('card-pool').innerHTML=CARDS.map(c=>`<button class="card-face ${c.color}" data-pick="${c.id}" aria-label="选择${c.name}，${c.text}" title="${c.text}">${face(c.id,true)}</button>`).join('');
  // Selection cues follow accepted actions; the generic button cue skips these controls.
  $('card-pool').addEventListener('click',e=>{const button=e.target.closest('[data-pick]');if(!button||!flow.selection)return;const s=flow.selection,id=button.dataset.pick,index=s.player.indexOf(id),from=center(button);if(index!==-1){if(s.remove(index))audio.play('ui.click');replaceSlot=null;}else if(s.choose(id,replaceSlot)){audio.play('ui.click');replaceSlot=null;render(performance.now());fly(cardNode({id}),from,center($('deck-slots').children[s.player.indexOf(id)]));}render(performance.now());});
  $('deck-slots').addEventListener('click',e=>{if(!flow.selection)return;const slot=e.target.closest('[data-remove],[data-slot]');if(slot&&!flow.selection.playerReady){if(flow.selection.remove(Number(slot.dataset.remove??slot.dataset.slot)))audio.play('ui.click');replaceSlot=null;}render(performance.now());});
  $('deck-ready').addEventListener('click',()=>{const s=flow.selection;if(s&&!s.playerReady&&s.ready())audio.play('ui.confirm');render(performance.now());});
  $('deck-cancel').addEventListener('click',()=>flow.cancelCards());
  const feedback=(text,important=false)=>{$('card-feedback').textContent=important?text:'';hand.setAttribute('aria-description',text);};
  function clearTargets(){for(const b of Object.values(boards)){b.classList.remove('card-valid-target','card-invalid-target');}for(const layer of Object.values(aimLayers))layer.replaceChildren();}
  function aim(hit,c){
    const battle=flow.arena.cards,side=battle.target('player',c),e=flow.arena.engines[side],layer=aimLayers[side],r=boards[side].getBoundingClientRect(),p=boards[side].parentElement.getBoundingClientRect();
    Object.assign(layer.style,{left:r.left-p.left+'px',top:r.top-p.top+'px',width:r.width+'px',height:r.height+'px'});
    const plan=hit?.side===side?battle.previewTarget(side,c.id,hit.index):null;
    const cell=(i,kind)=>`<i class="card-cell ${kind}" style="left:${i%e.width/e.width*100}%;top:${Math.floor(i/e.width)/e.height*100}%;width:${100/e.width}%;height:${100/e.height}%"></i>`;
    layer.innerHTML=boardWide(c.id)?(plan?.valid?'<i class="card-board-release"></i>':''):e.board.flatMap((t,i)=>battle.previewTarget(side,c.id,i).valid?[cell(i,'aim-legal')]:[]).join('')+(plan?.valid?plan.path.map(i=>cell(i,'aim-path')).join('')+plan.cells.map(i=>cell(i,'aim-hit')).join('')+cell(hit.index,'aim-target'):'');
    boards[side].classList.add(hit?.side===side&&!plan?.valid?'card-invalid-target':'card-valid-target');
    if(hit&&(hit.side!==side||!plan?.valid))boards[hit.side].classList.add('card-invalid-target');
    feedback(plan?.valid?'目标有效 · 高亮格子为预计影响范围':hit?'目标无效 · 松手会返回手牌':'拖向高亮棋盘，松手释放');
  }
  function targetAt(x,y){for(const [side,b] of Object.entries(boards)){const r=b.getBoundingClientRect();if(x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom){const e=flow.arena.engines[side];return {side,index:Math.floor((y-r.top)/r.height*e.height)*e.width+Math.floor((x-r.left)/r.width*e.width)};}}return null;}
  function dragAppearance(hit){
    if(!drag?.ghost)return;
    const c=cardById(drag.instance.id),battle=flow.arena.cards,legal=hit&&hit.side===battle.target('player',c)&&battle.previewTarget(hit.side,c.id,hit.index).valid;
    drag.ghost.classList.toggle('over-board',!!legal);
    drag.ghost.classList.toggle('board-wide',boardWide(c.id));
    if(legal){const size=boards[hit.side].getBoundingClientRect().width/flow.arena.engines[hit.side].width;drag.ghost.style.setProperty('--drag-icon-size',Math.max(28,Math.min(40,size*.8))+'px');}
  }
  function removeFlight(node){node.remove();flights.delete(node);}
  function fly(node,from,to,done,landing){flights.add(node);document.body.append(node);node.classList.add('card-flight');node.style.left=from.x+'px';node.style.top=from.y+'px';if(landing){node.style.width=landing.offsetWidth+'px';node.style.height=landing.offsetHeight+'px';node.classList.add('card-arrival-flight');}
    const animation=node.animate([{transform:`translate(-50%,-50%) scale(${landing?$('next-card').clientWidth/landing.offsetWidth:.7})`,opacity:1},{transform:`translate(${to.x-from.x}px,${to.y-from.y}px) translate(-50%,-50%) rotate(${landing?.style.getPropertyValue('--angle')||'0deg'}) scale(${landing?1:.45})`,opacity:landing?1:0}],{duration:430,easing:'ease-in-out',fill:'forwards'});animation.onfinish=()=>{removeFlight(node);done?.();};return animation;}
  function center(node){const r=node.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}
  function cardNode(instance){const node=document.createElement('div');node.className='card-face '+cardById(instance.id).color;node.innerHTML=face(instance);return node;}
  function cancelDrag(){const d=drag;drag=null;if(d)effects.cancelCast(d.uid);if(d?.ghost){d.ghost.classList.remove('drag-card','over-board');fly(d.ghost,{x:d.currentX,y:d.currentY},d.origin);}if(d?.button.hasPointerCapture(d.pointer))d.button.releasePointerCapture(d.pointer);clearTargets();hand.querySelectorAll('.drag-source').forEach(b=>b.classList.remove('drag-source'));}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(drag||selected!==null)){selected=null;cancelDrag();hand.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));feedback('已取消，卡牌返回手牌');}});
  hand.addEventListener('pointerdown',e=>{
    const b=e.target.closest('[data-card-uid]'),battle=flow.arena?.cards;if(!b||b.classList.contains('arriving')||e.button>0||flow.arena.status!=='playing')return;
    if(!flow.canUseCard(b.dataset.cardId)){feedback('先完成当前提示，这张卡可以继续留在手里。',true);return;}
    const origin=center(b),rect=b.getBoundingClientRect();
    e.preventDefault();selected=Number(b.dataset.cardUid);hand.querySelectorAll('[data-card-uid]').forEach(n=>n.classList.toggle('selected',n===b));
    const instance=battle.sides.player.hand.find(c=>c.uid===selected);drag={uid:selected,instance,button:b,pointer:e.pointerId,x:e.clientX,y:e.clientY,currentX:e.clientX,currentY:e.clientY,moved:false,origin};effects.prepareCast(instance,origin,[rect.width,rect.height],performance.now());b.setPointerCapture(e.pointerId);feedback(cardById(instance.id).color==='yellow'?'已选中 · 按住拖向自己的棋盘':'已选中 · 按住拖向敌方棋盘');
  });
  hand.addEventListener('pointermove',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;drag.currentX=e.clientX;drag.currentY=e.clientY;
    if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>=8){drag.moved=true;drag.ghost=cardNode(drag.instance);drag.ghost.insertAdjacentHTML('beforeend',`<img class="drag-reticle" src="${AIM_RETICLE}" alt="" aria-hidden="true" draggable="false">`);drag.ghost.classList.add('drag-card');flights.add(drag.ghost);document.body.append(drag.ghost);drag.button.classList.add('drag-source');}
    if(!drag.moved)return;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';clearTargets();
    const hit=targetAt(e.clientX,e.clientY);dragAppearance(hit);aim(hit,cardById(drag.instance.id));
  });
  hand.addEventListener('pointerup',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;clearTargets();d.button.classList.remove('drag-source');
    if(d.button.hasPointerCapture(e.pointerId))d.button.releasePointerCapture(e.pointerId);
    if(!d.moved){effects.cancelCast(d.uid);return;}
    const hit=targetAt(e.clientX,e.clientY),distance=Math.hypot(e.clientX-d.x,e.clientY-d.y);
    const result=hit&&distance>=CARD_CONFIG.minDrag?flow.castCard(d.uid,hit.side,hit.index,performance.now()):{ok:false,reason:distance<CARD_CONFIG.minDrag?'拖动距离不足，卡牌已返回':'请松手在对应棋盘内'};
    selected=null;
    if(result.ok){removeFlight(d.ghost);feedback(`已释放 ${cardById(d.instance.id).name}`);}
    else{effects.cancelCast(d.uid);d.ghost.classList.remove('drag-card','over-board');fly(d.ghost,{x:e.clientX,y:e.clientY},d.origin);feedback(result.reason,true);}
    hand.querySelectorAll('.selected').forEach(b=>b.classList.remove('selected'));render(performance.now());
  });
  hand.addEventListener('pointercancel',()=>{cancelDrag();feedback('拖动已取消');});
  hand.addEventListener('lostpointercapture',()=>{if(drag)cancelDrag();});
  hand.addEventListener('keydown',e=>{const b=e.target.closest('[data-card-uid]');if(e.key==='Escape'){selected=null;cancelDrag();hand.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));}if(b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selected=Number(b.dataset.cardUid);hand.querySelectorAll('[data-card-uid]').forEach(n=>n.classList.toggle('selected',n===b));feedback('已选中 · 按住卡牌拖向对应棋盘');}});
  function renderSelection(now){
    const s=flow.selection;$('deck-selection').hidden=!s;if(!s)return;
    const signature=JSON.stringify([s.player,s.opponent.length,s.playerReady,s.opponentReady,replaceSlot,s.error]);
    $('deck-timer').firstElementChild.textContent=Number.isFinite(s.deadline)?s.seconds(now):'—';
    $('deck-title').textContent=flow.session?'试选你的6张卡':'选择本局卡组';
    $('deck-title').nextElementSibling.textContent=flow.session?'已选5张推荐卡，补选或自由调整 · 类型无配额':'选择 6 张不同卡牌';
    $('deck-cancel').textContent=flow.session?'‹ 返回教学选关':'‹ 返回难度选择';
    document.querySelector('.deck-clock>small').textContent=flow.session?'自由选卡':'准备倒计时';
    if(signature===selectionSignature)return;selectionSignature=signature;
    const map=flow.arena.map;
    $('deck-map-preview').style.backgroundImage=`url("${map.assets.backdrop}")`;
    $('deck-map-platform').style.backgroundImage=`url("${map.assets.preview}")`;
    $('deck-map-name').textContent=`${map.icon} ${map.name}`;$('deck-map-description').textContent=map.description;
    $('deck-category-counts').textContent=`已选 ${s.player.length} / 6`;
    $('deck-slots').innerHTML=Array.from({length:6},(_,i)=>{const c=cardById(s.player[i]);return `<div class="deck-slot ${c?.color||''} ${c?'filled':''}"><button data-slot="${i}" ${c?`aria-label="${c.name}，点击取消" title="${c.text} · 点击取消"`:''} ${!c||s.playerReady?'disabled':''}>${c?face(c.id):`<b>${i+1}</b><small>待选择</small>`}</button>${c&&!s.playerReady?`<button class="slot-remove" data-remove="${i}" aria-label="移除${c.name}">×</button>`:''}</div>`;}).join('');
    $('deck-player-count').textContent=`${s.player.length} / 6`;$('deck-ai-count').textContent=`${s.opponent.length} / 6`;$('deck-ai-state').textContent=s.opponentReady?'AI 已准备':'AI 正在选择…';
    $('deck-ai-slots').innerHTML=Array.from({length:6},(_,i)=>`<span class="card-back chosen ${i<s.opponent.length?'confirmed':'pending'}" aria-label="保密卡背，${i<s.opponent.length?'已选择':'待选择'}"></span>`).join('');
    $('deck-ready').classList.toggle('deck-ready-waiting',s.player.length!==6);$('deck-ready').setAttribute('aria-hidden',String(s.player.length!==6));$('deck-ready').disabled=s.player.length!==6||s.playerReady;$('deck-ready').textContent=s.playerReady?'已准备 · 等待 AI':'我准备好了';
    $('deck-tip').textContent=s.playerReady?'卡组已锁定':s.error||(s.player.length===6?'点击已选卡牌可取消':flow.session?'三种类型自由组合，选满6张后准备':'超时自动补齐');
    $('card-pool').querySelectorAll('[data-pick]').forEach(b=>{b.classList.toggle('picked',s.player.includes(b.dataset.pick));b.disabled=s.playerReady;b.setAttribute('aria-pressed',String(s.player.includes(b.dataset.pick)));});
  }
  function reset(){cancelDrag();effects.reset();for(const f of flights){f.getAnimations().forEach(a=>a.cancel());f.remove();}flights.clear();arrivals.clear();selected=null;replaceSlot=null;selectionSignature=handSignature=previewSignature=enemySignature='';hand.replaceChildren();enemyHand.replaceChildren();feedback('红蓝卡拖向敌方 · 黄卡拖向自己');}
  function render(now){
    renderSelection(now);const battle=flow.arena?.cards;
    if(battle!==lastBattle){reset();lastBattle=battle;renderSelection(now);}
    dock.hidden=enemyDock.hidden=!battle||!!flow.selection;if(!battle)return;
    const s=battle.sides.player,enemy=battle.sides.opponent;
    $('energy-number').textContent=`${Math.floor(s.energy)} / 100`;$('card-energy-fill').style.width=s.energy+'%';$('card-energy').setAttribute('aria-valuenow',String(Math.floor(s.energy)));
    $('hand-count').textContent=`手牌 ${s.hand.filter(c=>!arrivals.has(c.uid)).length} / 6`;
    const fan=(node,count)=>{node.style.setProperty('--hand-step',Math.max(innerWidth<900?4:12,Math.min(90,(node.clientWidth-(node.querySelector('.hand-card')?.offsetWidth||144)-12)/Math.max(1,count-1)))+'px');for(const c of node.children)c.style.setProperty('--angle',Number(c.style.getPropertyValue('--offset'))*(innerWidth<900?3:6)+'deg');};
    $('opponent-hand-count').textContent=`对方手牌 ${enemy.hand.length} / 6 · 能量 ${Math.floor(enemy.energy)} / 100`;
    const es=enemy.hand.map(c=>c.uid).join(',');if(es!==enemySignature){enemySignature=es;enemyHand.innerHTML=enemy.hand.map((c,i)=>{const offset=i-(enemy.hand.length-1)/2;return `<div class="card-face hand-card opponent-hand-card" style="--offset:${offset};--angle:${offset*6}deg;--lift:${offset*offset*3}px;z-index:${i+1}" aria-label="对方卡牌，内容保密"><span class="card-painting"><img class="card-illustration" src="${CARD_BACK}" alt="卡背" draggable="false"></span></div>`;}).join('');}
    const sig=s.hand.map(c=>c.uid).join(',');if(sig!==handSignature){
      const uids=new Set(s.hand.map(c=>c.uid));if(drag&&!uids.has(drag.uid))cancelDrag();if(selected!==null&&!uids.has(selected))selected=null;handSignature=sig;
      // Keep live card nodes and pointer capture when energy draws during a drag.
      const nodes=new Map([...hand.querySelectorAll('[data-card-uid]')].map(n=>[Number(n.dataset.cardUid),n]));
      for(const [uid,node] of nodes)if(!uids.has(uid))node.remove();
      s.hand.forEach((c,i)=>{const offset=i-(s.hand.length-1)/2;let node=nodes.get(c.uid);
        if(!node){node=document.createElement('button');node.className=`card-face hand-card ${cardById(c.id).color}`;node.dataset.cardUid=c.uid;node.dataset.cardId=c.id;node.setAttribute('aria-label',`${cardById(c.id).name}，${cardById(c.id).text}`);node.innerHTML=face(c);hand.append(node);}
        node.style.setProperty('--offset',offset);node.style.setProperty('--angle',offset*6+'deg');node.style.setProperty('--lift',offset*offset*3+'px');node.style.zIndex=i+1;node.classList.toggle('selected',selected===c.uid);
      });
    }
    fan(hand,s.hand.length);fan(enemyHand,enemy.hand.length);
    for(const node of hand.querySelectorAll('[data-card-uid]')){const pending=arrivals.has(Number(node.dataset.cardUid));node.classList.toggle('arriving',pending);node.disabled=pending;node.setAttribute('aria-hidden',String(pending));}
    const preview=s.preview||s.next,ps=(preview?.uid||'empty')+':'+!!s.preview+':'+s.previewQueue.length;if(ps!==previewSignature){previewSignature=ps;$('next-card').innerHTML=preview?`<div class="card-face ${cardById(preview.id).color}">${face(preview)}</div>`:'<span class="pool-empty">本局卡池已耗尽</span>';$('preview-label').textContent=s.preview?`暂存 ${1+s.previewQueue.length} 张 · 出牌后入手`:'下一张卡牌';}

    if(drag?.moved){clearTargets();const hit=targetAt(drag.currentX,drag.currentY);dragAppearance(hit);aim(hit,cardById(drag.instance.id));}
    effects.render(now,flow.arena.status==='playing'?battle:null);
  }
  function event(e){
    effects.event(e);
    if(e.kind==='effect'&&e.side==='player'&&e.reason)feedback(e.reason,true);
    if(e.kind==='cast'&&e.side==='opponent')feedback(`AI 释放了 ${cardById(e.card.id).name}`);
    if(['draw','promote'].includes(e.kind)&&e.side==='player'&&!dock.hidden){
      const battle=lastBattle,from=center($('next-card')),pending={battle};if(e.destination==='hand')arrivals.set(e.card.uid,pending);
      const run=()=>{if(lastBattle!==battle||!battle.active)return;
        if(e.destination==='hand'){
          if(arrivals.get(e.card.uid)!==pending||!battle.sides.player.hand.some(c=>c.uid===e.card.uid)){arrivals.delete(e.card.uid);return;}
          const landing=hand.querySelector(`[data-card-uid="${e.card.uid}"]`);if(!landing)return;
          fly(cardNode(e.card),from,center(landing),()=>{if(arrivals.get(e.card.uid)!==pending)return;arrivals.delete(e.card.uid);render(performance.now());},landing);
        }else fly(cardNode(e.card),from,center($('next-card')));
      };effects.delayDraw(e.now,run,e.kind==='promote'?0:180);
    }
  }
  return {render,event,reset,boardEvent:effects.boardEvent,paintUnderlay:effects.paintUnderlay};
}
