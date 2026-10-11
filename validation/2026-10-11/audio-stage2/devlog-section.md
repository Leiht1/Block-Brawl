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
