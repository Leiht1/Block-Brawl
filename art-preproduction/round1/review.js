const data=window.ART_REVIEW;
function renderCard(c,state='normal'){
 const el=document.createElement('div');el.className='card-render '+c.kind;el.dataset.card=c.id;
 el.innerHTML=`<img class="painting" src="assets/art-${c.id}.png" alt="${c.name}绘画主图"><img class="frame" src="assets/${c.kind}-${state}.png" alt="${c.category}卡框"><span class="card-name">${c.name}</span><span class="description"><span>${c.lines[0]}</span><span>${c.lines[1]}</span><small>${c.target}${c.kind==='enhance'?' · 单局1次':''}</small></span>`;return el;
}
function scaledCard(c){const box=document.createElement('div');box.className='card-scale';box.append(renderCard(c));return box;}
for(const c of data.cards){
 document.querySelector('#board-cards').append(scaledCard(c));
 const item=document.createElement('article');item.className='card-item';const box=scaledCard(c),card=box.firstChild;
 card.role='button';card.tabIndex=0;card.setAttribute('aria-label',c.name+'，点击查看已选状态');card.setAttribute('aria-pressed','false');
 let chosen=false;const frame=card.querySelector('.frame');const state=s=>frame.src=`assets/${c.kind}-${s}.png`;
 card.addEventListener('pointerenter',()=>state(chosen?'selected':'hover'));card.addEventListener('pointerleave',()=>state(chosen?'selected':'normal'));card.addEventListener('focus',()=>state(chosen?'selected':'hover'));card.addEventListener('blur',()=>state(chosen?'selected':'normal'));
 const toggle=()=>{chosen=!chosen;card.setAttribute('aria-pressed',String(chosen));state(chosen?'selected':'normal');};card.addEventListener('click',toggle);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
 item.append(box);const p=document.createElement('p');p.innerHTML=`${c.category} · ${c.target}　<a href="cards/${c.id}.png" download>下载成品 PNG</a>`;item.append(p);document.querySelector('#finished-cards').append(item);
}
for(const a of data.assets){
 if(/^(attack|control|enhance)-/.test(a.id)){const el=document.createElement('div');el.className='state-item';el.innerHTML=`<a href="${a.file}" download><img src="${a.file}" alt="${a.name}"></a><p>${a.name}</p>`;document.querySelector('#state-grid').append(el);}
 else if(!a.id.startsWith('art-')){const el=document.createElement('article');el.className='asset-item';el.innerHTML=`<a href="${a.file}" download><img src="${a.file}" alt="${a.name}"></a><h3>${a.name}</h3><p>${a.use}</p><a href="${a.file}" download>下载 PNG</a>`;document.querySelector(a.status==='direction-only'?'#fx-library':'#ui-library').append(el);}
}
for(const b of document.querySelectorAll('[data-scheme]'))b.addEventListener('click',()=>{document.querySelectorAll('[data-scheme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const file='previews/'+b.dataset.scheme+'.png';document.querySelector('#scheme-image').src=file;document.querySelector('#scheme-image').alt=b.textContent;document.querySelector('#scheme-link').href=file;});
function resizeCards(){document.querySelectorAll('.card-scale').forEach(el=>el.style.setProperty('--card-scale',el.clientWidth/320));}new ResizeObserver(resizeCards).observe(document.querySelector('main'));resizeCards();
const params=new URLSearchParams(location.search);if(params.has('card')){const c=data.cards.find(c=>c.id===params.get('card'));if(c){document.body.className='export-card';document.body.append(renderCard(c));}}if(params.has('style'))document.body.className='export-style';
if(params.has('card'))document.documentElement.style.background='transparent';
