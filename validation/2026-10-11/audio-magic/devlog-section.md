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
