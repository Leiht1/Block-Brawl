# 方块乱斗声音设计 · 第三阶段

悬崖最终选择已经由用户确认并接入：预警A、坠落F、尘土D。坠落／尘土正式文件为 `maps/cliff/cliff-fall-v2.wav` 和 `maps/cliff/cliff-impact-v2.wav`，与试听F／D逐字节一致，增益仍为0.44／0.33，620ms／480ms。旧版已归档，当前没有待选项。下方“待用户选择”文字保留为前轮历史。

用户后续反馈环境偏小，当前将8条环境资源增益调整为0.33–0.44（比首次接入约提高29%–35%），核心播放期间从保留35%提高到50%，继续让消除／连击／技能优先。录音字节、核心声音、并发限制、映射和玩法保持不变。悬崖预警明确采用用户选定的A；坠落和尘土各准备D／E／F／G四个新候选，试听入口为 `validation/2026-10-11/audio-maps/cliff-reselection/index.html`，需用户选择后替换，目前游戏保留两项旧录音。以下原阶段记录中的音量为调整前数值。

第三阶段已接入 8 个地图事件 ID、8 个独立录音混音文件。悬崖为岩层／巨石／尘屑，冰川为结晶／碎冰，遗迹为石门研动与轻符文微光，熔炉为真实火浪。正式选择在 24 个候选的独立试听页建立并检验后锁定；试听入口 `validation/2026-10-11/audio-maps/index.html`。来源／证据／选型在 `references/audio-stage3/`，署名与修改随部署保存在 `assets/audio/CREDITS.md`。人工听感尚未确认；素材描述、结构分析及播放检验不冒充主观试听结论。

`environment` 独立控制，正式资源增益 0.25–0.34。环境通道最多 2 条、每事件 1 条，不排队；消除／连击／技能播放时环境声降到自身增益的 35%，结束后恢复。核心事件在全局容量已满时可释放一条环境声以取得声音槽位。环境分类设为 0 时只停止该分类，游戏事件照常发生。沿用全部事件映射，不修改规则、AI、计分或动画时序。只做第三阶段专项验证，详见 `validation/2026-10-11/audio-maps/report.json`。

## 第四阶段当前状态

实际试玩后完成音量复检：大厅／对战播放增益现为0.60／0.55，常规消除／技能期间音乐保留65%，地图60%，轻冰霜／尘土／破冰分别18%／24%／30%。交换、技能、倒计时和确认／揭晓已分项降低，爆爆约-10dB；所有录音字节不变。下段为初次接入音量记录。当前34条配置与首页一屏验收数据见 `validation/2026-10-11/audio-balance/` 和DEVLOG最新节。

大厅／准备BGM 100 BPM、153.6秒、增益0.30；竞技实际开始BGM 128 BPM、120秒、增益0.28。900ms交叉淡入淡出，WebAudio解码缓存和原生无间断循环；第一次可信操作解锁，音乐和音效分别开关并保存。核心反馈期间音乐32%、地图40%、冰霜24%，短平滑让位及恢复。点击90ms、确认320ms、洗牌420ms、揭晓660ms；只观察已有游戏／揭晓时钟，不改规则和演出。

18个候选及混听页：`validation/2026-10-11/audio-stage4/index.html`。正式文件6份在 `assets/audio/`，完整来源及采样CC0说明见 `assets/audio/CREDITS.md`。30项音频测试、15项实际浏览器检查、11组混音电平比较通过。听觉风格与长时间疲劳仍待人耳复核。详细选择、音乐原创编排和验证记录见DEVLOG阶段4。

以下为历史阶段记录。

## 第二阶段记录

本阶段已接入 10 个核心反馈 ID、16 个本地录音剪辑文件，包含三级气泡连击、三种特殊组合和倒计时 3／2／1／开始变体。线＋线复用已认可的整行列音色，倍率 0.72；线＋爆已接入用户选定的 D 光系法术，1200ms、倍率 0.78，爆＋爆仍使用最强的独立火魔法冲击。授权为 CC0 / CC BY 3.0，署名与修改说明随部署保存在 `assets/audio/CREDITS.md`；原素材和网页证据在 `references/audio-stage2/`。所有地图事件、按钮、返回、独立开始和结算 ID 保持 `src:null`。

浏览器验证了真实文件的 loadeddata / playing / ended、实际指针操作、原生帧时钟试玩、密集触发及开关逻辑独立性。当前试听入口为 `validation/2026-10-11/audio-choices/index.html`，D 已接入，A／B／C 仅保留对比。实际横线＋爆、竖线＋爆验证见 `validation/2026-10-11/audio-selected/report.json`。主观风格以用户选择及游玩反馈为准；不能把自动播放成功当作长时间舒适度验收。

