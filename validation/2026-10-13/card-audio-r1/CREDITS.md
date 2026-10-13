# 卡牌音效 R1 来源与处理记录

状态：21条审核候选，未确认、未接入。每组A/B/C同播放倍率、最强50ms窗RMS匹配。短音不以长静音/衰减尾拉高整段RMS；保留自然瞬态差异，客观校准不等于主观等响。增益为当前正式普通消除0.46之下的层级起点。

原附件完整保存于 references/audio-cards-r1/；原本为OGG的文件保留为有损原件，试听导出PCM WAV并不使它变成无损源。

CC0无需强制署名。CC BY 3.0候选必须保留作者、原始页面、许可证链接及修改说明；交付页已附齐。幸运星B仅使用真实竖琴采样，同来源三音离线混为一条。

## 卡牌释放 · cast.release

A 短旋律魔力；B 单根暖拨弦；C 反向柔铃聚拢。

出牌已提交时 0ms；不为声音等待聚光。

### A · 短旋律魔力

候选 `clips/cast-release-a-v1-preview.wav`，实际 0.260000 秒，播放倍率 0.3，RMS 0.104535，最强50ms窗RMS 0.160000，峰值 0.457977。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`magical_6.ogg`；保存路径 `magic-spell-sfx/magical_6_0.ogg`；原时长 1.110385 秒。
- 作者：JaggedStone；[来源](https://opengameart.org/content/magic-spell-sfx)；[原始下载](https://opengameart.org/sites/default/files/magical_6_0.ogg)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 1.1103854875283448, "originalSampleRate": 44100, "originalSubtype": "VORBIS", "cropStartSeconds": 0.0, "cropEndSeconds": 0.26, "reverse": false, "highpassHz": 100, "lowpassHz": 5200, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`0a18ee3460cf3fd79c3771bbf94c20c26d34b65ab60d0b0e15694ffcad815955`；授权证据 `magic-spell-sfx.html`。

输出 SHA-256：`f90ed9631eb7b85df074c38ed6577e004e5024ffdf88711d23c5c4657ecca7f5`；统一响度线性增益 10.003886。

### B · 暖拨弦启动

候选 `clips/cast-release-b-v1-preview.wav`，实际 0.300000 秒，播放倍率 0.3，RMS 0.075762，最强50ms窗RMS 0.160000，峰值 0.428925。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`KSHarp_A4_mf.wav`；保存路径 `vsco-harp/KSHarp_A4_mf.wav`；原时长 12.151769 秒。
- 作者：VSCO 2 CE: Sam Gossner & Simon Dalzell; sample cutting Elan Hickler / Soundemote (repository credits)；[来源](https://github.com/sgossner/VSCO-2-CE)；[原始下载](https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Strings/Harp/KSHarp_A4_mf.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核保留采样与编排来源。
- 精确处理：`{"originalSeconds": 12.151768707482994, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.018095238095238095, "cropEndSeconds": 0.3180952380952381, "reverse": false, "highpassHz": 100, "lowpassHz": 6200, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`3665f3975cad4a33f46784aa4f896f4b4319ba2b7831e892d975bc38c9f09f23`；授权证据 `vsco-harp/README.md`。

输出 SHA-256：`b45d2ebbe5dc8a23cde8e50f4be3eb23b1470cd791e6547112bcc1235bd23637`；统一响度线性增益 3.528394。

### C · 柔铃聚拢

候选 `clips/cast-release-c-v1-preview.wav`，实际 0.240000 秒，播放倍率 0.3，RMS 0.131651，最强50ms窗RMS 0.160000，峰值 0.462128。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`pleasing-bell.wav`；保存路径 `pleasing-bell-sound-effect/pleasing-bell.wav`；原时长 0.619297 秒。
- 作者：Julie Damsgaard / Spring Spring / Spring Enterprises；[来源](https://opengameart.org/content/pleasing-bell-sound-effect)；[原始下载](https://opengameart.org/sites/default/files/pleasing-bell.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 0.6192970521541951, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.00013605442176870748, "cropEndSeconds": 0.24013605442176872, "reverse": true, "highpassHz": 100, "lowpassHz": 6500, "attackMs": 25.0, "releaseMs": 30.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`3c851939ccf9146e49c1be0272386fdca1b1442bb034a5e6dcdfb3e0e144a411`；授权证据 `pleasing-bell-sound-effect.html`。

输出 SHA-256：`ad87e442d1b4f2a3d4b81d9af1d2af776648fd98e3b3798c6fd57a7732eb0ef4`；统一响度线性增益 9.035891。

## 光团飞行 · cast.travel

A 竹杖风切的细颗粒；B 连续自然风的柔面；C 近场旋动空气。均不拉伸原件。

180ms 启动，380ms 飞行窗口，560ms 到达。

### A · 细竹风切

候选 `clips/cast-travel-a-v1-preview.wav`，实际 0.380000 秒，播放倍率 0.24，RMS 0.061248，最强50ms窗RMS 0.160000，峰值 0.531464。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`swosh-03.flac`；保存路径 `swish-bamboo-stick-weapon-swhoshes/swosh-03.flac`；原时长 0.575510 秒。
- 作者：qubodup / Iwan Gabovitch；[来源](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes)；[原始下载](https://opengameart.org/sites/default/files/swoshes.7z)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 0.5755102040816327, "originalSampleRate": 44100, "originalSubtype": "PCM_24", "cropStartSeconds": 0.019773242630385487, "cropEndSeconds": 0.3997732426303855, "reverse": false, "highpassHz": 180, "lowpassHz": 5600, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`2111003e4c61b8f3589f926f549ffc36094319da7b99238624c7d64e91bddc09`；授权证据 `swish-bamboo-stick-weapon-swhoshes.html`。

输出 SHA-256：`6a832b4ac8ef8bfc015b986e694bbc7a10fc7b043c33042cd8f3d91e0ce42e8a`；统一响度线性增益 1.225067。

### B · 柔面风流

候选 `clips/cast-travel-b-v1-preview.wav`，实际 0.380000 秒，播放倍率 0.24，RMS 0.115755，最强50ms窗RMS 0.160000，峰值 0.471924。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`short wind sound.wav`；保存路径 `short-wind-sound/short wind sound.wav`；原时长 4.235306 秒。
- 作者：remaxim；[来源](https://opengameart.org/content/short-wind-sound)；[原始下载](https://opengameart.org/sites/default/files/short%20wind%20sound.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 4.235306122448979, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 1.1322675736961452, "cropEndSeconds": 1.512267573696145, "reverse": false, "highpassHz": 220, "lowpassHz": 4800, "attackMs": 25.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`4435f5ad1baf171f21f876f778d0a8a7447becea0c4955bb2566e0c63ab20f41`；授权证据 `short-wind-sound.html`。

输出 SHA-256：`a2a44eb74f0db8a366acf6176beaa28d925fd30a9060ee9aff2aac4afcca9aa7`；统一响度线性增益 13.036759。

### C · 近场旋动

候选 `clips/cast-travel-c-v1-preview.wav`，实际 0.380000 秒，播放倍率 0.24，RMS 0.089361，最强50ms窗RMS 0.160000，峰值 0.543915。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`whoosh2.wav`；保存路径 `air-whoosh/whoosh2_0.wav`；原时长 5.246599 秒。
- 作者：pyranostudios；[来源](https://opengameart.org/content/air-whoosh)；[原始下载](https://opengameart.org/sites/default/files/whoosh2_0.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 5.246598639455782, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.55, "cropEndSeconds": 0.93, "reverse": false, "highpassHz": 220, "lowpassHz": 5800, "attackMs": 18.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`d3fbff5bb78b289af16b2dfa29083f07ef83b0cbaff4514c48dfda16d082b468`；授权证据 `air-whoosh.html`。

输出 SHA-256：`aeb30c3f92d0e3ffee131c40e0a0b020cf05a6ffc3f115a70a818221dc0a3cf8`；统一响度线性增益 10.010351。

## 光团命中 · cast.impact

A 单颗清晶铃；B 圆润颤音琴铃；C 细密魔法微光。

光团实际到达时，本次静态模拟为560ms；无真实目标不应伪造命中。

### A · 单颗清晶铃

候选 `clips/cast-impact-a-v1-preview.wav`，实际 0.380000 秒，播放倍率 0.34，RMS 0.088057，最强50ms窗RMS 0.160000，峰值 0.509918。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`bell_ding2.wav`；保存路径 `bell-dingschimes/bell_ding2.wav`；原时长 1.439637 秒。
- 作者：PWL；[来源](https://opengameart.org/content/bell-dingschimes)；[原始下载](https://opengameart.org/sites/default/files/bell_ding2.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 1.4396371882086167, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.10802721088435374, "cropEndSeconds": 0.48802721088435375, "reverse": false, "highpassHz": 100, "lowpassHz": 6000, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`e4a764a1e0a6284f5a5ec80caf3d44c76d3ff8db17ddab8b42abb6b143e83529`；授权证据 `bell-dingschimes.html`。

输出 SHA-256：`b528ebcb71e7c18f5d0cb8fbb2f26d6758a7286fc698431fa6a1631df6435a3c`；统一响度线性增益 0.986287。

### B · 圆润软铃

候选 `clips/cast-impact-b-v1-preview.wav`，实际 0.360000 秒，播放倍率 0.34，RMS 0.123512，最强50ms窗RMS 0.160000，峰值 0.466583。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`pleasing-bell.wav`；保存路径 `pleasing-bell-sound-effect/pleasing-bell.wav`；原时长 0.619297 秒。
- 作者：Julie Damsgaard / Spring Spring / Spring Enterprises；[来源](https://opengameart.org/content/pleasing-bell-sound-effect)；[原始下载](https://opengameart.org/sites/default/files/pleasing-bell.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 0.6192970521541951, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.00013605442176870748, "cropEndSeconds": 0.3601360544217687, "reverse": false, "highpassHz": 100, "lowpassHz": 5800, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`3c851939ccf9146e49c1be0272386fdca1b1442bb034a5e6dcdfb3e0e144a411`；授权证据 `pleasing-bell-sound-effect.html`。

输出 SHA-256：`88eddaa6e7e44c75d466d72ceb2f7d7fecd871f96917320292e40a64a4c86519`；统一响度线性增益 9.065089。

### C · 细密微光

候选 `clips/cast-impact-c-v1-preview.wav`，实际 0.400000 秒，播放倍率 0.34，RMS 0.113153，最强50ms窗RMS 0.160000，峰值 0.550354。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`shimmer_1.flac`；保存路径 `shimmer-glitter-magic/shimmer_1.flac`；原时长 0.658367 秒。
- 作者：The Berklee College of Music; submitted by qubodup；[来源](https://opengameart.org/content/shimmer-glitter-magic)；[原始下载](https://opengameart.org/sites/default/files/shimmer_1.flac)。
- [许可 CC-BY-3.0](https://creativecommons.org/licenses/by/3.0/)；署名作者、附来源与许可证链接、注明剪辑修改；禁止额外限制。
- 精确处理：`{"originalSeconds": 0.6583673469387755, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.0, "cropEndSeconds": 0.4, "reverse": false, "highpassHz": 100, "lowpassHz": 6000, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`b6802e6ef22189058a4406ae5c7bda9a54c47e908fad3fd6212650c1aa0170af`；授权证据 `shimmer-glitter-magic.html`。

输出 SHA-256：`9c2cd79ca95f43f8bc6369660bab3e3f8d554b45bee9295044c770df64e77841`；统一响度线性增益 1.247506。

## 火焰冲击 · skill.fire

A 火杖短挥的流动火浪；B 火炬掠过的粗细变化；C 壁炉细爆裂的余烬颗粒。

fire-start 时播放：安定棋盘最早640ms；首格约700ms，末格约1144ms。棋盘忙碌或冻结时启动会后移。

### A · 短挥火浪

候选 `clips/skill-fire-a-v1-preview.wav`，实际 0.620000 秒，播放倍率 0.38，RMS 0.031976，最强50ms窗RMS 0.091954，峰值 0.336609。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`LEGIT_FIR_Fire_Staff 11-Audio.wav`；保存路径 `fire-staff-sound-effects/LEGIT Audio_FIRE STAFF - FREE/Wavs/LEGIT_FIR_Fire_Staff 11-Audio.wav`；原时长 8.500000 秒。
- 作者：LEGIT Audio；[来源](https://opengameart.org/content/fire-staff-sound-effects)；[原始下载](https://opengameart.org/sites/default/files/legit_audio_fire_staff_-_free_0.zip)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 8.5, "originalSampleRate": 96000, "originalSubtype": "PCM_24", "cropStartSeconds": 0.02528344671201814, "cropEndSeconds": 0.6452834467120181, "reverse": false, "highpassHz": 160, "lowpassHz": 4700, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`17c6c2f116faa73e92f2e806a11e59886e956b1ea3095582a7e7043a5451ac89`；授权证据 `fire-staff-sound-effects.html`。

输出 SHA-256：`4606fd5808877a9eb031bac8e7b8b613c30b913d87507b026948d77ae5ef0e2c`；统一响度线性增益 0.428665。

### B · 火炬掠过

候选 `clips/skill-fire-b-v1-preview.wav`，实际 0.660000 秒，播放倍率 0.38，RMS 0.034252，最强50ms窗RMS 0.091953，峰值 0.250977。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`Waving Torch.wav`；保存路径 `torch-fire-spell/Waving Torch.wav`；原时长 4.295692 秒。
- 作者：spookymodem；[来源](https://opengameart.org/content/torch-fire-spell)；[原始下载](https://opengameart.org/sites/default/files/Waving%20Torch.wav)。
- [许可 CC-BY-3.0](https://creativecommons.org/licenses/by/3.0/)；署名作者、附来源与许可证链接、注明剪辑修改；禁止额外限制。
- 精确处理：`{"originalSeconds": 4.295691609977324, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.30505668934240365, "cropEndSeconds": 0.9650566893424036, "reverse": false, "highpassHz": 180, "lowpassHz": 4200, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`a027961cae4ffdeccfd497788b229dfe32547dcb32f30b8e0429976ae9e9ef57`；授权证据 `torch-fire-spell.html`。

输出 SHA-256：`b4779bc320bd8aee07c4941f81abc388905ef7185df409b5eec2d6fc9c567e4a`；统一响度线性增益 3.201815。

### C · 轻碎余烬

候选 `clips/skill-fire-c-v1-preview.wav`，实际 0.480000 秒，播放倍率 0.38，RMS 0.035311，最强50ms窗RMS 0.091954，峰值 0.580017。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`fire-1.wav`；保存路径 `fire-crackling/fire-1.wav`；原时长 2.870612 秒。
- 作者：AntumDeluge；[来源](https://opengameart.org/content/fire-crackling)；[原始下载](https://opengameart.org/sites/default/files/fire-1.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 2.870612244897959, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 1.9, "cropEndSeconds": 2.38, "reverse": false, "highpassHz": 220, "lowpassHz": 4000, "attackMs": 18.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`26702de8a195bcbafeae72034861d875a1b7917168a25106f4e1957ecdddf7e5`；授权证据 `fire-crackling.html`。

输出 SHA-256：`12de43c5e3535a245e4e05a95897e9c104b8f53d8f017e61ae663f8abc4480df`；统一响度线性增益 2.531563。

## 时间冻结 · skill.freeze

A 细霜裂纹；B 真实冰片向内凝聚；C 短晶体共鸣停驻。C 是铃的冻结隐喻，冰材质辨识交由试听。

cast 提交时立即冻结3秒：真实时序0ms播一次，持续期间安静；画面冰封本体约640ms出现。

### A · 细霜骤凝

候选 `clips/skill-freeze-a-v1-preview.wav`，实际 0.560000 秒，播放倍率 0.38，RMS 0.027342，最强50ms窗RMS 0.065447，峰值 0.580017。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`ice.wav`；保存路径 `ice-spells/ice.wav`；原时长 1.163900 秒。
- 作者：bart; original recording Stephan / pdsounds；[来源](https://opengameart.org/content/ice-spells)；[原始下载](https://opengameart.org/sites/default/files/icespells.zip)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 1.1639002267573697, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.0014285714285714286, "cropEndSeconds": 0.5614285714285714, "reverse": false, "highpassHz": 180, "lowpassHz": 5800, "attackMs": 6.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`c3039c864d056d0e4951b84b96a7bb0044ca8cb58aeae514fc256145872b6a94`；授权证据 `ice-spells.html`。

输出 SHA-256：`17255cfced2addeb25e1c53dd787ed51d3a841123947fb53a5cb9826c61450ab`；统一响度线性增益 0.993287。

### B · 冰片凝聚

候选 `clips/skill-freeze-b-v1-preview.wav`，实际 0.600000 秒，播放倍率 0.38，RMS 0.028584，最强50ms窗RMS 0.065447，峰值 0.267487。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`LedasLuzta5.ogg`；保存路径 `ice-breakingshattering/IceShatters/LedasLuzta5.ogg`；原时长 0.841723 秒。
- 作者：IgnasD；[来源](https://opengameart.org/content/ice-breakingshattering)；[原始下载](https://opengameart.org/sites/default/files/IceShatters_0.zip)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 0.8417233560090703, "originalSampleRate": 44100, "originalSubtype": "VORBIS", "cropStartSeconds": 0.042607709750566894, "cropEndSeconds": 0.6426077097505669, "reverse": true, "highpassHz": 220, "lowpassHz": 5000, "attackMs": 20.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`34adbcb652d578b870d5317ec974e9773266ddfd6b4bfc8499ec775e1712b603`；授权证据 `ice-breakingshattering.html`。

输出 SHA-256：`50756f2f49d4ba04fc36b39ea396c4f8f5223eac30d3cc3a2a05a7dfe4593019`；统一响度线性增益 0.259561。

### C · 晶鸣停驻

候选 `clips/skill-freeze-c-v1-preview.wav`，实际 0.580000 秒，播放倍率 0.38，RMS 0.027796，最强50ms窗RMS 0.065447，峰值 0.241882。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`bell_ding4.wav`；保存路径 `bell-dingschimes/bell_ding4.wav`；原时长 2.316190 秒。
- 作者：PWL；[来源](https://opengameart.org/content/bell-dingschimes)；[原始下载](https://opengameart.org/sites/default/files/bell_ding4.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 2.316190476190476, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.025714285714285714, "cropEndSeconds": 0.6057142857142858, "reverse": false, "highpassHz": 280, "lowpassHz": 5600, "attackMs": 6.0, "releaseMs": 120.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`b06e837aa5e5b626eba32ad87264b577164e2eab3b9180a955345d06197b6876`；授权证据 `bell-dingschimes.html`。

输出 SHA-256：`27eb97e6395e9958e9dc58e5a24a0e9003e7885f032ffb1748c405a43c3e69fe`；统一响度线性增益 0.595357。

## 黑洞吸引 · skill.blackhole

A 连续风面收缩；B 竹杖空气反卷；C 近场气流漩涡。无持续低频、无长循环。

真实 card-change 开始420ms方块牵引；空闲棋盘可在0ms生效，忙碌或冻结时等真实事件。视觉本体不早于640ms。

### A · 柔面收缩

候选 `clips/skill-blackhole-a-v1-preview.wav`，实际 0.560000 秒，播放倍率 0.38，RMS 0.106197，最强50ms窗RMS 0.160000，峰值 0.362396。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`wind woosh loop.ogg`；保存路径 `wind-whoosh-loop/wind woosh loop.ogg`；原时长 5.959292 秒。
- 作者：SketchMan3；[来源](https://opengameart.org/content/wind-whoosh-loop)；[原始下载](https://opengameart.org/sites/default/files/wind%20woosh%20loop.ogg)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 5.959291666666667, "originalSampleRate": 48000, "originalSubtype": "VORBIS", "cropStartSeconds": 0.4, "cropEndSeconds": 0.96, "reverse": false, "highpassHz": 260, "lowpassHz": 3900, "attackMs": 100.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`0cfdbd3f21ed449689a9024264edf267d0037a6495813a7010827672ec191dac`；授权证据 `wind-whoosh-loop.html`。

输出 SHA-256：`485e124190bb0dd822484410795ebf3af10994d2dea555f1f9b51bbeb8d2881d`；统一响度线性增益 4.891394。

### B · 空气反卷

候选 `clips/skill-blackhole-b-v1-preview.wav`，实际 0.620000 秒，播放倍率 0.38，RMS 0.074854，最强50ms窗RMS 0.159999，峰值 0.429626。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`swosh-28.flac`；保存路径 `swish-bamboo-stick-weapon-swhoshes/swosh-28.flac`；原时长 1.535510 秒。
- 作者：qubodup / Iwan Gabovitch；[来源](https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes)；[原始下载](https://opengameart.org/sites/default/files/swoshes.7z)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 1.5355102040816326, "originalSampleRate": 44100, "originalSubtype": "PCM_24", "cropStartSeconds": 0.09342403628117914, "cropEndSeconds": 0.7134240362811791, "reverse": true, "highpassHz": 220, "lowpassHz": 4800, "attackMs": 45.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`cce797041738f3da47751864391a0a010c33cede19e5aaf2bb05d422dbadac0b`；授权证据 `swish-bamboo-stick-weapon-swhoshes.html`。

输出 SHA-256：`df706f2a0d65bbe160686bae7497020e7646de277e0161e6b45732c079141049`；统一响度线性增益 2.517847。

### C · 近场漩涡

候选 `clips/skill-blackhole-c-v1-preview.wav`，实际 0.580000 秒，播放倍率 0.38，RMS 0.082106，最强50ms窗RMS 0.160000，峰值 0.548157。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`whoosh2.wav`；保存路径 `air-whoosh/whoosh2_0.wav`；原时长 5.246599 秒。
- 作者：pyranostudios；[来源](https://opengameart.org/content/air-whoosh)；[原始下载](https://opengameart.org/sites/default/files/whoosh2_0.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 5.246598639455782, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 1.8, "cropEndSeconds": 2.38, "reverse": false, "highpassHz": 280, "lowpassHz": 4300, "attackMs": 60.0, "releaseMs": 70.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`d3fbff5bb78b289af16b2dfa29083f07ef83b0cbaff4514c48dfda16d082b468`；授权证据 `air-whoosh.html`。

输出 SHA-256：`a0c87913836a03c1411b83f0ecb11f3b84e9d50cd4aca0b7600649357d7b43fc`；统一响度线性增益 3.670105。

## 幸运星 · skill.luck

A 温暖单铃，反馈最集中；B 三个真实竖琴采样的小型和弦，拨弦更明显；C 微光泛音更细密。

cast时激活10秒、22%特殊补充概率；只在激活时响一次，不每次补充方块再响。

### A · 暖星单铃

候选 `clips/skill-luck-a-v1-preview.wav`，实际 0.640000 秒，播放倍率 0.38，RMS 0.080801，最强50ms窗RMS 0.160000，峰值 0.553375。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`bell_ding1.wav`；保存路径 `bell-dingschimes/bell_ding1.wav`；原时长 2.078186 秒。
- 作者：PWL；[来源](https://opengameart.org/content/bell-dingschimes)；[原始下载](https://opengameart.org/sites/default/files/bell_ding1.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核仍保留作者与来源。
- 精确处理：`{"originalSeconds": 2.078185941043084, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.10414965986394557, "cropEndSeconds": 0.7441496598639455, "reverse": false, "highpassHz": 120, "lowpassHz": 5600, "attackMs": 6.0, "releaseMs": 130.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`8ce40f49cd211125303df59db0da4fe911e8b2f34d3847011b15137c6b5850de`；授权证据 `bell-dingschimes.html`。

输出 SHA-256：`1363485bcb20c4cc717f464b645fe4f8e88574d4437e7ad7bb8c57be75b141d9`；统一响度线性增益 5.384224。

### B · 竖琴祝福

候选 `clips/skill-luck-b-v1-preview.wav`，实际 0.720000 秒，播放倍率 0.38，RMS 0.087734，最强50ms窗RMS 0.160000，峰值 0.439941。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。三颗真实竖琴音符离线混成单条；非跨来源堆叠。

- 原件：`KSHarp_C5_mf.wav`；保存路径 `vsco-harp/KSHarp_C5_mf.wav`；原时长 7.013016 秒。
- 作者：VSCO 2 CE: Sam Gossner & Simon Dalzell; sample cutting Elan Hickler / Soundemote (repository credits)；[来源](https://github.com/sgossner/VSCO-2-CE)；[原始下载](https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Strings/Harp/KSHarp_C5_mf.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核保留采样与编排来源。
- 精确处理：`{"originalSeconds": 7.013015873015873, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.02235827664399093, "cropEndSeconds": 0.7423582766439909, "reverse": false, "highpassHz": 100, "lowpassHz": 6000, "attackMs": 6.0, "releaseMs": 150.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`7c8b862f6fd3f1442ed87537af976d84bda8c05a5b4900e8907d570b5202a517`；授权证据 `vsco-harp/README.md`。

- 原件：`KSHarp_E5_mf.wav`；保存路径 `vsco-harp/KSHarp_E5_mf.wav`；原时长 6.641383 秒。
- 作者：VSCO 2 CE: Sam Gossner & Simon Dalzell; sample cutting Elan Hickler / Soundemote (repository credits)；[来源](https://github.com/sgossner/VSCO-2-CE)；[原始下载](https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Strings/Harp/KSHarp_E5_mf.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核保留采样与编排来源。
- 精确处理：`{"originalSeconds": 6.6413832199546485, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.02140589569160998, "cropEndSeconds": 0.6663945578231293, "reverse": false, "highpassHz": 100, "lowpassHz": 6000, "attackMs": 6.0, "releaseMs": 150.0, "mixDelaySeconds": 0.075, "mixGain": 0.55}`。
- 原件 SHA-256：`95dd9ddb0bd15bee7687906e00f25aafcaa43020cc9501f0e8b6cabf0e9a53ec`；授权证据 `vsco-harp/README.md`。

- 原件：`KSHarp_G5_mf.wav`；保存路径 `vsco-harp/KSHarp_G5_mf.wav`；原时长 5.950862 秒。
- 作者：VSCO 2 CE: Sam Gossner & Simon Dalzell; sample cutting Elan Hickler / Soundemote (repository credits)；[来源](https://github.com/sgossner/VSCO-2-CE)；[原始下载](https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Strings/Harp/KSHarp_G5_mf.wav)。
- [许可 CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；CC0，无强制署名；本审核保留采样与编排来源。
- 精确处理：`{"originalSeconds": 5.950861678004535, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.0181859410430839, "cropEndSeconds": 0.5881859410430839, "reverse": false, "highpassHz": 100, "lowpassHz": 6000, "attackMs": 6.0, "releaseMs": 150.0, "mixDelaySeconds": 0.15, "mixGain": 0.42}`。
- 原件 SHA-256：`f2004dfc617997fbabc6f849add2af06f4f859361c44a8fca0f993dc7f999540`；授权证据 `vsco-harp/README.md`。

输出 SHA-256：`1734ec6f22cbb47a37e308670f8cf7faa782830fbe9b82e87068ff97f901b70a`；统一响度线性增益 4.719666。

### C · 微光祝福

候选 `clips/skill-luck-c-v1-preview.wav`，实际 0.620000 秒，播放倍率 0.38，RMS 0.095514，最强50ms窗RMS 0.160000，峰值 0.542633。

单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。单一原始录音，不叠层。

- 原件：`shimmer_1.flac`；保存路径 `shimmer-glitter-magic/shimmer_1.flac`；原时长 0.658367 秒。
- 作者：The Berklee College of Music; submitted by qubodup；[来源](https://opengameart.org/content/shimmer-glitter-magic)；[原始下载](https://opengameart.org/sites/default/files/shimmer_1.flac)。
- [许可 CC-BY-3.0](https://creativecommons.org/licenses/by/3.0/)；署名作者、附来源与许可证链接、注明剪辑修改；禁止额外限制。
- 精确处理：`{"originalSeconds": 0.6583673469387755, "originalSampleRate": 44100, "originalSubtype": "PCM_16", "cropStartSeconds": 0.0, "cropEndSeconds": 0.62, "reverse": false, "highpassHz": 100, "lowpassHz": 5600, "attackMs": 6.0, "releaseMs": 100.0, "mixDelaySeconds": 0, "mixGain": 1}`。
- 原件 SHA-256：`b6802e6ef22189058a4406ae5c7bda9a54c47e908fad3fd6212650c1aa0170af`；授权证据 `shimmer-glitter-magic.html`。

输出 SHA-256：`2f8dc599557196ffdc06bf7cf0780491bb24aac63165cd2d803d38b589eaf192`；统一响度线性增益 1.296038。
