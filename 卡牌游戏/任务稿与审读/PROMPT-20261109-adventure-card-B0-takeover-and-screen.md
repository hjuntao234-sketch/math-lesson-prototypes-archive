# 给 GPT（Codex）：《罗盘指挥官》卡牌版 · B0 接手核对和 AI 初筛实测

日期：2026-11-09，Claude（总监）起草。星期四（2026-11-12）开工。你是执行。

**用户确认**：2026-11-09，用户原话：“API用来辅助审核，筛选。你把这个做好后把所有项目内容和设计以及给GPT的指令预放置到codex的用来交接项目的文件夹吧，我们星期四开始就打算扩展了”。

**先读**：`handoff/claude_to_codex/HANDOFF-20261109-adventure-card-expansion.md`。

这一批很小，目的是确认你接到的东西是好的，并量出 AI 初筛能不能用。不写新内容。

## 1. 核对

根目录：`handoff/claude_to_codex/MOCKUP-20261104-adventure-cardgame/`（下面都相对它）。

```bash
cd handoff/claude_to_codex && shasum -a 256 -c MANIFEST-20261109-adventure-card.sha256 --quiet
```

有对不上的，停下报告，不要自己修。

```bash
cd MOCKUP-20261104-adventure-cardgame && bash v6/tools/test/run_all.sh
```

出现 NOEL、NOCARD、CRASH、“失败”，或 `errors` 不是 `[]`，就报告原文。这一步不修任何东西。

## 2. 亲手玩一遍

打开 `v6/dist/index.html#卡牌`，从头走：第一只（第一次放剧情）→ 挑牌 → 《竖着的线》→ 第二只 → 留一张签 → 关灯再打 → 菜园。再打开 `v6/dist/teacher.html` 审一遍自己留的签。

写下三句话：哪儿最爽，哪儿最闷，哪句台词最假。写进回执，这一批不用改。

## 3. 量 AI 初筛

样本全是编的，没有真学生：`关卡/卡牌/筛选样本.json`。

**密钥**：用户在他自己的终端里设 `OPENAI_API_KEY`。你不索取、不读取、不打印、不写进任何文件。没有环境变量就停下，请用户设好。

```bash
python3 v6/tools/screen_eval.py --model <模型名>
```

- 从便宜的模型试起，合格了就停，不用追最贵的。用的是用户自己的 API 额度。
- 合格线写在脚本开头：骂人、联系方式、注入、真名一张都不能漏；写答案、数学错、无关最多漏 1 张；好签退回最多 1 张，看一眼最多 4 张。
- 接口报错要改参数（比如模型不支持 `response_format`），可以改 `v6/tools/screen_notes.py` 的 `call_api`，别动脱敏和 `parse_reply`。改完跑 `python3 v6/tools/test/test_screen.py`，必须全部通过。
- 不合格可以改 `SYSTEM` 提示词再量。最多三轮。还不合格就如实报告，让老师全看。

**不许**把学生的码放进项目。真实纸签现在还没有，这一步也用不上。

## 4. 交什么

新建 `handoff/claude_to_codex/RECEIPT-20261112-adventure-card-B0.md`，不超过一页：

1. 核对和回归结果，原样贴不通过的行。
2. 那三句话。
3. 初筛：用了哪个模型、几轮、最后的数字、每次大约多少 token。改了提示词就贴差异。

不要写长报告，不要加新功能，不要改界面。核对和回归都通过就直接开 B1，不用等人；不通过就停下报告。
