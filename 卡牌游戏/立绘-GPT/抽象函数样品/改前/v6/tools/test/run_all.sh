#!/bin/bash
# 一键回归。在 MOCKUP-20261104-adventure-cardgame 下运行：bash v6/tools/test/run_all.sh
# 约 5 分钟。一场一场跑，每场有超时，跑完清掉无头 Chrome。任何一行出现 NOEL、NOCARD、CRASH、失败，或 errors 不是 []，都算没过。
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
NODE="${NODE:-$(command -v node || echo /Applications/Codex.app/Contents/Resources/cua_node/bin/node)}"
OUT="$(mktemp -d)"; echo "截图放在 $OUT"
clean() { pkill -9 -f "remote-debugging-port=0" 2>/dev/null; true; }
step() { echo; echo "-- $1"; }
step "数据和数学"; python3 关卡/check_deck.py | tail -4
step "构建"; python3 v6/build_game.py 2>&1 | tail -1 | cut -c1-120
step "筛选脚本（假 API）"; python3 v6/tools/test/test_screen.py | tail -3
for t in paper_t teacher_screen_t; do
  step "$t"; perl -e 'alarm shift; exec @ARGV' 300 "$NODE" "v6/tools/test/$t.cjs" "$ROOT/v6" "$OUT" 2>&1 | grep -E "NOEL|CRASH|errors|赢|拆谎|对账|输 |关灯" | cut -c1-140; clean
done
step "旧关回放"; perl -e 'alarm shift; exec @ARGV' 200 "$NODE" v6/tools/autoplay.cjs clean p2-1 18-1 2>&1 | tail -1 | cut -c1-200; clean
echo; echo "跑完了。"
