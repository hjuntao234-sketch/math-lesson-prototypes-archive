"""v6 构建：把 关卡/第一章 的数据、守卫图、立绘、背景打进 v6/dist/。
用法：python3 v6/build.py   （在项目根目录 MOCKUP-20261104-adventure-cardgame 下）"""
import json, shutil, sys
from pathlib import Path
R = Path(__file__).resolve().parent.parent
V = R / 'v6'; OUT = V / 'dist'; IMG = OUT / 'img'
if OUT.exists(): shutil.rmtree(OUT)
(IMG / 'full').mkdir(parents=True); (IMG / 'guard').mkdir()
battles = {}
def _order(f):
    # 选关列表按卡号、次数排：序章 p1-1… 在前，再 1-1、2-1 … 13-1，不按字面把 13-1 排在 2-1 前面
    a, _, b = f.stem.partition('-'); pro = a.startswith('p')
    return (0 if pro else 1, int(a.lstrip('p') or 0) if a.lstrip('p').isdigit() else 999, int(b) if b.isdigit() else 0, f.stem)
for f in sorted((R / '关卡/第一章/战斗').glob('*.json'), key=_order):
    d = json.loads(f.read_text(encoding='utf-8')); battles[d['id']] = d
duels = {}
for f in sorted((R / '关卡/第一章/新骨架').glob('*.json')) if (R / '关卡/第一章/新骨架').exists() else []:
    d = json.loads(f.read_text(encoding='utf-8')); duels[d['id']] = d
guards = {}
GD = R / '素材/守卫'
def guard_files(name, seen=()):
    """守卫图层：guard.json 里写 base 时，先继承底子的图层和轴心，再盖上自己的。"""
    g = GD / name
    if name in seen or not (g / 'guard.json').exists(): sys.exit(f'守卫「{name}」缺 guard.json（或 base 循环）')
    meta = json.loads((g / 'guard.json').read_text(encoding='utf-8'))
    files, piv = {}, {}
    if meta.get('base'):
        bf, bp, _ = guard_files(meta['base'], seen + (name,)); files.update(bf); piv.update(bp)
    if (g / 'pivots.json').exists():
        for k, v in json.loads((g / 'pivots.json').read_text(encoding='utf-8')).items():
            piv[k] = {**piv.get(k, {}), **v} if isinstance(v, dict) and isinstance(piv.get(k), dict) else v
    for x in g.glob('*.webp'): files[x.stem] = x
    return files, piv, meta
for g in sorted(GD.iterdir()):
    if not (g / 'guard.json').exists(): continue
    files, piv, meta = guard_files(g.name)
    lack = [n for n in meta['order'] if n not in files]
    if lack: sys.exit(f'守卫「{g.name}」缺图层：{lack}')
    guards[g.name] = {'id': g.name, 'canvas': piv['canvas'], 'pivots': piv, 'order': meta['order'], 'hidden': meta.get('hidden', []), '名': meta.get('名', ''), 'tint': meta.get('tint', '')}
    (IMG / 'guard' / g.name).mkdir(); [shutil.copy(x, IMG / 'guard' / g.name / f'{n}.webp') for n, x in files.items()]
missing = [b['守卫']['图'] for b in list(battles.values()) + list(duels.values()) if b['守卫']['图'] not in guards]
if missing: sys.exit('缺守卫图：' + ', '.join(missing))
for x in (R / '素材/全身').glob('*.webp'): shutil.copy(x, IMG / 'full' / x.name)
for x in (R / '设定集/UI调研/战斗样稿/img').glob('bg-*.webp'): shutil.copy(x, IMG / x.name)
for x in (R / '素材/立绘').glob('ph-*.webp'): shutil.copy(x, IMG / x.name)
ready = sorted(x.stem[6:] for x in (R / '素材/全身').glob('ready-*.webp'))
KF = R / '关卡/第一章/队友技能.json'
kits = {k: v for k, v in json.loads(KF.read_text(encoding='utf-8')).items() if not k.startswith('_')} if KF.exists() else {}
DK = R / '关卡/卡牌'
decks = None
if DK.exists():
    decks = {'牌库': json.loads((DK / '牌库.json').read_text(encoding='utf-8')), '章': json.loads((DK / '章.json').read_text(encoding='utf-8')), '关': {}, '前情': json.loads((DK / '前情.json').read_text(encoding='utf-8')) if (DK / '前情.json').exists() else {}, '名录': json.loads((DK / '名录.json').read_text(encoding='utf-8')) if (DK / '名录.json').exists() else {}}
    for f in sorted(list(DK.glob('椭圆-*.json')) + list(DK.glob('抽象函数.json'))):
        d = json.loads(f.read_text(encoding='utf-8')); decks['关'][d['id']] = d
data = {'battles': battles, 'duels': duels, 'kits': kits, 'guards': guards, 'ready': ready, 'decks': decks}
html = (V / 'engine.html').read_text(encoding='utf-8')
css = (V / 'style.css').read_text(encoding='utf-8') + (V / 'v6.css').read_text(encoding='utf-8')
html = html.replace('/*__CSS__*/', css).replace('/*__TOPBAR__*/', (V / 'topbar.html').read_text(encoding='utf-8')).replace('/*__ORB__*/', (V / 'orb.html').read_text(encoding='utf-8'))
html = html.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False)).replace('/*__JS__*/', (V / 'duel.js').read_text(encoding='utf-8') + '\n' + (V / 'deck.js').read_text(encoding='utf-8') + '\n' + (V / 'juice.js').read_text(encoding='utf-8') + '\n' + (V / 'scene.js').read_text(encoding='utf-8') + '\n' + (V / 'dark.js').read_text(encoding='utf-8') + '\n' + (V / 'paper-ellipse.js').read_text(encoding='utf-8') + '\n' + (V / 'abstract-core.js').read_text(encoding='utf-8') + '\n' + (V / 'paper-abstract.js').read_text(encoding='utf-8') + '\n' + (V / 'notes.js').read_text(encoding='utf-8') + '\n' + (V / 'think.js').read_text(encoding='utf-8') + '\n' + (V / 'camp.js').read_text(encoding='utf-8') + '\n' + (V / 'engine.js').read_text(encoding='utf-8'))  # duel.js 在前：引擎末尾开机时它的常量已经就位
(OUT / 'index.html').write_text(html, encoding='utf-8')
if decks and (V / 'teacher.html').exists():
    lv = {k: {'名': d['名'], '层': d.get('纸行', ['设线', '丢线', '联立', '判别式', '面积', '最值', '拆谎'])} for k, d in decks['关'].items()}
    (OUT / 'teacher.html').write_text((V / 'teacher.html').read_text(encoding='utf-8').replace('/*__LEVELS__*/null', json.dumps(lv, ensure_ascii=False)).replace('/*__MING__*/null', json.dumps(decks['名录'], ensure_ascii=False)), encoding='utf-8')
if (V / 'toy.html').exists(): shutil.copy(V / 'toy.html', OUT / 'toy.html')  # 拖数原型，独立页面
n = sum(1 for _ in IMG.rglob('*.webp'))
print(f'built {OUT/"index.html"}: {len(html)} chars; {len(battles)} battles; {len(duels)} duels; {len(guards)} guards; {n} images')
