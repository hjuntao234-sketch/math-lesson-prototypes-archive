"""探究屏检查：照 关卡/格式-探究.md 查 关卡/第一章/探路、领主、遗迹 下的 *.json。
用法：python3 关卡/check_modes.py [文件 ...]     （默认查全部；有错误时退出码为 1）
战斗文件（含“改条件”）用 check_levels.py 查。错误（✗）必须改；提醒（!）看情况改。"""
import json, re, sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent
CH = R / '关卡/第一章'
JOIN = {'转化与化归': 0, '整体代换': 0, '构造': 0, '特殊化': 1, '方程思想': 4, '放缩': 6, '函数思想': 7, '存在性检验': 11,
        '数形结合': 14, '分类讨论': 16, '退化与边界': 16, '回到定义': 26, '正难则反': 31}
EP_CARDS = {1: [1, 2, 3], 2: [4, 5], 3: [6, 13], 4: [7, 8], 5: [9, 10], 6: [11, 12], 7: [14, 15, 18], 8: [16, 17], 9: [19, 20, 21, 22], 10: [23, 24, 25],
            11: [26, 27], 12: [28, 29, 30], 13: [31], 14: [32], 15: [33], 16: [34], 17: [35]}
CARD_EP = {c: e for e, cs in EP_CARDS.items() for c in cs}
CAST = {'诺曼'}  # 不是队友、随时能说话的人

def plain_len(s): return len(re.sub(r'\$[^$]*\$', '数学式', str(s)))

def texts(obj, path=''):
    if isinstance(obj, str): yield path, obj
    elif isinstance(obj, list):
        for i, x in enumerate(obj): yield from texts(x, f'{path}[{i}]')
    elif isinstance(obj, dict):
        for k, v in obj.items(): yield from texts(v, f'{path}.{k}')

def fn(expr):
    if not isinstance(expr, str) or not re.fullmatch(r'[0-9x+\-*/().^ ]+', expr): raise ValueError(f'式子「{expr}」只能用 x、数字和 + - * / ( ) ^')
    code = compile(expr.replace('^', '**'), '<式>', 'eval')
    return lambda x: eval(code, {'__builtins__': {}}, {'x': x})

class Ctx:
    def __init__(s, f):
        s.f, s.E, s.W = f, [], []
    def err(s, m): s.E.append(m)
    def warn(s, m): s.W.append(m)
    def need(s, d, keys, where=''):
        miss = [k for k in keys if k not in d]
        for k in miss: s.err(f'{where}缺字段 {k}')
        return not miss

def joined(ep):
    return {lm for lm, c in JOIN.items() if c == 0 or CARD_EP.get(c, 99) <= ep}

def speakers(c, obj, ep, path=''):
    """所有 人 字段、说话列表 [[人, 话], ...] 和 驳/说/成说 这类 [人, 话]：人必须已入队。"""
    ok = joined(ep) | CAST
    def who(name, where):
        if name not in JOIN and name not in CAST: c.err(f'{where}：「{name}」不是学法名，也不在人物表里')
        elif name not in ok: c.err(f'{where}：「{name}」第 {ep} 集时还没入队（见 格式.md 第 9 节）')
    def walk(o, p):
        if isinstance(o, dict):
            for k, v in o.items():
                if k == '人' and isinstance(v, str): who(v, f'{p}.人')
                elif isinstance(v, list) and len(v) == 2 and all(isinstance(x, str) for x in v) and k in ('驳', '说', '成说', '没试', '深挖说', '不够说', '进门说'):
                    who(v[0], f'{p}.{k}')
                    if plain_len(v[1]) > 40: c.warn(f'{p}.{k} 一句超过 40 字（{plain_len(v[1])}）')
                elif isinstance(v, list) and v and all(isinstance(x, list) and len(x) == 2 for x in v) and k in ('开场', '说', '说后', '说话'):
                    for i, x in enumerate(v):
                        who(x[0], f'{p}.{k}[{i}]')
                        if plain_len(x[1]) > 40: c.warn(f'{p}.{k}[{i}] 一句超过 40 字（{plain_len(x[1])}）')
                else: walk(v, f'{p}.{k}')
        elif isinstance(o, list):
            for i, x in enumerate(o): walk(x, f'{p}[{i}]')
    walk(obj, path)

