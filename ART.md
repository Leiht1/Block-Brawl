# 2026-10-12 · 方案C卡牌与通用释放（当前卡牌标准）

2026-10-12已确认并正式接入：12张技能本体采用当前审核稿；贤者时间选择“金色蒙层＋底层透光”，底光位于地形之后、方块之前。裂地采用落点所在横排的有效普通方块；迷雾采用落点附近12个有效普通格的一团大雾，6秒控制结束后1.2秒仅视觉消散。幸运星保持亮金色、原10秒22%特殊补充概率，幸运星与超载仅使用左侧大图标和真实倒计时。正式路径及接入约定见 docs/SKILL-BODY-INTEGRATION.md。

以下制作/接入步骤按当时状态保留；当前状态以上述2026-10-12接入记录为准。


当前项目美术规范正式维护于 `docs/art/`，项目级 `AGENTS.md` 要求相关任务开始前必读。背景、棋盘与地图继续沿用下方已确认标准。卡牌只换技能画窗，保留v3卡框与文字；新源稿、提示词、画窗装配范围和版本状态见 `art-preproduction/cards-soft-c/`。通用释放已按用户确认的v2放大稿再放大至1.5倍并接入v3正式效果；进攻柔和浅红金、控制浅蓝白、强化奶金白，保持可追踪光球、透明拖尾、空心贴地涟漪与短余辉。只改表现层，不改玩法或扩展技能本体。预览：`art-preproduction/cast-soft-v3/index.html`。

# 2026-10-11 · 对战界面与事件细节修正（当前环境标准）

地图名锚定分数牌上方，桌面保留约29px间隔并常驻；窄屏放到顶部，避免碰到工具栏。遗迹中央大齿轮转速由0.22rad/s提高到1.2rad/s，演出阶段共享起始时刻，预警、转盘和完成阶段连续转动。

悬崖删除平台SVG内超出视窗的左右山壁根部，山壁继续由原背景表现；平台保留轮廓／厚度／藤蔓，晃动时没有竖直硬裁切山壁。生成器同步修改，重建不会恢复旧山壁。冰川四周去掉枝状硬线，改成蓝白渐变及柔软径向雾团，方块冰壳和消除破冰保持。

熔炉在第3／6秒从所有已有火格向上下左右同时扩散一圈，每个有效目标仍提前650ms红框预热。重叠目标去重、边缘不跨行，避开空洞／特殊块／忙碌格并保留合法操作；整轮第9秒结束，恢复原方块。双方同一时刻蔓延，边缘位置不同可能产生不同目标数量。整波同列目标全部提交后才释放列锁。

223项回归、14项浏览器验收通过，无页面错误／404。验证名字持续可见且不覆盖分数牌、窄屏不覆盖工具栏、平台SVG外侧透明、四方向同步蔓延、原9秒截止与退出恢复。保存52张关键帧、4张分镜和前后对照到 validation/2026-10-11/map-feedback/index.html。以下为上一轮及历史记录。

# 2026-10-11 · 原有画风细化（当前标准）

这一轮直接细化现有素材，不接入刚才生成的新背景。保留各图的原构图、配色、平台轮廓、承重连接、遮挡、透明有效格遮罩和480×480棋盘。森林保留现有背景及藤蔓石框，原底板补浅划痕；其余四图在原SVG路径上补切面明暗、磨损、石缝、积雪反光、冰湖裂隙与金属铆接。材质颗粒很浅，主要细节来自原有结构。

细化入口为 scripts/refine-native-art.mjs，共14个现有素材。可重复运行，校验结果字节一致；重建原素材之后再执行该脚本即可恢复细化。背景和底板路径保持现有绑定，未使用新增绘画背景。

熔炉背景按事件进度整体提亮，原炉口／岩浆向场景散射暖光；目标格和蔓延格先红框发亮，后出现实时火舌。遗迹在神殿中央嵌入约600px直径的大齿轮，符文发光并旋转预警。冰川在屏幕四边长出霜雾与枝晶，方块冰壳改为不规则切面、厚边、羽状霜纹、气泡和外生晶体，彩色核心仍可识别。

对照与演出查看页：validation/2026-10-11/map-refinement/index.html。以下为历史美术记录。

