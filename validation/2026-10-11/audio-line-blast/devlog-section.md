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