def one_right(c, opts, where, wrong_key):
    if not isinstance(opts, list) or not (2 <= len(opts) <= 4): c.err(f'{where}.选 要 2—4 个'); return
    rights = [o for o in opts if o.get('对')]
    if len(rights) != 1: c.err(f'{where}.选 必须正好一个 "对": true（现在 {len(rights)} 个）')
    for i, o in enumerate(opts):
        if not o.get('对') and wrong_key and not o.get(wrong_key): c.err(f'{where}.选[{i}] 是错的选项，要写 {wrong_key}（为什么错）')

def check_common(c, d, kind):
    if d.get('id') != Path(c.f).stem: c.err(f'id「{d.get("id")}」和文件名「{Path(c.f).stem}」不一样')
    for p, s in texts(d):
        if s.count('$') % 2: c.err(f'{p}：$ 没有配对')

def check_explore(c, d):
    if not c.need(d, ['id', '卡', '名', '地点', '题', '开场', '试', '猜', '查', '证', '奖']): return
    ep = CARD_EP.get(d['卡'], 0) if isinstance(d['卡'], int) else 0
    speakers(c, d, ep)
    T = d['试']
    if c.need(T, ['人', '式', '表头', '列', '候选', '至少', '图'], '试.'):
        try:
            f = fn(T['式']); cols = [fn(x) for x in T['列']]
        except ValueError as e: c.err(f'试：{e}'); return
        if len(T['表头']) != len(T['列']) + 2: c.err('试.表头 要比 列 多两格（第一格是 x，最后一格是“加起来”）')
        if not (1 <= T['至少'] <= len(T['候选'])): c.err('试.至少 要在 1 和候选个数之间')
        vals = {}
        for x in T['候选']:
            try: vals[x] = f(x); [g(x) for g in cols]
            except ZeroDivisionError: c.err(f'试.候选 {x} 让式子除以 0')
        for i, w in enumerate(T.get('错', [])):
            try: fn(w['像'])
            except ValueError as e: c.err(f'试.错[{i}]：{e}')
        P = T['图']
        if vals and not (P['y'][0] <= min(vals.values()) and P['x'][0] <= min(T['候选']) and max(T['候选']) <= P['x'][1]): c.warn('试.图 的范围装不下候选的点')
        tried = set(T['候选'])
        for gi, g in enumerate(d['猜']):
            w = f'猜[{gi}]'
            c.need(g, ['问', '选'], w + '.'); one_right(c, g.get('选'), w, '驳')
            for i, o in enumerate(g.get('选', [])):
                if o.get('对'):
                    if not o.get('签'): c.err(f'{w}.选[{i}] 猜对的选项要写 签（写进猜想签的那句）')
                    miss = [x for x in o.get('要试过', []) if x not in tried]
                    if miss: c.err(f'{w}.选[{i}].要试过 {miss} 不在候选里')
                    if o.get('要试过') and not o.get('没试'): c.err(f'{w}.选[{i}] 写了 要试过，也要写 没试（没试时谁说什么）')
                    if o.get('标点'):
                        x0, y0 = o['标点']
                        if abs(f(x0) - y0) > 1e-9: c.err(f'{w}.选[{i}].标点 ({x0}, {y0}) 不在 {T["式"]} 上（算出来是 {f(x0)}）')
                        if vals and min(vals.values()) < y0 - 1e-9: c.err(f'{w}.选[{i}].标点 不是候选里最小的那个')
            nx = g.get('接着')
            if nx:
                A = nx.get('换式', {})
                try:
                    f2 = fn(A['式']); lx, ly = A['最低']
                    if abs(f2(lx) - ly) > 1e-9: c.err(f'{w}.接着.换式.最低 ({lx}, {ly}) 算出来是 {f2(lx)}')
                    if min(f2(x) for x in A['点']) < ly - 1e-9: c.err(f'{w}.接着.换式.最低 不是点里最小的')
                except (KeyError, ValueError) as e: c.err(f'{w}.接着.换式：{e}')
                if not nx.get('按钮'): c.err(f'{w}.接着 要写 按钮')
    for qi, q in enumerate(d['查']):
        w = f'查[{qi}]'
        if q.get('类') == '选': c.need(q, ['人', '说', '问', '选'], w + '.'); one_right(c, q.get('选'), w, '驳')
        elif q.get('类') == '填':
            c.need(q, ['人', '说', '问', '答', '错', '成'], w + '.')
            if not isinstance(q.get('答'), (int, float)): c.err(f'{w}.答 要是数字')
        else: c.err(f'{w}.类 只能是“选”或“填”')
    P = d['证']
    if c.need(P, ['人', '引', '选', '孔', '算'], '证.'):
        one_right(c, P['选'], '证', '驳')
        for i, h in enumerate(P['孔']):
            if not (isinstance(h, list) and len(h) == 2): c.err(f'证.孔[{i}] 写成 ["正", "为什么能盖"]')
    c.need(d['奖'], ['人', '式', '正文', '孔', '名', '发现'], '奖.')