# 地图表现 2.0 · 炽焰熔炉与世界演出（2026-10-11）

本轮沿既有代码原生SVG体系制作，没有生成写实3D/概念图、没有将旧背景简单换色。`scripts/build-furnace-art.mjs`生成`furnace-hall.svg`、`furnace-stage.svg`、`furnace-board.svg`、`furnace-rock.svg`和`furnace-preview.svg`。地下承重拱、后方炉口、金属管道、八角黑曜石机关与底部岩浆各自绘制；周围岩浆采用低饱和铜褐色，红橙色仅用于小面积缝隙和短时喷发。平台边缘厚度、金属倒面/铆钉和原果冻积木保持卡通玩具方向。

运行时`map-scene.mjs`在UI之后的世界层画环境，在两块棋盘外围连续承接云雾/风雪/机关/火星；`board-painter.mjs`共用两方的边缘反应、落石、透明冻结、破冰、开槽升柱、岩浆升起/冷却/碎裂。环境粒子数量固定，颜色与亮度低于可玩方块；不增加全屏高亮或棋盘整层模糊。五阶段只影响绘制；减少动态效果关闭相机/平台位移和粒子运动。

完整关键帧、分镜与离线查看页：`validation/2026-10-11/map-presentation-2/`。


# 美术资源与主题

## 2026-10-11 · 三种设施与地图预告（当前标准）

继续采用简洁、低饱和卡通幻想环境；材质复杂度由环境向五色果冻积木递增，禁止用精细明亮场景与简洁平台混搭。各图先设计设施和环境的结构连接，再做克制材质，不以统一矩形框换色区分地图。

悬崖保留机关石台轮廓，断面33–73px，断口少量碎石；灰青天空、远山、云雾和瀑布辅助深谷。冰原用白/灰/淡蓝的雪山冰湖，40格平台采用透明冰层和折射切面，雪岸为自然弧线，两个晶体簇只在非有效格。遗迹用米色神殿、柱廊和台阶，54格祭坛带厚底石材，10座封印柱具有斜顶、层基和浅绿色封印，少量苔藓。森林保持既有资源。

当前资源：`cliff-canyon.svg`及左右`cliff-stage-*.svg`；`crystal-landscape.svg`/`crystal-stage.svg`；`ruins-temple.svg`/`ruins-stage.svg`/`ruins-pillar.svg`。三图各自的`*-board.svg`为低对比浅槽，`*-preview.svg`是预告用静态设施缩图；森林仅新增预告缩图，不改原战场。全部资源离线SVG、无外部图源/字体/滤镜。悬崖生成器`build-cliff-art.mjs`；冰原、遗迹及四张预告缩图生成器`build-facility-art.mjs`，背景本身也是可编辑SVG。`build-map-art.mjs`调用两者，原九切片模板不会覆盖新设施。

设施绘于原Canvas下方，遮罩剔除全部有效格/障碍格，透明空洞显示环境，装饰鼠标穿透。双方480×480、8×8坐标及原UI边界保持。固定SVG让浏览器缓存设施，底板继续复用原栅格缓存，没有逐帧复杂材质或新场景动画。

单框地图预告显示环境＋静态平台，轮播3秒，锁定地图和实际特性2秒；不展示四张选择卡。开战名称/图标只作短暂顶部中央提示，不长期显示地图说明。冻结和动态机关尚未实现，预告文案不承诺其存在。验收截图与局部图在`validation/2026-10-11/map-facilities/`。

## 2026-10-11 · 悬崖视觉标准（覆盖下方悬崖旧约定）

以用户确认的简洁低饱和峡谷为准：环境与石台必须同一材质和细节尺度，背景保持安静，五色积木是第一视觉焦点。提升品质优先改变大形体、厚度、承重连接、遮挡与断层，而非增加纹理密度或明亮写实背景。精细imagegen峡谷候选未采用，避免与简洁石台混搭。

- `dist/assets/maps/cliff-canyon.svg`：可编辑1600×1000静态峡谷，天空/远山/瀑布/侧崖/深谷；3,131 B。
- `cliff-stage-left.svg` / `cliff-stage-right.svg`：分别650×600、640×600视窗，棋盘原点仍为(0,0)，附带左/右承重根部、连续轮廓倒角、29–68px朝下断面、局部藤蔓与碎石；8,738 B / 8,721 B。
- `cliff-board.svg`：480×480克制的中性浅凿槽，17,463 B。Canvas仍按48格裁剪并复用原栅格缓存。

