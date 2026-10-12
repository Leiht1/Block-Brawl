import {CARDS,cardById,CARD_CONFIG} from './cards.mjs';
import {createCardEffects} from './card-effects.mjs';
import {CARD_ART} from './card-cast-assets.mjs';

const face=instance=>{const c=cardById(typeof instance==='string'?instance:instance.id);return `<img class="card-illustration" src="${CARD_ART[c.id]}" alt="${c.name}：${c.text}" draggable="false">`;};
export function createCardUI(flow){
  const $=id=>document.getElementById(id),dock=$('card-dock'),hand=$('card-hand');
  let replaceSlot=null,selected=null,drag=null,selectionSignature='',handSignature='',previewSignature='',lastBattle=null,flights=new Set();
  const boards={player:$('board'),opponent:$('opponent-board')};
  const effects=createCardEffects(flow,boards,$('card-energy'));
  const aimLayers={};for(const side of ['player','opponent']){const layer=document.createElement('div');layer.className='card-aim-layer';layer.setAttribute('aria-hidden','true');boards[side].parentElement.append(layer);aimLayers[side]=layer;}
  $('card-pool').innerHTML=CARDS.map(c=>`<button class="card-face ${c.color}" data-pick="${c.id}" aria-label="选择${c.name}，${c.text}" title="${c.text}">${face(c.id,true)}</button>`).join('');
  $('card-pool').addEventListener('click',e=>{const button=e.target.closest('[data-pick]');if(!button||!flow.selection)return;const s=flow.selection,id=button.dataset.pick,index=s.player.indexOf(id),from=center(button);if(index!==-1){s.remove(index);replaceSlot=null;}else if(s.choose(id,replaceSlot)){replaceSlot=null;render(performance.now());fly(cardNode({id}),from,center($('deck-slots').children[s.player.indexOf(id)]));}render(performance.now());});
  $('deck-slots').addEventListener('click',e=>{if(!flow.selection)return;const slot=e.target.closest('[data-remove],[data-slot]');if(slot&&!flow.selection.playerReady){flow.selection.remove(Number(slot.dataset.remove??slot.dataset.slot));replaceSlot=null;}render(performance.now());});
  $('deck-ready').addEventListener('click',()=>{flow.selection?.ready();render(performance.now());});
  $('deck-cancel').addEventListener('click',()=>flow.cancelCards());
  const feedback=text=>{$('card-feedback').textContent=text;};
  function clearTargets(){for(const b of Object.values(boards)){b.classList.remove('card-valid-target','card-invalid-target');}for(const layer of Object.values(aimLayers))layer.replaceChildren();}
  function aim(hit,c){
    const battle=flow.arena.cards,side=battle.target('player',c),e=flow.arena.engines[side],layer=aimLayers[side],r=boards[side].getBoundingClientRect(),p=boards[side].parentElement.getBoundingClientRect();
    Object.assign(layer.style,{left:r.left-p.left+'px',top:r.top-p.top+'px',width:r.width+'px',height:r.height+'px'});
    const plan=hit?.side===side?battle.previewTarget(side,c.id,hit.index):null;
    const cell=(i,kind)=>`<i class="card-cell ${kind}" style="left:${i%e.width/e.width*100}%;top:${Math.floor(i/e.width)/e.height*100}%;width:${100/e.width}%;height:${100/e.height}%"></i>`;
    layer.innerHTML=e.board.flatMap((t,i)=>t&&e.ruleTerrain.cells[i]==='cell'&&!e.frozenCells.has(i)?[cell(i,'aim-legal')]:[]).join('')+(plan?.valid?plan.path.map(i=>cell(i,'aim-path')).join('')+plan.cells.map(i=>cell(i,'aim-hit')).join(''):'');
    boards[side].classList.add(hit?.side===side&&!plan?.valid?'card-invalid-target':'card-valid-target');
    if(hit&&(hit.side!==side||!plan?.valid))boards[hit.side].classList.add('card-invalid-target');
    feedback(plan?.valid?'目标有效 · 高亮格子为预计影响范围':hit?'目标无效 · 松手会返回手牌':'拖向高亮棋盘，松手释放');
  }
  function targetAt(x,y){for(const [side,b] of Object.entries(boards)){const r=b.getBoundingClientRect();if(x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom){const e=flow.arena.engines[side];return {side,index:Math.floor((y-r.top)/r.height*e.height)*e.width+Math.floor((x-r.left)/r.width*e.width)};}}return null;}
  function removeFlight(node){node.remove();flights.delete(node);}
  function fly(node,from,to,done){flights.add(node);document.body.append(node);node.classList.add('card-flight');node.style.left=from.x+'px';node.style.top=from.y+'px';const animation=node.animate([{transform:'translate(-50%,-50%) scale(.7)',opacity:1},{transform:`translate(${to.x-from.x}px,${to.y-from.y}px) translate(-50%,-50%) scale(.45)`,opacity:0}],{duration:430,easing:'ease-in',fill:'forwards'});animation.onfinish=()=>{removeFlight(node);done?.();};}
  function center(node){const r=node.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}
  function cardNode(instance){const node=document.createElement('div');node.className='card-face '+cardById(instance.id).color;node.innerHTML=face(instance);return node;}
  function cancelDrag(){const d=drag;drag=null;if(d)effects.cancelCast(d.uid);if(d?.ghost){d.ghost.classList.remove('drag-card');fly(d.ghost,{x:d.currentX,y:d.currentY},d.origin);}if(d?.button.hasPointerCapture(d.pointer))d.button.releasePointerCapture(d.pointer);clearTargets();hand.querySelectorAll('.drag-source').forEach(b=>b.classList.remove('drag-source'));}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(drag||selected!==null)){selected=null;cancelDrag();hand.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));feedback('已取消，卡牌返回手牌');}});
  hand.addEventListener('pointerdown',e=>{
    const b=e.target.closest('[data-card-uid]'),battle=flow.arena?.cards;if(!b||e.button>0||flow.arena.status!=='playing')return;
    const origin=center(b),rect=b.getBoundingClientRect();
    e.preventDefault();selected=Number(b.dataset.cardUid);hand.querySelectorAll('[data-card-uid]').forEach(n=>n.classList.toggle('selected',n===b));
    const instance=battle.sides.player.hand.find(c=>c.uid===selected);drag={uid:selected,instance,button:b,pointer:e.pointerId,x:e.clientX,y:e.clientY,currentX:e.clientX,currentY:e.clientY,moved:false,origin};effects.prepareCast(instance,origin,[rect.width,rect.height],performance.now());b.setPointerCapture(e.pointerId);feedback(cardById(instance.id).color==='yellow'?'已选中 · 按住拖向自己的棋盘':'已选中 · 按住拖向敌方棋盘');
  });
  hand.addEventListener('pointermove',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;drag.currentX=e.clientX;drag.currentY=e.clientY;
    if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>=8){drag.moved=true;drag.ghost=cardNode(drag.instance);drag.ghost.classList.add('drag-card');flights.add(drag.ghost);document.body.append(drag.ghost);drag.button.classList.add('drag-source');}
    if(!drag.moved)return;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';clearTargets();
    aim(targetAt(e.clientX,e.clientY),cardById(drag.instance.id));
  });
  hand.addEventListener('pointerup',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;clearTargets();d.button.classList.remove('drag-source');
    if(d.button.hasPointerCapture(e.pointerId))d.button.releasePointerCapture(e.pointerId);
    if(!d.moved){effects.cancelCast(d.uid);return;}
    const hit=targetAt(e.clientX,e.clientY),distance=Math.hypot(e.clientX-d.x,e.clientY-d.y);
    const result=hit&&distance>=CARD_CONFIG.minDrag?flow.arena.cards.cast('player',d.uid,hit.side,hit.index,performance.now()):{ok:false,reason:distance<CARD_CONFIG.minDrag?'拖动距离不足，卡牌已返回':'请松手在对应棋盘内'};
    selected=null;
    if(result.ok){removeFlight(d.ghost);feedback(`已释放 ${cardById(d.instance.id).name}`);}
    else{effects.cancelCast(d.uid);d.ghost.classList.remove('drag-card');fly(d.ghost,{x:e.clientX,y:e.clientY},d.origin);feedback(result.reason);}
    hand.querySelectorAll('.selected').forEach(b=>b.classList.remove('selected'));render(performance.now());
  });
  hand.addEventListener('pointercancel',()=>{cancelDrag();feedback('拖动已取消');});
  hand.addEventListener('lostpointercapture',()=>{if(drag)cancelDrag();});
  hand.addEventListener('keydown',e=>{const b=e.target.closest('[data-card-uid]');if(e.key==='Escape'){selected=null;cancelDrag();hand.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));}if(b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selected=Number(b.dataset.cardUid);hand.querySelectorAll('[data-card-uid]').forEach(n=>n.classList.toggle('selected',n===b));feedback('已选中 · 按住卡牌拖向对应棋盘');}});
  function renderSelection(now){
    const s=flow.selection;$('deck-selection').hidden=!s;if(!s)return;
    const signature=JSON.stringify([s.player,s.opponent.length,s.playerReady,s.opponentReady,replaceSlot,s.error]);
    $('deck-timer').textContent=s.seconds(now)+' 秒';$('deck-map').textContent=`${flow.arena.map.icon} ${flow.arena.map.name} · 先到 15000 分获胜`;
    if(signature===selectionSignature)return;selectionSignature=signature;
    const map=flow.arena.map;
    $('deck-map-preview').style.backgroundImage=`url("${map.assets.backdrop}")`;
    $('deck-map-platform').style.backgroundImage=`url("${map.assets.preview}")`;
    $('deck-map-name').textContent=`${map.icon} ${map.name}`;$('deck-map-description').textContent=map.description;
    $('deck-map-terrain').innerHTML=map.terrain.cells.map(type=>`<i class="${type}" aria-hidden="true"></i>`).join('');
    $('deck-map-terrain').setAttribute('aria-label','本局棋盘形状，深色为障碍，空白为缺口');
    $('deck-category-counts').textContent=`已选 ${s.player.length} / 6`;
    $('deck-slots').innerHTML=Array.from({length:6},(_,i)=>{const c=cardById(s.player[i]);return `<div class="deck-slot ${c?.color||''}"><button data-slot="${i}" ${!c||s.playerReady?'disabled':''}>${c?`<span class="slot-icon ${c.color}">${c.icon}</span><b>${c.name}</b><small>点击取消</small>`:`<b>${i+1}</b><small>待选择</small>`}</button>${c&&!s.playerReady?`<button class="slot-remove" data-remove="${i}" aria-label="移除${c.name}">×</button>`:''}</div>`;}).join('');
    $('deck-player-count').textContent=`${s.player.length} / 6`;$('deck-ai-count').textContent=`${s.opponent.length} / 6`;$('deck-ai-state').textContent=s.opponentReady?'AI 已准备':'AI 正在选择…';
    $('deck-ai-slots').innerHTML=Array.from({length:6},(_,i)=>`<span class="card-back ${i<s.opponent.length?'chosen':''}">${i<s.opponent.length?'✦':'?'}</span>`).join('');
    $('deck-ready').hidden=s.player.length!==6;$('deck-ready').disabled=s.playerReady;$('deck-ready').textContent=s.playerReady?'已准备 · 等待 AI':'我准备好了';
    $('deck-tip').textContent=s.playerReady?'卡组已锁定，双方准备后倒计时 3 秒开赛。':s.error||(s.player.length===6?'卡组已满，点击已选卡牌可取消，或准备开赛。':'任意选择 6 张不同卡牌；超时会随机补齐。');
    $('card-pool').querySelectorAll('[data-pick]').forEach(b=>{b.classList.toggle('picked',s.player.includes(b.dataset.pick));b.disabled=s.playerReady;b.setAttribute('aria-pressed',String(s.player.includes(b.dataset.pick)));});
  }
  function reset(){cancelDrag();effects.reset();for(const f of flights)f.remove();flights.clear();selected=null;replaceSlot=null;selectionSignature=handSignature=previewSignature='';hand.replaceChildren();feedback('红蓝卡拖向敌方 · 黄卡拖向自己');}
  function render(now){
    renderSelection(now);const battle=flow.arena?.cards;
    if(battle!==lastBattle){reset();lastBattle=battle;renderSelection(now);}
    dock.hidden=!battle||!!flow.selection;if(!battle){$('opponent-card-summary').hidden=true;return;}
    const s=battle.sides.player,enemy=battle.sides.opponent;
    $('opponent-card-summary').hidden=false;$('opponent-card-summary').textContent=`AI 手牌 ${enemy.hand.length} / 6 · 能量 ${Math.floor(enemy.energy)} / 100`;
    $('energy-number').textContent=`${Math.floor(s.energy)} / 100`;$('card-energy-fill').style.width=s.energy+'%';$('card-energy').setAttribute('aria-valuenow',String(Math.floor(s.energy)));
    $('hand-count').textContent=`手牌 ${s.hand.length} / 6`;
    hand.style.setProperty('--hand-step',Math.max(16,Math.min(s.hand.length<=3?130:76,(hand.clientWidth-150)/Math.max(1,s.hand.length-1)))+'px');
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
    const preview=s.preview||s.next,ps=(preview?.uid||'empty')+':'+!!s.preview+':'+s.previewQueue.length;if(ps!==previewSignature){previewSignature=ps;$('next-card').innerHTML=preview?`<div class="card-face ${cardById(preview.id).color}">${face(preview)}</div>`:'<span class="pool-empty">本局卡池已耗尽</span>';$('preview-label').textContent=s.preview?`暂存 ${1+s.previewQueue.length} 张 · 出牌后入手`:'下一张卡牌';}

    if(drag?.moved){clearTargets();aim(targetAt(drag.currentX,drag.currentY),cardById(drag.instance.id));}
    effects.render(now,flow.arena.status==='playing'?battle:null);
  }
  function event(e){
    effects.event(e);
    if(e.kind==='cast'&&e.side==='opponent')feedback(`AI 释放了 ${cardById(e.card.id).name}`);
    if(['draw','promote'].includes(e.kind)&&e.side==='player'&&!dock.hidden){const run=()=>{if(!lastBattle?.active)return;fly(cardNode(e.card),center($('next-card')),center(e.destination==='preview'?$('next-card'):hand));};if(e.kind==='draw')effects.delayDraw(e.now,run);else run();}
  }
  return {render,event,reset,boardEvent:effects.boardEvent,paintUnderlay:effects.paintUnderlay};
}