## 声音语言

轻松、爽快、玩具积木感、自然材质、轻竞技。玩家应感觉“操控有生命力的小积木进行对战”。
积木接触与消除以短促、圆润、有弹性的材质反馈为方向；地图使用岩石、冰、古代机关与火焰的自然材质表达。连击有层次，但不能遮住操作反馈。

禁止科技 UI 电子音、高频刺耳提示、科幻激光风、写实战争爆炸，以及随机按钮音替代游戏反馈。
禁止下载、生成、接入临时音效；不使用振荡器、测试音或默认按钮音补空。正式文件来自明确授权的木／玻璃碰撞、气泡、反弹、shimmer、马林巴录音，以及已经制作完成的魔法音效，做离线剪辑／混音；运行时不合成或调音高。旧消除／机关电子合成音已移除。

## 目录与资源引用

游戏静态根目录为 `dist/`，所以仓库位置为 `dist/assets/audio/`，部署路径统一为 `assets/audio/`：

```text
assets/audio/
├── ui/
├── block/
├── combo/
├── special/
├── maps/
│   ├── cliff/
│   ├── ice/
│   ├── ruins/
│   └── furnace/
└── result/
```

未接入的目录以 `.gitkeep` 保存。文件名约定 `<动作>-v<版本>.<格式>`，小写英文、数字、连字符；支持 ogg、mp3、wav、m4a、webm；当前正式文件统一为 44.1kHz 单声道 16-bit PCM WAV。
`audio-manifest.mjs` 是唯一语义 ID → 文件的配置表。正式文件路径形如 `./assets/audio/block/block-swap-v1.ogg`，相对管理模块解析，不依赖页面路径。禁止远程 URL、路径回溯与业务代码直接操作音频文件。

## 架构与接口

```text
真实引擎事件 / 已有流程状态 / UI 点击
          ↓ audio-events.mjs（只读翻译、地图批次合并）
          ↓ audio.play(语义 ID)
AudioManager → manifest → 本地核心／地图音效文件（其他 UI 为空）
```

`audio-manager.mjs` 导出 `AudioManager` 和共享 `audio`。所有声音通过管理器播放，业务模块不得 `new Audio()`、创建 AudioContext、使用振荡器或访问音频文件。浏览器音频对象仅在启用声音且资源已配置后按需创建；不预加载空资源、不发起音频网络请求、不创建音频上下文。

```js
import {audio} from './audio-manager.mjs';
audio.play('block.swap');
audio.play('combo.match3');       // 兼容别名 → block.match3
audio.play('map.cliff.rockfall'); // 兼容别名 → cliff.fall
audio.setSoundEnabled(true);
audio.setMasterVolume(0.6);      // 0～1，不新增音量 UI
audio.setChannelVolume('effect', 0.8);
audio.stopAll();
```

也支持 `soundEnabled / masterVolume / uiVolume / effectVolume / environmentVolume` 属性；实际增益是总音量 × 分类音量 × 资源音量，环境遇核心消除／连击／技能时再乘 0.35，限定在 0～1。默认音效开启、总音量 1；现有音效按钮复用原位置与文字，切换只影响表现层。设置当前仅保存在会话内，持久化和音量面板留待后续产品需求。

`register(id, entry)` / `registerManifest(manifest)` 可安装正式资源配置，不涉及游戏逻辑；无效路径或参数返回 false 并跳过。`snapshot()` 提供启用状态、音量、活动数量与配置数量的只读快照。
`play()` 同步返回是否接受播放请求；false 表示关闭、静音、缺失、合并或达到上限。true 不代表一定已听到声音，浏览器自动播放限制仍可能拒绝。游戏不得等待播放 Promise、依据返回值判定操作成功或改变结算。浏览器拒绝、404、格式不支持、创建失败均静默处理并释放槽位，不延迟补播过时声音。

## 事件映射

第一批 24 个语义 ID 保留，其中 10 个已配置核心音效。`AUDIO_EVENT_MAP` 保存公开游戏事件名，`resolveEngineAudioEvent()` 将当前真实 `kind` 翻译成对应公开事件；`createAudioEvents(audio)` 将 UI、双方引擎和流程观察统一交给 AudioManager。

