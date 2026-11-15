"""卡牌版数据检查（Claude 2026-11-08）。不依赖引擎：几何、真值、答案都在这里独立重算。
用法：python3 关卡/check_deck.py    （在 MOCKUP-20261104-adventure-cardgame 下）
查什么：
  1. 结构：关里用到的牌都在牌库；层的牌、变体、算库、孔话、理由、奖励都对得上。
  2. 数学：用直线和椭圆真实求交，验每个“二次”“式”“面积”“数”的答案；把“答”填进模子再算一遍，牌长大后的“答”也算。
  3. 最值：扫参数，核“答案”里写的最大值和取到的位置。
  4. 语言：语言指南里禁的书面连接词。
出错退出码 1。"""
import json, math, re, sys
from pathlib import Path

R = Path(__file__).resolve().parent
DK = R / '卡牌'
LIB = json.loads((DK / '牌库.json').read_text(encoding='utf-8'))
LEVELS = [json.loads(f.read_text(encoding='utf-8')) for f in sorted(DK.glob('椭圆-*.json'))]
CH = json.loads((DK / '章.json').read_text(encoding='utf-8'))
errs = []


def py(src):
    """把数据和学生写法的式子转成 python 表达式。只处理本项目自己的数据。"""
    s = str(src).replace(' ', '').replace('√', 'sqrt')
    s = re.sub(r'\|([^|]+)\|', r'abs(\1)', s)
    s = s.replace('^', '**')
    s = re.sub(r'(\d|\))(?=[a-z(])', r'\1*', s)
    s = re.sub(r'\b([kmt])(?=[a-z(\d])', r'\1*', s)
    return s


def ev(src, **v):
    return eval(py(src), {'__builtins__': {}, 'sqrt': math.sqrt, 'abs': abs}, v)


def coef(G, kind, v):
    a2, b2 = G['a2'], G['b2']
    px, py_ = G['点']
    if kind == 'k':
        c = py_ - v * px
        return b2 + a2 * v * v, 2 * a2 * v * c, a2 * (c * c - b2)
    d = px - v * py_
    return b2 * v * v + a2, 2 * b2 * v * d, b2 * (d * d - a2)


def meet(G, kind, v):
    a, b, c = coef(G, kind, v)
    D = b * b - 4 * a * c
    if D <= 1e-9:
        return None
    s = math.sqrt(D)
    r1, r2 = (-b - s) / (2 * a), (-b + s) / (2 * a)
    px, py_ = G['点']
    if kind == 'k':
        cc = py_ - v * px
        x1, x2 = r1, r2
        y1, y2 = v * r1 + cc, v * r2 + cc
    else:
        d = px - v * py_
        y1, y2 = r1, r2
        x1, x2 = v * r1 + d, v * r2 + d
    # 独立核对：两点确实在椭圆上、在直线上
    for x, y in ((x1, y1), (x2, y2)):
        assert abs(x * x / G['a2'] + y * y / G['b2'] - 1) < 1e-9
    return dict(r1=r1, r2=r2, S=abs(x1 * y2 - x2 * y1) / 2, D=D)


def fill(tpl, answers):
    it = iter(answers)
    return re.sub('□', lambda m: '(' + str(next(it)) + ')', tpl)


