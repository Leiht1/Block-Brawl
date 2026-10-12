# 方案C交付简报

## 规范入库

新增根目录 `AGENTS.md`，加入三份美术规范必读、未读不得生成、先小样审核再扩展、不得新引风格、方案C锁定、保护既有环境与玩法的规则。

新增 `docs/art/方块乱斗美术总规范.md`、`卡牌技能美术规范.md`、`特效制作规范.md`、`素材命名规范.md`；`docs/art/reference/README.md` 索引当前正式环境、棋盘、v3卡框及方案C文字确认来源，明确区分未采用的地图候选与本轮待审稿资源。旧 `ART.md`、卡牌外观/释放文档加入当前规范入口，历史记录保留。

## 美术修改

全部12张技能画窗重做，保留原卡框、字形、文字和类型。来源为内置imagegen，原稿和完整提示词保存在 `art-preproduction/cards-soft-c/`；`manifest.json` 登记版本v4、preview状态、运行路径与装配画窗。先审核火浪小样并修正过亮，再扩展11张独立构图。

通用释放改用 `dist/effect_cast_soft_v1_preview.mjs`：浅色小光球、半透明细线拖尾、贴地空心涟漪、短余辉；三类只微调浅色。尺寸随实际格子缩放，不用高亮叠加，不绘制旧厚重图集。保持手牌起点、实际目标、排队落点和960ms原时序，不修改技能本体和规则。

卡面已接入 `dist/assets/cards/`，导出脚本读取当前v4 manifest，避免重建恢复旧图。根目录 `方块乱斗-最新版.html` 已同步更新。

## 预览

- `index.html`：卡牌旧/新对比、正式116×153手牌尺寸、释放暂停/进度/三类切换、实际棋盘截图叠加和目标格放大。
- `art-preproduction/cards-soft-c/card_preview_soft_v4_preview.png`：全部12张大图。
- `art-preproduction/cards-soft-c/card_hand_soft_v4_preview.png`：手牌缩图。
- `card-selection.png`、`battle-baseline.png`：实际选牌页、六张重点手牌。
- `attack/control/buff-{activation,release,flight,impact}.png`：三类真实拖放截图，保留既有技能本体。
- `attack/control/buff-simulation.png`：通用释放单独叠在实际棋盘上。

打开本地服务后访问 `/validation/2026-10-12/art-soft-c/index.html`。本轮已打开5186端口审稿页。

## 最小验证

`scripts/validate-soft-card-art.mjs` 六项专项检查通过，报告 `report.json`：规范与AGENTS、55份受保护文件、12张画窗外像素、实际选牌/手牌、三类真实拖放、交互预览。页面错误与资源404均为0。

`tests/card-cast-vfx.test.mjs` 与 `tests/offline-cards.test.mjs` 共10项检查通过；包含原手牌位置、排队真实目标、取消/清理、旧素材归档保留、离线语法和来源哈希。不做无关全量回归。原画与运行卡面分别保留；离线构建仍携带旧图集归档，但正式释放不会加载/绘制它们。

待用户继续审稿：冰封钟面、黑洞核心缩图占比、浅色释放的可见度。新稿均标preview，后续获明确终稿确认再更改状态。
