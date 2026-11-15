"""Claude 2026-11-04：生成小样 v4（写到上一级的 index.html，保持同一个发布地址）。
- 不等式数据：data-inequality.json（v4 起含每张卡的变式和题库题，不含真题）
- 剧情：../gemini/回收/剧情-修订-R3.json（Gemini 初稿，Claude 修订；R2 换名字，R3 重写序幕和序章各关前后）
- 图、配乐：沿用 ../v3/assets 里处理好的；图内嵌成 data URI，配乐复制到上一级 assets/"""
from pathlib import Path
import base64, json, shutil

H = Path(__file__).resolve().parent
OUT = H.parent
A = OUT / 'v3' / 'assets'
dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
data = json.loads((H / 'data-inequality.json').read_text(encoding='utf-8'))
vn = json.loads((OUT / 'gemini/回收/剧情-修订-R3.json').read_text(encoding='utf-8'))
NEW = OUT / '素材'   # 11-04 第 2 批：雅娜、塔莉的表情，新背景 5 张（设定集/process_art.py 生成）
files = [p for p in sorted(A.glob('*.webp')) if not p.stem.startswith('ahua-')] + sorted(NEW.glob('*.webp'))
# 11-05：GPT 全员立绘 62 张 + 14 张头像（ph-<id>），放在 素材/立绘/；排在最后，同名的（雅娜、塔莉）盖掉 Gemini 旧图
files += sorted((NEW / '立绘').glob('*.webp'))
img = {p.stem: 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode() for p in files}
# 学习剧情：只打包审读修订过的（回收-Lxx-修订.json）；主讲从大纲取
season = json.loads((OUT / '设定集/第一季大纲.json').read_text(encoding='utf-8'))
lead = {e['课']: e['主讲'] for e in season['集']}
eps = {}
for f in sorted((OUT / 'gemini/学习剧情材料-R3').glob('回收-L*-修订.json')):
    e = json.loads(f.read_text(encoding='utf-8'))
    eps[e['课']] = {'集': e['集'], '集名': e['集名'], '卡': e['覆盖的卡'], '主讲': lead[e['课']], '剧本': e['剧本']}
src = (H / 'game.html').read_text(encoding='utf-8')
fig = {p.stem: p.read_text(encoding='utf-8') for p in sorted((OUT / '素材/图').glob('*.svg'))}   # 设定集/make_figs.py 画的数学图
# 11-06：剧情战斗（弱点击破 + 回合 + 剧情选项）的剧本，剧本/战斗-<关>.json
sb = {}
for f in sorted((OUT / '剧本').glob('战斗-*.json')):
    d = json.loads(f.read_text(encoding='utf-8')); sb[d['关']] = d
for k, v in (('__DATA__', data), ('__VN__', vn), ('__IMG__', img), ('__EPS__', eps), ('__FIG__', fig), ('__SB__', sb)):
    assert src.count(k) == 1, k
    src = src.replace(k, dump(v))
(OUT / 'index.html').write_text(src, encoding='utf-8')
(OUT / 'assets').mkdir(exist_ok=True)
for p in sorted(A.glob('bgm-*.mp3')):
    shutil.copy2(p, OUT / 'assets' / p.name)
print('built', len(src.encode()), 'bytes;', len(img), 'images;', len(eps), 'episodes', sorted(eps), ';', len(list((OUT / 'assets').glob('*.mp3'))), 'tracks')