石台由`scripts/build-cliff-art.mjs`从`TEST_TERRAINS.cliff`提取边界；轮廓与规则共用一份来源。素材的黑色有效格遮罩让岩体及装饰不覆盖操作区，缺失格中只允许相邻石层下沿及局部藤蔓进入，其他部分露出峡谷。CSS在原540px棋盘外盒内按照480pxCanvas坐标定位，左右背景层均`pointer-events:none`，不改变命中、UI布局和方块特效。只对`data-map="cliff"`生效，退出恢复森林；悬崖取消九切片矩形边框及背景磨砂，以统一静态图形建立空间。没有逐帧场景绘制、随机装饰或动态滤镜。

背景源就是可编辑SVG，石台重建运行`node scripts/build-cliff-art.mjs`，不会重做其他地图。未采用的内置imagegen候选源图保存在`references/maps/cliff-canyon-source.png`，提示词在`references/maps/cliff-canyon-candidate-prompt.txt`；同名WebP候选未绑定到游戏。验收图在`validation/2026-10-11/cliff-art/`。

## 2026-10-11 · 四地图素材

森林沿用原资源。`dist/assets/maps/` 保存悬崖、冰晶、遗迹各一张离线背景WebP、一个512×512底板SVG、一个600×600透明九切片边框SVG，以及落石、晶石和雕刻遗迹柱SVG。共用渲染按地形裁剪底板并绘制格边，不复制积木或特效。边框与命中坐标独立，切换不改变容器尺寸。

三张背景由内置 imagegen 以既有森林源图为风格参考生成，统一休闲卡通奇幻风格；生成原图位于 `references/maps/{cliff,crystal,ruins}-source.png`，原文提示词位于 `references/maps/prompts.json`。Sharp只做WebP格式编码（quality86），不改变构图。底板／边框／障碍沿用项目SVG素材方式制作，生成器为 `scripts/build-map-art.mjs`。资源全部随dist离线加载，无运行时在线图源、字体或生成工具依赖。

当前主题为 `sunny-jungle`，依据已实际查看的 `references/block-brawl-art-direction.png` 对齐明亮自然场景、砂岩棋盘、木质分数牌、立体游戏按钮和柔软积木。参考图只决定视觉语言；当前五色、8×8、三／四／五消、十三格爆破和组合规则不变。

| 当前资源 | 内容与尺寸 | 大小 |
| --- | --- | --- |
| `dist/assets/toy-atlas.svg` | 640×512，20 个透明 128×128 单元 | 15,560 B |
| `dist/assets/toy-board.svg` | 512×512，8×8 共用凹槽 | 3,003 B |
| `dist/assets/jungle-scenery.webp` | 1672×941，森林岩台场景 | 245,798 B |
| `dist/assets/jungle-frame.webp` | 1254×1254，真实 alpha 砂岩与藤叶框 | 251,106 B |
| `dist/assets/game-logo.svg` | 352×176，橙蓝字标与王冠 | 1,543 B |
| `dist/assets/wood-plaque.svg` | 600×130，木牌 | 951 B |

共 517,961 B（约 505.8 KiB，未使用传输压缩）。场景与石框由内置 imagegen 工具生成，分别保存原始 PNG 为 `references/jungle-scenery-source.png` 和 `references/stone-frame-source.png`。WebP 只用于格式编码，保持画面与 alpha；原图不进入静态部署目录。矢量方块、棋盘、标志与木牌是项目可编辑代码资源，未使用其他游戏的成品素材或在线字体。

图集列为原颜色编号 0～4，行依次为普通、`row`、`column`、`blast`。普通符号依次是菱形、星、圈、方形、三角；取消旧版圆形底座和铆钉，统一鼓起面、厚底与有色浮雕。横／竖技能采用发光带，爆破采用金色立体星，外壳保留原颜色。

