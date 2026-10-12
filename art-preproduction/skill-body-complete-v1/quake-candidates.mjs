export const QUAKE_CANDIDATES={
 pierce:{name:'岩刺突袭',rule:'破坏落点附近最近的4个普通方块。',benefit:'有有效目标就可用，空洞地图也稳定；与火焰的横向3格区分。',visual:'4处短岩刺依次突起、碎落'},
 cross:{name:'大地震波',rule:'破坏落点及上下左右，最多5个有效普通格。',benefit:'十字范围好理解，比炸弹3×3更集中；边缘或空洞会减少命中。',visual:'裂隙向四个方向短暂扩散'},
 row:{name:'裂地横扫',rule:'破坏指定目标行全部有效普通方块，最多8格。',benefit:'用户已选择：可以选有方块的一行，不再依赖最底行。',visual:'一条低矮岩脊从左到右横向掠过',selected:true},
 chain:{name:'连锁碎岩',rule:'从落点连接同色相邻普通方块，最多6格。',benefit:'有选点策略；孤立色块只命中1格，与炸弹区域清除区分。',visual:'同色格之间分段裂纹与碎岩'}
};
export const QUAKE_SELECTED='row';
export function quakeCells(engine,index,candidate=QUAKE_SELECTED){
 const {board,width,ruleTerrain}=engine,valid=i=>!!board[i]&&ruleTerrain.cells[i]==='cell'&&!board[i].wild&&!board[i].special&&!engine.frozenCells?.has(i),cells=board.flatMap((_,i)=>valid(i)?[i]:[]);
 if(!valid(index))return [];
 if(candidate==='row')return cells.filter(i=>Math.floor(i/width)===Math.floor(index/width));
 if(candidate==='cross')return [index,index-width,index+width,index-1,index+1].filter(i=>valid(i)&&(i===index||Math.abs(Math.floor(i/width)-Math.floor(index/width))+Math.abs(i%width-index%width)===1));
 if(candidate==='chain'){const todo=[index],seen=new Set(),out=[];while(todo.length&&out.length<6){const i=todo.shift();if(seen.has(i))continue;seen.add(i);if(!valid(i)||board[i].type!==board[index].type)continue;out.push(i);for(const j of [i-width,i+width,i-1,i+1])if(Math.abs(Math.floor(j/width)-Math.floor(i/width))+Math.abs(j%width-i%width)===1)todo.push(j);}return out;}
 const distance=i=>Math.abs(i%width-index%width)+Math.abs(Math.floor(i/width)-Math.floor(index/width));return cells.sort((a,b)=>distance(a)-distance(b)||a-b).slice(0,4);
}
