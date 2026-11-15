"""游戏层构建（Claude 写）：先跑 build.py 出战斗版 dist/index.html，再拼进各种探究屏和章节流程，写 dist/game.html。
build.py、engine.* 不动；新屏都在 v6/scr-*.html、v6/mode-*.js、v6/game*.js、v6/game.css。
用法：python3 v6/build_game.py   （在 MOCKUP-20261104-adventure-cardgame 下）"""
import json, subprocess, sys
from pathlib import Path
R = Path(__file__).resolve().parent.parent; V = R / 'v6'; OUT = V / 'dist'
subprocess.run([sys.executable, str(V / 'build.py')], check=True, cwd=R)
html = (OUT / 'index.html').read_text(encoding='utf-8')
SCREENS = ['scr-garden.html', 'scr-explore.html', 'scr-boss.html', 'scr-ruin.html', 'scr-story.html', 'scr-map.html']
MODES = ['game.js', 'mode-garden.js', 'mode-explore.js', 'mode-boss.js', 'mode-ruin.js', 'mode-story.js', 'mode-map.js', 'mode-record.js', 'game-boot.js']
CH = R / '关卡/第一章'
def load(sub):
    out = {}
    for f in sorted((CH / sub).glob('*.json')):
        d = json.loads(f.read_text(encoding='utf-8')); out[d['id']] = d
    return out
extra = {'explore': load('探路'), 'boss': load('领主'), 'ruin': load('遗迹')}
# 剧情：学习剧情 17 集（回收-L*-修订.json，主讲取自第一季大纲）、序章剧本；黑板要用的卡、原子、学法、数学图
import shutil
season = json.loads((R / '设定集/第一季大纲.json').read_text(encoding='utf-8'))
lead = {e['课']: e['主讲'] for e in season['集']}
eps = {}
for f in sorted((R / 'gemini/学习剧情材料-R3').glob('回收-L*-修订.json')):
    e = json.loads(f.read_text(encoding='utf-8'))
    eps[e['课']] = {'集': e['集'], '集名': e['集名'], '卡': e['覆盖的卡'], '主讲': lead[e['课']], '剧本': e['剧本']}
D = json.loads((R / 'v4/data-inequality.json').read_text(encoding='utf-8'))
extra['eps'] = eps
extra['chapter'] = json.loads((CH / '章节.json').read_text(encoding='utf-8'))
extra['vn'] = json.loads((R / 'gemini/回收/剧情-修订-R3.json').read_text(encoding='utf-8'))
extra['atoms'] = {a['id']: {k: a.get(k) for k in ('kind', 'name', 'say', 'why', 'fail', 'look', 'do')} for a in D['atoms']}
extra['strategies'] = {x['name']: {k: x.get(k) for k in ('one', 'when', 'boundary', 'group')} for x in D['strategies']}
extra['cards'] = {c['n']: {'name': c['name'], 'q': c['q'], 'steps': [{k: st.get(k) for k in ('can', 'simpler', 'want', 'est', 'do', 'check')} for st in c['steps']]} for c in D['cards']}
extra['figs'] = {f.stem: f.read_text(encoding='utf-8') for f in sorted((R / '素材/图').glob('*.svg'))}
IMG = OUT / 'img'; (IMG / 'vn').mkdir(exist_ok=True); faces = {}
for f in sorted((R / '素材/立绘').glob('*-*.webp')):
    if f.stem.startswith('ph-'): continue
    who, face = f.stem.split('-', 1); faces.setdefault(who, []).append(face); shutil.copy(f, IMG / 'vn' / f.name)
extra['faces'] = faces
for src in [R / 'v3/assets', R / '素材']:
    for f in src.glob('bg-*.webp'):
        if not (IMG / f.name).exists() or src.name == '素材': shutil.copy(f, IMG / f.name)
(OUT / 'assets').mkdir(exist_ok=True)
for f in (R / 'v3/assets').glob('bgm-*.mp3'): shutil.copy(f, OUT / 'assets' / f.name)
scr = '\n'.join((V / s).read_text(encoding='utf-8') for s in SCREENS)
js = '\n'.join(f'/* ---- {m} ---- */\n' + (V / m).read_text(encoding='utf-8') for m in MODES)
anchor = '  <div class="abs dev" id="dev" hidden></div>'
assert html.count(anchor) == 1 and html.count('</style>') == 1 and html.rstrip().endswith('</script>')
html = html.replace(anchor, scr + '\n' + anchor).replace('</style>', (V / 'game.css').read_text(encoding='utf-8') + '\n</style>')
html = html.rstrip() + '\n<script>\n"use strict";\nconst DATA2=' + json.dumps(extra, ensure_ascii=False) + ';\n' + js + '\n</script>\n'
(OUT / 'game.html').write_text(html, encoding='utf-8')
print(f'built {OUT/"game.html"}: {len(html)} chars; screens {len(SCREENS)}; modes {len(MODES)}')
