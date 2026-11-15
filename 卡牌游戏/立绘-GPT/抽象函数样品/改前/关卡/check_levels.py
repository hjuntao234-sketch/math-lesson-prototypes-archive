"""关卡检查：照 关卡/格式.md 查 关卡/第一章/战斗/*.json。
用法：python3 关卡/check_levels.py [文件 ...]     （默认查全部；有错误时退出码为 1）
错误（✗）必须改；提醒（!）看情况改。"""
import json, re, sys, math
from pathlib import Path

R = Path(__file__).resolve().parent.parent
SUPPORT = {1: {'标签': True, '视线': 1, '理由解释': True, '坑提醒': True},
           2: {'标签': False, '视线': 2, '理由解释': True, '坑提醒': True},
           3: {'标签': False, '视线': 0, '理由解释': False, '坑提醒': False}}
MATES = ['转化与化归', '整体代换', '构造', '函数思想', '方程思想', '分类讨论', '退化与边界', '存在性检验', '数形结合', '特殊化', '正难则反', '回到定义', '放缩']
# 入队：学法 -> 最早能上场的卡号（序章写 0）
JOIN = {'转化与化归': 0, '整体代换': 0, '构造': 0, '特殊化': 1, '方程思想': 4, '放缩': 6, '函数思想': 7, '存在性检验': 11,
        '数形结合': 14, '分类讨论': 16, '退化与边界': 16, '回到定义': 26, '正难则反': 31}
EP_CARDS = {1: [1, 2, 3], 2: [4, 5], 3: [6, 13], 4: [7, 8], 5: [9, 10], 6: [11, 12], 7: [14, 15, 18], 8: [16, 17], 9: [19, 20, 21, 22], 10: [23, 24, 25],
            11: [26, 27], 12: [28, 29, 30], 13: [31], 14: [32], 15: [33], 16: [34], 17: [35]}
CARD_EP = {c: e for e, cs in EP_CARDS.items() for c in cs}
BG = {'path', 'boss', 'garden', 'ruins'}
FX = re.compile(r'^(drop|scale|swap|show|hide|dissolve)(:|$)')

def plain_len(s):
    """长度：公式按 3 个字算。"""
    return len(re.sub(r'\$[^$]*\$', '数学式', str(s)))

def texts(obj, path=''):
    if isinstance(obj, str): yield path, obj
    elif isinstance(obj, list):
        for i, x in enumerate(obj): yield from texts(x, f'{path}[{i}]')
    elif isinstance(obj, dict):
        for k, v in obj.items(): yield from texts(v, f'{path}.{k}')

def guard_pivots(name, seen=()):
    """和 v6/build.py 一样：guard.json 写了 base 时，先继承底子的点，再盖上自己的（11-07 补）。"""
    g = R / '素材/守卫' / name
    if name in seen or not (g / 'guard.json').exists(): return None
    meta = json.loads((g / 'guard.json').read_text(encoding='utf-8'))
    piv = {}
    if meta.get('base'):
        b = guard_pivots(meta['base'], seen + (name,))
        if b: piv.update(b)
    if (g / 'pivots.json').exists():
        for k, v in json.loads((g / 'pivots.json').read_text(encoding='utf-8')).items():
            piv[k] = {**piv.get(k, {}), **v} if isinstance(v, dict) and isinstance(piv.get(k), dict) else v
    return piv or None

