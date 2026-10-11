import {CARDS,cardById,CARD_CONFIG,categoryCounts} from './cards.mjs';

const face=(instance)=>{const c=cardById(typeof instance==='string'?instance:instance.id);return `<span class="card-kind">${c.category} · ${c.target==='self'?'己方':'敌方'}</span><strong>${c.name}</strong><span class="card-art" aria-hidden="true">${c.icon}</span><span class="card-description">${c.text}</span><span class="card-target">${c.color==='yellow'?'拖向自己的棋盘':'拖向敌方棋盘'}</span>`;};
export function createCardUI(flow){
  const $=id=>document.getElementById(id),dock=$('card-dock'),hand=$('card-hand');
  let replaceSlot=null,selected=null,drag=null,selectionSignature='',handSignature='',previewSignature='',lastBattle=null,overlaysSignature='',flights=new Set();
  const boards={player:$('board'),opponent:$('opponent-board')};
  const layers={};for(const side of ['player','opponent']){const layer=document.createElement('div');layer.className='card-board-effects';layer.setAttribute('aria-hidden','true');boards[side].parentElement.append(layer);layers[side]=layer;}
  $('card-pool').innerHTML=CARDS.map(c=>`<button class="card-face ${c.color}" data-pick="${c.id}" aria-label="选择${c.name}">${face(c.id)}</button>`).join('');
  $('card-pool').addEventListener('click',e=>{const button=e.target.closest('[data-pick]');if(!button||!flow.selection)return;const s=flow.selection,id=button.dataset.pick,index=s.player.indexOf(id);if(index!==-1){s.remove(index);replaceSlot=null;}else if(s.choose(id,replaceSlot))replaceSlot=null;render(performance.now());});
  $('deck-slots').addEventListener('click',e=>{if(!flow.selection)return;const remove=e.target.closest('[data-remove]');if(remove){flow.selection.remove(Number(remove.dataset.remove));replaceSlot=null;}else{const slot=e.target.closest('[data-slot]');if(slot&&!flow.selection.playerReady)replaceSlot=Number(slot.dataset.slot);}render(performance.now());});
  $('deck-ready').addEventListener('click',()=>{flow.selection?.ready();render(performance.now());});
  $('deck-cancel').addEventListener('click',()=>flow.cancelCards());
  const feedback=text=>{$('card-feedback').textContent=text;};
  function clearTargets(){for(const b of Object.values(boards)){b.classList.remove('card-valid-target','card-invalid-target');}}
  function targetAt(x,y){for(const [side,b] of Object.entries(boards)){const r=b.getBoundingClientRect();if(x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom){const e=flow.arena.engines[side];return {side,index:Math.floor((y-r.top)/r.height*e.height)*e.width+Math.floor((x-r.left)/r.width*e.width)};}}return null;}
  function removeFlight(node){node.remove();flights.delete(node);}
  function fly(node,from,to,done){flights.add(node);document.body.append(node);node.classList.add('card-flight');node.style.left=from.x+'px';node.style.top=from.y+'px';const animation=node.animate([{transform:'translate(-50%,-50%) scale(.7)',opacity:1},{transform:`translate(${to.x-from.x}px,${to.y-from.y}px) translate(-50%,-50%) scale(.45)`,opacity:0}],{duration:430,easing:'ease-in',fill:'forwards'});animation.onfinish=()=>{removeFlight(node);done?.();};}
  function center(node){const r=node.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}
  function cardNode(instance){const node=document.createElement('div');node.className='card-face '+cardById(instance.id).color;node.innerHTML=face(instance);return node;}
  function cancelDrag(){if(drag?.ghost)removeFlight(drag.ghost);drag=null;clearTargets();hand.querySelectorAll('.drag-source').forEach(b=>b.classList.remove('drag-source'));}
  hand.addEventListener('pointerdown',e=>{
    const b=e.target.closest('[data-card-uid]'),battle=flow.arena?.cards;if(!b||e.button>0||flow.arena.status!=='playing')return;
    e.preventDefault();selected=Number(b.dataset.cardUid);hand.querySelectorAll('[data-card-uid]').forEach(n=>n.classList.toggle('selected',n===b));
    const instance=battle.sides.player.hand.find(c=>c.uid===selected);drag={uid:selected,instance,button:b,pointer:e.pointerId,x:e.clientX,y:e.clientY,currentX:e.clientX,currentY:e.clientY,moved:false,origin:center(b)};b.setPointerCapture(e.pointerId);feedback(cardById(instance.id).color==='yellow'?'已选中 · 按住拖向自己的棋盘':'已选中 · 按住拖向敌方棋盘');
  });
  hand.addEventListener('pointermove',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;drag.currentX=e.clientX;drag.currentY=e.clientY;
    if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>=8){drag.moved=true;drag.ghost=cardNode(drag.instance);drag.ghost.classList.add('drag-card');flights.add(drag.ghost);document.body.append(drag.ghost);drag.button.classList.add('drag-source');}
    if(!drag.moved)return;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';clearTargets();
    const c=cardById(drag.instance.id),side=c.target==='self'?'player':'opponent';boards[side].classList.add('card-valid-target');const hit=targetAt(e.clientX,e.clientY);if(hit&&hit.side!==side)boards[hit.side].classList.add('card-invalid-target');
  });
  hand.addEventListener('pointerup',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;clearTargets();d.button.classList.remove('drag-source');
    if(d.button.hasPointerCapture(e.pointerId))d.button.releasePointerCapture(e.pointerId);
    if(!d.moved)return;
    const hit=targetAt(e.clientX,e.clientY),distance=Math.hypot(e.clientX-d.x,e.clientY-d.y);
    const result=hit&&distance>=CARD_CONFIG.minDrag?flow.arena.cards.cast('player',d.uid,hit.side,hit.index,performance.now()):{ok:false,reason:distance<CARD_CONFIG.minDrag?'拖动距离不足，卡牌已返回':'请松手在对应棋盘内'};
    selected=null;
    if(result.ok){const ghost=d.ghost;ghost.classList.remove('drag-card');fly(ghost,{x:e.clientX,y:e.clientY},center(boards[hit.side]));feedback(`已释放 ${cardById(d.instance.id).name}`);}
    else{d.ghost.classList.remove('drag-card');fly(d.ghost,{x:e.clientX,y:e.clientY},d.origin);feedback(result.reason);}
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
    const map=flow.arena.map,counts=categoryCounts(s.player);
    $('deck-map-preview').style.backgroundImage=`url("${map.assets.backdrop}")`;
    $('deck-map-platform').style.backgroundImage=`url("${map.assets.preview}")`;
    $('deck-map-name').textContent=`${map.icon} ${map.name}`;$('deck-map-description').textContent=map.description;
    $('deck-map-terrain').innerHTML=map.terrain.cells.map(type=>`<i class="${type}" aria-hidden="true"></i>`).join('');
    $('deck-map-terrain').setAttribute('aria-label','本局棋盘形状，深色为障碍，空白为缺口');
    $('deck-category-counts').innerHTML=Object.entries(counts).map(([color,n])=>`<span class="${color}">${{red:'进攻',blue:'控制',yellow:'强化'}[color]} ${n} / 2</span>`).join('');
    $('deck-slots').innerHTML=Array.from({length:6},(_,i)=>{const c=cardById(s.player[i]);return `<div class="deck-slot ${replaceSlot===i?'replacing':''}"><button data-slot="${i}" ${!c||s.playerReady?'disabled':''}>${c?`<span class="slot-icon ${c.color}">${c.icon}</span><b>${c.name}</b><small>点击替换</small>`:`<b>${i+1}</b><small>待选择</small>`}</button>${c&&!s.playerReady?`<button class="slot-remove" data-remove="${i}" aria-label="移除${c.name}">×</button>`:''}</div>`;}).join('');
    $('deck-player-count').textContent=`${s.player.length} / 6`;$('deck-ai-count').textContent=`${s.opponent.length} / 6`;$('deck-ai-state').textContent=s.opponentReady?'AI 已准备':'AI 正在选择…';
    $('deck-ai-slots').innerHTML=Array.from({length:6},(_,i)=>`<span class="card-back ${i<s.opponent.length?'chosen':''}">${i<s.opponent.length?'✦':'?'}</span>`).join('');
    $('deck-ready').hidden=s.player.length!==6;$('deck-ready').disabled=s.playerReady;$('deck-ready').textContent=s.playerReady?'已准备 · 等待 AI':'我准备好了';
    $('deck-tip').textContent=s.playerReady?'卡组已锁定，双方准备后倒计时 3 秒开赛。':s.error|| (replaceSlot!==null?'点击下方卡牌，替换高亮卡槽。':s.player.length===6?'卡组已满，可点击卡槽替换，或准备开赛。':'选择 6 张，每类最多 2 张；超时会随机补齐。');
    $('card-pool').querySelectorAll('[data-pick]').forEach(b=>{b.classList.toggle('picked',s.player.includes(b.dataset.pick));b.disabled=s.playerReady;b.setAttribute('aria-pressed',String(s.player.includes(b.dataset.pick)));});
  }
  function renderOverlays(battle,now){
    const state=Object.entries(battle.sides).map(([side,s])=>[side,Object.entries(s.buffs).filter(([,until])=>now<until).map(([id,until])=>[id,Math.ceil((until-now)/1000)]),s.fogCells,battle.cues.filter(c=>c.targetSide===side).map(c=>[c.id,c.cells]),flow.arena.engines[side].board.flatMap((t,i)=>t?.wild?[i]:[])]);
    const sig=JSON.stringify([state,Object.values(boards).map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height];})]);if(sig===overlaysSignature)return;overlaysSignature=sig;
    for(const [side,buffs,fog,cues,wild] of state){const e=flow.arena.engines[side],layer=layers[side],r=boards[side].getBoundingClientRect(),p=boards[side].parentElement.getBoundingClientRect();layer.style.left=r.left-p.left+'px';layer.style.top=r.top-p.top+'px';layer.style.width=r.width+'px';layer.style.height=r.height+'px';
      const cell=(i,kind,label)=>`<i class="card-cell ${kind}" style="left:${i%e.width/e.width*100}%;top:${Math.floor(i/e.width)/e.height*100}%;width:${100/e.width}%;height:${100/e.height}%">${label}</i>`;
      layer.innerHTML=(buffs.some(([id])=>id==='freeze')?'<div class="card-freeze-glass"></div>':'')+fog.map(i=>cell(i,'fog-cell','☁')).join('')+cues.flatMap(([id,cells])=>cells.map(i=>cell(i,id==='fire'?'fire-cell':'bomb-cell',id==='fire'?'♨':'✹'))).join('')+wild.map(i=>cell(i,'rainbow-cell','✦')).join('')+`<div class="card-buff-labels">${buffs.map(([id,seconds])=>`<span>${cardById(id).name} ${seconds}s</span>`).join('')}</div>`;
    }
  }
  function reset(){cancelDrag();for(const f of flights)f.remove();flights.clear();selected=null;replaceSlot=null;selectionSignature=handSignature=previewSignature=overlaysSignature='';hand.replaceChildren();for(const layer of Object.values(layers))layer.replaceChildren();feedback('红蓝卡拖向敌方 · 黄卡拖向自己');}
  function render(now){
    renderSelection(now);const battle=flow.arena?.cards;
    if(battle!==lastBattle){reset();lastBattle=battle;renderSelection(now);}
    dock.hidden=!battle||!!flow.selection;if(!battle){$('opponent-card-summary').hidden=true;return;}
    const s=battle.sides.player,enemy=battle.sides.opponent;
    $('opponent-card-summary').hidden=false;$('opponent-card-summary').textContent=`AI 手牌 ${enemy.hand.length} / 6 · 能量 ${Math.floor(enemy.energy)} / 100`;
    $('energy-number').textContent=`${Math.floor(s.energy)} / 100`;$('card-energy-fill').style.width=s.energy+'%';$('card-energy').setAttribute('aria-valuenow',String(Math.floor(s.energy)));
    $('hand-count').textContent=`手牌 ${s.hand.length} / 6`;
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
    const preview=s.preview||s.next,ps=preview.uid+':'+!!s.preview;if(ps!==previewSignature){previewSignature=ps;$('next-card').innerHTML=`<div class="card-face ${cardById(preview.id).color}">${face(preview)}</div>`;$('preview-label').textContent=s.preview?'暂存 · 出牌后入手':'下一张卡牌';}
    renderOverlays(battle,now);
  }
  function event(e){
    if(e.kind==='cast'&&e.side==='opponent')feedback(`AI 释放了 ${cardById(e.card.id).name}`);
    if(['draw','promote'].includes(e.kind)&&e.side==='player'&&!dock.hidden){const from=center(e.kind==='promote'?$('next-card'):$('card-energy')),to=center(e.destination==='preview'?$('next-card'):hand);fly(cardNode(e.card),from,to);}
  }
  return {render,event,reset};
}
