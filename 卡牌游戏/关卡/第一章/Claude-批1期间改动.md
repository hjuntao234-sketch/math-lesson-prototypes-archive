# 批 1 进行期间 Claude 的改动（2026-11-06）

给 GPT 和审读用：批 1 任务稿发出后，下面这些文件是 Claude 新建的，不算 GPT 越权，也不在批 1 的可写范围里。批 1 任务稿钉住的文件一个没改（哈希照旧：engine.js 015fcda4…、engine.html e9bb00a0…、build.py 6249751f…、v6.css 6339d5d9…、p2-1.json 98abccee…、check_levels.py 70b1f98c…、格式.md dd23544d…）。

- 游戏层：`v6/build_game.py`（先跑 build.py，再写 `v6/dist/game.html`）、`v6/game.js`、`v6/game.css`、`v6/game-boot.js`、`v6/mode-garden|explore|boss|ruin|story|map|record.js`、`v6/scr-garden|explore|boss|ruin|story|map.html`。
- 格式和检查：`关卡/格式-探究.md`、`关卡/check_modes.py`。
- 数据：`关卡/第一章/章节.json`、`探路/7.json`、`领主/b.json`、`遗迹/many.json`、`战斗/p1-1.json`、`战斗/p3-1.json`。
- 素材：`素材/守卫/p1/`、`素材/守卫/p3/`（都用 p2 的底子，只有 guard.json 和 pivots.json）。
- 规则：`设定集/战斗规则-v3.md`。

注意：`v6/build.py` 每次都会清空 `v6/dist/`。跑过它以后，要再跑一次 `python3 v6/build_game.py` 才有 game.html。
