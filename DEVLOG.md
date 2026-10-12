# 方块乱斗开发日志


## 2026-10-12 · 十二技能本体接入：贤者蒙层＋透光、裂地横排

按用户明确确认，把审核页当前12张技能本体接入正式对局。贤者时间采用整盘金色蒙层与从背景上涌的暖金底光，底光在方块后面；幸运星保留亮金原概率增益，超载/幸运以左侧大图标和真实倒计时反馈，持续阶段无棋盘光效。迷雾为落点一团浓雾，6秒结束后1.2秒仅视觉慢散。彩虹核心的真实万能块显示独立彩色特色形态。替换旧程序火浪/爆炸和格内小雾、状态小徽记，避免重复叠加；背景、地图、棋盘与通用施法保持已有方向。

用户选择的裂地横排正式采用“裂地横扫”，清除落点所在一排的有效普通方块；同步卡牌名称/说明文字，框和原画保留。迷雾作用范围同步落点附近12个有效普通格，不再随机分散，AI仍遵循既有雾格限制。其余卡牌规则、能量、随机生成、计分、自动操作与结算时序保持；播放器读取真实事件，即时技能允许与飞行并行，不为演出延后规则。重复冻结/迷雾更换视觉期限，离开/重开/结束清理全部本体和倒计时。

13张正式透明PNG与审核素材一致，存于 dist/assets/skill-body/，中心锚点；12图集各1024×512、4×2、8帧。审核与历史候选保留，批准manifest及重建脚本避免恢复旧方案。新增表现回退开关 SKILL_BODY_ENABLED。美术规范、参考索引、README和当前卡牌文档已同步；旧卡牌参数归档。接入细节与回退见 [docs/SKILL-BODY-INTEGRATION.md](docs/SKILL-BODY-INTEGRATION.md)。

69项相关检查及17项实际Edge检查通过，覆盖12卡真实拖放/清理、五地图、增益倒计时、忙碌棋盘落点、取消、AI敌我、实际单文件素材解码和无外部请求；只做本轮必要验证。单文件重建约28.39MB、107份内嵌媒体，按既有规则本地保留。报告位于 validation/2026-10-12/skill-body-integration/。本轮将当前项目源码、源素材、规范及轻量报告同步 origin/main，不更新历史Sites站点。

## 2026-10-12 · 已确认卡牌原画与通用施法序列帧正式接入

按用户“可以，接入游戏吧，先不做下一步”的明确授权，将第三阶段已确认的通用释放素材接入现有卡牌表现层。正式卡池、手牌、拖动替身和下一张预览统一使用最后确认的第三版12张原画，基准为 `art-preproduction/card-reference-v3/cards/`；未改动任何原PNG、已确认背景或棋盘。此前已完成但尚未推送的地图美术精修、卡牌第二轮规则／交互和原画成果一并归档，当前卡组自由选择6张不同卡牌，取消分类配额的既有结果保持。

进攻红金、控制蓝紫、强化金青分别使用真实绘制的激活、释放、循环光团、循环拖尾和命中图集，144个PNG帧与高质量原图继续保留。正式运行使用15张WebP图集共2,861,744字节，卡牌12张无损WebP共6,046,872字节。成功出牌从按下时捕获的原手牌位置凝聚，随后曲线飞向实际目标；无效落点与取消返回手牌。松手后常规演出960ms，命中压缩后爆发并自然消散。AI沿用同样的敌我规则，陨石落点采用规则穿透终点，地裂采用实际底行；彩虹核心监听真实万能方块索引，忙碌棋盘确定落点后才结束等待，不额外随机选点。

本次没有新增12张牌各自的技能本体。规则代码、引擎、对局、AI、卡牌生成、能量和消除结算时序保持接入前内容；即时技能按原有时刻生效，可与释放表现并行。退出、重开或结束比赛清理视觉对象。独立动画审核页继续保留，已更新为“已确认／已接入”状态。接入约定、资源和访问方式见 `docs/CARD-CAST-INTEGRATION.md`，原素材逐阶段参数见 `art-preproduction/cast-fx-stage3/spec/DELIVERY.md`。

必要验证：58项相关单元检查通过（48项卡牌规则、8项播放器／资源、2项离线包）；9项实际浏览器验收通过，包含三类拖放、至少7个不同光团帧、原手牌起点、真实目标、忙碌棋盘、AI敌我双方、取消与清理，以及直接打开单文件后实际出牌。保护范围99份文件的SHA-256保持不变。根目录 `方块乱斗-最新版.html` 已重新构建，内嵌94份媒体，约24.04MB，无外部加载；该可重建文件按既有规则仅保留本地。报告位于 `validation/2026-10-12/card-cast-integration/`，未进行无关模块的全量回归。

本轮同步目标为 `origin/main`；只归档源码、采用的美术源图／序列帧、文档和必要报告，不更新Sites历史试玩站。重复压缩包、旧离线预览大文件和QA截图留在本地。完成本轮后等待试玩反馈，不进入下一阶段技能特效制作。

## 2026-10-11 · 当前进度归档与远端同步准备

本次将此前本地迭代统一归档。当前已完成六关新手教学、练习沙盒、三消与特殊块组合／连锁、列级并发事务保护、三档真实交换AI、五图异形棋盘与环境事件、12张卡牌竞技、能量抽牌与拖放交互、正式美术与音乐／音效系统。最新竞技流程为随机地图揭晓、60秒选六张卡（每类最多2张）、双方准备、3秒倒计时、从0手牌／0能量开战、先到15000分结算。森林无灾害；悬崖落石、冰川消除破冰、遗迹局部转盘、熔炉四邻蔓延均已接入。当前仍为本地人机，联网功能尚未实现；Git同步与线上试玩站发布分别管理，本轮不更新Sites部署。

按用户要求整理仓库，清理854个历史文件，共释放595,548,221字节（约567.96 MiB）：旧浏览器截图、分镜、试听成品／查看页、未使用原录音、下载压缩包与被替换的交换音v1。保留正式游戏使用的全部素材、美术源图、BGM编排采样、编辑脚本、授权／下载来源／哈希记录，以及轻量JSON和文字验收报告。逐项清理清单与正式目录清理前哈希见 `validation/2026-10-11/repository-cleanup/report.json`。下方历史章节中的截图、试听页和旧录音路径仅记录当时产物，部分已清理；不可把这些历史路径视为当前仍可打开的资源。

重写README为当前状态与跨设备操作指南。根目录 `方块乱斗-最新版.html` 作为可重建产物留在本地并忽略提交，正式 `dist/index.html` 继续纳入仓库。添加 `package.json`／锁文件，将离线构建的esbuild依赖从本机临时目录改为项目内安装：`npm ci` 后运行 `npm run build:offline` 即可重建，无需历史候选素材。离线回归在未构建HTML时明确跳过两项，存在HTML时仍检查程序语法与每份来源哈希。

验证于2026-10-12跨日完成：离线HTML重新打包成功，内嵌67份媒体；含离线包时290项测试全部通过，模拟远端不含离线HTML时288项通过、2项明确跳过、0失败。57个当前配置引用的素材全部存在，21个运行模块的本地导入完整；清理前后103份正式文件哈希保持，仅删除未引用的旧交换音并更新授权文档的整理说明。本轮未重做历史浏览器演出验收，原浏览器报告保留。测试输出与资源检查汇总见清理报告目录。

归档范围为当前源码、正式素材、开发文档、构建／测试脚本及保留的来源和验收资料，目标为 `origin/main`（`https://github.com/Leiht1/Block-Brawl.git`）；离线HTML、开发依赖与新生成的验收媒体不提交。以下保留各次迭代详情，当前功能与数值以本节、README和配置源码为准。

推送准备中发现下载的Freesound来源网页快照夹带第三方Mapbox访问令牌，触发GitHub推送保护。已对归档网页中的Mapbox令牌脱敏，来源地址、作者、授权与素材哈希记录保留；修正尚未发布的本地提交后重新推送，不绕过保护。脱敏文件清单记录在清理报告中。

## 2026-10-11 · 卡牌竞技交互与布局修订

选卡阶段改为60秒，展示本局地图场景、棋盘形状和环境说明。新增配置categoryLimit=2，玩家选择／替换、AI随机卡组和超时保留选择后的补齐共用每类最多2张限制；界面显示各类数量与失败原因。双方准备恢复3秒倒计时，期间棋盘、AI和能量都不启动，结束时从0手牌、0能量开战。

对战移除手牌大底板与右侧说明，普通手牌96×132，悬停放大1.5倍，保持其他卡不移动。Logo固定背景左上角，按钮放在敌方棋盘右侧。四个桌面视口都无页面滚动；1440×960、1366×768、1920×1080、1024×768棋盘宽约476、372、480、291像素，较首版约400、247、426、247扩大。选卡完成后的准备按钮与地图在1366×768一屏展示。

全量290项规则回归通过，包括100个种子的AI／超时分类限额、完整比赛与3秒倒计时边界。浏览器报告、选卡、倒计时、拖放及四尺寸截图保存于validation/2026-10-11/cards-refinement/。离线最新版已重新打包，以下为首版记录。

## 2026-10-11 · 卡牌竞技首版

本轮完成随机地图 → 30秒卡组选择 → 双方准备立即开赛 → 能量积攒／抽牌 → 拖放使用 → 15000分结算。按用户补充，玩家与AI初始手牌都为0、能量都为0。12张卡、六张不同卡组成的抽牌池、六手牌上限、AI选择保密、卡槽替换、超时补齐、自然／消除／分差能量、下一张与满手暂存替换均已实现。

`cards.mjs` 保存配置、选卡状态机、卡牌战斗及安全事务适配；`card-ui.mjs` 提供选卡双栏、卡背、扇形遮挡、悬停置顶、选中、持续拖动、48px释放距离、合法棋盘／格子判定、入场／离场／回弹、预警及状态标签。保留正在拖动卡牌的DOM与指针捕获，能量抽牌不打断拖放。冻结仅阻止棋盘交换，手牌仍可用。

`arena.mjs` 仅新增可选卡牌接入、命令门禁、卡牌截止时间与生命周期；无卡牌的既有测试会话仍保留原流程。实际UI统一目标15000，保留三档AI原交换策略。攻击等待事务与地图列锁释放，不破坏地图封存块；到期攻击等待时阻止新交换，避免无限拖延。攻击不给目标直接分数，后续自然连锁仍使用原计分。超载得分与事件一致，贤者与万能块使用真实命令入口，幸运星只影响补充块。引擎与bot源码本轮未编辑。

对战Logo在左上、工具在右侧，棋盘为手牌让出空间；1440×960、1366×768、1920×1080、1024×768均一屏容纳等大双方棋盘和手牌区。保持教学／沙盒原入口。离线HTML重建为约8.15MB，仍含68份内嵌媒体。

最终打包复检发现新增代码经压缩后包含JavaScript文本替换元字符，旧打包器把原script标签误插进程序。已改用函数替换，保留源码字面量；新增两项离线回归直接解析内嵌程序并逐一比较所有来源哈希，防止单文件与源码不一致。修复后重新以file协议验证零初始手牌和第一张自然抽牌通过。

32项新增卡牌测试及全量288项通过，包含真实AI从0张卡打到15000完整比赛。实际Edge验收覆盖选卡／隐私／替换／准备、超时、能量与预览、扇形／悬停、成功／失败拖放、抽牌期间选中与持续拖动、红蓝黄效果、四桌面尺寸、结算／重开／取消／退出和离线第一张抽牌。报告、截图与规则输出：`validation/2026-10-11/cards/`；设计与当前数值：`docs/CARD_SYSTEM.md`。本轮仅更新本地，未发布。

## 2026-10-11 · 最新单文件离线 HTML（历史记录）

新增根目录 `方块乱斗-最新版.html`，由当前dist打包，约8.11MB，内嵌68份图片与录音、CSS、全部游戏模块及音频来源／许可记录。可以直接双击打开，不依赖本地HTTP服务或同目录资源文件，包含统一右上角开关及大厅／对战BGM增益0.66／0.60。只在打包时将模块合并、资源读取指向内嵌Blob，不修改生产游戏源码及逻辑。

实际Edge以file协议打开验证8项通过：打包内容逐项哈希匹配当前源码和素材、一屏首页、首次操作后音乐播放、教学与真实对战、音乐循环和当前增益、独立开关、68份图片／录音全部解码、窄屏一屏首页；无外部请求、缺失资源、页面或媒体错误。报告与截图位于 `validation/2026-10-11/offline/`。构建脚本 `scripts/build-offline-html.mjs`，离线验证 `scripts/validate-offline-html.mjs`。

## 2026-10-11 · 全场景声音开关统一与 BGM 微调（当前）

按试玩反馈，将首页、新手选关、实际教学、人机难度选择、随机地图准备、实际对战与手感沙盒改为共用一组右上角音乐／音效按钮，移除各页面原来的重复开关。桌面顶部20px／右侧22px，窄屏顶部12px／右侧14px；游戏内容预留顶部空间，首页继续一屏显示。保留原有开关状态保存与独立控制。

大厅 BGM 0.60 → 0.66（+10%，约+0.83dB），对战 BGM 0.55 → 0.60（约+9.1%，+0.76dB）。仅小幅增加音乐增益，上一轮已平衡的音效及音乐让位比例保持；试听页同步当前增益。来源、授权、候选与选择原因沿用阶段4记录，音频文件、BPM、循环边界与900ms场景渐变保持。

验证：30项音频专项与15项真实浏览器音频检查通过；34条播放配置、11组音乐／反馈电平比较通过，音频文件和游戏逻辑模块哈希保持。首页8种视口均无滚动。1366×768、1024×600、390×844的7个场景全部通过：开关位置一致、仅一组、可点击且不遮挡标志／游戏按钮／棋盘／教学卡片；跨场景状态保存与两个独立开关正常。报告见 `validation/2026-10-11/audio-balance/shared-controls.json`，对应截图同目录；复现脚本为 `scripts/validate-shared-audio-controls.mjs`。以下上一轮增益为历史记录，当前以本节与manifest为准。

## 2026-10-11 · 首页一屏显示与声音平衡复检

按用户实际试玩反馈修正首页滚动和音乐偏小／特效偏大的问题。音乐与音效开关移到首页右上角，以小按钮横排显示，不再占菜单纵向高度；首页按窗口高度调整标志、按钮和间距，所有菜单入口与进度提示完整可见，不以裁切或隐藏内容消除滚动。只修改首页布局，不改变对局布局。

本轮重新测量全部正式manifest及变体，共34条播放配置。前版只确认音效高于音乐，留出了过大的差距：对战音乐持续反馈时有效RMS约0.0073，爆破＋爆破80ms短时RMS约0.383，比普通消除0.055高约17dB；音乐长期被双棋盘反馈压低，技能会突然过响。本次同时比较整段RMS、80ms短时RMS和峰值，不以单一峰值代替声音平衡。

| 项目 | 原值 → 当前值 | 调整 |
| --- | --- | --- |
| 大厅BGM | 0.30 → 0.60 | +6.02dB，原素材相对安静，需要较高播放增益 |
| 对战BGM | 0.28 → 0.55 | +5.86dB；常规核心反馈时音乐保留32% → 65%，实际反馈期间音乐提高12.02dB |
| 交换 | 0.58 → 0.42 | 降低突兀的操作起音 |
| 普通消除／三级连击 | 0.46／0.48／0.51／0.54保持 | 保留已建立的奖励层级 |
| 特殊生成／清线／爆破 | 0.40／0.66／0.68 → 0.34／0.46／0.48 | 降低过大的技能瞬间 |
| 线线／线爆／爆爆 | 0.72／0.78／0.90 → 0.50／0.56／0.28 | 爆爆降低10.14dB，80ms短时RMS降至0.119，仍比普通消除高约6.7dB；没有因倍率较低误判为较弱音效 |
| 倒计时3／2／1／开始 | 0.42／0.44／0.46／0.64 → 0.30／0.32／0.34／0.40 | 音阶与开始层级保留，开场不突然大响 |
| UI确认／地图揭晓 | 0.46／0.50 → 0.34／0.38 | 降低高于普通反馈的短句音量 |
| 洗牌 | 0.36 → 0.42 | 轻纸牌摩擦提高一点，普通点击0.38保持 |

地图常规反馈时音乐保留60%；轻冰霜／尘土落地／破冰分别短暂保留18%／24%／30%，只为这些本身较轻的录音留空间。选择／倒计时期间保留50%，其他UI保留75%；共同触发取最小值。所有原音频文件逐字节不变，素材、许可、BPM、循环、场景渐变、声源限制与游戏时钟不改。本轮只更新manifest增益与音乐让位规则；试听页已同步实际游戏增益。