| 真实入口／公开事件 | 音效 ID | 触发约定 |
| --- | --- | --- |
| 按钮／ui_click | ui.click | 有效且可见按钮，捕获阶段识别 |
| 返回、退出、取消／ui_back | ui.back | 在页面隐藏前识别 |
| 非倒计时进入 playing、教学开始、沙盒进入／game_start | ui.start | 观察状态变更，仅一次；本阶段空引用 |
| countdown_tick / countdown_start | ui.countdown | 同步 3／2／1 数字变化选择对应马林巴单音变体；countdown → playing 播 start 变体；双方共享一次，跳帧不补播 |
| game_win / game_lose | ui.win / ui.lose | 已有结算状态；教学 won/lost、竞技 finished |
| swap／block_swap | block.swap | 引擎已接受交换；后续无效时再反馈弹回 |
| revert／block_invalid | block.invalid | 无效或冲突交换实际弹回 |
| clear，depth≤1／match_complete | block.match3 | 普通消除窗口开始；四／五消也用此基础反馈 |
| clear，depth>1／chain_match | block.combo | depth=2／3／≥4 选择 combo1／combo2／combo3；组合技 clear 跳过普通消除声 |
| fall／block_fall | block.fall | 一批下落，不逐块播放 |
| special-create／special_create | special.create | 生成特殊块 |
| special-trigger／special_line | special.line | row / column 触发 |
| special-trigger／special_bomb | special.bomb | blast 触发 |
| combo-trigger／special_combo | special.combo | 特殊块组合；按原事件 type 选择 line-line／line-blast／blast-blast |
| rock-warning／rock_warning | cliff.warning | 岩石预警 |
| rock-fall／rock_fall | cliff.fall | 岩石坠落 |
| rock-blocked／rock_impact | cliff.impact | 岩石落地占位 |
| map-blocked，freeze／ice_freeze | ice.freeze | 实际冻结提交 |
| map-restored，freeze + reason=clear／ice_break | ice.break | 实际消除破冰；退出清理不播放 |
| map-warning，mechanism／ruins_activate | ruins.activate | 现有齿轮转盘预警 |
| ruins_pillar | ruins.pillar | 仅预留，现有遗迹不生成石柱，不能伪造事件 |
| map-warning / map-spread-warning，fire／furnace_warning | furnace.warning | 首次与扩散预热 |
| map-blocked，fire／furnace_spread | furnace.spread | 初次点火与实际扩散提交 |

`special_trigger` 未提供子类时映射 `special.line`；真实引擎带 tile.special 时由适配器选择 line / bomb。
规范 ID 使用第一批清单中的 `cliff.* / ice.* / ruins.* / furnace.*`；`map.*` 与 `maps.*` 为兼容别名，例如 `maps.cliff.warning`。`combo.match3`、`special.trigger` 分别兼容至 `block.match3`、`special.line`。文件路径不由这些别名拼接。
不监听 `score` 再播消除声，不对 cancel、cleanup、restored 岩块恢复伪造声音。对手独立操作也通过同一管理器。

## 防堆积与生命周期

- 普通消除与三级连击共享 match 组，120ms 冷却且最多 1 个活动／待加载声音；保留已接受声音至结束，重叠新请求跳过，不截断、不排队。
- 特殊生成／直线／爆破／组合共享 special 组，最多 1 个声音，100ms 冷却（组合 150ms）。交换／弹回／下落共享 operation 组，最多 2 个声音；交换 70ms、弹回 100ms、下落 160ms 冷却。倒计时 countdown 组最多 1 个，500ms 冷却。
- 地图同阶段、同 round、同引擎 time 的多格与双方事件在映射层合并成一次调用；分批扩散时刻仍各自触发。
- 全局最多 8 个活动或待播放声音，ui／effect 每分类最多 3 个，environment 最多 2 个；超过上限直接跳过，不排队。全局满时核心消除／连击／技能可释放一个环境槽位。缺失资源不占槽位也不创建计时器。
- ended、error、同步异常、Promise 拒绝均清理；基础默认上限 8000ms，核心资源上限 1600ms，地图上限为各文件时长＋650ms（含加载），防止失败请求长期占用槽位。
- 关闭开关立即停掉已有声音并清空合并窗口；重置棋盘、离开场景停止旧声音、清空地图批次记录。重新进入不会沿用旧批次。
- localhost、127.0.0.1、IPv6 loopback 默认输出开发 debug 提示；每 ID／原因只提示一次，避免连击刷屏。生产默认静默，可构造管理器时显式指定 development。音频失败不自动改变用户开关。

## 变体与正式素材维护

`audio.play('block.combo', {variant:'combo2'})`、`audio.play('ui.countdown', {variant:'start'})` 通过同一管理器播放；变体只覆盖本地 src 和 volume，继承原 ID 的分类、冷却、合并组和生命周期。未知变体回退到默认文件。默认调用不受影响，变体不能自行绕开合并或并发限制。

