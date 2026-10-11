# 第二阶段素材筛选记录

2026-10-11。接入范围限于基础操作、消除、特殊块、倒计时。取样依据为官方／作者页面描述、明确授权、原录音时长、波形、电平及剪辑可用性；当前工具不能可靠听取耳机输出，主观风格审核待人工复核。

- 使用 Kenney Impact Sounds 的轻木和轻玻璃材料；heavy／金属／采矿类未接入。
- EZduzziteh 的 casual / cute / vocal pop 作为圆润短爆发，结合少量轻玻璃起音，避免尖锐电子提示。
- qubodup 的竹杆空气录音用于特殊块蓄力和穿透，避开科幻激光。
- Blender Foundation 的 YoFrankie! 反弹素材作为无效交换返回；Berklee 的短 shimmer 作为特殊发现和较强奖励尾音。两者是 CC BY 3.0，随部署提供作者、许可、来源和修改说明。
- Kenney RPG Audio 已取得官方包并保留网页、原 archive 和许可，但目录以刀具、皮革、门与步伐为主，没有选作本阶段素材；这些声音不进入 manifest。
- OpenGameArt 的 Chunky Explosion 标记为 pseudorealistic，8 Magic Attacks／8 Heals and Buffs 标记为 retro，方向不匹配，未下载／接入。
- 没有使用 Kenney Interface／Sci-fi 包、默认按钮音、振荡器、测试音或授权不明资源。

制作脚本仅对来源明确的素材做离线剪辑与层次设计，不给未配置 ID 自动补音。所有地图、按钮、返回和结算 ID 仍为空。运行时不增加滤波、振荡器或 pitch shift 来补救风格。

原始 archive 保留供追溯；解包目录只保留使用的录音与许可。`sources.json` 保存网页／archive／录音校验值与下载位置，`derivatives.json` 保存每个最终文件的来源、编辑步骤、时长、电平和 SHA-256。

## 首版试玩反馈后的替换

用户反馈普通消除像打砖块、特殊偏轻且组合缺少递进、倒计时不悦耳。当前普通消除改用 trezegames 气泡 p_1，三级连击同用 p_1／p_2／p_3，移除硬玻璃敲击。旧 EZduzziteh pop 与旧剪辑仅供历史核验，不在当前部署中使用。

特殊以更宽的竹杆 swosh-26／30、低气泡主体和 Gniffelbaf／AntumDeluge 的气球爆破录音形成单线→行爆→爆爆；各类组合有独立节奏和尾音。仅采用气球破裂，未使用战争爆炸。

倒计时采用 VSCO 2 CE 官方 CC0 马林巴录音，固定版本并保存 LICENSE。放弃 Freesound 候选：下载登录限制和页面上的额外限制说明使其不适合本轮直接分发。倒计时自然单音递升、开始三音展开，与积木的木质方向保持联系。

技术检查和视觉试玩通过；没有可靠耳机输出检查能力，仍需以实际听感判断新版本是否舒适统一。试听页支持按默认倍率四级对比。

## 魔法方向与生成音迁移

用户认可原生成声用于整行列，已逐样本原样迁移为 special-line-v3；不是另选光束或变调版本。新生成采用 ViRiX Misc 02 的短魔法显现。单爆／行爆／爆爆从同作者的独立 Ice attack 2／Wind effects 5／Fire impact 1 选取，最高档只剪辑一次大型火魔法冲击；行行使用 spookymodem 的神圣魔法束 Magic Smite。移除当前部署中的气球和竹杆素材。

新增素材为公开 CC BY 3.0 成品，已按作者要求署名 ViRiX Dreamcore (David Mckee) 并链接 soundcloud.com/virix。包名 Preview 不代表演示用途限制：来源网页明确授权单条使用。未采用未授权商业完整版。源包、页面和校验值已保留。

原生成声已有用户听觉认可；新增素材依据作者定义、响度和实际游戏播放检查筛选，不宣称工具能可靠完成耳机听觉验收。

## 只替换沉闷的线＋爆

用户确认现在仅线爆不合适，保留其他全部录音与播放倍率。Wind effects 5 的低频能量占比较高，改选 Iwan qubodup Gabovitch 的 Ice & Electricity Magic 中 IceDamage03b，560ms 短冰晶法术冲击。没有采用包中的 Electricity cue，避免电击／科幻方向，也没有采用更尖薄的 IceDamage03d/e。03b 的晶莹音色在频谱方向上接近用户认可的行列／单爆，保留单次起音和短尾；最强爆爆不动。

新素材许可 CC BY 3.0，作者 notes.txt 标注原始构成录音为 CC0，网页和源包明确授权。已记录作者、许可、来源、编辑步骤及 SHA-256。数值／播放验证不代表工具已完成耳机听觉验收。