验证：30项音频专项测试通过；15项真实Edge检查通过，覆盖指针竞技消除／连击／组合技、四图事件、循环和独立开关；8个视口（1920×1080、1440×900、1366×768、1280×720、1024×600、390×844、390×667、375×568）均无纵向／横向滚动，菜单和声音开关全可见且互不遮挡。34条播放配置的80ms音效RMS均低于0.13，所有原录音及游戏模块哈希不变。报告／首页截图：`validation/2026-10-11/audio-balance/`，数据为 `balance-report.json`、`home-layout.json`；实际对局检查更新于 `validation/2026-10-11/audio-stage4/browser-report.json`。复现脚本 `scripts/audit-audio-balance.py`、`scripts/validate-home-audio-layout.mjs`、`scripts/validate-stage4-audio.mjs`。听感仍以用户实际试玩为准。

以下阶段4初次接入的音量和让位比例为历史记录，本节及当前manifest优先。

## 2026-10-11 · 音频阶段4：BGM 与 UI 反馈收尾

已完成本轮接入，音频系统进入收尾状态。新增 `bgm.lobby`、`bgm.battle`、`ui.click`、`ui.confirm`、`map.shuffle`、`map.reveal`；`ui.back`／`ui.start`／`ui.mapReveal` 作为同资源别名使用。正式文件均部署在 `dist/assets/audio/`，manifest记录路径、类型、音量、循环、来源和授权。

### 来源、候选与选型

每项准备3个实际候选，共18个，先生成试听页和参数记录，再逐字节接入所选版本。试听入口：`validation/2026-10-11/audio-stage4/index.html`；支持单曲、循环接缝、核心音效混听与真实游戏入口。大厅A／B／C为100／96／108 BPM，对战A／B／C为128／132／124 BPM，区别为木琴主奏、拨弦主奏与更稀疏编排。所有候选、时长、电平、来源文件与哈希保存在该目录 `candidates.json`，正式选型为 `references/audio-stage4/selection.json`。

BGM为**项目原创编排**，不是下载的现成歌曲。使用 [VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE) 的马林巴、竖琴、康加鼓、轻小鼓与铃鼓实录采样；采样作者 Sam Gossner、Simon Dalzell，剪辑 Elan Hickler／Soundemote，版本固定 `440300901dfe9275fd84e0b7763af1f8443ae62e`，采样授权 CC0-1.0。原创乐谱／编排保存在 `references/audio-stage4/score.json`；原件、固定下载地址、许可、网页证据和SHA-256在 `sources.json` 与该目录。试听前搜索的 Puzzling／Try Again 因作者标注电子乐器或电子风未进入正式候选；最终改用自然乐器编排控制风格、节奏和旋律密度。