def check(f):
    E, W = [], []
    err = lambda m: E.append(m)
    warn = lambda m: W.append(m)
    try:
        L = json.loads(Path(f).read_text(encoding='utf-8'))
    except Exception as e:
        return [f'读不了 JSON：{e}'], []
    for k in ['id', '卡', '次', '名', '地点', '背景', '题', '答', '守卫', '队友', '支架', '牌', '层', '落笔']:
        if k not in L: err(f'缺字段 {k}')
    if E: return E, W
    if L['id'] != Path(f).stem: err(f'id「{L["id"]}」和文件名「{Path(f).stem}」不一样')
    if L['背景'] not in BG: err(f'背景「{L["背景"]}」不在 {sorted(BG)} 里')
    n = L['次']
    if n not in SUPPORT: err('次 只能是 1、2、3')
    elif L['支架'] != SUPPORT[n]: err(f'支架和第 {n} 次不符，应为 {SUPPORT[n]}')
    if not (4 <= len(L['名']) <= 10): warn(f'名「{L["名"]}」长度不在 4—10 字')
    # 守卫
    g = L['守卫']; gdir = R / '素材/守卫' / str(g.get('图'))
    parts = g.get('部位', {})
    piv = guard_pivots(str(g.get('图')))
    if piv is None: warn(f'守卫图「{g.get("图")}」还没有（素材/守卫/{g.get("图")}/），引擎会报缺图')
    else:
        for k, p in parts.items():
            spec = p.get('点', '')
            if spec != 'ground':
                lay, _, key = spec.partition('.')
                if lay not in piv or key not in piv[lay]: err(f'部位 {k} 的点「{spec}」在 pivots.json 里找不到')
    # 队友
    team = L['队友']
    if not (1 <= len(team) <= 3): err('队友要 1—3 个')
    card = L['卡'] if isinstance(L['卡'], int) else 0
    for lm in team:
        if lm not in MATES: err(f'队友「{lm}」不是学法名')
        elif JOIN[lm] > 0 and card > 0 and CARD_EP.get(card, 99) < CARD_EP.get(JOIN[lm], 0): err(f'队友「{lm}」在卡 {card} 时还没入队（先介绍后使用）')
        elif card == 0 and JOIN[lm] > 0: err(f'序章里队友「{lm}」还没入队')
    # 视线
    if n in (1, 2):
        sv = L.get('视线') or {}
        if not sv: err('第 1、2 次要写 视线')
        for lm, v in sv.items():
            if lm not in team: err(f'视线里的「{lm}」不在队友里')
            if v.get('看') not in parts: err(f'视线「{lm}」看的部位「{v.get("看")}」不存在')
            if not (v.get('文') or (v.get('前') and v.get('后') and v.get('分界'))): err(f'视线「{lm}」要写 文，或 前/后/分界')
    # 牌
    C = L['牌']
    for cid, c in C.items():
        t = c.get('类')
        need = {'情报': ['名', '印', '正文'], '理由': ['名', '签', '正文', '合'], '装备': ['名', '式', '孔', '正文'], '问': ['名', '正文']}.get(t)
        if need is None: err(f'牌 {cid} 的类「{t}」不认识'); continue
        for k in need:
            if k not in c: err(f'牌 {cid} 缺 {k}')
        if t == '理由':
            if not c.get('合') and not c.get('坑'): err(f'干扰理由 {cid} 要写 坑')
            for lm in c.get('合', []):
                if lm not in MATES: err(f'理由 {cid} 合的「{lm}」不是学法名')
        if plain_len(c.get('正文', '')) > 45: warn(f'牌 {cid} 正文超过 45 字')
    # 层
    layers = L['层']
    if not (3 <= len(layers) <= 5): err(f'层数 {len(layers)}，要 3—5 层')
    stamped = set(); traps_total = 0; step_ids = set(); nl_pts = set()
    for li, y in enumerate(layers):
        tag = f'第 {li+1} 层「{y.get("名")}」'
        steps = y.get('步', [])
        if y.get('心力') != len(steps): err(f'{tag}心力 {y.get("心力")} 不等于步数 {len(steps)}')
        hand = y.get('手牌', [])
        for cid in hand:
            if cid not in C: err(f'{tag}手牌 {cid} 在 牌 里没有')
        used = set(); has_reason = False; has_dispatch = False; traps = 0
        for s in steps:
            sid = s.get('id'); k = s.get('类')
            if not sid: err(f'{tag}有一步没有 id')
            if sid in step_ids: err(f'步 id「{sid}」重复')
            step_ids.add(sid)
            if k == '情报':
                if s.get('牌') not in hand or C.get(s.get('牌'), {}).get('类') != '情报': err(f'{tag}步 {sid} 的牌不是这一层手里的情报牌')
                for pk in ([s.get('部位')] if not isinstance(s.get('部位'), list) else s.get('部位')):  # 11-08：部位可以写一组，点哪个都算对
                    if pk not in parts: err(f'{tag}步 {sid} 的部位「{pk}」不存在')
                if not s.get('亮'): err(f'{tag}步 {sid} 要写 亮（题板上记的发现）')
                used.add(s.get('牌'))
            elif k == '理由':
                has_reason = True
                fit = [cid for cid in hand if C.get(cid, {}).get('类') == '理由' and C[cid].get('合')]
                if not fit: err(f'{tag}步 {sid}：手里没有合适的理由牌')
                used.update(fit)
                decoys = [cid for cid in hand if C.get(cid, {}).get('类') == '理由' and not C[cid].get('合')]
                traps += len(decoys) + max(0, len(fit) - 1)  # 挂错人也是坑
                if not decoys: warn(f'{tag}理由牌里没有干扰项')
            elif k == '派人':
                has_dispatch = True
                br = s.get('分支') or {}
                if not br: err(f'{tag}步 {sid} 要写 分支')
                for lm in br:
                    if lm not in team: err(f'{tag}派人分支「{lm}」不在队友里')
                    if not any(lm in C.get(cid, {}).get('合', []) for cid in hand): err(f'{tag}分支「{lm}」没有合适的理由牌')
            elif k == '问':
                q = C.get(s.get('牌'), {})
                if s.get('牌') not in hand or q.get('类') != '问': err(f'{tag}步 {sid} 的牌不是这一层手里的问题牌')
                used.add(s.get('牌'))
                for which in ([s] + ([s['换数字']] if s.get('换数字') else [])):
                    ops = which.get('选', [])
                    if not (2 <= len(ops) <= 4): err(f'{tag}步 {sid} 选项要 2—4 个')
                    if sum(1 for o in ops if o.get('对')) != 1: err(f'{tag}步 {sid} 要正好一个对的选项')
                    for o in ops:
                        if not o.get('对') and not o.get('坑'): err(f'{tag}步 {sid} 错的选项「{o.get("文")}」要写 坑')
                    traps += sum(1 for o in ops if not o.get('对')) if which is s else 0
            elif k == '出刀':
                gcard = C.get(s.get('牌'), {})
                if s.get('牌') not in hand or gcard.get('类') != '装备': err(f'{tag}步 {sid} 的牌不是这一层手里的装备')
                used.add(s.get('牌'))
                before = set(stamped)
                for s2 in steps:
                    if s2 is s: break
                    before.update(s2.get('盖', []))
                    for b in (s2.get('分支') or {}).values(): before.update(b.get('盖', []))
                miss = [h for h in gcard.get('孔', []) if h not in before]
                if miss: err(f'{tag}步 {sid} 出刀时孔「{"".join(miss)}」还没盖章')
                if not s.get('填'): err(f'{tag}步 {sid} 要写 填')
                for fl in s.get('填', []):
                    if not isinstance(fl.get('答'), (int, float)): err(f'{tag}步 {sid} 填「{fl.get("名")}」的答要是数字')
                traps += 1  # 算错
            else:
                err(f'{tag}步 {sid} 的类「{k}」不认识')
            stamped.update(s.get('盖', []))
            for b in (s.get('分支') or {}).values(): stamped.update(b.get('盖', []))
            for fx in s.get('效果', []) + [f for b in (s.get('分支') or {}).values() for f in b.get('效果', [])]:
                if '守卫' in fx and not FX.match(fx['守卫']): err(f'{tag}步 {sid} 效果「{fx["守卫"]}」不认识')
                if '数轴' in fx and fx['数轴'] is not None:
                    nl = fx['数轴']
                    for pt in nl.get('点', []):
                        if not (isinstance(pt, list) and 2 <= len(pt) <= 3 and isinstance(pt[0], (int, float))): err(f'{tag}步 {sid} 数轴的点要写成 [值, "标签"]')
                        else: nl_pts.add(pt[0])
                    for r in nl.get('行', []) + ([nl['亮']] if nl.get('亮') else []):
                        for g in r.get('段', []):
                            for e in g:
                                if e is not None and e not in nl_pts: err(f'{tag}步 {sid} 数轴「{r.get("名")}」的端点 {e} 还没上数轴（先在前面的效果里写进 点）')
        if has_reason != has_dispatch: err(f'{tag}“理由”和“派人”要成对出现')
        pit = y.get('坑') or {}
        for cid in hand:
            c = C.get(cid, {})
            if cid in used: continue
            if c.get('类') == '理由': continue
            if pit.get(cid) or c.get('坑'): traps += 1
            else: err(f'{tag}手牌 {cid} 这一层用不上，也没写为什么是坑（每张牌都要有用）')
        if any(s.get('类') == '情报' for s in steps): traps += sum(1 for p in parts.values() if p.get('错'))
        if traps < 1: err(f'{tag}一个坑都没有')
        traps_total += traps
        if y.get('提醒') and plain_len(y['提醒']) > 40: warn(f'{tag}提醒超过 40 字')
    if traps_total < 3: err(f'全场坑只有 {traps_total} 个，至少 3 个')
    # 落笔
    P = L['落笔']
    if len(P.get('行', [])) < 3: err('落笔 行 至少 3 行')
    if not (3 <= len(P.get('清单', [])) <= 5): err('落笔 清单 要 3—5 条')
    if re.search('最小值|最大值', L['题']):
        if not any('当且仅当' in x for x in P.get('行', [])): err('最值题的落笔要有“当且仅当……时，等号成立”')
        if 'dissolve' not in json.dumps(layers[-1], ensure_ascii=False): warn('最后一层没有 dissolve（守卫不会散）')
        if '改条件' not in L: err('最值题要写 改条件（实在化不成一元的式子，写 {"跳过": "理由"}）')
    # 改条件
    G = L.get('改条件')
    if isinstance(G, dict) and G.get('跳过'):
        if plain_len(G['跳过']) < 8: err('改条件 跳过 要写清理由（为什么化不成一元的式子）')
        G = None
    if G:
        kind = G.get('类', '最小值')
        if kind not in ('最小值', '最大值'): err(f'改条件 类「{kind}」只能是 最小值 或 最大值')
        sgn = 1 if kind == '最小值' else -1
        G = dict(G); G['原最小'] = G.get('原最小') if kind == '最小值' else G.get('原最大')
        if G['原最小'] is None: err(f'改条件要写 {"原最小" if kind == "最小值" else "原最大"}')
        expr = G.get('式', '')
        if not re.fullmatch(r'[0-9x+\-*/().^ ]+', expr): err(f'改条件 式「{expr}」只能用 x、数字和 + - * / ( ) ^')
        else:
            fn = lambda x: eval(expr.replace('^', '**'), {'__builtins__': {}}, {'x': x})
            try:
                v = fn(G['原取等'])
                if abs(v - G['原最小']) > 1e-9: err(f'改条件：x={G["原取等"]} 时式子是 {v}，不是 原最小 {G["原最小"]}')
                d = G['定义域']; ok_dom = G['原取等'] > d['a'] if d['op'] == '>' else G['原取等'] >= d['a']
                if not ok_dom: err('改条件：原取等不在定义域里')
                # 数值核：定义域上的最小值
                hi = d.get('b', d['a'] + 30)
                xs = [d['a'] + (hi - d['a']) * i / 30000 for i in range(1, 30000)]
                vals = [fn(x) for x in xs]
                ext = min(vals) if sgn > 0 else max(vals)
                if sgn * (ext - G['原最小']) < -1e-6: err(f'改条件：数值算出{kind}约 {ext:.4f}，和写的 {G["原最小"]} 对不上')
            except Exception as e:
                err(f'改条件：式子算不了（{e}）')
            kinds = set()
            for c in G.get('改', []):
                has = G['原取等'] > c['a'] if c['op'] == '>' else G['原取等'] >= c['a']
                kinds.add('same' if has else ('end' if c['op'] == '≥' else 'none'))
            at_end = abs(G['原取等'] - G['定义域']['a']) < 1e-9
            if at_end:
                if kinds != {'end', 'none'}: err(f'改条件：最值在左端点取到的题，改两次覆盖“端点、取不到”：{sorted(kinds)}')
            elif kinds != {'same', 'end', 'none'}: warn(f'改条件的三改没覆盖“不变、端点、取不到”三种：{sorted(kinds)}')
            # 11-07：屏上要好读
            nice = lambda v: abs(v * 100 - round(v * 100)) < 1e-9
            for c in G.get('改', []) + [{'a': a} for a in (G.get('自出') or {}).get('a', [])]:
                if not nice(c['a']): err(f'改条件：端点 {c["a"]} 太长，改成最多两位小数的数（屏上直接显示它）')
            if not nice(G['原取等']) and not G.get('取等显示'): err('改条件：原取等不是整齐的数，要写 取等显示（如 "\\dfrac{\\sqrt3}{3}"）')
            if not nice(G['原最小']) and not G.get('最值显示'): err('改条件：最值不是整齐的数，要写 最值显示（如 "2\\sqrt3"）')
            if G.get('定义域', {}).get('bop', '<') not in ('<', '≤'): err('改条件：定义域 bop 只能是 < 或 ≤')
            if (G.get('元', 'x') != 'x' or not re.search(r'求\s*\$', L['题'])) and not G.get('显示'): err('改条件：换了字母，或题面里没有“求 $…$”，要写 显示')
            if G.get('元', 'x') != 'x' and not G.get('说明'): err('改条件：换了字母，要写 说明（新字母是什么）')
    # 答与出刀一致
    nums = [fl['答'] for y in layers for s in y.get('步', []) if s.get('类') == '出刀' for fl in s.get('填', [])]
    for k, v in L['答'].items():
        if isinstance(v, (int, float)) and v not in nums: warn(f'答「{k}={v}」没出现在出刀的 填 里')
    # 语言
    for path, s in texts({'层': layers, '视线': L.get('视线', {})}):
        if re.search(r'\.(开场|说)\[\d+\]\[\d+\]$', path) and not s in MATES and s != 'narr':
            if plain_len(s) > 40: warn(f'{path} 这句超过 40 字：{s[:20]}…')
    for path, s in texts(L):
        if s.count('$') % 2: err(f'{path} 的 $ 没配对：{s[:30]}')
    # 11-07 R2 审读：题板、问题不能写成一大段（金样本题板 ≤42 字、问题 ≤27 字；公式按 3 字算）
    for path, s in texts(L):
        if path.endswith('.题板') and (plain_len(s) > 60 or len(s) > 170):
            err(f'{path} 题板太长（{plain_len(s)} 字）：后进生读不完，还会挡住守卫。只写这位队友的关键一两步，60 字以内')
        if re.search(r'\.步\[\d+\]\.问$', path) and plain_len(s) > 60:
            err(f'{path} 问题太长（{plain_len(s)} 字）：推导放进前面的题板或拆成两问，问题本身 60 字以内')
    # 11-08：这一层没有“理由”步，手里的理由牌挂不上，也不算坑，是废牌
    for li, y in enumerate(layers):
        if not any(st.get('类') == '理由' for st in y.get('步', [])):
            for cid in y.get('手牌', []):
                if (L.get('牌', {}).get(cid) or {}).get('类') == '理由': err(f'层[{li}] 没有挂理由这一步，手牌里的理由牌「{cid}」挂不上，也不算坑')
    # 11-07：语言和设计（批 1 退回的教训：套话、行话、拿牌面凑错误选项、装备不是知识）
    BANNED = ['报界', '界成为', '做稳', '本层', '结算第', '字段', '接口', '先核对本层']
    for path, t in texts(L):
        if path.startswith('._说明') or path.startswith('.改条件.跳过'): continue  # 这两处只给作者看，学生看不到
        for w in BANNED:
            if w in t: err(f'{path} 用了套话或行话「{w}」：{t[:24]}…')
    if re.search(r'守卫[甲乙丙丁]$', L['名']): err(f'名「{L["名"]}」不要用甲乙丙编号，写它长什么样')
    reminders = [y.get('提醒', '') for y in layers if y.get('提醒')]
    for t in set(reminders):
        if reminders.count(t) > 1: err(f'提醒「{t[:20]}…」在 {reminders.count(t)} 层里重复：每层写这一层自己的坑')
    openers = [ln[1] for y in layers for ln in y.get('开场', [])]
    for t in set(openers):
        if openers.count(t) > 1: err(f'开场「{t[:20]}…」重复了 {openers.count(t)} 次')
    tails = [o[-5:] for o in openers if len(o) >= 5]
    for t in set(tails):
        if tails.count(t) >= 3: err(f'有 {tails.count(t)} 句开场都用同一个句尾「{t}」：像模板，按这一层的事写')
    cardtext = {str(c.get(k, '')) for c in C.values() for k in ('名', '正文', '式')} - {''}
    wrongs = []
    for y in layers:
        for st in y.get('步', []):
            for which in [st] + ([st['换数字']] if st.get('换数字') else []):
                for o in which.get('选', []):
                    if o.get('对'): continue
                    if o.get('文') in cardtext: err(f'步 {st.get("id")} 的错误选项「{o.get("文", "")[:20]}」照抄了牌面：错误选项要是学生真会写的错答')
                    if which is st: wrongs.append(o.get('文'))
            if st.get('类') == '出刀':
                g = C.get(st.get('牌'), {})
                if re.search(r'结算|第.步|直接', g.get('名', '')) or not re.search(r'\\ge|\\le|≥|≤|>|<', g.get('式', '')): err(f'步 {st.get("id")} 出刀用的「{g.get("名")}」不是一条结论：装备要写真的不等式（如基本不等式），带孔')
                for fl in st.get('填', []):
                    if not [k for k in (fl.get('错') or {}) if k != '_']: err(f'步 {st.get("id")} 填「{fl.get("名")}」的错只写了“_”：至少写一个学生真会填的错数和提示')
    for t in set(wrongs):
        if wrongs.count(t) > 1: err(f'错误选项「{str(t)[:20]}」在 {wrongs.count(t)} 个问题里重复')
    for path, s in texts([y.get('开场', []) for y in layers] + [st.get('说', []) for y in layers for st in y.get('步', [])]):
        pass
    return E, W

def main():
    files = sys.argv[1:] or sorted(str(p) for p in (R / '关卡/第一章/战斗').glob('*.json'))
    bad = 0
    for f in files:
        E, W = check(f)
        print(f'{"✓" if not E else "✗"} {Path(f).name}：{len(E)} 个错误，{len(W)} 个提醒')
        for e in E: print('   ✗', e)
        for w in W: print('   !', w)
        bad += len(E)
    print(f'\n合计：{len(files)} 个文件，{bad} 个错误')
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
