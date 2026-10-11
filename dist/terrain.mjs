export const TERRAIN = Object.freeze({cell:'cell',hole:'hole',obstacle:'obstacle'});
const states=new Set(Object.values(TERRAIN));
export function neighbors(i,t){const r=Math.floor(i/t.width),c=i%t.width;return [c>0?i-1:-1,c<t.width-1?i+1:-1,r>0?i-t.width:-1,r<t.height-1?i+t.width:-1].filter(j=>j>=0&&t.cells[j]==='cell');}
export function triples(t){const out=[];for(let i=0;i<t.cells.length;i++)for(const axis of ['row','column']){const step=axis==='row'?1:t.width;if(axis==='row'&&i%t.width+2>=t.width)continue;if(axis==='column'&&Math.floor(i/t.width)+2>=t.height)continue;const group=[i,i+step,i+step*2];if(group.every(j=>t.cells[j]==='cell'))out.push(group);}return out;}
// A triple plus an adjacent donor outside that triple can create a match from
// a stable board. Three isolated cells, or an isolated triple, cannot.
export function witnesses(t){const lines=triples(t),out=[];for(const line of lines)for(const target of line)for(const source of neighbors(target,t)){if(line.includes(source))continue;const same=[...line.filter(i=>i!==target),source];if(lines.some(g=>g.every(i=>same.includes(i))))continue;out.push({target,source,same});}return out;}
export function createTerrain({width=8,height=8,cells}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>32||height>32)throw Error('Invalid terrain dimensions (1–32)');
  cells=cells?[...cells]:Array(width*height).fill('cell');
  if(cells.length!==width*height||!cells.every(s=>states.has(s)))throw Error('Invalid terrain cells');
  const terrain=Object.freeze({width,height,cells:Object.freeze(cells)});
  if(!witnesses(terrain).length)throw Error('Terrain cannot support a legal match-producing swap');
  return terrain;
}
export const STANDARD_TERRAIN=createTerrain();
// Authored silhouettes, all within the same 8×8 development viewport.
// '.' is a playable cell, ' ' a permanent gap, '#' an immovable pillar.
const testShape=rows=>createTerrain({width:8,height:8,cells:rows.join('').split('').map(s=>s===' '?'hole':s==='#'?'obstacle':'cell')});
export const TEST_TERRAINS=Object.freeze({
  standard:STANDARD_TERRAIN,
  cliff:testShape([
    '  ......',
    ' .......',
    ' ...... ',
    '......  ',
    '....... ',
    '  ......',
    ' ...... ',
    '   .... '
  ]),
  crystal:testShape([
    '   ..   ',
    '  ....  ',
    ' ...... ',
    '........',
    '........',
    ' ...... ',
    '  ....  ',
    '   ..   '
  ]),
  ruins:testShape([
    '........',
    '..#..#..',
    '..#..#..',
    '........',
    '.#....#.',
    '.#....#.',
    '...##...',
    '........'
  ])
});
// Holes are skipped, obstacles split the column. Each segment has its own
// vertical inlet immediately below the previous obstacle (or above row zero).
export function columnSegments(t,c){const out=[];let indices=[],top=0;for(let r=0;r<t.height;r++){const i=r*t.width+c;if(t.cells[i]==='obstacle'){if(indices.length)out.push({indices,top});indices=[];top=r+1;}else if(t.cells[i]==='cell')indices.push(i);}if(indices.length)out.push({indices,top});return out;}