def check_calc(L, cid, a, kind):
    """a 是合并好的算。kind 是这条路的参数名。"""
    G = L['几何']
    v = a.get('验')
    if not v:
        errs.append(f'{L["id"]}/{cid}: 缺“验”')
        return
    who = f'{L["id"]}/{cid}[{kind}]'
    fa = v['法']
    ans = a.get('答')
    if fa == '死路':
        for b in v.get('支', []):
            ev(b['值'])
        return
    if ans is None:
        errs.append(f'{who}: 缺“答”')
        return
    if len(ans) != len(a['空']):
        errs.append(f'{who}: “答”和“空”个数不一样')
    forms = []
    if a.get('合'):
        tpls = a['合'] if isinstance(a['合'], list) else [a['合']]
        n = sum(t.count('□') for t in tpls)
        if n != len(a['空']):
            errs.append(f'{who}: 模子里的方框 {n} 个，空 {len(a["空"])} 个')
        it = list(ans)
        for t in tpls:
            c = t.count('□')
            forms.append(fill(t, it[:c]))
            it = it[c:]
    else:
        forms = list(ans)
    if fa == '二次':
        for p in v['参']:
            m = meet(G, kind, p)
            if not m:
                errs.append(f'{who}: {kind}={p} 没有交点，不能当验算点')
                continue
            A, B, C = [ev(f, **{kind: p}) for f in forms]
            for r in (m['r1'], m['r2']):
                if abs(A * r * r + B * r + C) > 1e-6:
                    errs.append(f'{who}: {kind}={p} 时答案的方程不过真实交点')
    elif fa == '式':
        for p in v['参']:
            a_, b_, c_ = coef(G, kind, p)
            real = b_ * b_ - 4 * a_ * c_
            if abs(ev(v['真'], **{kind: p}) - real) > 1e-6:
                errs.append(f'{who}: “真”和真实判别式不符（{kind}={p}）')
            if abs(ev(forms[0], **{kind: p}) - real) > 1e-6:
                errs.append(f'{who}: “答”和真实判别式不符（{kind}={p}）')
    elif fa == '面积':
        for q in v['点']:
            p = ev(q['p']) if isinstance(q['p'], str) else q['p']
            m = meet(G, kind, p)
            if not m:
                errs.append(f'{who}: {kind}={p} 没有交点')
                continue
            vars_ = {kind: p}
            if 't' in q:
                vars_['t'] = q['t']
            if abs(ev(forms[0], **vars_) - m['S']) > 1e-6:
                errs.append(f'{who}: 答案面积 {ev(forms[0], **vars_)} ≠ 真实 {m["S"]}（{q}）')
    elif fa == '数':
        for want, got in zip(v['值'], ans):
            if abs(ev(want) - ev(got)) > 1e-9:
                errs.append(f'{who}: “值”和“答”不一样：{want} / {got}')
    elif fa == '反驳':
        m = meet(G, kind, ev(ans[0]))
        if not m or m['S'] <= v['过']:
            errs.append(f'{who}: 给的反例打不穿')
    else:
        errs.append(f'{who}: 不认识的验法 {fa}')


def merged(L, a):
    if a.get('同'):
        base = L.get('算库', {}).get(a['同'])
        if base is None:
            errs.append(f'{L["id"]}: 算库里没有 {a["同"]}')
            return a
        return {**base, **a}
    return a


def walk_cards(L):
    """牌的每个变体 → (id, 变体)。"""
    for cid, e in L['牌'].items():
        if cid not in LIB:
            errs.append(f'{L["id"]}: 牌库里没有 {cid}')
            continue
        for x in (e if isinstance(e, list) else [e]):
            yield cid, x


def route_kind(L, cid, x):
    """这个变体走哪条路：写了条件看条件；没写条件的是兜底，走兄弟变体的反面。"""
    当 = x.get('当', '')
    if 'lineK' in 当:
        return 'k'
    if 'lineM' in 当:
        return 'm'
    e = L['牌'][cid]
    if isinstance(e, list):
        for s in e:
            if s is x:
                continue
            if 'lineK' in s.get('当', ''):
                return 'm'
            if 'lineM' in s.get('当', ''):
                return 'k'
    return None


for L in LEVELS:
    G = L['几何']
    # 结构
    for y in L['层']:
        for e in y.get('牌', []):
            if e['id'] not in LIB:
                errs.append(f'{L["id"]}: 层 {y["名"]} 用了牌库没有的 {e["id"]}')
            elif e['id'] not in L['牌']:
                errs.append(f'{L["id"]}: 层 {y["名"]} 的 {e["id"]} 这一关没写效果')
    for k, p in L['看'].items():
        if p['理'] not in L['理由']:
            errs.append(f'{L["id"]}: 看 {k} 的理由 {p["理"]} 没定义')
        for i in p.get('想到', []):
            if i not in LIB:
                errs.append(f'{L["id"]}: 看 {k} 想到的 {i} 不在牌库')
    for i in L.get('奖', []):
        if i not in LIB:
            errs.append(f'{L["id"]}: 奖励 {i} 不在牌库')
    # 数学
    for cid, x in walk_cards(L):
        for h in x.get('孔', []) + LIB[cid].get('孔', []):
            if h not in L['孔话'] and h not in ('正', '定'):
                errs.append(f'{L["id"]}/{cid}: 孔 {h} 没有反例台词')
        if '算' not in x:
            continue
        a = merged(L, x['算'])
        k_ = a.get('成') or {}
        if k_.get('演') and k_['演'] not in ('线', '两根', '扇', '面', '顶'):
            errs.append(f'{L["id"]}/{cid}: 不认识的演 {k_["演"]}')
        seen = re.sub(r'\$[^$]*\$', '公式', k_.get('章') or k_.get('现') or '')
        if len(seen) > 16:
            errs.append(f'{L["id"]}/{cid}: 砸在屏幕上的结论太长（{seen}），写一条短的“章”')
        rk = route_kind(L, cid, x)
        kinds = [rk] if rk else [(a['成'].get('线') if a.get('成') else None) or G['初']]
        for kind in kinds:
            if a.get('验'):
                check_calc(L, cid, a, kind)
            if a.get('二'):
                check_calc(L, cid + '·长大后', {**a, **a['二'], '合': None}, kind)
    # 最值：扫一遍
    ans = L['答案']
    want = ev(ans['最大'])
    best = 0
    for kind in ('k', 'm'):
        for i in range(-6000, 6001):
            m = meet(G, kind, i / 1000)
            if m and m['S'] > best:
                best = m['S']
    if abs(best - want) > 1e-5:
        errs.append(f'{L["id"]}: 扫出来最大 {best}，数据写 {want}')
    m = meet(G, ans['线'], ev(ans['值']))
    if not m or abs(m['S'] - want) > 1e-9:
        errs.append(f'{L["id"]}: 写的取到位置面积不对')
    print(f'{L["id"]}: 最大值 {want:.6f}，扫描 {best:.6f}')

