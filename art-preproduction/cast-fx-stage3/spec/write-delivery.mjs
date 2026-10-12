import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const M=JSON.parse(await fs.readFile(path.join(root,'spec/manifest.json')));
const V=JSON.parse(await fs.readFile(path.join(root,'qa/verification.json')));
if(V.status!=='passed')throw new Error('Verification must pass before publishing delivery notes.');
const kib=b=>(b/1024).toFixed(1)+' KiB',mib=b=>(b/1048576).toFixed(2)+' MiB';
const rows=[];
for(const [type,phases] of Object.entries(M.animations))for(const [stage,a] of Object.entries(phases))rows.push(`| ${M.types[type].name} / ${a.name} | ${a.frameCount} | 256×256 | ${a.atlasSize.join('×')} | ${a.durationMs} ms | ${a.loop?'循环':'单次'} | ${kib(a.atlasBytes)} | ${kib(a.runtimeBytes)} | ${kib(a.sequenceBytes)} |`);
let archiveBytes=0;
for(const name of await fs.readdir(path.join(root,'sources/archive')))archiveBytes+=(await fs.stat(path.join(root,'sources/archive',name))).size;
const content=`# 方块乱斗 · 第三阶段卡牌释放动画素材库

日期：2026-10-12。状态：素材已获用户认可，按用户随后授权接入正式游戏。独立预览页继续保留；接入说明与当前验证见 [CARD-CAST-INTEGRATION.md](../../../docs/CARD-CAST-INTEGRATION.md)。

## 本轮基准与范围

卡牌使用用户最新确认的 \`art-preproduction/card-reference-v3/cards/\` 中12张原画。预览采用原有背景、棋盘、棋盘框和方块素材；用户截图保存在 \`spec/approved-card-baseline.png\`，页面可展开对照。

制作通用激活、释放、光团、拖尾、命中与消散五个阶段。没有制作12张卡牌的技能本体。正式玩法、卡牌规则、生成机制、消除结算和运行时序均未修改。素材制作阶段的历史保护校验：${V.protectedFiles.checked}份文件；内容变化：${V.protectedFiles.changed.length}。正式接入的保护范围和验证另见接入说明。

## 打开与审核

直接双击本目录 \`index.html\` 即可，保持它与项目中卡牌、背景、棋盘文件的相对目录关系。预览无在线依赖，已经验证直接打开。

类型按钮可切换进攻、控制、强化；卡牌选择器只替换已确认原画与实际目标规则，复用所属类型的通用释放素材。场景选择器覆盖现有五张地图。

选择完整演出或五个独立阶段，使用重新播放、暂停、上一帧、下一帧、时间条、1×/0.5×/0.25×速度、反复播放。开启“敌方 / 己方演出对比”可在同一时间查看双方路径。透明检查可切换棋格、深色和浅色底；这些检查背景没有烘焙进任何素材。

可实际从96px宽的普通手牌按住、拖动并松手。有效释放时，爆发位置始终是按下时捕获的原手牌中心；鼠标松开只用于确认目标。无效目标取消演出。也可点击对应棋盘的有效方块选择落点，然后重新播放。

## 类型区别

- 进攻：红金卷曲魔力、锐利碎光与向外翻卷的冲击，飞向敌方棋盘。
- 控制：蓝紫交织弧带、流动旋纹与晶光碎屑，飞向敌方棋盘。
- 强化：金青祝福丝带、叶形能量与柔和星光，飞向己方棋盘。

三类分别绘制，不通过换色生成。光团与拖尾各有八个实际绘制姿态，内部纹理和外部丝带随帧改变。代码仅播放素材并控制位置、曲线、拖尾朝向与少量过渡缩放；没有临时绘制魔法粒子、几何形状或CSS光晕。

## 素材清单与资源大小

共有141个绘制帧，加3个完全透明的命中结束帧，合计144张独立PNG；15张无损PNG图集和15张浏览器优化WebP图集。每类48帧。

| 类型 / 阶段 | 帧数 | 单帧 | 图集尺寸 | 阶段时长 | 播放方式 | PNG图集 | WebP图集 | 独立PNG序列合计 |
| --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
${rows.join('\n')}

PNG图集总计 **${mib(M.totals.atlasBytes)}**；独立PNG序列总计 **${mib(M.totals.sequenceBytes)}**；默认浏览器版全部15张图集总计 **${mib(M.totals.runtimeBytes)}**。二者为替代播放格式，正式加载可选一种。

\`card-cast-assets.zip\` 为可独立使用的素材压缩包，包含序列帧、图集、高质量原图、元数据与本说明。审核页面保留在当前项目目录，使用已确认的卡牌和场景素材。

当前采用的9张高质量原始绘制图均为1254×1254 RGBA PNG，总计 **${mib(M.totals.sourceBytes)}**；另保留3张修整前原始生成稿于 \`sources/archive/\`，大小 **${mib(archiveBytes)}**。原图与导出帧均支持透明背景。

若同时解码全部15张图集，RGBA像素占用约 **${mib(M.totals.decodedAtlasBytes)}**，不含浏览器对象与已确认场景素材。按需加载所属类型即可；当前预览会缓存已访问类型，便于反复审核。

| 路径 | 内容 |
| --- | --- |
| \`index.html\`、\`preview.css\`、\`preview.js\`、\`preview-data.js\` | 独立审核页面 |
| \`frames/{attack,control,buff}/{activation,release,orb,trail,impact}/001.png…\` | 可独立使用的144张RGBA PNG |
| \`atlases/{类型}-{阶段}.png\` / \`.webp\` | 无损图集 / 浏览器优化图集 |
| \`sources/{类型}-{charge,flight,impact}.png\` | 9张原始高质量绘制图，charge包含激活与释放 |
| \`sources/archive/\` | 修整前原始素材保留 |
| \`spec/manifest.json\` | 每帧坐标、顺序、尺寸、时长、锚点、透明留边、原图位置与文件大小 |
| \`spec/source-layouts.json\` | 原始绘制图的实测分区与定位 |
| \`spec/prompts.json\`、\`spec/repairs.json\` | 全部绘制及布局修整提示词；使用内置image_gen，透明背景开启 |
| \`qa/*-contact.png\` | 三类逐帧接触表，棋格仅用于检查 |
| \`qa/*-scene.png\`、\`qa/enemy-self-comparison.png\` | 普通手牌、飞行、命中与路径对比的实际页面截图 |
| \`qa/assets.json\`、\`qa/verification.json\` | 素材指标与本轮必要验证结果 |

## 图集坐标与锚点

最终图集四列，按从左到右、从上到下排列。元数据 \`index\` 从0开始，PNG文件名从001开始。

每帧矩形为 \`x=(index%4)×256\`、\`y=floor(index/4)×256\`、\`w=h=256\`。激活、释放、光团、拖尾图集均1024×512；命中图集1024×1024。原始生成图的实际分区不完全等距，已经逐格定位与注册后导出；请使用最终图集坐标。

激活、释放、光团、命中锚点为 **(128,128)**，即归一化 **(0.5,0.5)**。拖尾锚点为 **(220,128)**，即 **(0.859375,0.5)**，位于发亮的前端，原始方向朝右；绕该点按曲线切线朝向旋转，光团与该点重合。每帧 \`contentBounds\` 和每阶段 \`minimumGutterPx\` 记录实际透明留边。

PNG保持无损RGBA、直通透明通道、sRGB，按 \`source-over\` 合成。WebP彩色质量95、透明质量100；逐像素验证优化版透明通道与PNG一致。低于或等于2/255的透明编码噪声已清理；半透明的绘制边缘保留。没有合成中间帧、程序变色或把预览背景写入素材。

## 时序与视觉衔接

| 阶段 | 完整演出时间区间 | 帧间隔 | 说明 |
| --- | --- | --- | --- |
| 激活 | 0–240 ms | 30 ms | 边框流动、能量汇聚与轻微卡牌震动 |
| 松手释放 | 240–440 ms | 25 ms | 原手牌中心爆发并凝成光团 |
| 曲线飞行 | 420–800 ms | 光团/拖尾40 ms | 释放末端与飞行重叠20ms；位置由曲线控制 |
| 命中与收尾 | 800–1200 ms | 25 ms | 前3帧压缩，第4帧闪光，随后扩散与消散 |
| 技能视觉衔接标记 | 1000 ms | — | 命中后200ms，中心开始让出空间；仅作以后接入参考 |

完整演出1.20秒；有效松手从240ms开始，至收尾共0.96秒。光团与拖尾独立循环各320ms；命中400ms包含自然消散及最终透明帧。独立阶段可以重新计时，不依赖完整演出。

预览中的普通手牌为96×144。建议显示尺寸：激活144×208、释放164×184、光团102×102、进攻/强化拖尾190×140、控制拖尾280×160、命中194×194。控制拖尾采用更舒展的显示尺寸，让蓝紫交织丝带在普通手牌尺寸下保持可见。命中前3个压缩帧沿用光团102×102尺寸，其后使用194×194。这些为当前审核场景的像素尺寸，后续随游戏画布统一缩放。

## 实际目标规则与后续接入建议

本页读取现有规则生成审核用有效落点，不调用正式战斗流程。进攻/控制只能指向敌方，强化只能指向己方；地图空洞、障碍格与卡牌实际目标区域均参与预览。

陨石使用当前规则的 \`plan.landing\` 实际贯穿终点；大地震动落在实际最底部有效行的作用格。彩虹核心按当前随机选普通方块的规则确定演示生成格，因此不直接采用鼠标所在格；正式接入时应使用实际 \`card-change.index\` 事件中的生成格。

以下接入约定已用于本次正式接入，保留供后续维护：

1. 卡牌节点移除之前保存原手牌中心；有效释放沿用当前卡牌目标校验，之后从保存位置播放释放素材。
2. 使用实际卡牌 \`target\`、已验证目标计划和技能事件给出的落点驱动曲线，尤其保留陨石、大地震动和彩虹核心的实际规则。
3. 光团与拖尾以各自帧序列循环播放，位移由代码控制；拖尾绕发亮前端沿切线朝向，光团本身通过实际连续绘制帧表现魔力流动。
4. 命中后约200ms可与未来技能本体视觉重叠；当前仅保留衔接标记，不包含技能本体。
5. 动画作为视觉层观察现有结算事件，保持正式规则与运行时序；不要通过等待动画延迟现有消除、生成或技能结算。取消、切换对局或页面销毁时释放视觉对象，播放结束使用透明终帧并回收。
6. 浏览器优先使用所属类型的WebP图集，PNG和高质量原图保留给后续美术修改与其他工具使用。

## 本轮验证

验证结果：**${V.status}**。仅验证本轮素材和审核页面：${V.browser.framesChecked}个真实帧实际绘制、15张PNG图集逐像素对应序列帧、15张WebP透明通道一致、图集留边、循环首尾差异、三类完整收尾、暂停与逐帧、慢速和反复播放、敌我路径对比、原手牌释放起点、五张地图与12张卡牌目标、直接打开页面、三种窗口尺寸以及保护文件内容。

逐帧接触表和实际场景截图供视觉复核。没有运行无关游戏模块的全量回归。素材通过用户审核后才按明确授权接入正式游戏；未进入下一步技能本体制作。
`;
await fs.writeFile(path.join(root,'spec/DELIVERY.md'),content);
console.log('Saved DELIVERY.md with current verified sizes and metadata.');
