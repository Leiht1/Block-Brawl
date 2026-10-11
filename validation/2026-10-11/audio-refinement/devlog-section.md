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
