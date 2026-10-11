// Presentation-only theme. No match, score, transaction or timing rules belong here.
export const THEME = Object.freeze({
  id:'sunny-jungle',
  palette:Object.freeze([
    {name:'青柠菱',symbol:'diamond',color:'#acec49',light:'#e6ffad',mid:'#a6e641',dark:'#4f9625',edge:'#356a27'},
    {name:'葡萄星',symbol:'star',color:'#ab8af5',light:'#e6d8ff',mid:'#a785ef',dark:'#6745b0',edge:'#47327c'},
    {name:'橘子圈',symbol:'ring',color:'#ffac48',light:'#ffe4a2',mid:'#ffa238',dark:'#cd671c',edge:'#91441e'},
    {name:'汽水方',symbol:'square',color:'#4cd6e5',light:'#beffff',mid:'#45cedf',dark:'#148ba4',edge:'#126175'},
    {name:'莓果角',symbol:'triangle',color:'#ff779b',light:'#ffd4e3',mid:'#fb6e93',dark:'#c83d70',edge:'#912a54'}
  ]),
  assets:Object.freeze({atlas:'./assets/toy-atlas.svg',board:'./assets/toy-board.svg',backdrop:'./assets/jungle-scenery.webp',logo:'./assets/game-logo.svg',frame:'./assets/jungle-frame.webp',plaque:'./assets/wood-plaque.svg'}),
  tile:Object.freeze({sourceSize:128,ratio:.96,atlasColumns:5,variants:Object.freeze(['normal','row','column','blast'])}),
  board:Object.freeze({well:'#213854',busy:'#1b3049',edge:'#54727d',base:'#122b3c'}),
  motion:Object.freeze({exchangeStretch:.085,landingSquash:.095,clearPop:.2}),
  effects:Object.freeze({particleLimit:700,ringLimit:120,flashAlpha:.18,ink:'#fff5d6'}),
  ui:Object.freeze({'--bg':'#a8dcf2','--panel':'#fff4db','--ink':'#49394a','--muted':'#746268','--accent':'#8cdb42','--warm':'#ffc640'})
});
export function applyTheme(doc){
  if(!doc.documentElement?.style)return;
  for(const [key,value] of Object.entries(THEME.ui))doc.documentElement.style.setProperty(key,value);
  for(const [key,value] of Object.entries(THEME.assets))doc.documentElement.style.setProperty('--art-'+key,`url("${value}")`);
}

// Board geometry and toy tiles remain shared; only map-owned scenery changes.
export function applyMapTheme(doc,map){
  if(!doc.documentElement?.style)return;
  doc.documentElement.setAttribute?.('data-map',map?.id||'forest');
  for(const key of ['backdrop','frame'])doc.documentElement.style.setProperty('--art-'+key,`url("${map?.assets[key]||THEME.assets[key]}")`);
}