# 关灯：每组数字都扫一遍，定点在外要有两边贴线，最大值不能在边界上取不到
for L in LEVELS:
    for v in L.get('关灯', []):
        G = dict(L['几何']); G.update(a2=v['a2'], 点=v['点'])
        best, bt = -1, None
        for i in range(0, 3141):
            th = i / 1000
            m = meet(G, 'm', 0) if abs(math.cos(th)) < 1e-3 else meet(G, 'k', math.tan(th))
            if m and m['S'] > best:
                best, bt = m['S'], th
        if best <= 0:
            errs.append(f'{L["id"]}/关灯 {v}: 没有三角形')
        where = 'x=%s' % v['点'][0] if abs(bt - math.pi / 2) < .002 else 'k²≈%.4f' % math.tan(bt) ** 2
        print(f'{L["id"]} 关灯 a²={v["a2"]} 点{v["点"]}: 最大 {best:.4f}，在 {where}')

# 前情：说话的人要认识，一句别太长，选项要记，第一关都有
PRE = json.loads((DK / '前情.json').read_text(encoding='utf-8')) if (DK / '前情.json').exists() else {}
KNOWN = {'转化与化归', '整体代换', '退化与边界', '数形结合', '方程思想', '函数思想', '旁'}
def vis(t):
    return len(re.sub(r'\$[^$]*\$', '式', t))
for lid, P in PRE.items():
    if lid not in [L['id'] for L in LEVELS]:
        errs.append(f'前情 {lid}: 没有这一关')
    chars = 0
    for st in P['场'] + P.get('醒', []):
        if '说' in st and st['说'] not in KNOWN:
            errs.append(f'前情 {lid}: 不认识的人 {st["说"]}')
        for k in ('旁', '文', '碑'):
            if k in st:
                chars += vis(st[k])
                if vis(st[k]) > 52:
                    errs.append(f'前情 {lid}: 这句太长（{vis(st[k])} 字）：{st[k][:20]}')
        if '选' in st:
            for o in st['选']:
                if o.get('记') not in P.get('猜后', {}):
                    errs.append(f'前情 {lid}: 选项 {o.get("记")} 没有打完后的回应')
    for lm in P.get('队话', {}):
        if lm not in [x[0] for L in LEVELS if L['id'] == lid for x in L['队友']]:
            errs.append(f'前情 {lid}: 队话里的 {lm} 不在这一关的队友里')
    print(f'前情 {lid}: 约 {chars} 字')

# 名录：每张签要对得上关和层，别太长，样例要标
MING = json.loads((DK / '名录.json').read_text(encoding='utf-8')) if (DK / '名录.json').exists() else {}
for lid, ns in MING.items():
    L = next((x for x in LEVELS if x['id'] == lid), None)
    if not L:
        errs.append(f'名录: 没有这一关 {lid}')
        continue
    for n in ns:
        if not (isinstance(n.get('层'), int) and 0 <= n['层'] < 7):
            errs.append(f'名录 {lid}: 层号不对 {n}')
        if len(n.get('话', '')) > 60 or len(n.get('署', '')) > 12 or not n.get('署'):
            errs.append(f'名录 {lid}: 太长或没署名 {n.get("话", "")[:16]}')
    print(f'名录 {lid}: {len(ns)} 张（样例 {sum(1 for n in ns if n.get("届") == "样例")}）')

# 语言
BAN = ['首先', '因此', '综上', '其次', '总之', '值得注意']
for name, text in [(f.name, f.read_text(encoding='utf-8')) for f in sorted(DK.glob('*.json'))]:
    for w in BAN:
        if w in text:
            errs.append(f'{name}: 书面连接词“{w}”')

if errs:
    print(f'\n{len(errs)} 个问题：')
    for e in errs:
        print(' -', e)
    sys.exit(1)
print('卡牌版数据检查通过')
