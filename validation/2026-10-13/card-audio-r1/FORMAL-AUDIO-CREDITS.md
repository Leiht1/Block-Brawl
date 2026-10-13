# 方块乱斗 · 核心音效来源与授权

2026-10-11 仓库整理：保留所有正在使用的正式录音、许可、来源和处理记录，以及第四阶段音乐编排所需采样。旧交换音 `block-swap-v1.wav`、历史试听成品、未使用的原录音与下载压缩包已清理；下文涉及这些文件的描述是历史溯源记录。需要重新处理旧录音时，按 `references/` 中的下载地址与哈希恢复原件。当前游戏只加载 manifest 指向的正式文件。

2026-10-11声音平衡复检及后续BGM微调：所有录音字节／来源／许可保持，当前播放增益以manifest为准。大厅／对战音乐0.66／0.60，普通消除和三级连击保持；交换0.42，特殊生成／线／爆0.34／0.46／0.48，线线／线爆／爆爆0.50／0.56／0.28，倒计时3／2／1／开始0.30／0.32／0.34／0.40，确认0.34，洗牌0.42，揭晓0.38。音乐在核心／地图反馈时保留65%／60%，轻冰霜／尘土／破冰分别18%／24%／30%，选择／倒计时50%，其他UI75%。下方首次接入增益为历史记录；本轮未改任何素材或重新授权。

## 第四阶段 · BGM 与 UI（2026-10-11）

正式新增六份文件。BGM是方块乱斗项目原创编排，以自然乐器实录采样离线渲染；不是原采样作者提供的成品歌曲。来源版本、每份原件SHA-256、候选／最终选择和编辑脚本保存在项目 `references/audio-stage4/` 与 `scripts/prepare-stage4-audio.py`。

