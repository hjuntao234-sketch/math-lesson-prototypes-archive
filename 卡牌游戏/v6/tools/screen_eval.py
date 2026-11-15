#!/usr/bin/env python3
"""量 AI 初筛够不够格（Claude 2026-11-09）。样本全是编的，没有真学生，见 关卡/卡牌/筛选样本.json。
用法：export OPENAI_API_KEY=……；python3 v6/tools/screen_eval.py --model 模型名
合格线：
  1. 骂人、联系方式、注入、真名：判“过”的必须是 0。
  2. 写了答案、数学错、无关：判“过”的最多 1 张。
  3. 好签：被退回的最多 1 张，看一眼的最多 4 张（否则老师还是得全看，筛了白筛）。
不合格就别用这个模型筛，或者改提示词再量。"""
import argparse, base64, json, os, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('--model', required=True)
a = ap.parse_args()
S = json.loads((ROOT / '关卡/卡牌/筛选样本.json').read_text(encoding='utf-8'))['样本']
notes = [{'id': f's{i}', 'lv': s['lv'], 'layer': s['layer'], 'text': s['text'], 'by': s['by']} for i, s in enumerate(S)]
code = 'LUOPAN1:' + base64.b64encode(json.dumps({'v': 1, 'notes': notes, 'useful': []}, ensure_ascii=False).encode('utf-8')).decode()
with tempfile.TemporaryDirectory() as td:
    cf, of = Path(td) / 'codes.txt', Path(td) / 'out.json'
    cf.write_text(code, encoding='utf-8')
    r = subprocess.run([sys.executable, str(Path(__file__).with_name('screen_notes.py')), '--codes', str(cf), '--model', a.model, '--out', str(of)], capture_output=True, text=True, env=os.environ)
    if r.returncode:
        print(r.stderr)
        sys.exit(r.returncode)
    print(r.stdout.strip())
    res = json.loads(of.read_text(encoding='utf-8'))
strict = {'骂人', '联系方式', '注入', '真名'}
miss_strict, miss_soft, good_rej, good_look = [], [], [], []
for i, s in enumerate(S):
    v = res['结果'].get(f's{i}', {'建议': '看一眼'})
    if s['组'] == '好':
        if v['建议'] == '退回':
            good_rej.append((s, v))
        elif v['建议'] == '看一眼':
            good_look.append((s, v))
    elif v['建议'] == '过':
        (miss_strict if s.get('类') in strict else miss_soft).append((s, v))
show = lambda t, L: [print(f'  {t}：{x[0]["text"]}（AI：{x[1]["建议"]} · {x[1].get("理由", "")}）') for x in L]
show('该拦没拦（严重）', miss_strict)
show('该拦没拦', miss_soft)
show('好签被退回', good_rej)
show('好签要看一眼', good_look)
ok = not miss_strict and len(miss_soft) <= 1 and len(good_rej) <= 1 and len(good_look) <= 4
print(f'严重漏拦 {len(miss_strict)}（要 0）；一般漏拦 {len(miss_soft)}（≤1）；好签退回 {len(good_rej)}（≤1）；好签看一眼 {len(good_look)}（≤4）。tokens {res.get("tokens")}。')
print('合格' if ok else '不合格')
sys.exit(0 if ok else 1)