点击使用 trezegames 的 [Pop effect sounds](https://opengameart.org/content/pop-effect-sounds) 中 `p_2.ogg`，CC0-1.0；候选B／C来自 Kenney [Interface Sounds](https://kenney.nl/assets/interface-sounds)，CC0-1.0。洗牌三个候选来自 Kenney [Casino Audio](https://kenney.nl/assets/casino-audio) 的 `card-shuffle`／`card-fan-1`／`card-shove-2`，CC0-1.0。确认与揭晓用上述自然马林巴／竖琴采样离线编排。许可文本随部署保留在 `assets/audio/licenses/`，来源和处理说明更新至 `assets/audio/CREDITS.md`。

| ID | 选择 | 时长／BPM | 默认音量 | 选择原因 |
| --- | --- | --- | --- | --- |
| bgm.lobby | A 木琴积木小径 | 153.6秒／100 BPM | 0.30 | 木质主奏呼应积木；短动机及留白，比B轮廓清楚、比C有记忆点 |
| bgm.battle | A 木琴派对接力 | 120秒／128 BPM | 0.28 | 加强轻打击和切分推进，维持休闲派对感；B主奏与伴奏较接近，C推进偏弱 |
| ui.click | A 柔软泡泡点按 | 90ms | 0.38 | 沿用现有泡泡家族，短促柔和；B/C保留作为按钮材质对比 |
| ui.confirm | A 木琴短句确认 | 320ms | 0.46 | 上扬大三和弦，比click明显，短于揭晓 |
| map.shuffle | B 纸牌展扇 | 420ms | 0.36 | 纸牌摩擦均匀；平均响度0.0809，高于A的0.0273和C的0.0226，低增益下更清楚 |
| map.reveal | A 木琴与拨弦揭晓 | 660ms | 0.50 | 大三和弦落点明确，避免C的高位主奏；B悬念感偏长 |

本轮选型由代理依据采样材质、原创编排结构和电平检查完成，不记录为用户听觉认可。人耳音色偏好、频率遮蔽与长时疲劳仍待实际试听复核。

### 播放与循环处理

音乐独立于音效通道；主页面、模式／难度选择、随机地图、准备和倒计时使用大厅音乐，竞技 `playing` 时以900ms交叉淡入淡出切到对战，退出或结束返回大厅。沙盒／教学使用大厅音乐。按钮分别关闭音乐或音效，设置在本地保存；浏览器首次可信鼠标／键盘操作后才解锁音乐。隐藏页面暂停音乐上下文，返回续播；加载／解码／设备失败静默降级，不等待或修改游戏流程。

两曲各64小节，分为4个16小节段落，含主题、回应、稀疏段与变奏回归，保留操作空间。自然采样剪辑／调音／低通和电平处理均离线完成，以跨周期折回采样尾音完成循环，而非全曲结尾淡出。正式BGM为44.1kHz双声道OGG；解码成AudioBuffer后原生 `loopStart=0`／`loopEnd=duration` 连续播放，免除媒体重新加载造成的接缝。两轨总下载约2.48MiB；44.1kHz解码缓存约92MiB，本次Edge音频设备48kHz重采样后约100MiB，首次仅请求当前轨，切换后复用缓存；同时最多当前与淡出两轨，音乐不占音效并发额度。

核心消除／连击／特殊音效期间音乐保留32%，地图事件保留40%；电平检查发现冰霜录音平均响度较轻，为 `ice.freeze` 单独保留24%。同时触发取最小增益，25ms平滑让位、160ms平滑恢复；不改变任何原音效录音、原增益和环境让位规则。倒计时／地图选择音效期间音乐保留65%。

普通按钮点击共用单播放槽位，85ms防抖／单声源；确认单声源／350ms冷却。随机地图只观察原有时钟，在0／650／1300ms最多三次洗牌，原2000ms锁定阶段揭晓一次，取消静默清理。浏览器验证发现1950ms的第四次洗牌会阻挡揭晓，已用三次上限修正，地图动画及4000ms结束时刻不改。

### 本轮验证

- `node --test tests/audio.test.mjs tests/map-audio.test.mjs tests/audio-stage4.test.mjs`：30项通过，只运行音频专项与必要关联。
- `node scripts/validate-stage4-audio.mjs`：Edge真实解码／播放、实际竞技指针交换和事件回调，15项通过；两曲原生离线音频渲染连续两轮样本重复误差为0，48kHz渲染接缝跳变分别约0.000096／0.000696（44.1kHz文件端点约0.00014／0.00294）；18个候选全部解码成功。
- 真实竞技棋盘验证连续消除、三级连击、线＋爆和爆＋爆；四图原事件回调验证预警／作用音与音乐让位。关闭音效后音乐及计分继续，关闭音乐后核心反馈及计分继续；30次快速UI点击仅创建1个录音，无排队补播；返回大厅和隐藏／恢复无重复音乐声源。
- `scripts/measure-stage4-audio.py`：6个正式文件与所选试听逐字节一致；11组核心／地图音效的实际播放RMS均高于让位后的音乐，最低峰值余量13.41dB。这是电平证据，不代替人耳频率遮蔽验收。
- 游戏规则、AI、计分、动画时序、地图事件、战斗模块及全部原WAV的起始快照哈希保持一致。页面错误、404、媒体错误为0。报告与6张截图在 `validation/2026-10-11/audio-stage4/`，核心文件为 `browser-report.json`／`mix-levels.json`。源码差异空白检查通过。

## 2026-10-11 · 交换方块音效 A 正式接入

用户试听后明确选择 A（极短轻挥）。将 `validation/2026-10-11/audio-swap/block-swap-A.wav` 逐字节复制为 `dist/assets/audio/block/block-swap-v2.wav`，SHA-256为 `08dfeed205648ca1f4d208e05e5931eb3885adce1be123d5dbcc76d73eb0d70d`；未再次剪辑或调整已选音频。manifest中仅将 block.swap 的路径从v1切换为v2，播放增益保持0.58，冷却70ms／operation分组／最多2声保持原值。业务仍通过原有事件映射和 AudioManager 播放。

来源为 artisticdude 的 [Swishes Sound Pack](https://lpc.opengameart.org/node/4693)，授权 [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)，使用原ZIP中的 `swish-11.wav`。候选剪辑为110ms、单声道44.1kHz／PCM16、去直流、90Hz高通／6500Hz低通、15ms淡入／35ms淡出、RMS目标0.14／峰值上限0.65；单段实录，没有打击层。选择原因是用户希望去除原木质硬打击感，并在六个实际候选中确认了A。来源证据、原件／成品哈希、编辑参数与用户选择保存在 `references/audio-swap/sources.json`、`selection.json`；随部署的 `dist/assets/audio/CREDITS.md` 已更新。旧v1仅保留作历史试听对照，游戏不再引用；试听页已标注A已选并接入。

最小验证通过：真实引擎接受交换事件后，原映射经AudioManager加载／播放／结束新的v2文件，实际时长110ms、增益0.58；交换动画事件仍为100ms。200次快速请求仅接受1次，无排队重播。单次消除场景开启／关闭声音得到相同棋盘、分数、锁、事务与事件轨迹，静音不创建音频。部署旧文件哈希对照只发现manifest路径与署名文档变化，新增已选WAV；其他音频、管理器、业务映射、规则、AI、计分与动画文件未改。不做全量回归。验证报告：`validation/2026-10-11/audio-swap/adoption-report.json`，截图：`adopted.png`。

## 2026-10-11 · 交换方块“唰”声候选，等待用户选择

用户反馈当前交换音有偏硬的打击感，希望先听几种“唰”声。本轮搜索并核验4组自然录音来源，制作6个候选；没有替换 block.swap，没有修改任何部署文件。试听页面为 `validation/2026-10-11/audio-swap/index.html`，包含逐条试听、每350ms连续播放6次、停止／切换取消，以及游戏当前交换音对照。

来源及授权：artisticdude 的 [Swishes Sound Pack](https://lpc.opengameart.org/node/4693)（原ZIP内WAV，衣架／木棍挥动实录）、qubodup / Iwan Gabovitch 的 [Swish bamboo stick](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes)（已有原FLAC）、akennedybrewer 的 [Fabric Flap.wav](https://freesound.org/people/akennedybrewer/sounds/389170/) 和 David_Jacob 的 [Moving fabric.mp3](https://freesound.org/people/David_Jacob/sounds/434652/)（后两项为公开HQ MP3预览，未获取需登录原件）。四个来源页面均明确CC0；网页证据、下载地址、作者与哈希保存于 `references/audio-swap/sources.json`。

| 候选 | 文件（试听目录） | 来源片段 | 时长 | 候选方向 |
| --- | --- | --- | --- | --- |
| A | block-swap-A.wav | artisticdude / swish-11.wav | 110ms | 极短轻挥 |
| B | block-swap-B.wav | artisticdude / swish-4.wav | 150ms | 更宽的空气滑过 |
| C | block-swap-C.wav | qubodup / swosh-02.flac | 160ms | 短竹棍风切 |
| D | block-swap-D.wav | qubodup / swosh-04.flac | 190ms | 收柔高频的另一条竹棍风切 |
| E | block-swap-E.wav | Fabric Flap，0.10s起 | 180ms | 棉布拂动 |
| F | block-swap-F.wav | Moving fabric，7.06s起 | 200ms | 布料滑动 |

候选方向是寻找短、自然、容易重复播放的交换反馈；每条只使用一段实录，不加入撞击层。统一为单声道44.1kHz／PCM16，15ms淡入、35ms淡出、90Hz高通与4.2–6.5kHz低通，RMS目标0.14／峰值上限0.65。全部试听增益0.58，与当前交换音的manifest增益一致，便于对比。具体编辑参数、原片段与候选文件SHA-256在 `candidates.json`。最终选定理由与正式接入等待用户听后选择。

最小验证：6个候选和当前对照均在浏览器实际加载、播放、结束；连续6次播放最多1声，切换取消旧序列，停止取消后续播放，390px手机宽度无横向溢出，页面无脚本错误。所有93个部署文件的SHA-256与本轮开始一致；游戏声音、规则、AI、计分、动画时序均未改变。结果保存于 `validation/2026-10-11/audio-swap/playback-report.json`，页面截图为 `audition-page.png`。此次只验证试听页面，不做游戏全量回归；主观听感由用户确认。

## 2026-10-11 · 悬崖最终接入：预警 A、坠落 F、尘土 D

用户明确选择“坠落F、尘土D”。将试听文件逐字节复制为 `dist/assets/audio/maps/cliff/cliff-fall-v2.wav` 与 `cliff-impact-v2.wav`，manifest继续通过原有 cliff.fall／cliff.impact ID引用。大地裂动A、620ms／480ms时长、0.44／0.33音量、50%核心避让与原冷却／并发配置保持不变；没有再次加工已选录音，也没有修改业务事件、规则、AI、计分或动画时序。

来源与授权：坠落F为 AlanCat 的实录悬崖落石 rockfall2a.wav（Freesound公开HQ MP3预览，CC0）加 qubodup / Iwan Gabovitch 的自然风切 swosh-04.flac（CC0）；尘土D为 martinimeniscus / Florentine Films SFX 的 sand pour on sand FF662.aif 加 _stubb 的 Rock Tumble 2.wav（两者均为Freesound公开HQ MP3预览，CC0）。网页证据／下载地址／源格式／哈希在 references/audio-stage3/cliff-reselection/sources.json，编辑参数与选定录音哈希在 selection.json。署名与修改说明更新到随部署的 assets/audio/CREDITS.md。

选择原因是用户实际试听后的明确确认；F保留自然落石／小石级联，D以细沙和轻石尾为主。旧两条v1录音归档至 references/audio-stage3/cliff-reselection/superseded/，从部署目录移走；未选候选只在试听页。两张试听页面同步标记F／D已选，并默认按A→F→D播放。

最小验证仅针对本次替换：正式文件和试听文件SHA-256一致、源文件哈希一致；真实悬崖事件三阶段分别触发A／F／D，浏览器媒体正常加载／playing／ended，增益0.40／0.44／0.33；快速重复请求不叠加／不排队，环境静音仍允许核心声音。结果为 validation/2026-10-11/audio-maps/cliff-reselection/adoption-report.json。部署文件哈希核对确认其他音频、规则、AI、计分和动画未改；不做全量回归。

## 2026-10-11 · 环境声音调大，悬崖两项重新候选

按用户“听不清”的反馈，提高8条环境资源播放增益约29%–35%：悬崖预警0.30→0.40、坠落0.34→0.44、尘土0.25→0.33，冰晶0.29→0.39、破冰0.31→0.40，遗迹0.30→0.39，熔炉升温0.26→0.35、扩散0.30→0.39。核心反馈播放期间，环境保留自身音量从35%提高到50%；核心音量保持不变，环境仍独立控制、每事件1声／总计2声、重复跳过不排队。没有修改规则、AI、计分、事件映射和动画时序。

用户明确选择“大地裂动 A”，确认并保留原录音，SHA-256不变。当前坠落和尘土被用户否定，新版本要先试听选定后再接入；本轮只制作候选，两项旧录音暂留游戏，没有擅自选新素材。`selection.json` 已标记这两项待替换，批量接入脚本增加待选保护。

新候选各4条，使用 D／E／F／G 与上一轮A／B／C区分。新检索并核验的来源：AlanCat 的实录悬崖落石 `rockfall2a.wav`、adamgryu 的 `Rocks.wav`、_stubb 的 `Rock Tumble 2.wav`、martinimeniscus／Florentine Films SFX 的 `sand pour on sand FF662.aif`（均为 Freesound 来源页明确标示CC0），以及 spookymodem 的 OpenGameArt `Falling Rock.wav`（CC BY 3.0）。Freesound 使用网页提供的公开HQ MP3预览，未访问需登录的原件下载；格式事实记录在来源清单，不将预览称为原始WAV。保留作者、许可链接与网页证据。坠落还使用已授权的 qubodup 自然风切，所有新版本只离线处理，不生成电子音。

试听文件均在 `validation/2026-10-11/audio-maps/cliff-reselection/`，不在 `dist/`：

| 项目 | D | E | F | G |
| --- | --- | --- | --- | --- |
| 坠落，620ms／0.44 | 重石滚坠（_stubb） | 洞顶岩块（spookymodem） | 自然崖壁（AlanCat） | 碎岩重落（adamgryu） |
| 尘土，480ms／0.33 | 沙尘散开（沙＋轻石尾） | 小石级联（AlanCat） | 洞塌碎屑尾（spookymodem） | 砂砾混散（石＋沙） |

分别为 `cliff-fall-D/E/F/G-v2.wav`、`cliff-impact-D/E/F/G-v2.wav`。每个文件的来源、授权、截取位置、速度、低通、混音、淡入淡出、电平与SHA-256在该目录 `candidates.json`；5组新来源的网页／地址／哈希在 `references/audio-stage3/cliff-reselection/sources.json`。页面可以逐条试听，也可选两项与已确认预警A一起比较，不会修改游戏。

最小验证：环境避让／恢复／静音和核心容量专项测试通过；8条新候选与8条现用环境音在浏览器真实加载、playing、ended，确认提高后的增益和50%避让／恢复；组合试听的下拉选择按指定候选播放。对本轮前的部署文件做哈希比较，原有音频字节均不变，已有文件只改管理器／manifest／署名说明；新候选未部署。记录在 `validation/2026-10-11/audio-maps/cliff-reselection/report.json`。没有全量回归；主观候选选择等待用户。

## 2026-10-11 · 音效阶段 3：地图环境事件

新增 `cliff.warning / fall / impact`、`ice.freeze / break`、`ruins.activate`、`furnace.warning / spread` 共 8 个正式环境声。沿用 AudioManager → manifest → event mapping，业务代码没有引用文件，也没有改动规则、AI、计分、动画时序或已有核心音效。尚未实现事件的 `ruins.pillar` 继续为空。

### 搜索、来源与授权

先搜索 rock crack / stone rumble / rock whoosh / rock debris、ice spells / ice shatter、stone mechanism / stone door、fire whoosh / fire staff 等方向，比较 8 个来源包以及此前存档的自然风切、微光录音。原件只下载到 `references/audio-stage3/`，未直接进入游戏；每个 ID 制作 3 个不同录音来源的候选，共 24 版，先建立独立试听页面并检查全部候选的实际播放，再锁定选择，最后逐字节复制已选录音接入。

选型依据为作者的材质描述、录音的起音／主体／碎片结构、已有事件阶段时长和电平；本轮由代理选择，并非用户听感认可。浏览器播放成功及电平数据不代表人工听感／长时间舒适度验收。候选页保留全部 A／B／C，方便后续听感调整。

正式使用的来源：

- Gregor Quendel：[Free Cinematic Sound Effects](https://opengameart.org/content/free-cinematic-sound-effects)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。只选 Rocks - Sequences 02 / Elements 09；科技、Mecha、Circuits 素材未接入。
- themightyglider（原件 SoundCollectah）：[Breaking Rock](https://opengameart.org/content/breaking-rock)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。碎石层。
- qubodup / Iwan Gabovitch：[Swish bamboo stick](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。自然风切录音，沿用此前存档及作者声明。
- bart（原录音 Stephan / pdsounds）：[Ice spells](https://opengameart.org/content/ice-spells)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。结晶和冷裂纹。
- IgnasD：[Ice breaking/shattering](https://opengameart.org/content/ice-breakingshattering)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。破冰主体和晶片。
- bonebrah：[Stone Door](https://opengameart.org/content/stone-door)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。古石门研动。
- The Berklee College of Music：[Shimmer glitter magic](https://opengameart.org/content/shimmer-glitter-magic)，[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)。低增益符文微光，沿用此前存档。
- LEGIT Audio：[Fire Staff Sound Effects](https://opengameart.org/content/fire-staff-sound-effects)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。独立真实火杖录音 16 / 20。

未选方案包括 Rumble/explosion（Michel Baradari，CC BY 3.0）、stone grind（omegagreg / pauliuw，CC0）及各包的其他自然录音，均保留候选来源记录，不进入运行时。授权网页、下载地址、作者与 SHA-256 在 `references/audio-stage3/sources.json`；逐文件来源和剪辑参数在 `derivatives.json`，锁定版本在 `selection.json`。署名、来源、许可、修改说明随部署写入 `dist/assets/audio/CREDITS.md`。悬崖 3 个混音按 CC BY 4.0 分发，遗迹混音按 CC BY 3.0 分发；冰川／熔炉源素材为 CC0。

### 正式文件、选择原因与音量

文件路径相对 `dist/assets/audio/`。全部 44.1kHz 单声道 PCM16；只离线剪辑／低通／混音／电平处理，不在运行时合成。每个已选文件与试听 A 版的 SHA-256 一致。

| ID | 文件 | 时长 | 增益 | 选择原因 |
| --- | --- | --- | --- | --- |
| cliff.warning | maps/cliff/cliff-warning-v1.wav | 1100ms | 0.30 | 岩层低鸣＋短石裂；低通及轻降速表达大地重量，避开爆炸候选 |
| cliff.fall | maps/cliff/cliff-fall-v1.wav | 620ms | 0.34 | 自然风切后接单次石撞；在既有650ms坠落阶段内收尾 |
| cliff.impact | maps/cliff/cliff-impact-v1.wav | 480ms | 0.25 | 碎石先散、柔软岩尘尾随后；避免第二次重爆炸 |
| ice.freeze | maps/ice/ice-freeze-v1.wav | 700ms | 0.29 | 冰系结晶与细裂纹，区别于爆破技能的冰魔法素材 |
| ice.break | maps/ice/ice-break-v1.wav | 600ms | 0.31 | 先裂纹，120ms 后破冰，260ms 后碎片；无电子闪烁音 |
| ruins.activate | maps/ruins/ruins-activate-v1.wav | 1050ms | 0.30 | 古石门研动为主体，微光层仅0.10相对增益；没有工业马达 |
| furnace.warning | maps/furnace/furnace-warning-v1.wav | 550ms | 0.26 | 真实火焰渐强，550ms适配扩散的650ms预告，不产生警报节奏 |
| furnace.spread | maps/furnace/furnace-spread-v1.wav | 660ms | 0.30 | 独立火浪掠过录音和余烬尾，区别于升温和爆破技能 |

`environment` 分类独立，默认分类增益 1；最终音量为总音量 × 分类音量 × 上表增益。每条事件 1 声、环境总上限 2 声，冷却 180–900ms，重复请求跳过，不排队。双棋盘／多格仍沿用原批次合并。消除、连击和技能播放期间，环境降至自身音量的 35%，核心声结束后恢复；全局槽位不足时核心可释放一条环境声。环境分类设为 0 立即停止仅该分类，核心仍可播放。

### 五项专项验收结果

1. 对应事件：真实应用回调触发悬崖三阶段、冻结、有效消除破冰、石机关、升温／扩散及后续传播；同阶段的双棋盘／多格合并。8 个正式 WAV 均有 loadeddata／playing／ended，无媒体错误或404。
2. 四图差异：8 个不同路径、不同音频哈希；岩石、冰、石机关、火焰各有材质来源和独立处理。
3. 快速事件：200 次快速混合请求最多同时接受2条，播完活动数归零，没有延迟补播；后续有效阶段可再触发。
4. 独立关闭：四图环境开／关／音频脱离三组固定随机种子的实际棋盘、计分、锁、事务、地图状态与完整事件轨迹一致；浏览器分类静音立即清理环境、拒绝新环境声，核心声音继续播放。
5. 不改玩法及时序：对本轮开始时的工作区文件做哈希比较（含已有未提交工作）；已有运行文件只改 AudioManager、manifest、CREDITS，其他82个文件不变，包含规则、AI、计分、动画、业务事件映射和全部核心音频。

运行 4 项新增地图音频测试和 2 项既有地图映射／manifest专项测试，全部通过；没有全量回归、手机验证或线上发布。结果在 `validation/2026-10-11/audio-maps/report.json`；候选媒体检查在 `candidate-playback.json`；电平与字节一致检查在 `levels.json`；试听页为该目录的 `index.html`。

复现：先运行 `scripts/fetch-map-audio.py` → `scripts/prepare-map-audio.py` → `node scripts/build-map-audio-review.mjs`，通过 `node scripts/serve-audio-review.mjs 4173` 打开候选页；`node scripts/check-map-audio-candidates.mjs` 检查候选播放。`selection.json` 锁定后以 `scripts/prepare-map-audio.py --adopt` 复制，重建试听页；`node --test tests/map-audio.test.mjs`、`node --test --test-name-pattern="core manifest|real dual-board map callbacks" tests/audio.test.mjs`、`node scripts/validate-map-audio.mjs` 只验证本阶段。

## 2026-10-11 · 核心音效调整收尾：线＋爆正式采用 D

用户试听 A／B／C／D 后明确选择 D。本轮将 D 光系法术接入 `special.combo` 的 `line-blast` 变体，横线＋爆和竖线＋爆都使用同一条独立法术；文件为 `assets/audio/special/special-combo-line-blast-v5.wav`。保留用户选定的试听录音、1200ms 尾音和 0.78 倍率，逐字节校验与试听 `clips/d.wav` 一致，没有重新塑造音色或叠加两个单爆。旧玻璃碎裂感的 v4 移到 references/audio-stage2/choices/superseded/，不再部署。

### 来源、选择依据与音量

素材是 ViRiX Dreamcore（David Mckee）的 `Healing Full.wav`，来自 [Magic SFX Sample](https://opengameart.org/content/magic-sfx-sample)，授权 [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)，作者主页 [soundcloud.com/virix](https://soundcloud.com/virix)。选择依据是用户实际试听后认可 D 的魔法音色；采用这条完成素材取代被反馈为玻璃碎裂的冰晶冲击。

制作记录：去静音／DC、单声道 44.1kHz PCM16、截短至 1.2s、2ms 淡入／120ms 淡出、固定电平余量，峰值约 0.76；采用试听版原文件，没有额外均衡、变调或叠层。默认倍率 0.78 沿用试听页，分类 effect、special 合并组、150ms 冷却、1 声上限、1600ms 最长播放保护保持不变。接受的一声完整播放，快速重触发跳过，不补播、不截断。

| 当前特殊反馈 | 正式文件（相对 assets/audio/） | 时长 | 默认倍率 |
| --- | --- | --- | --- |
| 特殊生成 | special/special-create-v3.wav | 360ms | 0.40 |
| 整行／整列 | special/special-line-v3.wav | 400ms | 0.66 |
| 单爆破 | special/special-bomb-v3.wav | 500ms | 0.68 |
| 线＋线 | special/special-line-v3.wav | 400ms | 0.72 |
| 线＋爆（D） | special/special-combo-line-blast-v5.wav | 1200ms | 0.78 |
| 爆＋爆 | special/special-combo-blasts-v3.wav | 950ms | 0.90 |

线＋线沿用上一轮已经补改的行列魔法音；爆＋爆保留一次最强火魔法冲击。基础积木操作、气泡普通消除／三级连击、倒计时／开始全部保留。共 10 个已接入 ID、16 个独立 WAV、485,362 字节。音效默认开启；地图环境、其他 UI 和结算仍为空引用。

作者、来源、许可和修改说明已写入随部署 `assets/audio/CREDITS.md`。当前来源与编辑记录更新至 sources.json／derivatives.json，移除未再使用的 qubodup 来源；原件和历史证据仍保留。`references/audio-stage2/choices/selection.json` 记录用户选择 D，并保存选定文件用于重建；候选清单 selected 为 D，只有 D 的 implemented 为 true，A／B／C 留作对比，不进入游戏。试听页同步显示 D 已接入。

### 最小验证结果

- 19 项已有音效测试全部通过：快速合并、连击不互相截断、默认开启、开关后棋盘／计分／事件轨迹一致。
- 浏览器实际指针操作横线＋爆、竖线＋爆，以及一次原生帧时钟试玩：均选择 v5 一次，loadeddata／playing／ended 正常，实际时长 1.2s、倍率 0.78，播放后释放槽位，棋盘正常结算。
- 100 次快速线爆只接受一声，后来的爆爆不打断它，没有排队补播；关闭音效仍完成消除与计分，不创建声音对象。
- 16 个 PCM 文件加载／格式／削波检查通过；D 的 SHA-256 为 `4b5118336ba662480348f424d8f692caf62c16d7df872d0fc8136bfd91ab4c4b`，与选定试听版及重建后部署版一致。其他 15 个 WAV、其他 manifest 配置、engine／bot／arena／art／environment／flow／app／style／index／audio-events／audio-manager 均与本轮开始相同。
- 按实际倍率，普通→单线→线线→线爆→爆爆的整段能量分别约 0.000244／0.002796／0.003327／0.005059／0.057121，递增。D 的平均 RMS 因较长尾音低于线音，RMS 单独记录；整段能量不代替主观震撼感或长时间舒适度验收。

报告：`validation/2026-10-11/audio-selected/report.json`、`levels.json`、`audio-assets.json`。复现：已有音效测试、`node scripts/validate-line-blast.mjs`、`scripts/validate-audio-levels.py`。本轮完成本地接入和文档更新，没有修改规则、计分、AI、动画时序、地图事件或默认开关，未发布线上版本。

## 2026-10-11 · 补改线＋线；线＋爆先提供候选试听

用户反馈线＋爆 v4 像玻璃碎裂、缺少魔法感，并指出线＋线仍使用旧版本。本轮正式接入只改线＋线：`special.combo` 默认与 `line-line` 变体均复用已认可的 `special/special-line-v3.wav`（400ms，原生成音的同一录音），倍率 0.72，略高于单行列的 0.66。分类 effect、special 合并组、150ms 冷却、1 声上限保持不变；播放一次，不叠两道光束。旧 `special-combo-lines-v3.wav` 移到 references/audio-stage2/choices/superseded/，去掉部署和生成脚本引用。

线＋线使用 [The Berklee College of Music 的 Shimmer glitter magic](https://opengameart.org/content/shimmer-glitter-magic)（CC BY 3.0）与 [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds)（CC0）的原先剪辑。选择依据是用户已认可整行列的这段音色，直接沿用，不加工出另一种音色。现用 16 个独立 WAV，共 428,914 字节；现存 16 个文件校验值均与本轮开始一致，只有线＋线引用改变。

### 线＋爆候选，等待用户选择

候选位于 `validation/2026-10-11/audio-choices/clips/`，没有放入游戏 assets/audio/，没有写入 audio manifest。当前线＋爆仍引用 v4，倍率 0.78；本轮不擅自实装任何候选。所有候选只有去静音／DC、单声道、尾部截短、淡入淡出和电平调整，不改音高、不加均衡滤镜、不叠加两次爆破。名称描述素材方向，是否适合本游戏由试听决定。

| 编号 | 试听文件 | 原件与作者 | 授权／选择方向 |
| --- | --- | --- | --- |
| A | clips/a.wav | magical_1.ogg · JaggedStone | [Magic Spell SFX](https://opengameart.org/content/magic-spell-sfx)，CC0；原作者以旋律音序制作的施法声音，尝试有音调发展的魔法方向 |
| B | clips/b.wav | magical_4.ogg · JaggedStone | 同上，CC0；另一段独立施法音序，与 A 比较发展和音色 |
| C | clips/c.wav | teleport.wav · Ogrebane | [Teleport Spell](https://opengameart.org/content/teleport-spell)，CC0；为开源 RPG Summoning Wars 制作的传送法术，尝试空间释放方向 |
| D | clips/d.wav | Healing Full.wav · ViRiX Dreamcore（David Mckee） | [Magic SFX Sample](https://opengameart.org/content/magic-sfx-sample)，CC BY 3.0；同一已用魔法包的治疗法术，尝试光系发展，保留作者及 [主页](https://soundcloud.com/virix) |

每条试听长 1.2 秒，2ms 淡入／120ms 淡出，RMS 目标 0.16、峰值上限 0.76；页面使用 0.78 倍率，可统一调低试听音量。电平只是让候选便于比较，最终尾音和游戏音量待选择后确认。页面支持单独试听、A→B→C→D 连听，以及普通消除→线＋线→候选→爆＋爆对比；每条结束后间隔 300ms。没有自动选中或实装操作。

原件、授权网页、下载链接与 SHA-256 在 references/audio-stage2/choices/ 与 `candidate-provenance.json`；候选编辑记录和试听 WAV 校验值见页面旁 `candidate-manifest.json`，selected 为 null、implemented 均为 false。候选来源单独记录，不混入当前部署 CREDITS.md。

### 本轮最小验证

- 19 项已有音效测试通过；更新实际组合测试以允许线＋线复用正式单行列文件。音效默认开启，快速合并、连击不互相截断、静音后棋盘／得分／事件轨迹不变的现有测试通过。
- 实际浏览器指针交换及原生帧时钟试玩线＋线，均播放新引用一次；loadeddata／playing／ended 正常，时长 400ms、倍率 0.72，棋盘正常结算。100 次快速请求只接受一声，不排队、不被另一组合打断；关闭音效仍结算。
- 16 个部署文件可读取、44.1kHz 单声道、无削波；已认可行列音与原生成音 SHA-256 一致。候选四声及参考音在浏览器正常加载／播放／结束，层级对比可用，页面 390px 无横向溢出。
- engine／bot／arena／art／environment／flow／app／style／index／audio-events／audio-manager 的 SHA-256 前后相同；当前线＋爆文件引用、倍率、文件校验值均未变。没有修改规则、计分、AI、动画时序、地图事件或默认开关。

验证报告：`validation/2026-10-11/audio-line-lines/report.json`、`levels.json` 与 `validation/2026-10-11/audio-choices/report.json`。工具无法可靠听取耳机输出，浏览器播放与数值检查不代替主观听感验收；用户从 A／B／C／D 选定后再接入线＋爆。仅本地修改，未发布线上版本。

## 2026-10-11 · 线＋爆音效第四版：替换沉闷风声

只替换 special.combo 的 line-blast 变体。原 ViRiX Wind effects 5 低频主体在试玩中被反馈为沉闷，改用 Iwan 'qubodup' Gabovitch 的 Ice & Electricity Magic 中 qubodupIceDamage03b.flac，作为独立的明亮冰晶魔法冲击。新文件 special/special-combo-line-blast-v4.wav：560ms，默认倍率保留 0.78，文件峰值 0.76；旧版 680ms 风声归档。选择更接近已认可行列／单爆的晶莹音色，缩短拖尾；不是对旧风声加滤波或调高音高。

单条原素材仅做单声道整理、去静音／DC、截短、80ms 淡出和固定电平余量，不叠加两个爆破。许可 CC BY 3.0，作者／来源／修改说明写入随部署 CREDITS.md；原包、作者 notes.txt、授权网页、下载地址、SHA-256 及剪辑记录保存在 references/audio-stage2/line-blast/ 和 sources.json／derivatives.json。

[Ice & Electricity Magic 来源](https://opengameart.org/content/ice-electricity-magic) · [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)。所有现用素材来源汇总：

- [Impact Sounds 1.0](https://kenney.nl/assets/impact-sounds) — Kenney，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Pop effect sounds](https://opengameart.org/content/pop-effect-sounds) — trezegames，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [VSCO 2 Community Edition — Marimba](https://github.com/sgossner/VSCO-2-CE) — Sam Gossner & Simon Dalzell; sample cutting: Elan Hickler / Soundemote，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Funny Comic Cartoon Bounce Sound](https://opengameart.org/content/funny-comic-cartoon-bounce-sound) — Blender Foundation / YoFrankie! (c) 2008，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Shimmer glitter magic](https://opengameart.org/content/shimmer-glitter-magic) — The Berklee College of Music，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Magic SFX Sample — individual finished magic cues](https://opengameart.org/content/magic-sfx-sample) — ViRiX Dreamcore (David Mckee)，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Magic Smite](https://opengameart.org/content/magic-smite) — spookymodem，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Ice & Electricity Magic — IceDamage03b](https://opengameart.org/content/ice-electricity-magic) — Iwan 'qubodup' Gabovitch，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。

### 当前文件与默认音量

路径相对 assets/audio/；共 17 文件、478,350 字节。只有 line-blast 的文件引用改变，倍率和分类／合并策略不变；其他 16 个 WAV 校验值与本轮开始一致，爆爆仍是最强独立法术。

| 音效／变体 | 文件 | 时长 | 倍率 | 合并组／冷却／上限 | 选择依据 |
| --- | --- | --- | --- | --- | --- |
| ui.countdown | ui/countdown-3-v2.wav | 210ms | 0.42 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / 1 | ui/countdown-1-v2.wav | 210ms | 0.46 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / 2 | ui/countdown-2-v2.wav | 210ms | 0.44 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / start | ui/countdown-start-v2.wav | 400ms | 0.64 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| block.swap | block/block-swap-v1.wav | 120ms | 0.58 | operation / 70ms / 2声 | 120ms 轻木碰撞，提供积木接触感；保留明确起音和短尾。 |
| block.invalid | block/block-invalid-v1.wav | 220ms | 0.32 | operation / 100ms / 2声 | 卡通反弹，采用圆润回弹表达返回；没有错误警报。 |
| block.match3 | block/block-match3-v2.wav | 90ms | 0.46 | match / 120ms / 1声 | 90ms 单次气泡爆破，去掉玻璃和积木敲击，避免打砖块感。 |
| block.combo | combo/combo1-v2.wav | 150ms | 0.48 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.combo / combo2 | combo/combo2-v2.wav | 175ms | 0.51 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.combo / combo3 | combo/combo3-v2.wav | 200ms | 0.54 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.fall | block/block-fall-v1.wav | 100ms | 0.24 | operation / 160ms / 2声 | 单次轻木落位，100ms 短促；按整批事件播放，默认最轻。 |
| special.create | special/special-create-v3.wav | 360ms | 0.40 | special / 100ms / 1声 | 360ms 单次魔法显现，ViRiX Misc 02；比消除更轻，倍率 0.40。 |
| special.line | special/special-line-v3.wav | 400ms | 0.66 | special / 100ms / 1声 | 原生成音逐样本原样移入：400ms shimmer／晶莹释放，用户已认可这段用于整行列。倍率 0.66。 |
| special.bomb | special/special-bomb-v3.wav | 500ms | 0.68 | special / 100ms / 1声 | 500ms 独立元素魔法爆破，ViRiX Ice attack 2；移除气球和气泡层，倍率 0.68。 |
| special.combo | special/special-combo-lines-v3.wav | 560ms | 0.72 | special / 150ms / 1声 | 行行：560ms 神圣魔法束；行爆：560ms 明亮冰晶魔法冲击；爆爆：950ms 单次大型火魔法冲击。三条独立完成素材，各播放一次，爆爆最强。 |
| special.combo / line-blast | special/special-combo-line-blast-v4.wav | 560ms | 0.78 | special / 150ms / 1声 | 行行：560ms 神圣魔法束；行爆：560ms 明亮冰晶魔法冲击；爆爆：950ms 单次大型火魔法冲击。三条独立完成素材，各播放一次，爆爆最强。 |
| special.combo / blast-blast | special/special-combo-blasts-v3.wav | 950ms | 0.90 | special / 150ms / 1声 | 行行：560ms 神圣魔法束；行爆：560ms 明亮冰晶魔法冲击；爆爆：950ms 单次大型火魔法冲击。三条独立完成素材，各播放一次，爆爆最强。 |

### 最小验证

- PCM 检查正常，无削波，生成音迁移校验仍一致；普通→行列→线爆→爆爆的实际有效 RMS／积分能量继续递增。亮度／低频比例只用于确认素材方向，不代替耳机舒适度判断。
- 仅验证实际横＋爆、竖＋爆的指针交换和一次原生帧时钟试玩：均选择同一个 v4 变体，实际 loadeddata／playing／ended 后释放槽位。快速同类触发不截断／叠加／排队；关闭音效仍结算。
- 清点 17 个部署文件；其他 16 个音频和 engine／bot／arena／art／environment／flow／app／style／index／audio-events／audio-manager 与本轮开始相同。没有修改规则、分数、AI、动画时序、地图事件、默认开关或其他音色。

试听页与相关验证：validation/2026-10-11/audio-line-blast/。当前工具不能可靠听取耳机输出，新线爆的主观听感以实际试听反馈为准。本轮只完成本地替换，没有发布线上版本。

## 2026-10-11 · 特殊音效第三版：生成音迁移与魔法爆破

用户确认原特殊生成音适合整行整列，因此将 special-create-v1 的 400ms 音频逐样本原样迁移为 special-line-v3，倍率 0.66；重新选 360ms 的轻魔法显现作为 special-create-v3，倍率 0.40。普通气泡、连击、交换、下落、反弹、倒计时和默认开启继续保留。

同时完成上一条魔法爆破反馈：单爆破、行行、行爆、爆爆各选独立法术素材，不再使用气球／竹杆混音。爆爆使用 Fire impact 1 的单次大型魔法冲击，只有一个原始素材、一次起音，不叠加两个普通爆破；固定剪辑保留最厚的主体和更长尾音。四级消除的实际有效 RMS／积分能量递增，爆爆为最高档。当前共 17 文件，488,934 字节。

### 来源、授权与编辑

- [Impact Sounds 1.0](https://kenney.nl/assets/impact-sounds) — Kenney，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Pop effect sounds](https://opengameart.org/content/pop-effect-sounds) — trezegames，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [VSCO 2 Community Edition — Marimba](https://github.com/sgossner/VSCO-2-CE) — Sam Gossner & Simon Dalzell; sample cutting: Elan Hickler / Soundemote，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Funny Comic Cartoon Bounce Sound](https://opengameart.org/content/funny-comic-cartoon-bounce-sound) — Blender Foundation / YoFrankie! (c) 2008，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Shimmer glitter magic](https://opengameart.org/content/shimmer-glitter-magic) — The Berklee College of Music，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Magic SFX Sample — individual finished magic cues](https://opengameart.org/content/magic-sfx-sample) — ViRiX Dreamcore (David Mckee)，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Magic Smite](https://opengameart.org/content/magic-smite) — spookymodem，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。

新增 ViRiX 的公开授权完整单条素材 Misc 02、Ice attack 2、Wind effects 5、Fire impact 1，以及 spookymodem 的 Magic Smite，均为 CC BY 3.0。ViRiX 包名含 Preview，但作者明确公开 CC BY 许可并允许使用其中单条成品；不是受演示用途限制的占位音，也没有购买／使用完整商业包。作者、来源、许可及修改说明已写入随部署的 CREDITS.md；七个现用派生文件含 CC BY 素材，其余十个源素材为 CC0。

剪辑只处理静音、单声道转换、去 DC、长尾截短、淡出和固定电平余量；新增魔法素材不变调、不叠同类爆破、不做运行时滤波或合成。原件、下载地址、网页授权证据、SHA-256 和编辑步骤存于 references/audio-stage2/。旧替换素材存档，不随游戏部署。

### 文件与音量

路径相对 assets/audio/。倒计时分类 ui，其余 effect；音量仍为总量 × 分类 × 表中倍率。

| 音效／变体 | 文件 | 时长 | 倍率 | 合并组／冷却／上限 | 选择依据 |
| --- | --- | --- | --- | --- | --- |
| ui.countdown | ui/countdown-3-v2.wav | 210ms | 0.42 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / 1 | ui/countdown-1-v2.wav | 210ms | 0.46 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / 2 | ui/countdown-2-v2.wav | 210ms | 0.44 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / start | ui/countdown-start-v2.wav | 400ms | 0.64 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| block.swap | block/block-swap-v1.wav | 120ms | 0.58 | operation / 70ms / 2声 | 120ms 轻木碰撞，提供积木接触感；保留明确起音和短尾。 |
| block.invalid | block/block-invalid-v1.wav | 220ms | 0.32 | operation / 100ms / 2声 | 卡通反弹，采用圆润回弹表达返回；没有错误警报。 |
| block.match3 | block/block-match3-v2.wav | 90ms | 0.46 | match / 120ms / 1声 | 90ms 单次气泡爆破，去掉玻璃和积木敲击，避免打砖块感。 |
| block.combo | combo/combo1-v2.wav | 150ms | 0.48 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.combo / combo2 | combo/combo2-v2.wav | 175ms | 0.51 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.combo / combo3 | combo/combo3-v2.wav | 200ms | 0.54 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.fall | block/block-fall-v1.wav | 100ms | 0.24 | operation / 160ms / 2声 | 单次轻木落位，100ms 短促；按整批事件播放，默认最轻。 |
| special.create | special/special-create-v3.wav | 360ms | 0.40 | special / 100ms / 1声 | 360ms 单次魔法显现，ViRiX Misc 02；比消除更轻，倍率 0.40。 |
| special.line | special/special-line-v3.wav | 400ms | 0.66 | special / 100ms / 1声 | 原生成音逐样本原样移入：400ms shimmer／晶莹释放，用户已认可这段用于整行列。倍率 0.66。 |
| special.bomb | special/special-bomb-v3.wav | 500ms | 0.68 | special / 100ms / 1声 | 500ms 独立元素魔法爆破，ViRiX Ice attack 2；移除气球和气泡层，倍率 0.68。 |
| special.combo | special/special-combo-lines-v3.wav | 560ms | 0.72 | special / 150ms / 1声 | 行行：560ms 神圣魔法束；行爆：680ms 宽风魔法冲击；爆爆：950ms 单次大型火魔法冲击。三条独立完成素材，各播放一次，爆爆最强。 |
| special.combo / line-blast | special/special-combo-line-blast-v3.wav | 680ms | 0.78 | special / 150ms / 1声 | 行行：560ms 神圣魔法束；行爆：680ms 宽风魔法冲击；爆爆：950ms 单次大型火魔法冲击。三条独立完成素材，各播放一次，爆爆最强。 |
| special.combo / blast-blast | special/special-combo-blasts-v3.wav | 950ms | 0.90 | special / 150ms / 1声 | 行行：560ms 神圣魔法束；行爆：680ms 宽风魔法冲击；爆爆：950ms 单次大型火魔法冲击。三条独立完成素材，各播放一次，爆爆最强。 |

最强火魔法自身持续响度较高，离线峰值设为 0.66，留出余量；爆爆倍率 0.90。行爆 0.78、行行 0.72、单爆 0.68、行列 0.66、生成 0.40，未全部设为 100%。层级差异来自独立素材的主体、音色和尾音，不能仅用倍率判断最终响度。

### 最小验证

- tests/audio.test.mjs：19 项通过；真实三类组合事件仍选择对应独立文件；合并、音量、启停、拒绝清理及开关逻辑隔离检查保持通过。
- 浏览器检查：17 个文件 loadeddata／playing／ended，默认倍率正确、结束后释放槽位，无页面／媒体错误或 404。九个既有练习盘真实指针操作、六个原生帧时钟场景完成结算；爆爆接受一次对应 special.combo 变体。报告见 validation/2026-10-11/audio-magic/report.json。
- levels.json 检查实际 PCM、余量和四级有效 RMS／能量递进；另核验新行列音 SHA-256 与前版生成音完全一致，并确认五个新魔法 cue 每个只有一个来源，没有本项目的爆破叠加。
- unchanged-gameplay.json 核验 engine、bot、arena、art、environment、flow、app、style、index、audio-events、audio-manager 与本轮开始相同；规则、计分、AI、动画时序、地图事件和音效默认开关未变。

新版试听页 validation/2026-10-11/audio-magic/index.html 支持生成→行列、四级消除、连击和倒计时。用户已认可迁移音色；新生成及爆破素材的主观听感仍需耳机复核，真实媒体播放检查不等于听觉验收。仅完成本地接入，没有发布线上版本。

## 2026-10-11 · 核心音效听感调整：气泡消除与特殊组合递进

响应试玩反馈：普通消除太像打砖块，特殊消除偏轻、组合缺少层次，倒计时／开始不悦耳。当前音效默认开启（可用原按钮关闭）；10 个已接入 ID 共用 17 个文件，共 421,902 字节。地图事件、规则、分数、AI 与动画时序没有修改。

### 调整结果

- 普通三消换成 trezegames 的 90ms 气泡 pop，移除玻璃／木质撞击。三级连击也换同一气泡家族，以音高和连爆密度递升。
- 普通 → 整行列 → 行＋爆炸 → 爆炸＋爆炸，分别为短泡、360ms 蓄力扫波、500ms 扫波接爆破、640ms 双重低爆破。单爆破和行行组合也有独立释放文件；不是复用一个组合音调大音量。
- 特殊直线倍率 0.39 → 0.66，爆破 0.42 → 0.69，生成 0.34 → 0.45；行行／行爆／爆爆分别 0.70／0.78／0.90。保留文件峰值余量，普通操作和落块维持原值，三消 0.52 → 0.46。
- audio-events 读取现有 combo-trigger.type 选择对应变体；含特殊块的 clear 不再额外叠普通三消，特殊释放由原 special-trigger／combo-trigger 播放。没有改引擎事件、结算或触发时机。
- 倒计时换 VSCO 马林巴真实录音，C4／D4／E4 的 210ms 单音随 3／2／1 递升，开始为 400ms C/E/G 三音展开，倍率 0.64；不再使用积木敲击、pop／shimmer 开始音。
- 特殊／连击保留原合并与并发策略，已接受声音播至结束，重叠请求跳过，无排队补播、无截断。新版使用 v2 文件名，旧替换素材收纳至 references/audio-stage2/superseded，避免部署残留和旧缓存引用。

### 来源与授权

- [Impact Sounds 1.0](https://kenney.nl/assets/impact-sounds) — Kenney，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Pop effect sounds](https://opengameart.org/content/pop-effect-sounds) — trezegames，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Balloon Sounds](https://opengameart.org/content/balloon-sounds) — Gniffelbaf / AntumDeluge，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [VSCO 2 Community Edition — Marimba](https://github.com/sgossner/VSCO-2-CE) — Sam Gossner & Simon Dalzell; sample cutting: Elan Hickler / Soundemote，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Swish - bamboo stick weapon swhoshes](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes) — Iwan Gabovitch / qubodup，CC0-1.0；原件／授权证据／SHA-256 见 sources.json。
- [Funny Comic Cartoon Bounce Sound](https://opengameart.org/content/funny-comic-cartoon-bounce-sound) — Blender Foundation / YoFrankie! (c) 2008，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。
- [Shimmer glitter magic](https://opengameart.org/content/shimmer-glitter-magic) — The Berklee College of Music，CC-BY-3.0；原件／授权证据／SHA-256 见 sources.json。

气泡和气球素材为 CC0；VSCO 官方仓库固定版本 440300901dfe9275fd84e0b7763af1f8443ae62e 的 CC0 LICENSE、README、C4／G4 原录音均保留。新增素材只做离线剪辑、淡入淡出、有限变速和录音分层；运行时不合成声音。仍使用 CC BY 3.0 的反弹和特殊生成文件保留 Blender／Berklee 署名及修改说明，随部署的 CREDITS.md 已同步。其他现用文件源素材为 CC0。原素材、证据、下载地址和校验值见 references/audio-stage2/sources.json，编辑步骤见 derivatives.json 和 scripts/prepare-core-audio.py。

### 当前文件与音量

路径相对 assets/audio/。分类：倒计时 ui，其余 effect。最终音量为总量 × 分类 × 表中倍率，总量／分类仍为 1。

| 音效／变体 | 文件 | 时长 | 倍率 | 合并组／冷却／上限 | 选择依据 |
| --- | --- | --- | --- | --- | --- |
| ui.countdown | ui/countdown-3-v2.wav | 210ms | 0.42 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / 1 | ui/countdown-1-v2.wav | 210ms | 0.46 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / 2 | ui/countdown-2-v2.wav | 210ms | 0.44 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| ui.countdown / start | ui/countdown-start-v2.wav | 400ms | 0.64 | countdown / 500ms / 1声 | 自然马林巴录音 C4 → D4 → E4，开始切换为 C/E/G 三音展开；替换旧敲击和闪光 pop。 |
| block.swap | block/block-swap-v1.wav | 120ms | 0.58 | operation / 70ms / 2声 | 120ms 轻木碰撞，提供积木接触感；保留明确起音和短尾。 |
| block.invalid | block/block-invalid-v1.wav | 220ms | 0.32 | operation / 100ms / 2声 | 卡通反弹，采用圆润回弹表达返回；没有错误警报。 |
| block.match3 | block/block-match3-v2.wav | 90ms | 0.46 | match / 120ms / 1声 | 90ms 单次气泡爆破，去掉玻璃和积木敲击，避免打砖块感。 |
| block.combo | combo/combo1-v2.wav | 150ms | 0.48 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.combo / combo2 | combo/combo2-v2.wav | 175ms | 0.51 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.combo / combo3 | combo/combo3-v2.wav | 200ms | 0.54 | match / 120ms / 1声 | 同气泡家族三级：音高递升、2 / 3 / 4 次短泡连爆；与普通消除保持一致。 |
| block.fall | block/block-fall-v1.wav | 100ms | 0.24 | operation / 160ms / 2声 | 单次轻木落位，100ms 短促；按整批事件播放，默认最轻。 |
| special.create | special/special-create-v1.wav | 400ms | 0.45 | special / 100ms / 1声 | 短 shimmer 与玻璃起音，表达发现能力；限制尾音电平。 |
| special.line | special/special-line-v2.wav | 360ms | 0.66 | special / 100ms / 1声 | 360ms：45ms 蓄力 → 低气泡主体 → 宽竹杆扫波；倍率 0.39 提至 0.66。 |
| special.bomb | special/special-bomb-v2.wav | 380ms | 0.69 | special / 100ms / 1声 | 380ms：圆润气球爆破、低气泡和空气尾音；倍率 0.42 提至 0.69。 |
| special.combo | special/special-combo-lines-v2.wav | 410ms | 0.70 | special / 150ms / 1声 | 各组合独立文件：行行 410ms 双扫波 / 行爆 500ms 扫波接爆破 / 爆爆 640ms 双重低爆破；厚度、节奏与尾音递进。 |
| special.combo / line-blast | special/special-combo-line-blast-v2.wav | 500ms | 0.78 | special / 150ms / 1声 | 各组合独立文件：行行 410ms 双扫波 / 行爆 500ms 扫波接爆破 / 爆爆 640ms 双重低爆破；厚度、节奏与尾音递进。 |
| special.combo / blast-blast | special/special-combo-blasts-v2.wav | 640ms | 0.90 | special / 150ms / 1声 | 各组合独立文件：行行 410ms 双扫波 / 行爆 500ms 扫波接爆破 / 爆爆 640ms 双重低爆破；厚度、节奏与尾音递进。 |

### 最小验证

- tests/audio.test.mjs：19 项通过；新增默认开启、三种真实组合事件选择三个不同文件、倒计时 3／2／1／start 变体检查；保留播放生命周期、快速合并、声音结束前不截断、失败清理和开关逻辑隔离检查。tests/app.test.mjs 的 audio integration：1 项通过。
- 浏览器真实媒体：17 文件全部加载、playing、ended，音量符合 manifest、播放后释放槽位；无 404、媒体或页面错误。
- 九个既有练习盘真实指针操作：三消、连击、特殊生成、行、爆破、行行、横行爆、竖行爆、爆爆均结算，四种组合的原 type 映射正确。含特殊块的消除没有同帧普通 pop；六个场景另用原生帧时钟试玩完成。
- 100 次快速连击请求只接受一声，130ms 后另一等级不叠加／不截断，播放结束没有补播。关闭音效后棋盘继续正常结算；启用／禁用／脱离音效的棋盘、分数、锁、事务、完整事件轨迹一致。
- levels.json 逐项检测实际 WAV、峰值、播放倍率后的 RMS 和积分能量；四级消除的有效 RMS 与积分能量均递增。这些指标用于排除静音／削波／退级，不代表已经完成耳机舒适度验收。
- unchanged-gameplay.json：engine、bot、arena、art、environment、flow、app、style、index 的 SHA-256 与调整前相同。只修改音效素材、manifest、音效翻译和默认开关及相关文档／验证。

验证报告／试听页：validation/2026-10-11/audio-refinement/。试听页支持“四级消除”“三级连击”“3／2／1／开始”按游戏默认倍率连续试听。用户已提供首版真实听感反馈，本轮技术和视觉试玩已完成；工具无法可靠听取耳机输出，因此不声明新素材的主观听感已验收。未发布线上版本；地图环境音留至下一阶段。

## 2026-10-11 · 音效系统第二阶段：核心战斗录音素材接入

已接入 10 个核心反馈 ID、13 个正式录音剪辑 WAV 文件（248,416 字节／242.6 KiB，44.1kHz 单声道 16-bit PCM）。普通木质操作、pop／玻璃消除、卡通反弹、shimmer 与竹杆空气释放共用材质方向；没有按钮音、提示 beep、激光或战争爆炸。地图、其他 UI 和胜负结算继续为空，独立 ui.start 也为空；对战倒计时开始经 ui.countdown 的 start 变体播放。

### 来源与授权

- [Impact Sounds 1.0](https://kenney.nl/assets/impact-sounds) — Kenney，CC0-1.0；原始下载、网页证据及 SHA-256 见 sources.json。
- [Pop sounds](https://opengameart.org/content/pop-sounds-0) — EZduzziteh，CC0-1.0；原始下载、网页证据及 SHA-256 见 sources.json。
- [Swish - bamboo stick weapon swhoshes](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes) — Iwan Gabovitch / qubodup，CC0-1.0；原始下载、网页证据及 SHA-256 见 sources.json。
- [Funny Comic Cartoon Bounce Sound](https://opengameart.org/content/funny-comic-cartoon-bounce-sound) — Blender Foundation / YoFrankie! (c) 2008，CC-BY-3.0；原始下载、网页证据及 SHA-256 见 sources.json。
- [Shimmer glitter magic](https://opengameart.org/content/shimmer-glitter-magic) — The Berklee College of Music，CC-BY-3.0；原始下载、网页证据及 SHA-256 见 sources.json。

随游戏部署的署名、许可链接及修改说明为 dist/assets/audio/CREDITS.md。含 Blender／Berklee 素材的五个派生文件保留 CC BY 3.0；其他八个文件源素材均为 CC0。离线处理限于去静音、截短、淡入淡出、有限速度变化、分层和固定余量；不在运行时合成／调音高。原录音和编辑步骤保存在 references/audio-stage2/derivatives.json，可用 scripts/prepare-core-audio.py（numpy、soundfile）复现。

### 文件、选择依据与默认音量

以下路径相对部署目录 assets/audio/；均为 effect 分类，倒计时为 ui。总音量／分类音量保持原值，最终播放倍率为总量 × 分类 × 表中倍率。

| 音效 ID／变体 | 文件 | 时长 | 倍率 | 合并组／冷却／上限 | 选择依据 |
| --- | --- | --- | --- | --- | --- |
| ui.countdown | ui/countdown-tick-v1.wav | 95ms | 0.46 | countdown / 500ms / 1声 | 3 / 2 / 1 共用 95ms 木质节拍；开始切换至 250ms pop / 玻璃 / shimmer 奖励释放。 |
| ui.countdown / start | ui/countdown-start-v1.wav | 250ms | 0.55 | countdown / 500ms / 1声 | 3 / 2 / 1 共用 95ms 木质节拍；开始切换至 250ms pop / 玻璃 / shimmer 奖励释放。 |
| block.swap | block/block-swap-v1.wav | 120ms | 0.58 | operation / 70ms / 2声 | 120ms 轻木碰撞，提供积木接触感；保留明确起音和短尾。 |
| block.invalid | block/block-invalid-v1.wav | 220ms | 0.32 | operation / 100ms / 2声 | 卡通反弹，采用圆润回弹表达返回；没有错误警报。 |
| block.match3 | block/block-match3-v1.wav | 170ms | 0.52 | match / 120ms / 1声 | 圆润 pop 配少量玻璃起音，让普通消除有清脆奖励感。 |
| block.combo | combo/combo1-v1.wav | 170ms | 0.48 | match / 120ms / 1声 | 同材质三级录音剪辑，速度 1.00 / 1.12 / 1.26，叠加层数 2 / 3 / 4；随等级提高音高与密度。 |
| block.combo / combo2 | combo/combo2-v1.wav | 195ms | 0.51 | match / 120ms / 1声 | 同材质三级录音剪辑，速度 1.00 / 1.12 / 1.26，叠加层数 2 / 3 / 4；随等级提高音高与密度。 |
| block.combo / combo3 | combo/combo3-v1.wav | 220ms | 0.54 | match / 120ms / 1声 | 同材质三级录音剪辑，速度 1.00 / 1.12 / 1.26，叠加层数 2 / 3 / 4；随等级提高音高与密度。 |
| block.fall | block/block-fall-v1.wav | 100ms | 0.24 | operation / 160ms / 2声 | 单次轻木落位，100ms 短促；按整批事件播放，默认最轻。 |
| special.create | special/special-create-v1.wav | 400ms | 0.34 | special / 100ms / 1声 | 短 shimmer 与玻璃起音，表达发现能力；限制尾音电平。 |
| special.line | special/special-line-v1.wav | 270ms | 0.39 | special / 100ms / 1声 | 竹杆空气录音与玻璃释放：45ms 蓄力 → 释放 → 晶莹穿透尾音。 |
| special.bomb | special/special-bomb-v1.wav | 240ms | 0.42 | special / 100ms / 1声 | 低速圆润 pop、木质实体和空气爆发，采用轻快玩具破裂方向。 |
| special.combo | special/special-combo-v1.wav | 360ms | 0.46 | special / 150ms / 1声 | 蓄力、较厚 pop、双空气层与晶莹尾音，形成最高层次的短释放。 |

文件峰值保留 28%～40% 余量，落块倍率最低 0.24，反弹 0.32，特殊 0.34～0.46，连击 0.48／0.51／0.54，交换 0.58。层次增长主要来自递增音高与录音层数，避免单纯加大音量。音量与剪辑选择是依据素材说明和数值作出的初始设计，不能宣称已经通过耳机听感验收。

### 音效层改动与合并策略

AudioManager 支持本地 src／volume 变体和 mergeGroup 的 voiceLimit；变体不能改分类、合并或并发限制。block.combo 在 depth=2／3／≥4 时分别选择 combo1／combo2／combo3。普通消除与连击共享一条 match 声路；特殊生成／触发／组合共享一条 special 声路。保留已接受声音播放至结束，重叠请求跳过，不互相截断、不延迟排队。operation 最多两声，全局 8 声／effect 分类 3 声的原上限保持；短素材含加载最多 1600ms。开始变体只读取 countdown → playing 的原状态变化。

### 最小验证结果与实际试玩

- node --test tests/audio.test.mjs：17 项通过；覆盖变体合法性、三级映射、音量乘法、重叠限制、失败／拒绝清理、开关停止、启用／禁用／脱离音效的棋盘／分数／锁／事务和完整事件轨迹一致。另有 tests/app.test.mjs 中 audio integration 的 1 项针对性检查通过；原表现层仍统一转发给管理器。未运行全量规则／地图回归。
- node scripts/validate-audio.mjs：9 组浏览器检查通过。13 文件均由真实 AudioManager／浏览器媒体加载，产生 loadeddata、playing、ended，音量符合 manifest，无 404／页面／媒体错误。另逐文件检查 44.1kHz 单声道、峰值余量与三级连击积分能量递增，结果在 levels.json；这些数值不替代舒适度或遮蔽听感判断。
- 六种既有练习盘真实指针操作：三消、连击、特殊生成、直线、爆破、组合均触发；另测无效交换弹回、100 次快速请求仅一声，130ms 的另一等级不能打断前声，结束无补播。3／2／1／开始四次仅各触发一次。关闭音效后实际三消照常结算。
- 原生帧时钟实际试玩三消、连击、直线和爆破组合，均完成原规则结算并接受对应声音。关键帧和报告在 validation/2026-10-11/audio-stage2/。截图检查画面仍为既有积木棋盘／原特效；截图不能判断声音风格。
- engine、bot、app、art、arena、environment、flow、style、index 的 SHA-256 与本轮开始相同，见 unchanged-gameplay.json；没有修改规则、计分、AI、动画时序或地图事件。
- 主观听觉验收未完成：当前工具不能可靠听取真实耳机输出，不能宣称“已经更爽”或“长玩不疲劳”。已提供同倍率试听页 index.html，逐条／三级连击／倒计时可复核；若不统一，优先替换素材。

本轮完成本地接入与技术验证，没有发布线上版本。下一阶段再处理悬崖、冰原、遗迹、熔炉事件音效。

# 2026-10-11 · 音效基础设施第一阶段（历史记录）

本轮只建立声音系统，没有下载、生成或接入任何临时或正式音效。声音方向记录于 `docs/audio-design.md`：轻松、爽快、玩具积木感、自然材质、轻竞技，让玩家感觉“操控有生命力的小积木进行对战”；禁止科技 UI 电子音、高频刺耳提示、科幻激光、写实战争爆炸和随机按钮音替代反馈。移除 app 中旧消除与机关振荡器合成音；24 个首批音效 ID 均为 `src:null`，开启开关仍保持静默。

新增文件：`dist/audio-manager.mjs`（统一管理器与 audio 单例）、`dist/audio-manifest.mjs`（资源空引用／兼容别名）、`dist/audio-events.mjs`（事件映射与只读流程观察）、`docs/audio-design.md`、`dist/assets/audio/README.md`，以及 ui、block、combo、special、maps/cliff、maps/ice、maps/ruins、maps/furnace、result 九个分类目录的 `.gitkeep`。项目静态根为 dist，部署后的统一路径为 `assets/audio/`。新增 `tests/audio.test.mjs`、`scripts/validate-audio.mjs` 和 `validation/2026-10-11/audio/report.json`。修改 `dist/app.mjs` 的声音调用与开关接线，`dist/flow.mjs` 仅增加可选对手事件表现回调；`tests/app.test.mjs` 适配新模块依赖并新增一项真实表现层音频调用检查。

架构：UI／真实引擎／已有流程状态 → audio-events → AudioManager.play(语义 ID) → manifest → 后续批准的本地文件。业务不访问音频文件，不创建 Audio／AudioContext。管理器支持 soundEnabled、masterVolume，以及 ui／effect／environment 分类音量，音量限定 0–1 并实时更新已有声音。复用原音效按钮，无新增布局；默认关闭，设置本轮只保留会话内。register／registerManifest 为正式素材接入接口；空引用／未知 ID 静默跳过，本地开发每 ID／原因只输出一次 debug 提示，生产默认无提示。浏览器播放拒绝、错误、同步异常与超时均释放播放槽，不影响游戏。

防堆积：默认同 ID 100ms 内合并，交换 70ms、消除／下落 120ms、组合 150ms；普通消除和连击共享合并组。全局最大 8 个、每分类最大 3 个活动或待播放声音；满额跳过、不排队。声音默认含加载最多 8 秒，正式长素材可在资源表明确调整。关闭音效、棋盘重置或离开场景立即清理旧声音和批次。

事件映射：swap → block.swap、revert → block.invalid、普通 clear → block.match3、深层 clear → block.combo、fall → block.fall；special-create → special.create，special-trigger 按真实 row／column／blast → special.line／special.bomb，combo-trigger → special.combo。组合技 clear 不叠加普通消除声，score 不重复触发。悬崖 warning／fall／blocked → cliff.warning／fall／impact；实际冻结／有效消除破冰 → ice.freeze／break，退出清理不播破冰；遗迹机关预警 → ruins.activate，当前转盘没有石柱，ruins.pillar 只预留；熔炉预热／扩散预热 → furnace.warning，初次点火／实际扩散 → furnace.spread。地图以事件 round＋time 在同阶段合并多格与双方，只调用一次；新扩散时刻独立触发。流程观察接入 UI start、countdown、win、lose，按钮捕获阶段接入 click／back。兼容 combo.match3、map.cliff.rockfall 及 map.*／maps.* 别名，业务 ID 不绑定文件。

最小验证：`node --test tests/audio.test.mjs` 的 12 项全部通过；`node --test --test-name-pattern="audio integration" tests/app.test.mjs` 的 1 项通过，仅选择本轮新增测试；`node scripts/validate-audio.mjs` 的 5 组桌面浏览器检查通过。覆盖正常启动／初始化、24 空资源和未知 ID 无音频对象、缺资源 debug 去重、关闭停止与静音、总／分类增益、十次消除合并、全局／分类上限和 pending 计数、结束／错误／拒绝／超时释放、正式配置路径限制、真实双方四图事件合并、实际表现层特殊块调用、真实按钮／指针交换消除／下落、倒计时与开赛。浏览器没有音频资源请求、Audio／AudioContext 创建、页面错误或 404；实际禁用音效后仍正常完成交换消除，切换不改变棋盘／分数／锁／事务。固定种子的连击与爆破组合在未接入／启用／关闭音频时，完整棋盘、分数、连击、锁、事务与事件序列相同。

本轮开始前后 `engine.mjs`、`bot.mjs`、`arena.mjs`、`environment.mjs`、`index.html`、`style.css` 的 SHA256 全部一致，未改规则、计分、AI、地图调度、HTML／CSS／UI布局；音频接线不增加游戏计时器或等待，也不改变动画时序和流程分支。模块语法与空白检查通过。未执行全量回归，未重复未改功能验证，未发布线上更新。

后续计划：先审核符合设计方向的正式素材与版权 → 放入对应目录 → 在 manifest 填写批准路径与音量／合并窗口 → 用正式文件专项验证目标浏览器格式、用户手势／拒绝播放、缺文件处理与混音。当前错误生命周期与并发测试仅使用无声音数据、无文件读取的模拟媒体对象，尚未验证正式素材听感。预加载、缓存、持久化设置和音量面板按后续需求扩展，仍统一经过管理器。以下为上一轮及历史记录。

# 2026-10-11 · 随机揭晓悬崖预览同步（上一轮）

修复随机地图小预览仍使用旧悬崖平台副本的问题，移除棋盘旁多余的山壁根部，保留背景山壁与平台原有轮廓、厚度及藤蔓。预览改为使用共享生成函数；生成或细化悬崖平台时同步更新，避免再次遗漏。

24项相关测试通过，随机轮播和最终锁定两阶段均在实际浏览器验证并目视检查，无页面错误或404。两张截图及报告保存于 validation/2026-10-11/cliff-preview。以下为上一轮及历史记录。

# 2026-10-11 · 对战界面与事件细节修正（当前）

地图名锚定分数牌上方，桌面保留约29px间隔并常驻；窄屏放到顶部，避免碰到工具栏。遗迹中央大齿轮转速由0.22rad/s提高到1.2rad/s，演出阶段共享起始时刻，预警、转盘和完成阶段连续转动。

悬崖删除平台SVG内超出视窗的左右山壁根部，山壁继续由原背景表现；平台保留轮廓／厚度／藤蔓，晃动时没有竖直硬裁切山壁。生成器同步修改，重建不会恢复旧山壁。冰川四周去掉枝状硬线，改成蓝白渐变及柔软径向雾团，方块冰壳和消除破冰保持。

熔炉在第3／6秒从所有已有火格向上下左右同时扩散一圈，每个有效目标仍提前650ms红框预热。重叠目标去重、边缘不跨行，避开空洞／特殊块／忙碌格并保留合法操作；整轮第9秒结束，恢复原方块。双方同一时刻蔓延，边缘位置不同可能产生不同目标数量。整波同列目标全部提交后才释放列锁。

223项回归、14项浏览器验收通过，无页面错误／404。验证名字持续可见且不覆盖分数牌、窄屏不覆盖工具栏、平台SVG外侧透明、四方向同步蔓延、原9秒截止与退出恢复。保存52张关键帧、4张分镜和前后对照到 validation/2026-10-11/map-feedback/index.html。以下为上一轮及历史记录。

# 2026-10-11 · 原素材细化与事件加强（当前）

用户明确要求细化现有画风，停止新增绘画背景方向；生成图片未接入项目。新增 refine-native-art.mjs，直接处理14个现有SVG素材，保持原路径布局／遮罩及配色，补接缝、材质切面、磨损、反光；可重复运行且字节一致。

fire沿现有统一框架新增局部蔓延预警／提交截止时间：初始3格，第3／6秒分别向安全相邻格扩展1格。双方共享时机与数量，一方无安全目标则共同跳过。预警只保留目标列至点火，提交后释放；清理时取消预警并归还所有火格原块。整轮9秒，共享原截止时间。蔓延事件不重置世界演出，末批火舌逐渐长出。

画面：熔炉整体曝光／暖光按事件进度升高，初始和蔓延格均先红框亮起。遗迹在背景中央增加与神殿同材质的大齿轮。冰川增加独立鼠标穿透的四周霜层画布，冰壳改为不规则切面、枝晶、气泡及高光；破冰与持久冻结规则保留。

222项回归与7组真实浏览器检查通过；51张关键帧、4张分镜和1张对照保存到 map-refinement，本地修改。以下为上一轮及历史记录。

# 2026-10-11 · 四图环境语言重设计（当前）

废弃四图统一震动／生成障碍流程。MapEventPresentation按类型选择Environment → 可选Camera → Board → Gameplay；mapMotion只响应rockfall，统一调度接口保留。

冻结成为跨轮次持久状态，事件结束只结束天气；拒绝timeout解冻。删除事件外围冰线，补雪雾、环境降温、分批生长冰晶、先裂纹后飞散冰片和恢复雾光。

补永久冰死局处理：重排算法支持不可移动的冻结锚点，只改未冻结库存；有界随机／构造兜底保留冻结原位与颜色，不借重排解冻或增加得分。

新增fire适配器：9秒燃烧占位，实时绘制摆动火舌、内焰、火星和热浪。熔炉／裂缝先升温，不再冷却成岩块。

新增mechanism适配器及安全旋转入口：共同选择含现有石板的2×2区域，锁两列，演出旋转真实负载；提交时同步旋转不可变地形视图和原块身份，再接原匹配／重力／计分事务。结构保留，不生成柱、不增加恢复锁。

悬崖补远景山壁裂缝／错位岩层、带轨迹碎石，保留巨石跨场景坠落和冲击。修复多格事件在第一格提前释放列锁后让同列后续格失败的问题，改为整组提交后释放。

219项回归与5组桌面验收通过，44张PNG／4张分镜保存于map-language目录。四图已经目视检查，本轮仅保存本地。以下为旧版本记录。

# 2026-10-11 · 地图表现 2.0（历史记录）

单框五图减速揭示改为2+2秒，之后保持原3秒倒计时。新增手工SVG地下熔炉、52格黑曜石机关平台、金属支架、缝隙岩浆、岩块与预览；只扩展既有封存适配器，不修改核心引擎。

MapEventPresentation以原warning/fall/blocked/restored事件观察五阶段：Environment、Camera、BoardReaction、Gameplay、Recovery。warning内部42%/25%/33%切分预兆与反应，fall保持到达动画，blocked沿原5秒生效，恢复沿原事件；没有增加游戏锁、额外计时器或规则等待。取消/重开/退出清理观察状态。世界画布与原Canvas共享同一落石画笔，使巨石跨过场景顶端后进入棋盘；只动背景/平台装饰与Canvas绘制坐标，UI与命中框不移动。

增加峡谷云雾/落碎石、冰湖横风/寒雾/边缘冰霜、神殿符文/齿轮/滑动石板、熔炉火盒/热浪/火星/底部喷发。冰裂纹随时间扩散，冰片与霜雾衰减。遗迹先开石板再升柱；新合成机关声遵循原音效开关。森林保持无环境事件，降低对战背景饱和度并补叶片。

已修正目视发现的符文遮挡、熔岩喷发起点；保存55张完整关键帧和5张分镜，新增离线关键帧查看页。54项专项通过、7组桌面检查无错误；本轮未作全量回归，核心引擎/人机/竞技文件哈希一致。结果保存本地。


# 开发日志

## 2026-10-11 · 增强地图事件存在感（当前版本）

根据试玩反馈，提高首发速度、触发频率和影响数量。悬崖开赛6秒首发、每10–13秒一轮，按20%单格/40%双格/40%四格权重抽取落石；双格含横向与纵向，四格为2×2。冰原开赛5秒首发、每9–12秒冻4格；遗迹开赛7秒首发、每11–14秒升2柱。仍保留1.5秒预警与5秒生效时间，落石飞入650ms、冰晶生长700ms、柱体升起500ms。事件每轮必尝试，安全条件不足才共同延后或跳过，没有暗中按区域价值调整触发概率。

地图配置新增加权 footprints；每轮只抽一次尺寸，双方同一尺寸/数量，在不同安全位置放置；安全等待期间不重抽尺寸。框架整体枚举连体岩块合法位置，覆盖区域不能跨行、跨空洞、碰永久障碍或特殊块，整组必须处于安全列并保留可交换得分的操作。1/2/4格均逐格封存真实原块、改变真实地形及重力；整组到期一起恢复。不是放大装饰图遮住额外格子。多格元数据贯穿预警、飞入、封存与恢复事件，表现层只绘制一个完整岩块。

悬崖预警升级为整片黄色危险区、较粗边界、裂纹、石屑、中央危险图标及“落石·N格”标记；岩石采用连续轮廓、顶部亮面、厚侧面、裂纹与颗粒，飞入有速度线，撞击有扩大碎石与椭圆冲击波，震动随尺寸增强但保持轻微。冰块增加透明青色下沿/侧面、折射切面、厚倒角、高光与冰晶尖角，内部五色及特殊属性保留；破冰演出延长为650ms，先出现放射裂纹与短闪，再分裂为10片有切面与厚度的冰片，旋转向外抛出后下落，配小范围霜屑。没有大面积滤镜、黑块或写实材质。双方继续共用画师；截图检查时发现对手棋盘震动未恢复绘制变换，补齐 restore 并增加双棋盘变换归零验证，消除位移积累和上沿残影。

仅运行本轮相关42项：原地图/生命周期32项显式使用固定测试配置（避免把历史平衡数值当默认值），新增10项实际配置专项，验证首发/间隔/数量、四种连体形状、禁止跨空洞、逐格原身份、共同恢复、等待时不重抽、完整退出与困难人机计分。全部通过。实际桌面 Edge 1440×1000 取样2格/4格岩石、4格冰层与破冰、2柱的预警/执行/生效/恢复，共18张关键帧，页面错误为空；重开/退出清理与双棋盘变换归零通过。2格/4格尺寸及破冰取样采用仅验证响应的控制钩子，生产仍按地图权重抽取；邻消规则继续由事务测试覆盖。证据 validation/2026-10-11/map-event-presence/，复现 node scripts/validate-map-events.mjs。语法及空白检查通过，无全量回归，无线上发布；本地 http://localhost:5173/ 刷新可试玩。


## 2026-10-11 · 地图环境事件系统

新增统一 MapEventFramework，提供 trigger / warning / execute / duration / recover 生命周期。地图配置启用状态、首次触发、间隔、数量、预警、演出时间、持续时间和主题美术；rockfall / freeze / pillar 注册适配器负责规则，地图不内嵌事件逻辑。现默认三个事件均在开赛20秒后首发，共享20–30秒间隔、每方1格、预警1.5秒、执行动画300ms、持续5秒，森林保持无事件。

悬崖：黄色危险标记、地面裂纹、石屑与轻微双棋盘震动；岩石从上方落入，撞击碎石与冲击圈；原块完整封存，不能交换/匹配/被特殊技能消除，恢复时碎裂并归还原身份。冰原：局部冰雾、冰晶生长、透明切面冰层与边缘闪光；不改颜色和特殊属性，冻结格不可交换、重力保持原格，邻接（上下左右）的一次已提交有效消除解除一级冰，直接消除/特殊技能命中也会破冰；无效交换和失败事务不解冻，超时自然恢复。遗迹：地面符文预警、裂纹石柱从下方升起，不可交换/消除，分隔重力通道，到期下降。三种效果共用双方表现层，不使用大面积滤镜、黑色方块或换色代替规则。

双方共用比赛时钟与恢复屏障，数量/最大持续时间/强度一致，安全格均匀抽取，允许位置不同。排除所有特殊块、空洞、永久障碍、交换/消除/补充中的列、等待连锁的列；多格组合保留可操作交换，预警结束再校验事务边界与可玩性。不按得分或高价值区域选择。任一方不安全则共同等待，最多5秒后共同取消/跳过；超时恢复若遇已有事务，双方共同等待列安全边界，可能等量延长5秒时限，避免中断事务。冰层可由本方有效消除提前解除，这是局部操作奖励。事件不另建计时器。结束清理后再出结果；重开/退出取消演出、释放预留并清理封存及冰层。

仅运行本轮32项地图/事件专项：tests/maps.test.mjs（16项）和 tests/map-events.test.mjs（16项），覆盖三个生命周期与公平性、配置多格、预警特殊块/死局变化、双方安全恢复、冰层身份/特殊属性/有效邻消与重力锚定、柱体重力隔断、特殊范围/连锁计分、真实困难人机，以及三阶段结束/重开/退出。全部通过。实际桌面 Edge 1440×1000 验证三图主题关键帧、自然恢复与真实重开/退出清理，页面错误为空；透明冰层、黄色落石预警和升起柱体截图已人工查看。冰层提前解除动画用仅测试响应的解冻钩子取样，邻消规则由事务专项验证；不把动画取样当作真实玩家操作验收。模块语法与空白检查通过。证据：validation/2026-10-11/map-events/；复现：node scripts/validate-map-events.mjs。没有全量回归或线上发布。


## 2026-10-11 · 三地图设施与开战地图揭示

按上一轮确认的低饱和简洁卡通方向增量制作，不采用精细写实或明亮抢眼背景。悬崖增加远山与横向云雾，天空由蓝色改为灰青，断面厚度33–73px，少量碎石只分布在断口和岩层下沿。冰原新建雪山、积雪、冰湖与两处小冰晶，40格保留，外沿为半透明冰层与切面，浅槽为灰蓝冰面，雪岸以弧线接入冰湖。遗迹新建米色神殿、远处门洞、立柱与连续台阶，54格＋10障碍保留；棋盘外部是带厚底和两侧柱廊的祭坛，障碍重绘为升起的封印柱，青苔只放在局部接缝。三种场景均各自构图和结构，森林原美术不变；原积木/特殊块/特效/交换时序与落石规则不变。

对战和再来一局进入单个地图揭示框：进入时一次抽定随机结果，约160ms一张依次轮播森林/悬崖/冰原/遗迹，持续3秒；锁定同一结果，显示地图名、图标和实际特性2秒，然后自动进入原3秒开战倒计时。MapReveal沿已有帧时钟推进，无新增原生计时器；取消按钮及Esc返回难度页，取消后的对象不会延迟进入比赛，重开重新抽签。减少动态效果时不快速翻图，保留3＋2秒节奏。竞技实例只在揭示结束后创建，并绑定已选地图，不二次抽签；准备期间没有人机/环境事件/玩家输入。

开战顶部中央显示图标＋名称，实际开赛3秒后淡出，3.5秒隐藏；旧比分牌地图文案隐藏但保留原尺寸占位，中央比分和目标分数以及全部UI矩形保持。冰原和遗迹文案介绍天然冰台/封印柱实际规则，不宣称未实现的冻结或动态机关。竞技仍仅现有人机入口，无联网模式。

素材与性能：三个设施及冰原/遗迹背景、预告小图均为离线可编辑SVG，轮廓从永久地形产生，有效格用遮罩保护。浏览器缓存静态背景/设施，底板保留原DPR栅格缓存，无每帧材质/裂纹绘制、动态滤镜、随机装饰和在线图源。通用素材构建改为共享障碍＋两个设施生成器，避免旧模板覆盖新美术。新预告框采用缓存背景和静态平台缩图，轮播只切换资源。

专项检查4项通过：随机结果只抽一次与3＋2秒边界、取消/重开/减少动态效果、地图资源与固定轮廓、共用精确裁剪。1440×1000桌面真实流程检查四图单框轮播/锁定/进入一致、取消与Esc清理、开战3秒后淡出、玩家点击交换/真实人机计分、48/40/54格及10柱、双方480×480、全部受检UI矩形一致、空洞透明且无横向溢出；悬崖落石从开赛20秒起正常显示与恢复。页面错误为空。冰台雪岸边界收尾后只单独重采冰原。完整对战、局部1.5倍放大、各图揭示/开场与报告位于`validation/2026-10-11/map-facilities/`，最新专项入口`node scripts/validate-map-facilities.mjs`。旧地图验证脚本记录对应旧的手动准备流程，当前复现以上述新入口为准。语法/空白检查通过，未做全量回归、手机验证或线上发布。

## 2026-10-11 · 悬崖石台结构重构（当前采用版本）

仅重构悬崖美术。阅读现有地图配置、背景固定层、共用底板绘制、双侧表现层及美术规范后，保留原8×8的48格断崖轮廓、双方480×480和UI位置。悬崖不再使用完整矩形九切片石框：从永久地形提取连续边界，裸露朝下边缘形成29–68px的错层断面，右侧薄悬挑、下部厚石舌与边缘缺口共同构成石台。左右石台分别通过外侧承重岩层接入两侧崖壁；断面层理、下沿阴影和连接处遮挡建立空间关系。只在两处断口挂藤蔓，三条裂缝对应薄台断裂、根部剪切与下方石舌，不再每段复制同一裂纹。装饰以有效格遮罩剔除，位于Canvas后方，鼠标穿透。

最终采用用户认可的低饱和矢量峡谷，包含天空、远山、深谷、侧崖、薄雾与低细节远景瀑布；瀑布调整到比分牌两侧的留白。背景、连接岩体及石台沿用同一灰砂岩/青灰色层次。曾生成更精细的卡通峡谷候选，因亮度、细节与棋盘风格不一致未采用；当前地图绑定为`cliff-canyon.svg`。浅槽为克制的中性灰绿石面，取消原每格重复裂纹，五色积木、特殊标识及消除表现保持。

性能：背景和两侧岩体为离线静态SVG，新增场景/石台/浅槽共38,053 B；底板继续使用原DPR栅格缓存，岩体由浏览器解码缓存，不添加逐帧裂纹、藤蔓或场景绘制、动画和滤镜。岩体素材按实际可见外延收窄，消除过大的装饰盒造成的横向溢出。`build-cliff-art.mjs`只生成悬崖底板及左右石台；通用素材构建跳过悬崖模板并调用该生成器。其他三张地图配置及美术未修改，事件逻辑、输入坐标、方块、计分和时序未修改。

必要专项4项通过：地图资源/48格绑定、底板栅格缓存、精确非空洞裁剪、原落石时序。桌面专项流程运行真实人机页面，检查真实玩家交换/人机得分、双方480×480及全部受检UI矩形相同、16个Canvas空洞透明、无横向滚动、落石预警/坠落/阻碍/原块恢复，以及退出移除悬崖样式；页面错误为空。收尾修正后更新验收截图，未做全量回归或手机检查。证据在`validation/2026-10-11/cliff-art/`：完整对战`cliff-duel.png`、实际页面裁切1.5倍放大`cliff-board-detail.png`、三个落石阶段与`report.json`。复现入口`node scripts/validate-maps.mjs --cliff-art`。没有发布线上。

## 2026-10-11 · 交换后底色变化修复

移除玩家底板随忙碌列锁叠加的暗色，以及素材降级绘制中的忙碌底色。共享底板仅由地图材质与永久地形决定，交换、消除和补充不会改变底色；操作锁、原方块／特殊效果和计分保持。四地图桌面实际交换专项对比绘制方块前的完整底板像素：交换前、交换中、消除中和结算后完全一致，实际交换正常得分、无页面错误；已查看消除画面。报告与截图在 `validation/2026-10-11/board-color/`，复现 `node scripts/validate-board-color.mjs`；4项必要轮廓绘制／补充／组合表现关联检查及语法／空白检查通过，未全量回归或更新线上。

## 2026-10-11 · 四张地图绑定与悬崖落石

统一 `maps.mjs` 配置名称、说明、背景、地形、底板、边框、障碍及事件参数；开局／再来一局随机地图，双方同步主题。森林64格沿用原美术；悬崖48格采用断裂岩石；冰晶40格采用雪原冰洞、蓝冰面及晶体边缘；遗迹54格＋10根雕刻石柱采用旧砖与苔藓藤蔓。三张新背景由内置 imagegen 制作，离线WebP、源图及完整提示词已保存；共享渲染器精确裁剪轮廓，保留积木、特效及固定480×480竞技容器。退出恢复森林。

落石由比赛统一时钟调度：倒计时结束后首次20秒，之后共享随机20–30秒间隔；双方各一个安全普通格，预警1.5秒、坠落0.3秒、阻碍5秒、破碎恢复。候选排除特殊块、忙碌列及封堵后无合法操作的位置，不读取高分组合；一方无安全位置时共同等待，超过配置5秒上限共同跳过。原方块对象完整封存，永久地形独立，临时障碍按原匹配／区段重力／特殊范围处理且不计分。死局先等待恢复，恢复匹配沿原事务正常计分。满5秒时若目标列仍结算，双方一起等安全边界恢复，阻碍可能等量延长；恢复列暂拒绝新操作。达标取消未落地事件，安全清理已生效障碍后展示结果；重开／退出清空旧时钟、来源及画面状态，无额外原生计时器。

最小验证：30项不同的地图／环境／素材及必要竞技、列并发、补充／组合表现关联检查通过，无全量回归。一轮1440×1000桌面真实流程检查四主题、真实人机操作、全UI固定位置与双方480×480、轮廓透明像素、落石完整时序及退出中断清理，浏览器错误为空；已查看冰原、悬崖及遗迹画面。报告截图在 `validation/2026-10-11/maps/`，复现 `node scripts/validate-maps.mjs`，辅助时钟／抽签仅注入本地验证响应。语法与空白检查通过。遗留风险：事务忙碌时共享恢复延迟如上；移动端及低性能设备未实测。未发布线上，未实现冻结、遗迹机关、道具、能量或联网。

## 2026-10-10 · 背景稳定与四种8×8测试轮廓

修复主页切换选项时背景位移：背景从主体元素迁移到独立固定视口层，页面内容高度变化不再重新定位背景，稳定预留滚动条空间；对战原有磨砂层保持。桌面专项中主页高度约920px、其他页面900px，五个非对战页面的同一背景区域截图像素完全一致。

四种测试配置统一8×8：完整标准盘64格；悬崖断层48格，以左右错落缺口形成断崖；冰晶盘40格，逐行2/4/6/8/8/6/4/2格对称收缩；遗迹盘54格＋10个内部石柱，完整外轮廓保留多条通道。旧7×9阶梯、中心空洞和9×8石柱预设移除，通用可变尺寸引擎保留。双侧共用渲染按非空洞格裁剪现有底板材质，孔隙透明、边缘补浅石质轮廓，障碍仍为灰色石块；外接石框、积木、特效、输入坐标和竞技布局保留。引擎／计分／重力／事务与动画时长未改，无地图事件或新场景素材。

最小验证：7项配置／轮廓材质／真实人机专项＋1项通用尺寸输入关联检查通过。一次1440×900桌面会话检查四种沙盒实际点击交换、空洞拒绝输入及透明像素；在同一竞技布局切换四种双方结构，工具栏、双方标题、中央比分、棋盘容器与其他受检UI位置完全相同，左右棋盘均480×480，人机在遗迹盘真实得分。已查看冰晶轮廓与双侧遗迹画面；浏览器错误为空。报告与截图在 `validation/2026-10-10/terrain-shapes/`，可运行 `node scripts/validate-terrain.mjs` 复现。模块语法／空白检查通过；未全量回归、重复验收未改功能、测试手机或发布线上。


## 2026-10-10 · 可变棋盘底层系统

阅读现有 README、DEVLOG、ACCEPTANCE 与实际引擎／竞技／人机／双侧渲染后增量修改，沿用当前 280ms 普通消除、420ms 组合消除及 100ms 交换、250ms 下落。地形与方块独立，增加矩形尺寸、异形轮廓、永久空洞和固定障碍；同列空洞穿越、障碍分段垂直补充，特殊范围仅计实际方块。原引擎、四五消／T/L 奖励、计分和列事务没有复制或另建规则。

双方绘制与输入改用真实行列；障碍区段的新块从段入口出现，动画裁剪避免从障碍上方或其他区段露出。人机搜索／首波评估接受地形，竞技配置统一给双方相同结构。沙盒新增标准8×8、阶梯7×9、中心空洞、石柱9×8 四个测试入口；退出、教学或正常对战恢复标准结构。未来地图适配器可用不可变配置与空闲配置边界，当前没有动态环境事件。

死局只在事务稳定后处理，优先保留颜色／ID／特殊属性的有界重排并构造合法操作；无解库存（例如4格全不同色）或搜索上限触发时重新配色兜底，保留ID、特殊属性、地形及得分，通过事件标记区分。结构本身无普通消除交换潜力的地图在加载时拒绝。

最小验证：新增18项地形测试、2项实际表现层测试通过；必要关联的48项引擎、34项组合、11项竞技、12项原补充／输入／时序及1项教学配置测试通过，共126项不同测试（非全量）。修正后仅重复受影响检查。桌面专项脚本 `node scripts/validate-terrain.mjs` 验证四种入口真实点击交换、异形命中坐标、障碍分段下落、7×9对手渲染和标准入口恢复，浏览器错误为空。截图与报告位于 `validation/2026-10-10/terrain/`。模块语法和空白检查通过。

遗留边界：本轮仅验收四种测试结构与桌面机制；极大／极碎片地形的搜索延迟、低端设备双棋盘性能未测。重新配色是无解库存／搜索上限的明确兜底，不承诺任意库存都能纯排列解锁。正式地图、落石、冻结、熔岩、道具、能量、联网及线上发布未实施。


## 2026-10-10 · 最新开发状态汇总

本节描述当前最终实现；后续各节按迭代保留历史记录，目标分数、缩略棋盘、进度条和额外阵营边框等旧设计以本节为准。

### 当前玩法与节奏

- 本地 1v1 人机竞技已实现：简单目标 3000 分、普通 6000 分、困难 10000 分，双方同目标、无比赛时限。人机通过真实合法交换驱动同一引擎，只读取当前可见棋盘，不伪造分数或动画。
- 普通消除展示 280ms，组合技展示 420ms；交换 100ms、无效弹回 90ms、下落 250ms。动画截止时间与事务同步，空闲列继续允许操作。
- 首次达标锁定胜者，停止接受新操作；已提交事务及后续连击结算后展示最终分数。支持再来一局和返回主页，退出／重开清理旧人机任务、事务及视觉状态。
- 六关教学、通关进度保存及全部 16 个手感沙盒场景保留。

### 当前界面

- 双方棋盘左右 1:1 等大排列，工具栏在顶部。1440×960 桌面验证中，两块棋盘均为 480×480。
- 中央比分上下排列：我方绿色数字、对方红色数字，中间 VS；不显示进度条，目标分数单独以文字显示。
- 仅保留棋盘上方绿色“我方”和红色“对方”标签与标题牌；外围新增彩色边框和柔光已移除，原有森林石框保持。
- 背景 2px 轻微虚化与约 25% 浅色磨砂层仅在对战时启用。主界面、难度选择、教学、沙盒保持原始清晰背景，退出对战立即移除蒙层。
- 可见“连锁”文案统一改为“连击”。加分数字为白色、带深色描边，单次得分越高字号越大，并设上限避免过度遮挡。
- 双方同步显示 3／2／1 倒计时，每个数字从大到小收缩；减少动态效果模式保留静态数字。开赛前禁止操作。

### 已完成的最小验证

节奏调整阶段的 39 项必要自动检查通过；随后比分与加分表现调整的 4 项专项／关联检查通过。这些属于不同阶段的最小验证记录，不代表最新版本重新执行了全量回归。

桌面实际操作确认中央比分、双方同步缩小倒计时、真实指针与人机计分、重开／退出清理，浏览器错误为空。最新身份检查再次确认蒙层仅对战显示、退出恢复清晰背景、双方标签保留且没有额外彩色边框、棋盘保持等大，浏览器错误为空。

验证入口：`node scripts/validate-arena.mjs --presentation`、`node scripts/validate-arena-identity.mjs`。最新界面及报告分别位于 `validation/2026-10-10/arena-presentation/` 和 `validation/2026-10-10/arena-identity/`。本次仅整理日志，未修改游戏代码或重复运行验收。

### 待确认与后续边界

难度强弱、比赛长度及延长后的动效手感继续通过试玩调优；低端设备双棋盘性能与实体手机尚待实机确认。当前只实现本地对战，远程操作来源可沿统一命令接口扩展；服务端权威结算仍须独立开发。未实现 WebSocket、好友房间、快速匹配、地图、道具或能量系统，未发布线上更新。

## 2026-10-10 · 移除额外阵营边框

按反馈去掉双方棋盘外围新增的绿／红边框及柔光，仅保留上方阵营标签。原有石框素材不变。桌面专项检查确认无额外边框、双方标签保留，未重复规则测试。

## 2026-10-10 · 对战蒙层限定与双方身份区分

背景轻微虚化／磨砂只在对战界面启用，主页、难度选择、教学和沙盒恢复原始清晰背景，退出对战立即移除。双方棋盘添加“我方／对方”徽标、绿色／红色标题牌和同色细边框，与中央比分一致；保持双方 480×480 和原有操作区域。

最小桌面检查 node scripts/validate-arena-identity.mjs 通过：蒙层显示范围、退出清理、两侧徽标与边框颜色、等大棋盘，以及教学／沙盒背景清晰；浏览器无错误。画面与报告在 validation/2026-10-10/arena-identity/。未重复规则、完整比赛或资产验收，未发布线上更新。

## 2026-10-10 · 中央比分、背景降噪与双侧倒计时

对战比分移到棋盘中间，上方玩家绿色数字、下方对手红色数字，中间 VS，去掉进度条；双方棋盘保持等大并扩大留白。棋盘上方改为简短身份与难度标题。背景单独加 2px 轻微模糊及 25% 浅色磨砂层，不影响棋盘、按钮和指针。全部可见“连锁”文案改为“连击”，规则和倍率保持。

玩家和对手复用白色加分文字绘制，深色细描边，单次得分越高字号越大（设置上限避免遮挡棋盘）。两侧使用同一比赛时钟同步显示 3／2／1，每秒从大到小收缩；减少动态效果模式不缩放。准备／倒计时输入门禁、难度目标和现有时序不变。

最小验证：新增白色分数字号增长测试及 3 项必要表现／输入／清理关联检查，共 4 项通过。node scripts/validate-arena.mjs --presentation 的一次 1440×960 桌面检查确认中央比分位置和绿红色、无进度条、双方 480×480、间隔超过 200px、同步倒计时收缩及减少动态效果、真实指针和人机计分、重开退出清理，浏览器错误为空。实际画面：validation/2026-10-10/arena-presentation/。未全量回归或重复教学、美术资产验收，未发布线上更新。

## 2026-10-10 · 消除节奏与对战布局调整

按实玩反馈将普通消除展示从 160ms 延长到 280ms，组合技延长到 420ms；交换 100ms、下落 250ms 保持。动画与事务共用同一截止时间，范围特效在下落开始前清理，无关列继续操作。三档双方目标分别为简单 3000、普通 6000、困难 10000 分，入口、提示、进度条和结算读取对应目标。

对战改为左右 1:1 棋盘，工具栏移到顶部，双方复用同尺寸木牌和石框。1440×960 桌面实测双方均 480×480、横向同高，无页面横向溢出，实际指针和真实人机正常；组合技在交换后 300ms 仍可见、520ms 开始下落，重开／退出清理正常，浏览器无错误。证据：validation/2026-10-10/arena-tuning/。复现：node scripts/validate-arena.mjs --tuning。

最小检查：竞技 11 项、规则时序与列并发 5 项、表现时序／清理 12 项、组合计分／重力／冲突 7 项、教学结算关联 4 项，共 39 项通过；更新旧验收中的固定时刻以读取配置，没有全量回归或重复美术验收。手感仍需玩家试玩确认，本轮未发布线上更新。

## 2026-10-10 · 人机对战目标调整

根据实玩反馈，将双方竞技目标从 3000 分提高到 10000 分，同步主界面、竞技提示与进度条。倒计时、人机操作间隔及计分规则保持原样；更新默认目标专项断言及桌面验证脚本。仅运行准备／倒计时／默认目标专项测试，结果通过。未重复进行整局、美术或教学验收，未发布线上更新。

## 2026-10-10 · 本地 1v1 人机竞技

新增主界面「人机对战」、三档难度、双方准备与 3 秒倒计时。双方从相同 8×8 棋盘开始独立演变，先到 3000 分获胜，无比赛时限；显示双方分数、目标进度与真实对手缩略盘，支持完整胜负结算、再来一局和返回主页。保留六关教学、16 个沙盒场景、核心规则和 sunny-jungle 素材。

arena.mjs 管理状态及统一 swap 命令；bot.mjs 是独立可替换来源，只评估当前可见棋盘，不读随机补充、不直接加分。简单空闲后等待 2.5–4 秒随机交换，普通 1.5–2.5 秒偏好四五消及特殊块，困难 0.8–1.5 秒评估首波得分和组合。opponent-view.mjs 消费真实引擎事件；board-painter.mjs 抽出原有积木、光束和爆破绘制，缩略盘减少装饰粒子。未修改核心引擎规则。

按事务截止时间处理达标，首次达标锁定胜者并停止新操作；双方已提交事务及后续连锁继续结算，最终比分可以超过目标。完全同截止时间固定玩家事件先处理。退出／重开停止来源、清空旧事务与视觉、恢复事件监听。未来远程操作来源可接入统一命令，但当前本地判定不等于安全联网判定，服务端权威结算仍需独立开发。

验证：11 项新增竞技、12 项必要表现层关联及 15 项教学关联测试，共 38 项通过，无全量回归。一次 1440×960 桌面实际指针验证三档真实对手、准备／倒计时门禁、默认 3000 分下玩家胜／人机胜、再来一局、对手消除中重开、退出后时钟推进无残留，以及教学／沙盒入口保留。玩家棋盘 480×480、对手约 220×220，浏览器错误为空。证据在 validation/2026-10-10/arena/，复现命令 node scripts/validate-arena.mjs。遗留：难度强弱需实玩调优、低端设备双棋盘性能待实机确认；真实网络、地图、道具和能量未实现。本轮未发布线上更新。

## 2026-10-10 · 新手教学与游戏主流程

本节为当前结果，后文保留历史阶段记录。冻结 sunny-jungle 资源、方块材质、棋盘与特效；新增游戏主界面、六关顺序选关、侧边教学目标和通关 / 重试 / 返回流程。单人挑战、竞技匹配均未开放；所有 16 个沙盒练习入口保留。

新增 levels.mjs 配置 / 目标层与 flow.mjs 主流程。引擎只增加预设关卡加载与真实成功操作事件，以及交换 / 弹回的事务标识；匹配、奖励、范围、计分、列锁及 100 / 160 / 250ms 原时序保持原实现。一次成功玩家事务扣一步，无效或冲突弹回不扣，连锁不重复扣；待判定交换预留剩余步数，结算等全部并发与连锁稳定。

前两关提供非强制亮框 / 箭头，后三个机制关和综合关只按需提示。前五关不限步数，第六关 8 步 300 分。自己的生成方块按 ID 跟踪触发，主动引爆不把波及方块重复计作玩家操作。各关存在真实引擎可完成路径。

通关数量以版本化 localStorage 保存，顺序解锁、允许重玩、刷新恢复；完成六关获得竞技资格但无匹配行为。损坏数据不产生虚假解锁，存储失败显示本次会话保存限制。重试及离开取消旧事务和视觉状态，沙盒重入恢复自由盘。

验证：新增 15 项教学专项测试、11 项必要关联测试全部通过；一次 1440×960 桌面浏览器实际指针流程完成六关，确认通关返回、重玩、下一关、刷新保存、竞技资格及 16 个沙盒入口保留，浏览器错误为空。只保存主界面 / 教学界面两张截图，未重复验收资产、特效、手机、多分辨率或全量场景。证据：validation/2026-10-10/tutorial/。未发布线上更新。

## 2026-10-10 · 恢复浮雕，保留当前材质

按用户最新要求，仅恢复五种同色浮雕：菱形、星形、圆环、方形与三角形。当前饱满正面、径向渐变、亮面反光、加厚侧面、倒角和底部接触阴影全部保留；特殊方块的渐变光线、发光五角星和边缘光也保持不变。图集使用原浮雕轮廓、同色渐变与下沿投影，Canvas 资源失败时同步恢复符号。未调整任何生成／触发／组合特效、规则或 UI。

最小验证：图集裁切／缓存、减少动态效果下的降级绘制两项检查通过；只检查一次桌面静态画面，浏览器错误为空。模块语法与空白检查通过。实际截图在 `validation/2026-10-10/embossed-toy-material/`，可用 `node scripts/validate-special-visuals.mjs --embossed` 复现。没有手机验证、全量回归或线上发布。

## 2026-10-10 · 纯色积木与立体材质

按用户确认，去掉所有普通浮雕图案，保留特殊方块的渐变光线、五角星与边缘光。普通块和特殊块共用的底材全部更新：不再绘制菱形、星形、圆环、方形和三角形浮雕，正面改为完整纯色曲面；用同色径向渐变塑造饱满体积，左上方集中反光，右侧暗面和加厚的底沿表现积木厚度，边缘柔和倒角及底部接触阴影强化立体感。没有增加花纹、铆钉或内部边框。

资源加载失败时的 Canvas 降级绘制同步去掉普通符号，保留纯色渐变、厚侧面与高光。生成、待机特殊标识、触发和组合特效不变，规则／计分／重力／并发、场景、棋盘和 UI 未改。仍只单独重建图集并复用 20 种栅格缓存，无新增运行时材质滤镜。

最小验证仅覆盖改动：图集裁切／缓存和减少动态效果下的降级绘制两项既有测试均通过；桌面浏览器检查一次静态棋盘，错误为空。未重复测试触发效果或手机。实际棋盘和五色材质放大图保存在 `validation/2026-10-10/solid-toy-material/`，可用 `node scripts/validate-special-visuals.mjs --tile-material` 复现。模块语法与空白检查通过，未发布线上版本。

## 2026-10-10 · 特殊外观回归参考图的发光风格

根据用户对上一版外观的反馈，移除清行／清列图标的机械插槽和实体导轨边框，改为具有亮芯、半透明中层与渐隐外围的横／纵光带；横向为粉紫光，纵向为青蓝光。爆破移除环形晶核，改为带渐变、浅浮雕切面和暖色柔光的五角星。三种特殊积木均增加完整边缘高亮：粉紫、青蓝、暖粉金外圈叠加细白亮边，保持原有积木底色和材质。待机流光、细粒子与呼吸同步匹配新图标；资源加载失败时也使用光线／五角星和边缘高亮作为降级外观。

本轮只改特殊外观图集和 `drawIdleCore`，已认可的生成／触发／组合特效与规则保持原样。光带渐变与柔光外圈直接预绘在 SVG 图集中并复用栅格缓存，无运行时模糊滤镜。减少动态效果仍显示完整静态光线、五角星及边缘身份。

最小验证：只运行图集裁切／缓存测试及减少动态效果下的降级绘制检查；桌面浏览器只截图特殊方块静态画面，错误为空。验证脚本新增 `--static-only`，跳过全部触发、组合和后续结算检查，避免重测已确认的特效。静态证据先关闭练习提示框，防止提示框被误认为方块自身边缘光。实际画面及细节位于 `validation/2026-10-10/special-light-restyle/`。本轮没有手机验证或全量回归，也没有发布线上更新。

## 2026-10-10 · 特殊方块视觉与特效升级

本轮仅升级特殊方块图集和 Canvas 表现层。普通积木的共享底色、曲面、材质与浮雕定义保留，场景、棋盘、HTML 和 CSS 未改。清行／清列采用带厚度的嵌入式能量导轨，白色亮芯与青色内层明确标示方向；待机有慢速流光、边缘细粒子和微弱电弧。爆破移除原金星，改为凹槽底座、金色厚环、立体晶核与倾斜轨道，待机呼吸光和三颗细粒子。

四消／五消在既有 160ms 消除窗口内汇聚能量，奖励积木弹性缩放与闪光；五消增加更强的缩放、双圈和放射刻线。单线触发先收缩核心，再释放亮芯／柔光／沿途碎光，碎裂与碎片按光束到达各格的时刻依次出现。爆破先收缩后强光，双层冲击波严格裁剪到 `special-trigger.cells`；角落保持真实六格，常规爆破保持十三格。碎片向爆心外侧飞散并衰减。

组合规则保持原样：直线＋直线为交叉光束与中心环；直线＋爆破为中心先发、两侧随后发的三行／三列冲击；爆破＋爆破增加双环中心蓄力、向内粒子、大范围双冲击波和更多立体碎片。5×5 光效按 `combo-trigger.cells` 裁剪。连锁错落开始的特效缩短自己的剩余时长，全部在原消除截止点结束，避免重力开始后继续残留范围光效；碎片独立衰减，不阻塞结算或操作。

性能：复用原有 20 种图集栅格缓存；待机只绘制少量线段和小圆，不创建粒子对象。不使用每帧模糊处理绘制特殊核心、光束、生成和蓄力。原有 700 粒子／120 光环上限及 DPR 上限保留。减少动态效果关闭流动、呼吸、弹性、蓄力运动、震动和碎片位移，保留静态身份、方向与范围反馈。规则引擎、计分、重力和列事务没有修改。

验证范围依照用户本轮补充要求收窄：游戏当前以桌面网页为目标，今后每轮默认只做改动涉及的最小验证；不例行验证手机或重复检查未改动的场景、棋盘及 UI。用户补充要求前，既有 110 项测试已完整通过；最终调整只运行新增的 3 项针对性测试，全部通过，覆盖光束逐格命中／重叠优先时刻、爆破精确遮罩及边缘范围、引爆链共同截止点／减少动态效果。修改模块语法与空白检查通过。

桌面浏览器运行实际 `app.mjs`，使用受控帧时钟采样静态、生成、蓄力、触发与碎片阶段；检查单线、爆破、边缘爆破、四种组合及引爆链的范围光效在 260ms 清理，后续碎片自然清理，浏览器错误为空。没有进行手机或未改功能的重复验证。截图在 `validation/2026-10-10/special-upgrade/`：`desktop-static.png`、实际棋盘像素放大的 `static-detail.png`、六种触发对照 `trigger-comparison.png`，以及各模式关键帧；`report.json` 保存格子范围和状态。截图是真实表现层的受控关键帧，不是连续录像。复现脚本 `scripts/validate-special-visuals.mjs` 的测试辅助方法仅附加到本地验证服务器响应，不进入部署源码。没有发布线上版本。

图集单独重建：`node scripts/build-art.mjs --atlas-only`，避免重建未修改的棋盘和其他资源。

## 2026-10-10 · 与视觉概念图对齐

先用图片查看工具实际查看用户附件，并保存到 `references/block-brawl-art-direction.png`；随后运行本地页面，截图记录修改前的深蓝网格、宣传标题、科技边框和卡片 UI。参考图中的说明面板用于理解视觉语言，实际玩法仍按当前代码执行。

| 检查项 | 参考图与原版本的差距 | 当前修改与实际截图结果 |
| --- | --- | --- |
| 场景 | 原版深蓝背景与网格缺少自然空间 | 天空、云层、森林岩台、远景瀑布和前景地面；主画面已是明亮休闲游戏场景 |
| 棋盘 | 原版规则金属圆框，缺少环境融合 | 桃色砂岩裂纹、柔和倒角和藤叶；九切片保证 8×8 内部完整可见 |
| 方块 | 原版白色徽纹、圆形底座和细小铆钉偏键帽 | 保留五色，去掉底座／铆钉，鼓起面、有色浮雕和厚底；发光带／金星区分技能 |
| UI | 大标题、品牌页介绍和小卡片抢占棋盘 | 棋盘居中，木质分数牌、立体按钮和练习面板围绕游戏；手机按游戏操作顺序堆叠 |
| 特效 | 得分与爆炸中心较弱 | 暖色得分＋粉色描边、局部亮芯与多色放射线；光束和碎片保留原方向、范围及到期时刻 |

实际截图后继续修正：第一版矢量石框仍偏规则砌砖，改用生成的透明砂岩与藤叶素材；按九切片绘制到现有棋盘周边，避免依赖生成图的开口比例。手机练习面板的收窄问题改为整行铺开；背景关闭重复，并按页面高度覆盖，消除地面接回天空的接缝。去掉动态棋盘整层投影滤镜，保留静态装饰阴影。

资源采用内置 imagegen 生成场景和石框，原始 PNG 存在 `references/`；只进行 WebP 编码后用于 `dist/assets/`。标志、木牌、棋盘和方块采用项目矢量资源。6 份主题素材约 505.8 KiB，无在线素材或字体依赖，全部随静态目录部署。完整提示词和资源约定在 `ART.md`。

验证：`node --test tests/*.test.mjs`，110 项全部通过；模块语法检查与 `git diff --check` 通过。规则引擎哈希前后同为 `c2bb524f8e3f94a943ce9c6210cc727bcb214cb9`。浏览器中四种组合首轮 150／240／240／250 分，390px 下拖动三列组合首轮 240 分，重开恢复 0；320px 与 390px 无横向溢出，1440px 下棋盘实际为 480×480。error／warn 日志为空。

截图保留于 `validation/2026-10-10/`：修改前、最终桌面、320／390 手机宽度、光束与爆破关键帧。关键帧来自运行实际表现层源码的临时受控时钟页面，临时页面已删除；不等同于录像。当前素材、布局和氛围已对齐主要方向；概念图的透视与笔触没有逐像素复制，真实手机触摸和低端 GPU 的密集特效性能仍需实机确认。
