# 已确认视觉锚点索引

2026-10-12已确认并正式接入：12张技能本体采用当前审核稿；贤者时间选择“金色蒙层＋底层透光”，底光位于地形之后、方块之前。裂地采用落点所在横排的有效普通方块；迷雾采用落点附近12个有效普通格的一团大雾，6秒控制结束后1.2秒仅视觉消散。幸运星保持亮金色、原10秒22%特殊补充概率，幸运星与超载仅使用左侧大图标和真实倒计时。正式路径及接入约定见 docs/SKILL-BODY-INTEGRATION.md。


不移动正式素材，避免破坏运行路径。以下相对路径从仓库根目录计算；本目录是固定来源索引，后续任务必须同时查看规范和相应原图。

## 背景、棋盘与地图（已确认）

- 总体初始参考：`references/block-brawl-art-direction.png`；森林实际资源：`dist/assets/jungle-scenery.webp`、`dist/assets/jungle-frame.webp`、`dist/assets/toy-board.svg`。
- 悬崖：`dist/assets/maps/cliff-canyon.svg`、`cliff-stage-left.svg`、`cliff-stage-right.svg`、`cliff-board.svg`。
- 冰晶：`dist/assets/maps/crystal-landscape.svg`、`crystal-stage.svg`、`crystal-board.svg`。
- 遗迹：`dist/assets/maps/ruins-temple.svg`、`ruins-stage.svg`、`ruins-board.svg`。
- 熔炉：`dist/assets/maps/furnace-hall.svg`、`furnace-stage.svg`、`furnace-board.svg`。
- 当前绑定与历史说明：`dist/maps.mjs`、`dist/theme.mjs`、`ART.md`。确认依据是当前正式绑定及用户锁定环境方向；这些资源本轮不改。
- `art-preproduction/painted-map-polish/` 和部分 `references/maps/*-source.png` 是历史候选，不应当作当前采用稿；见 ART.md 中“未采用”的记录。

## 已确认卡牌体系

- 完整12张原画：`art-preproduction/card-reference-v3/cards/*.png`。
- 用户确认的三张并排基准：`art-preproduction/cast-fx-stage3/spec/approved-card-baseline.png`。
- 保留内容：卡框、红金/蓝金/青金分组、标题及说明文字、整体卡面体系。
- 本轮技能画窗重做版本：`art-preproduction/cards-soft-c/`，状态为集成审稿稿，不能写成用户新确认。

## 已锁定方案C

最新选定：裂地采用横排方案“裂地横扫”。贤者时间已确认底层透光，正式默认开启，审核页支持“仅金色蒙层 / 加底层透光”比较；底光在方块后面上涌。其他已调整效果保持上轮结果，现已接入正式游戏。

最新全技能审核入口：`art-preproduction/skill-body-complete-v1/index.html`。幸运星已按最新要求恢复亮金色与原10秒22%概率增益，和彩虹核心万能块区分；幸运与超载仅左侧大图标及倒计时；贤者时间保留简单整盘金色蒙层并采用已确认背景底光，复杂交错光带已否定；迷雾为命中原地一团大雾，6秒持续后慢散。裂地已选横排，其他3个方案只作历史回看。全部已完成审稿，现已接入正式对局。原4张v3入口保留供追溯。

2026-10-12最新可见度修订：用户反馈当前技能本体太浅、太透明，要求主体颜色更实、更容易看清；方案C的克制保留在范围、节奏与数量上，不以特别浅的色调或高透明作为默认。最新v3按追加要求将冻结改为冰壳、晶角与霜裂，其他3张继续仅调色和alpha，四张范围与节奏不改。审稿入口仍为 `art-preproduction/skill-body-soft-v1/index.html`，当前图集版本以该目录manifest为准，支持同一帧对比上一版v2。历史“浅色、清透”描述遇到冲突时让位于此修订。

用户2026-10-12本轮文字要求是方向确认来源：柔和、克制、清透、精致、轻幻想、雅致、不刺眼、不喧宾夺主。它覆盖原画中强光、爆橙、繁密粒子的旧处理，但不推翻卡框体系。

没有单独已确认的“方案C终稿参考图”；不虚构来源。本轮小样与最终预览记录在 `art-preproduction/cards-soft-c/` 和 `validation/2026-10-12/art-soft-c/`，后续用户明确确认后再更新此索引。

## 释放效果历史来源

`art-preproduction/cast-fx-stage3/` 是旧版图集与动画库，仅供比较及回退；当前方案C版本按新特效规范执行，不能用旧图集覆盖新版本。

2026-10-12最新确认与接入：用户要求v2放大审稿稿再放大到1.5倍，并把进攻改得偏红，随后接入。正式效果源为 `dist/effect_cast_soft_v3_final.mjs`，登记于 `art-preproduction/cast-soft-v3/manifest.json`。进攻柔和浅红金、控制浅蓝白、强化奶金白。v1过淡版与v2审稿版保留作历史参考；当前查看 `art-preproduction/cast-soft-v3/index.html`。