新增素材必须有作者、许可、原始下载链接、文件校验值及修改说明；更新 manifest 与 CREDITS。选择不符合声音语言的素材时更换素材，不能依赖运行时 DSP 伪装修正。离线制作脚本 `scripts/prepare-core-audio.py` 可复现本阶段录音剪辑，不用于动态声音生成。

本轮最小验证见 `DEVLOG.md` 和 `validation/2026-10-11/audio-stage2/report.json`。复现：`node --test tests/audio.test.mjs`、`node scripts/validate-audio.mjs`；无全量回归。第一阶段历史验证保留在 `validation/2026-10-11/audio/report.json`。

## 用户试听后的魔法素材调整

普通三消和三级连击保留气泡家族。用户确认原特殊生成声适合行列消除，因此将其 400ms 录音原样移到 special.line（SHA-256 一致），倍率 0.66。special.create 重新选择 360ms 的轻魔法显现，倍率 0.40。

单爆破改为 500ms 元素魔法爆破，倍率 0.68。行行、行爆、爆爆分别使用独立的神圣魔法束、冰晶魔法冲击、大型火魔法冲击，时长 560／560／950ms，倍率 0.72／0.78／0.90。爆爆只有一次最强法术起音，直接剪辑单一完整素材，不叠两个单爆破。按实际播放倍率检测的四级 RMS／能量递增，爆爆最强。

只更新 manifest 与素材，没有改变音效事件翻译。含特殊块的 clear 仍不另播普通 pop；原 special-trigger／combo-trigger.type 选择独立魔法文件。倒计时和默认开启保留。新引用使用 v3 名称，旧素材归档。来源、文件、音量和验证见 DEVLOG 最新条目与 validation/2026-10-11/audio-magic/。

### 线＋爆单项替换

用户确认其他音效合适，仅反馈线爆沉闷。line-blast 变体改为 special-combo-line-blast-v4.wav（560ms、0.78），选用 qubodup IceDamage03b 单条素材，移除原 Wind effects 5 的低频主体。原录音只做基本剪辑和淡出，没有运行时滤波／变调；其他 16 个部署音频及音量／合并配置不变。横／竖线爆、快速合并、静音结算与原生帧时钟试玩相关验证见 validation/2026-10-11/audio-line-blast/，复现 node scripts/validate-line-blast.mjs。

### 最新：补改线＋线，线＋爆等待选择

用户反馈 v4 像玻璃碎裂，并指出线＋线遗漏。现在 `special.combo` 默认与 `line-line` 都引用 `special-line-v3.wav`，400ms、倍率 0.72；单行列仍为 0.66。旧 Magic Smite 剪辑归档，正式文件降为 16 个。线＋爆 v4 暂留，候选尚未写入 manifest。

四个候选为 JaggedStone magical_1／magical_4、Ogrebane Teleport（以上 CC0）和 ViRiX Healing Full（CC BY 3.0）。原件与授权证据在 references/audio-stage2/choices/，试听剪辑仅在 validation/2026-10-11/audio-choices/。用户选定后才接入，页面没有实装操作。完整来源、编辑记录、音量和最小验证结果见 DEVLOG 最新条目。

复现：已有音效测试；`node scripts/validate-line-lines.mjs`；先运行本地预览服务 5178，再运行 `node scripts/validate-audio-choices.mjs`。候选生成使用 `scripts/prepare-audio-choices.py`，来源／当前授权／试听页生成使用 `scripts/build-audio-review.mjs`；候选脚本不会写入 dist/assets/audio/。

### 最终选定：线＋爆使用 D

用户明确选择 D，已将其原试听文件逐字节接入 `special-combo-line-blast-v5.wav`，倍率 0.78。选择依据为用户对四个实际音频的试听结果；素材为 ViRiX Healing Full，CC BY 3.0，作者、来源与编辑说明进入随部署 CREDITS.md。不会叠加两次单爆。旧 v4 归档，不再部署。`references/audio-stage2/choices/selection.json` 记录正式选择，保留选定音频用于重建；候选生成会保留已选择状态。

当前 16 个文件共 485,362 字节。新 D 的平均 RMS 因较长尾音低于线音，整段播放能量按普通→单线→线线→线爆→爆爆递增，RMS 单独报告，不当作魔法听感或强弱的验收结论。重建后音频与 D 试听的 SHA-256 一致。最小验证：19 项音效测试、`node scripts/validate-line-blast.mjs`、`scripts/validate-audio-levels.py`，报告在 audio-selected/；不改规则、计分、AI、动画、地图事件或默认开启。