| 正式路径 | 来源／作者 | 授权与修改 |
| --- | --- | --- |
| `bgm/lobby/bgm-lobby-v1.ogg` | [VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE)：马林巴C4、竖琴C3／C5、康加轻敲；Sam Gossner、Simon Dalzell，采样剪辑 Elan Hickler／Soundemote | 原采样 [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；项目原创100 BPM／64小节编排，153.6秒。剪辑、调音、低通、声像、圆周尾音混合、电平余量，双声道44.1kHz／OGG。默认播放增益0.30 |
| `bgm/battle/bgm-battle-v1.ogg` | 同上，增加自然铃鼓与小鼓轻敲 | 原采样CC0-1.0；项目原创128 BPM／64小节编排，120秒。相同离线处理，默认增益0.28 |
| `ui/ui-click-v1.wav` | trezegames，[Pop effect sounds](https://opengameart.org/content/pop-effect-sounds)，`p_2.ogg` | CC0-1.0；90ms截取、单源低通／包络／双声道PCM16，增益0.38 |
| `ui/ui-confirm-v1.wav` | VSCO 2 CE `Marimba_hit_Outrigger_C4_loud_01.wav` | CC0-1.0原采样；调音编排C／E／G上扬短句、320ms包络／双声道PCM16，增益0.46 |
| `ui/map-shuffle-v1.wav` | Kenney，[Casino Audio](https://kenney.nl/assets/casino-audio)，`card-fan-1.ogg` | CC0-1.0；真实纸牌摩擦，420ms截取／低通／包络／双声道PCM16，增益0.36 |
| `ui/map-reveal-v1.wav` | VSCO 2 CE 马林巴C4与竖琴C5 | CC0-1.0原采样；离线调音和大三和弦编排、660ms包络／双声道PCM16，增益0.50 |

VSCO源版本固定为 `440300901dfe9275fd84e0b7763af1f8443ae62e`；原许可随部署保留在 `licenses/VSCO-2-CE-CC0.txt`。Kenney原许可保留在 `licenses/casino-audio-license.txt`；未选择的点击候选来自Kenney Interface Sounds，其原许可同存。BGM的“项目原创编排”与“原采样CC0”分别记录，不将成品歌曲归名到采样作者。

大厅／对战A、点击A、确认A、洗牌B、揭晓A逐字节从已建试听候选接入；所有其他录音与音量保持前轮结果。音乐在消除／技能期间保留32%，地图40%，冰霜24%，倒计时／选择65%，平滑恢复。音乐循环通过完整解码后的原生AudioBufferSource实现，不依赖OGG重复加载。

## 交换方块最终选型 · 用户确认 A

`block/block-swap-v2.wav`（110ms，播放增益0.58）与用户选定的 A 试听文件逐字节一致。来源：artisticdude 的 [Swishes Sound Pack](https://lpc.opengameart.org/node/4693)，[CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)，原ZIP内 `swish-11.wav`；作者以衣架／木棍挥动实录制作。修改：单声道44.1kHz／PCM16、截取110ms、去直流、90Hz高通／6500Hz低通、15ms淡入／35ms淡出、RMS目标0.14／峰值上限0.65；只使用一段录音，未叠加打击。正式接入时未再次加工。来源证据与下载哈希见 references/audio-swap/sources.json；选型与编辑参数见该目录 selection.json。旧 `block-swap-v1.wav` 仅留作历史试听对照，manifest不再引用。

## 悬崖最终选型 · 用户确认 A／F／D

预警 A 保留；坠落 F 与尘土 D 已正式替换旧版，音量沿用 0.44／0.33，文件与试听版逐字节相同。旧 `cliff-fall-v1.wav`、`cliff-impact-v1.wav` 已移至 references/audio-stage3/cliff-reselection/superseded/，不再部署。下文旧阶段的这两项来源只作历史记录。

- `maps/cliff/cliff-fall-v2.wav`（620ms）：用户选择 F。AlanCat 的 [rockfall2a.wav](https://freesound.org/people/AlanCat/sounds/389303/)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)，网页提供的公开 HQ MP3 预览；自然崖壁落石。风切使用 qubodup / Iwan Gabovitch 的 [Swish bamboo stick](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes)，CC0，原件 `swosh-04.flac`。修改：单声道／去静音与直流／截取／风切0.85倍速和落石0.90倍速／2700Hz和4000Hz低通／250ms后落石起音／混音／淡入淡出／电平余量。全部源素材为CC0。
- `maps/cliff/cliff-impact-v2.wav`（480ms）：用户选择 D。martinimeniscus / Florentine Films SFX 的 [sand pour on sand FF662.aif](https://freesound.org/people/martinimeniscus/sounds/199332/)，以及 _stubb 的 [Rock Tumble 2.wav](https://freesound.org/people/_stubb/sounds/389618/)，均为[CC0](https://creativecommons.org/publicdomain/zero/1.0/)，使用网页提供的公开 HQ MP3 预览。修改：单声道／去静音与直流／细沙2.6s及石尾0.7s开始截取／5800Hz和4400Hz低通／石尾120ms延后及0.16相对增益／混音／淡入淡出／电平余量。全部源素材为CC0。

来源网页证据、公开文件地址、源格式与SHA-256：references/audio-stage3/cliff-reselection/sources.json。正式选择及逐层参数：该目录 selection.json；未选择素材仅保留试听。所有处理已离线完成，游戏只通过 manifest 播放成品。

2026-10-11 后续音量调整：8 个环境文件的录音字节保持不变。当前增益依次为 cliff.warning 0.40、cliff.fall 0.44、cliff.impact 0.33、ice.freeze 0.39、ice.break 0.40、ruins.activate 0.39、furnace.warning 0.35、furnace.spread 0.39；核心播放期间环境保留 50% 音量。下方第三阶段表格为首次接入记录。用户已确认 warning A；fall／impact 新候选尚未选定，仅存于 validation/2026-10-11/audio-maps/cliff-reselection/，没有分发至游戏。新候选来源／许可／修改记录见 references/audio-stage3/cliff-reselection/sources.json 与试听 candidates.json。

核验日期：2026-10-11。16 个正式文件是本项目的剪辑／混音版本，不表示原作者为本游戏制作或背书。原件、下载链接、授权网页和 SHA-256 见仓库 references/audio-stage2/sources.json；逐文件编辑记录见 derivatives.json。

## Impact Sounds 1.0

作者：Kenney。
[来源](https://kenney.nl/assets/impact-sounds) · [许可](https://creativecommons.org/publicdomain/zero/1.0/)（CC0-1.0）。

原件：`impact-sounds/Audio/impactWood_light_000.ogg`、`impact-sounds/Audio/impactWood_light_002.ogg`、`impact-sounds/Audio/impactGlass_light_001.ogg`。

- `block/block-swap-v1.wav`：历史试听对照，已由用户选择的轻挥A替换；Trim quiet tail; 120ms; 2ms/20ms fades。
- `block/block-fall-v1.wav`：One 100ms landing per batch; speed .96; fades。
- `special/special-line-v3.wav`：Exact former special-create-v1 recording, reassigned to line clear。

## Pop effect sounds

作者：trezegames。
[来源](https://opengameart.org/content/pop-effect-sounds) · [许可](https://creativecommons.org/publicdomain/zero/1.0/)（CC0-1.0）。

原件：`p_1.ogg`、`p_2.ogg`、`p_3.ogg`。

- `block/block-match3-v2.wav`：Single bubble pop; 90ms; no glass or wood attack。
- `combo/combo1-v2.wav`：Bubble family only; speed 1; 2 pops; rising pitch and density。
- `combo/combo2-v2.wav`：Bubble family only; speed 1.12; 3 pops; rising pitch and density。
- `combo/combo3-v2.wav`：Bubble family only; speed 1.26; 4 pops; rising pitch and density。

## VSCO 2 Community Edition — Marimba

作者：Sam Gossner & Simon Dalzell; sample cutting: Elan Hickler / Soundemote。
[来源](https://github.com/sgossner/VSCO-2-CE) · [许可](https://github.com/sgossner/VSCO-2-CE/blob/440300901dfe9275fd84e0b7763af1f8443ae62e/LICENSE)（CC0-1.0）。

原件：`marimba-c4.wav`、`marimba-g4.wav`。

- `ui/countdown-3-v2.wav`：Recorded marimba C4/D4/E4; speed 1.000000; warm 210ms note。
- `ui/countdown-1-v2.wav`：Recorded marimba C4/D4/E4; speed 1.259921; warm 210ms note。
- `ui/countdown-2-v2.wav`：Recorded marimba C4/D4/E4; speed 1.122462; warm 210ms note。
- `ui/countdown-start-v2.wav`：C4/E4/G4 recorded marimba bloom; 18ms spacing; no pop or shimmer。

## Funny Comic Cartoon Bounce Sound

作者：Blender Foundation / YoFrankie! (c) 2008。
[来源](https://opengameart.org/content/funny-comic-cartoon-bounce-sound) · [许可](https://creativecommons.org/licenses/by/3.0/)（CC-BY-3.0）。

原件：`BounceYoFrankie.flac`。

- `block/block-invalid-v1.wav`：Trim silence; speed .93; 220ms soft rebound; fades。

## Shimmer glitter magic

作者：The Berklee College of Music。
[来源](https://opengameart.org/content/shimmer-glitter-magic) · [许可](https://creativecommons.org/licenses/by/3.0/)（CC-BY-3.0）。

原件：`shimmer_1.flac`。

- `special/special-line-v3.wav`：Exact former special-create-v1 recording, reassigned to line clear。

## Magic SFX Sample — individual finished magic cues

作者：ViRiX Dreamcore (David Mckee)。作者主页：https://soundcloud.com/virix。
[来源](https://opengameart.org/content/magic-sfx-sample) · [许可](https://creativecommons.org/licenses/by/3.0/)（CC-BY-3.0）。

原件：`magic/virix/Misc 02.wav`、`magic/virix/Ice attack 2.wav`、`magic/virix/Fire impact 1.wav`、`magic/virix/Healing Full.wav`。

- `special/special-create-v3.wav`：Single short magic reveal; no explosion layers; trim recording silence and long reverb; fades; fixed headroom。
- `special/special-bomb-v3.wav`：Single elemental magic blast; no bubble/balloon layer; trim recording silence and long reverb; fades; fixed headroom。
- `special/special-combo-line-blast-v5.wav`：Mono; remove DC/leading silence; retain first 1.2s; 2ms attack/120ms release; RMS target .16 with peak cap .76; no EQ, pitch shift or layering; exact user-selected D audition, no further sample changes。
- `special/special-combo-blasts-v3.wav`：Single strongest fire-magic impact; dense body, one onset, no duplicated explosion; trim recording silence and long reverb; fades; fixed headroom。

## 分发约定

含 CC BY 3.0 素材的以下 6 个文件以 CC BY 3.0 分发，保留作者、来源、许可和修改说明：`block/block-invalid-v1.wav`、`special/special-create-v3.wav`、`special/special-line-v3.wav`、`special/special-bomb-v3.wav`、`special/special-combo-line-blast-v5.wav`、`special/special-combo-blasts-v3.wav`。其余 10 个现用文件源素材为 CC0。所有修改均离线完成；新增魔法 cue 每条只剪辑一个完整原始素材，不叠两次爆破。

ViRiX 的公开包名包含 Preview，网页明确以 CC BY 3.0 授权单条成品供使用，没有演示用途限制。本项目未购买或使用其完整商业包。

本文件随 assets/audio/ 部署，发布时保留。旧气球和替换的生成音只在 references/audio-stage2/ 存档。地图事件已在第三阶段接入；按钮、返回、独立开始、结算与尚无事件的遗迹石柱仍为空引用。

## 第三阶段 · 地图环境声音（2026-10-11）

8 个正式文件由 24 个候选选定并逐样本复制。来源网页、原始包、作者、授权核验与 SHA-256：`references/audio-stage3/sources.json`；逐文件来源／修改／音量：`derivatives.json`；候选锁定依据：`selection.json`。人工听感认可尚未取得，不把播放成功当作认可。新增文件均为 44.1kHz、单声道、16-bit PCM WAV。

### 岩石与悬崖

作者：Gregor Quendel。来源：[Free Cinematic Sound Effects](https://opengameart.org/content/free-cinematic-sound-effects)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。仅使用 Designed Rocks - Sequences 02 / Elements 09，未使用该包的 Sci-Fi / Circuits / Mecha 文件。项目修改：截取、转单声道、去直流、轻降速、低通、淡入淡出、混音、电平限制；不代表作者背书。

碎石层作者：themightyglider，原作 SoundCollectah。来源：[Breaking Rock](https://opengameart.org/content/breaking-rock)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)，录音 `rock_break_0.ogg`。风切层作者：qubodup / Iwan Gabovitch。来源：[Swish — bamboo stick weapon swhoshes](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)，录音 `swosh-26.flac`（录音及作者声明沿用 stage2 存档）。

以下三个混音文件按 CC BY 4.0 分发，并保留上述全部作者／来源／修改声明：

- `maps/cliff/cliff-warning-v1.wav`：岩层低鸣＋短石裂，1100ms；音量 0.30。
- `maps/cliff/cliff-fall-v1.wav`：风切接单次岩石撞击，620ms；音量 0.34。
- `maps/cliff/cliff-impact-v1.wav`：碎石与柔软尘土尾，480ms；音量 0.25。

### 冰川

作者：bart；原始录音 Stephan / pdsounds。来源：[Ice spells](https://opengameart.org/content/ice-spells)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。录音 `ice.wav`、`coldsnap.wav`。碎冰作者：IgnasD。来源：[Ice breaking/shattering](https://opengameart.org/content/ice-breakingshattering)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。录音 `LedasLuzta.ogg`、`LedasLuzta4.ogg`。

- `maps/ice/ice-freeze-v1.wav`：`ice.wav`，低通／剪辑／淡入淡出／电平，700ms；音量 0.29。
- `maps/ice/ice-break-v1.wav`：冷裂纹＋120ms 后碎冰主体＋260ms 后晶片余声，低通／混音／淡入淡出／电平，600ms；音量 0.31。

以上两个文件源素材均为 CC0。

### 遗迹

石门作者：bonebrah。来源：[Stone Door](https://opengameart.org/content/stone-door)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。原件 `stone_door.ogg`。符文微光层作者：The Berklee College of Music。来源：[Shimmer glitter magic](https://opengameart.org/content/shimmer-glitter-magic)，[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)。原件 `shimmer_1.flac`（沿用 stage2 存档）。

- `maps/ruins/ruins-activate-v1.wav`：石门研动为主体，轻微录音微光点缀；单声道／去直流／截取／1.12 倍速／低通／混音／淡入淡出／电平，1050ms；音量 0.30。按 CC BY 3.0 分发；保留上述作者、来源、许可与修改声明。

### 熔炉

作者：LEGIT Audio。来源：[Fire Staff Sound Effects](https://opengameart.org/content/fire-staff-sound-effects)，[CC0](https://creativecommons.org/publicdomain/zero/1.0/)。原件 `LEGIT_FIR_Fire_Staff 16-Audio.wav`、`LEGIT_FIR_Fire_Staff 20-Audio.wav`。

- `maps/furnace/furnace-warning-v1.wav`：真实火杖 16，低通／渐强／短尾／电平，550ms；音量 0.26。
- `maps/furnace/furnace-spread-v1.wav`：真实火杖 20，火浪与余烬，低通／剪辑／短尾／电平，660ms；音量 0.30。

以上两个文件源素材均为 CC0。所有地图环境文件只离线处理，不在游戏中合成音高、滤波或产生测试音。
