import {TEST_TERRAINS,createTerrain} from './terrain.mjs';
import {THEME} from './theme.mjs';
const event=(type,art,tuning={})=>Object.freeze({enabled:true,count:1,type,art:Object.freeze(art),firstDelay:20000,intervalMin:20000,intervalMax:30000,warning:1500,impact:300,duration:5000,waitLimit:5000,...tuning});
const rockfall=event('rockfall',{material:'sandstone',warning:'#ffdb68',chips:'#cdb698'},{firstDelay:12000,intervalMin:20000,intervalMax:26000,impact:650,footprints:Object.freeze([
  {name:'single',weight:2,cells:[[0,0]]},
  {name:'wide',weight:2,cells:[[0,0],[1,0]]},
  {name:'tall',weight:2,cells:[[0,0],[0,1]]},
  {name:'massive',weight:4,cells:[[0,0],[1,0],[0,1],[1,1]]}
])});
const freeze=event('freeze',{material:'ice',edge:'#c4f7ff',mist:'#dcfaff'},{firstDelay:10000,intervalMin:18000,intervalMax:24000,count:4,warning:2100,impact:1100,duration:1400,persistent:true});
const mechanism=event('mechanism',{material:'carved-stone',rune:'#ffdc8b',stone:'#baab8a'},{firstDelay:14000,intervalMin:22000,intervalMax:28000,count:4,warning:1800,impact:1200,duration:900});
const fire=event('fire',{material:'flame',warning:'#ff6834',embers:'#ffc86a'},{firstDelay:13000,intervalMin:28000,intervalMax:34000,count:3,warning:2400,impact:900,duration:9000,spreadInterval:3000,spreadWarning:650});
export const FURNACE_TERRAIN=createTerrain({cells:['  ....  ',' ...... ','........','........','........','........',' ...... ','  ....  '].join('').split('').map(c=>c===' '?'hole':'cell')});
const preview={forest:['🌿','森林石台：完整棋盘，自由消除。'],cliff:['🪨','山崩落石：山体震动、碎石坠落，巨石砸入棋盘。'],crystal:['❄️','寒潮冻结：冰晶包裹方块，只能通过消除影响破冰。'],ruins:['🏛️','古代转盘：符文唤醒齿轮，局部石板与方块旋转，改变通道。'],furnace:['🔥','高温燃烧：熔炉升温，每3秒向四邻格蔓延，整轮燃烧9秒。']};
const map=(id,name,description,terrain,assets,material,environment=null)=>Object.freeze({id,name,description,icon:preview[id][0],brief:preview[id][1],terrain,assets:Object.freeze({...assets,preview:`./assets/maps/${id}-preview.svg`}),material:Object.freeze(material),environment});
export const MAPS=Object.freeze([
  map('forest','标准森林','完整棋盘，自由消除；无环境事件。',TEST_TERRAINS.standard,{backdrop:THEME.assets.backdrop,board:THEME.assets.board,frame:THEME.assets.frame,obstacle:null},{base:THEME.board.base,well:THEME.board.well,rim:'#927963',obstacle:'#6c747a',style:'forest'}),
  map('cliff','悬崖断层','开赛12秒后落石；每20–26秒一轮，岩块覆盖1/2/4格，阻碍5秒。',TEST_TERRAINS.cliff,{backdrop:'./assets/maps/cliff-canyon.svg',board:'./assets/maps/cliff-board.svg',frame:'./assets/maps/cliff-stage-left.svg',stageRight:'./assets/maps/cliff-stage-right.svg',obstacle:'./assets/maps/falling-rock.svg'},{base:'#b5b4a1',well:'#929588',rim:'#d4cbb1',obstacle:'#857465',style:'cliff'},rockfall),
  map('crystal','冰晶雪原','寒潮随机冻结4块；不会自动融化，邻近消除或技能命中才能破冰。',TEST_TERRAINS.crystal,{backdrop:'./assets/maps/crystal-landscape.svg',board:'./assets/maps/crystal-board.svg',frame:'./assets/maps/crystal-stage.svg',obstacle:'./assets/maps/crystal-obstacle.svg'},{base:'#c2d0d0',well:'#acbdc2',rim:'#f2f6ee',obstacle:'#83bed7',style:'crystal'},freeze),
  map('ruins','古代遗迹','古代机关将局部2×2石板与方块顺时针旋转，改变交换与下落通道。',TEST_TERRAINS.ruins,{backdrop:'./assets/maps/ruins-temple.svg',board:'./assets/maps/ruins-board.svg',frame:'./assets/maps/ruins-stage.svg',obstacle:'./assets/maps/ruins-pillar.svg'},{base:'#c2b699',well:'#a79e88',rim:'#e9dbbb',obstacle:'#938875',style:'ruins'},mechanism),
  map('furnace','炽焰熔炉','熔炉升温后3格起火，每3秒向上下左右扩散一圈；整轮9秒，燃烧格不可交换。',FURNACE_TERRAIN,{backdrop:'./assets/maps/furnace-hall.svg',board:'./assets/maps/furnace-board.svg',frame:'./assets/maps/furnace-stage.svg',obstacle:null},{base:'#4d4c57',well:'#353640',rim:'#8b8586',obstacle:'#59535b',style:'furnace'},fire)
]);
export const FOREST_MAP=MAPS[0];
export function selectMap(random=Math.random){return MAPS[Math.min(MAPS.length-1,Math.floor(random()*MAPS.length))];}
