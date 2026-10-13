// Crops and encodes painted source images only; no generated replacement art.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const manifest=[];
await fs.mkdir(path.join(root,'sources'),{recursive:true});
const cards=[['fire','火焰冲击','attack',370,620],['freeze','时间冻结','control',300,620],['blackhole','黑洞吸引','control',280,620],['sage','贤者时间','enhance',290,710],['rainbow','彩虹核心','enhance',280,700],['meteor','陨石坠落','attack',305,770]];
for(const [id,name,kind,top,height] of cards){
 const source=path.join(root,'sources',id+'.png');
 try{await fs.access(source);}catch{await fs.rename(path.join(root,'cards',id+'.png'),source);}
 const file='assets/art-'+id+'.png';
 await sharp(source).extract({left:95,top,width:834,height}).png().toFile(path.join(root,file));
 manifest.push({id:'art-'+id,name:name+'主图',file,use:'卡牌独立主图；由绘画源稿裁切',status:'integration-candidate',size:[834,height],source:'sources/'+id+'.png',rect:[95,top,834,height]});
}
async function slice(sheet,id,name,rect,status,use,normalize){
 const file='assets/'+id+'.png';
 let pipeline=sharp(path.join(root,'sheets',sheet+'.png')).extract({left:rect[0],top:rect[1],width:rect[2],height:rect[3]});
 if(normalize)pipeline=pipeline.resize(320,440,{fit:'fill'});
 await pipeline.png().toFile(path.join(root,file));
 const meta=await sharp(path.join(root,file)).metadata();
 manifest.push({id,name,file,use,status,size:[meta.width,meta.height],source:'sheets/'+sheet+'.png',rect,anchor:[.5,.5],scale:normalize?'uniform card canvas; do not stretch at runtime':'uniform; no nine-slice approved'});
}
const types=[['attack','进攻'],['control','控制'],['enhance','强化']];
const states=[['normal','正常'],['hover','悬停'],['selected','已选'],['disabled','禁用']];
// Source has small uneven gutters; preserve the complete nominal cells.
for(let row=0;row<3;row++)for(let col=0;col<4;col++){
 const left=Math.round(col*1254/4),top=Math.round(row*1254/3);
 const right=Math.round((col+1)*1254/4),bottom=Math.round((row+1)*1254/3);
 await slice('frames',types[row][0]+'-'+states[col][0],types[row][1]+'卡框·'+states[col][1],[left,top,right-left,bottom-top],col===0?'integration-candidate':'state-study','主图透明开窗；状态光效边缘须下一轮精修',true);
}
const ui=[
 ['title','标题牌',[0,125,372,205],'选卡标题；文字独立叠放'],
 ['deck-player','我的卡组面板',[370,50,360,310],'左侧六槽卡组底板'],
 ['deck-ai','AI卡组面板',[730,50,350,310],'右侧保密卡组底板'],
 ['pool','卡池底板',[1080,100,368,235],'下方卡池分区'],
 ['hand-base','扇形手牌底座',[0,430,520,255],'下方手牌托台与能量联系'],
 ['slot','已选卡槽',[520,390,235,300],'选卡页空槽；也可用作状态槽'],
 ['ready','准备按钮',[755,450,425,205],'文字与点击区域独立'],
 ['timer','倒计时框',[1180,380,268,305],'倒计时数字独立'],
 ['energy-track','能量槽外框',[0,795,500,175],'填充与数值独立'],
 ['energy-fill','能量填充',[500,835,375,105],'固定大小绘画纹理按百分比遮罩'],
 ['next-frame','下一张预览框',[875,690,295,345],'独立预告卡容器'],
 ['card-back','保密卡背',[1170,690,278,345],'AI卡组背面与未揭示卡']
];
for(const [id,name,rect,use] of ui)await slice('ui-components',id,name,rect,'integration-candidate',use,false);
const fxNames=[['activation','激活光框'],['release-flash','松手闪光'],['orb','魔法光团'],['trail','飞行拖尾'],['impact','命中爆点'],['windup','技能展开']];
for(let i=0;i<6;i++)await slice('vfx-direction',...fxNames[i],[i%3*512,Math.floor(i/3)*512,512,512],'direction-only','单张关键姿态；源图带色雾，不作为透明动画序列接入',false);
manifest.push({id:'selection-background',name:'选卡环境背景',file:'assets/selection-background.png',use:'低对比环境层',status:'integration-candidate'});
await fs.writeFile(path.join(root,'spec/manifest.json'),JSON.stringify({version:1,tool:'built-in imagegen + source cropping',cards:cards.map(([id,name,kind])=>({id,name,kind})),assets:manifest},null,2));
console.log('Exported',manifest.length,'asset entries');
