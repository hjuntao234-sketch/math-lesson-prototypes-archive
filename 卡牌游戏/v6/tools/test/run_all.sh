#!/bin/bash
# 一键回归。在 MOCKUP-20261104-adventure-cardgame 下运行：bash v6/tools/test/run_all.sh
# 约 5 分钟。一场一场跑，每场有超时，跑完清掉无头 Chrome。任何一行出现 NOEL、NOCARD、CRASH、失败，或 errors 不是 []，都算没过。
set -euo pipefail
MODE="${1:-all}"
if [[ "$MODE" != "all" && "$MODE" != "--static-only" ]]; then echo "用法: $0 [--static-only]"; exit 2; fi
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
NODE="${NODE:-$(command -v node || echo /Applications/Codex.app/Contents/Resources/cua_node/bin/node)}"
OUT="$(mktemp -d)"; echo "截图放在 $OUT"
clean() { pkill -9 -f "remote-debugging-port=0" 2>/dev/null; true; }
step() { echo; echo "-- $1"; }
step "数据和数学"; python3 关卡/check_deck.py | tail -4
step "构建"; python3 v6/build_game.py 2>&1 | tail -1 | cut -c1-120
step "筛选脚本（假 API）"; python3 v6/tools/test/test_screen.py | tail -3
step "抽象函数独立验算"; python3 v6/tools/test/abstract_math.py
step "抽象函数证明核"; "$NODE" v6/tools/test/abstract_core_t.cjs
step "纸面事件逻辑（模拟 DOM，不是浏览器）"; "$NODE" v6/tools/test/paper_flow_t.cjs
step "椭圆画布指令回归（模拟 Canvas，不是截图）"; "$NODE" v6/tools/test/paper_draw_t.cjs
if [[ "$MODE" == "--static-only" ]]; then
  echo "STATIC PASS；浏览器/真实鼠标键盘/旧关回放未运行，不代表 run_all 全部通过。"
  exit 0
fi
for t in paper_t abstract_t teacher_screen_t; do
  step "$t"; perl -e 'alarm shift; exec @ARGV' 300 "$NODE" "v6/tools/test/$t.cjs" "$ROOT/v6" "$OUT" > "$OUT/$t.log" 2>&1
  cat "$OUT/$t.log"
  if grep -E 'NOEL|NOCARD|CRASH|失败|errors \[[^]]' "$OUT/$t.log"; then exit 1; fi
  clean
done
step "旧关回放"; perl -e 'alarm shift; exec @ARGV' 200 "$NODE" v6/tools/autoplay.cjs clean p2-1 18-1 2>&1 | tail -1 | cut -c1-200; clean
echo; echo "跑完了。"