def check_boss(c, d):
    if not c.need(d, ['id', '路', '集', '名', '地点', '题', '开场', '答', '影', '拼', '回马枪']): return
    speakers(c, d, d['集'])
    A = d['答']; holes = re.findall(r'\{(\d)\}', A.get('式', ''))
    if sorted(int(h) for h in holes) != list(range(len(A.get('值', [])))): c.err('答.式 里的 {0} {1}… 要和 答.值 一一对应')
    for i, e in enumerate(d.get('常错', [])):
        if len(e.get('值', [])) != len(A.get('值', [])): c.err(f'常错[{i}].值 格数不对')
        if e.get('值') == A.get('值'): c.err(f'常错[{i}] 和正确答案一样')
        if not e.get('记'): c.err(f'常错[{i}] 要写 记（老师端那一行）')
    ids = [m.get('id') for m in d['影']]
    if not (2 <= len(ids) <= 5): c.err('影 要 2—5 只')
    if len(set(ids)) != len(ids): c.err('影 的 id 有重复')
    for i, m in enumerate(d['影']):
        w = f'影[{i}]'
        if not c.need(m, ['id', '名', '本事', '色', '人', '题', '带', '牌'], w + '.'): continue
        if len(m['题']) != 2: c.err(f'{w}.题 要正好 2 道（第二道是换了数字的同一种）')
        for j, q in enumerate(m['题']): one_right(c, q.get('选'), f'{w}.题[{j}]', None)
    J = d['拼']
    if c.need(J, ['格', '接法', '顺序', '错', '行', '带着拼', '终错'], '拼.'):
        rids = [r['id'] for r in J['接法']]
        if not (len(J['格']) == len(J['顺序']) == len(J['行'])): c.err('拼.格、顺序、行 三个列表要一样长')
        for x in J['顺序']:
            if x not in rids + ids: c.err(f'拼.顺序 里的「{x}」不是接法或影的 id')
        if J['顺序'] and J['顺序'][0] not in rids: c.err('拼.顺序 第一格要是一张接法')
        right = [r for r in J['接法'] if r.get('对')]
        if len(right) != 1 or (J['顺序'] and right and right[0]['id'] != J['顺序'][0]): c.err('拼.接法 要正好一张 "对": true，并且就是 顺序 第一格')
        for r in J['接法']:
            if not r.get('对') and not r.get('错'): c.err(f'拼.接法「{r["id"]}」是错的接法，要写 错')
        for k in ['接法放后面'] + [str(i) for i in range(len(J['格']))]:
            if k not in J['错']: c.err(f'拼.错 缺「{k}」')
            elif k != '接法放后面' and '_' not in J['错'][k]: c.err(f'拼.错.{k} 要有 "_"（其余情况）')