`dist/theme.mjs` 管理配色、六个资源地址、图集布局、CSS 变量、弹性幅度和特效预算；`applyTheme` 把地址交给 CSS，资源加载和裁切由 `dist/art.mjs` 完成。规则引擎不导入美术模块。替换方块保持 5 列、4 行和中心锚点；改源单元尺寸同步 `sourceSize`，占格比例使用 `ratio`。背景和边框可修改 `THEME.assets`；更换背景地址时同步 HTML 中的图片 preload。

石框使用 CSS 九切片，中心不绘制。棋盘 `--board-inset` 同时控制 Canvas 留白与边框宽度，`--frame-overhang` 只把装饰向外扩展，不改变 Canvas 位置／命中区域。桌面主要视口中 Canvas 仍为 480×480；手机按可用宽度等比缩放。所有边框装饰 `pointer-events:none`。不要直接以生成图中心开口覆盖 Canvas，否则不同素材的开口比例可能挡住格子。

方块／棋盘各解码一张，固定尺寸至多缓存 20 种方块＋1 张棋盘；DPR 上限 2，resize 释放旧缓存。场景和石框由浏览器缓存，无动态背景或整层棋盘模糊。粒子上限 700、光环 120；爆炸亮芯局限中心，特效生命周期与锁完全独立。资源未加载／失败时，输入和计分照常工作，Canvas 方块使用原有降级绘制。

矢量修改后运行 `node scripts/build-art.mjs` 与 `node scripts/build-scenery-ui.mjs`。前者也保留旧品牌图标和背景生成能力，当前页面只将旧品牌图标用作 favicon；后者生成当前木牌和字标。已生成资源随 `dist/` 直接部署，无运行时工具依赖。图片 WebP 编码在开发环境使用 Sharp 完成，无新增游戏依赖。

## imagegen 提示词记录

执行方式：内置 imagegen，附件作为风格参考；未使用 CLI/API fallback。场景 `transparent_background=false`，石框 `true`。最终提示词如下。

### 场景

```text
Use case: stylized-concept. Asset type: original reusable landscape background for the Block Brawl casual H5 game. Transform the attached art-direction reference into a standalone SCENERY asset: keep its bright sunny cartoon jungle valley visual language and polished toy-like 3D materials, remove ALL UI, text, logos, game board, tiles and infographic panels. Wide landscape 16:9 composition, high-quality casual game illustration: blue sky and puffy creamy clouds across top third, distant pastel sandstone mesas and lush rounded lime-green canopies, terraced jungle valley with warm peach sandstone, soft teal atmospheric depth, sunlit leafy plants at far left and far right, soft ochre stone clearing/path across the bottom foreground. Center should be comparatively calm and lower-detail for a real game board to be overlaid by code, with visible sky and distant hills; peripheral foliage frames the screen. Exquisitely sculpted soft forms, rounded rock strata, saturated friendly colors, directional upper-left sunshine, ambient occlusion in leaves and stones, no ink outlines, no grain, no realism, no neon blue technology, no grids. Do not recreate the screenshot layout. No people, animals, UI boxes, buttons, tiles, lettering, watermarks, or baked shadows from UI. The final output is the full bleed scenery illustration only.
```

### 石框

```text
Use case: stylized-concept. Asset type: isolated transparent square game-board frame sprite, production asset for an H5 casual puzzle. Reference image is STYLE reference only. Make one beautifully sculpted warm peach sandstone frame with irregular rounded rock blocks, recessed dark brown seams, sunlight highlights from upper left and thick softly beveled sides, tiny trailing vines and lush soft 3D lime-green tropical leaves clustered asymmetrically at outer corners. Straight front view, square, no perspective. The inner square opening MUST be completely transparent and must occupy exactly 89% of the full image width and height, centered; frame border is only about 5.5% wide along each edge. All rocks and foliage must stay on that narrow outer rim, not protrude into the transparent opening. Full image outer edge is square and matches the frame's outer silhouette, transparent outside the sculpted corners; no margin. Match the sunny jungle casual-game materials seen on the reference main board frame, more soft dimensional handcrafted rock than plain regular masonry. No game tiles, no grid, no board backing, no buttons, no scene background, no ground, no characters, no text, no watermark. Genuine alpha transparency both in the large center opening and outside the frame.
```

石框实际开口未严格等于提示词的比例，最终用九切片保证布局几何。实体手机触摸与低端 GPU 性能仍需实机确认；受控时钟截图用于视觉比较，不替代录像或性能基准。