def check_ruin(c, d):
    if not c.need(d, ['id', '集', '名', '地点', '要证', '开场', '石碑', '方向', '房间', '出口', '消化']): return
    speakers(c, d, d['集'])
    c.need(d['石碑'], ['出处', '文', '问', '说明'], '石碑.')
    D = d['方向']
    if c.need(D, ['引', '路', '深挖', '深挖说'], '方向.'):
        ids = [r.get('id') for r in D['路']]
        if len(set(ids)) != len(ids): c.err('方向.路 的 id 有重复')
        for i, r in enumerate(D['路']):
            c.need(r, ['id', '名', '人', '想', '走', '果', '说'], f'方向.路[{i}].')
            if r.get('果') not in ('dead', 'q', 'ev', 'go'): c.err(f'方向.路[{i}].果 只能是 dead、q、ev、go')
        dig = [r for r in D['路'] if r.get('id') == D['深挖']]
        if not dig or dig[0].get('果') != 'go': c.err('方向.深挖 要指向一条 果 为 go 的路')
        if D.get('至少试', 1) > len(ids): c.err('方向.至少试 比路还多')
        if D.get('至少试', 1) > 1 and not D.get('不够说'): c.err('方向 写了 至少试，也要写 不够说')
        kinds = {r.get('果') for r in D['路']}
        if 'dead' not in kinds: c.warn('方向.路 里没有死路：遗迹要让学生看到走不通的路')
    rids = [r.get('id') for r in d['房间']]
    if len(set(rids)) != len(rids) or set(rids) & {'stone', 'dirs', 'exit', 'digest'}: c.err('房间 id 重复，或用了保留名 stone/dirs/exit/digest')
    for i, r in enumerate(d['房间']):
        w = f'房间[{i}]'
        if not c.need(r, ['id', '名', '步', '成', '章', '下一'], w + '.'): continue
        for j, s in enumerate(r['步']):
            c.need(s, ['问', '选'], f'{w}.步[{j}].'); one_right(c, s.get('选'), f'{w}.步[{j}]', '坑')
    E = d['出口']
    if c.need(E, ['人', '说', '牌', '招', '问号'], '出口.'):
        c.need(E['牌'], ['名', '式', '正文', '孔'], '出口.牌.')
        for i, q in enumerate(E['问号']):
            if '路' in q and q['路'] not in [r.get('id') for r in D['路']]: c.err(f'出口.问号[{i}].路 不存在')
            if not (q.get('文') or (q.get('有') and q.get('无'))): c.err(f'出口.问号[{i}] 写 文，或者写 路+有+无')
    G = d['消化']
    if c.need(G, ['问', '选', '招式', '回访'], '消化.'):
        one_right(c, G['选'], '消化', '坑')
        for o in G['选']:
            if o.get('对') and not o.get('好'): c.err('消化.选 对的那个要写 好（选对后说的话）')
        if '看到' not in G['招式'] or '就先' not in G['招式']: c.err('消化.招式 要照“看到……就先……因为……但如果……”的格式写')

KINDS = {'探路': check_explore, '领主': check_boss, '遗迹': check_ruin}

def main(args):
    files = [Path(a) for a in args] or [f for k in KINDS for f in sorted((CH / k).glob('*.json'))]
    bad = 0
    for f in files:
        kind = f.parent.name
        c = Ctx(f)
        try: d = json.loads(f.read_text(encoding='utf-8'))
        except Exception as e: print(f'✗ {f.name}：读不了 JSON：{e}'); bad += 1; continue
        if kind not in KINDS: print(f'✗ {f}：不在 探路/、领主/、遗迹/ 下'); bad += 1; continue
        check_common(c, d, kind); KINDS[kind](c, d)
        try: rel = f.resolve().relative_to(R)
        except ValueError: rel = f
        print(f'{"✗" if c.E else "✓"} {rel}：{len(c.E)} 个错误，{len(c.W)} 个提醒')
        for m in c.E: print('   ✗', m)
        for m in c.W: print('   !', m)
        bad += bool(c.E)
    sys.exit(1 if bad else 0)

if __name__ == '__main__': main(sys.argv[1:])
