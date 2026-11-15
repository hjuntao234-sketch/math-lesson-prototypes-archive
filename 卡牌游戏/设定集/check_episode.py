"""Claude 2026-11-04：机器检查一集学习剧情（R3 规矩），Gemini 或 GPT 写的都用它。
用法：python3 设定集/check_episode.py <剧本 json>，例如 剧本/初稿-L02.json
只报问题，不改文件。数学对不对、比喻准不准、问题链顺序，还要人工审。"""
from pathlib import Path
import json, re, sys

H = Path(__file__).resolve().parent
R3 = H.parent / 'gemini' / '学习剧情材料-R3'
EXPR = {'narr': {''}, 'rival': {'平静', '不屑', '动摇', '惊讶', '不服'},
        '转化与化归': {'平静', '微笑', '思考', '惊讶', '得意', '动摇'},
        '整体代换': {'平静', '大笑', '思考', '惊讶', '着急', '低落'},
        '构造': {'平静', '微笑', '思考', '惊讶', '害羞'},
        # 11-05 GPT 立绘第 2 阶段起，其余 10 位队友各有 4 种表情：平静、微笑、惊讶，加一种专属
        '方程思想': {'平静', '微笑', '惊讶', '皱眉'}, '特殊化': {'平静', '微笑', '惊讶', '兴奋'},
        '数形结合': {'平静', '微笑', '惊讶', '专注'}, '存在性检验': {'平静', '微笑', '惊讶', '怀疑'},
        '函数思想': {'平静', '微笑', '惊讶', '出神'}, '放缩': {'平静', '微笑', '惊讶', '认真'},
        '分类讨论': {'平静', '微笑', '惊讶', '大笑'}, '退化与边界': {'平静', '微笑', '惊讶', '警觉'},
        '回到定义': {'平静', '微笑', '惊讶', '较真'}, '正难则反': {'平静', '微笑', '惊讶', '坏笑'}}
OTHERS = set()   # 11-05 起都有表情清单，不再要求“其他队友只用平静”
BG = {'名录院大厅', '原野营地', '雾中小路', '遗迹', '领主之地', '函数森林入口', '集市', '河边', '菜园', '溪上木桥', '遗迹深处'}
MUSIC = {'营地', '战斗', '领主', '菜园', '静音'}
SHOW = {'迷雾散开', '罗盘亮起', '钥匙转动', '纸签贴上', '刀成形', '换刀', '震动', '雾气压近', '闪白'}
SEG = ['日常', '来敌', '交锋', '收刀']
RANGE = {'日常': (10, 20), '来敌': (3, 8), '交锋': None, '收刀': (6, 12)}
FIGHT = {1: (25, 55), 2: (45, 70), 3: (60, 85), 4: (75, 100)}   # 11-05 第 2 批起压篇幅：每张卡约 30 条；第 3 批起一张卡的集放宽到 55（L12—L16 一课一卡但内容重）
BANNED = '口径 邻域 峰谷 折点 临界 交叉项 交叉差 锚点 覆盖数 副本 投影数 垂向 冒充 机械 显然 易得 不难看出 命运 羁绊 觉醒 宿命 力量 灵魂 仿佛 宛如 某种意义上 不用背 背了没用 真聪明 好棒 真棒 太强了 厉害'.split()

ep = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
season = json.loads((H / '第一季大纲.json').read_text(encoding='utf-8'))
outline = next(e for e in season['集'] if e['课'] == ep['课'])
bundle = next(R3.glob(ep['课'] + '-*.md')).read_text(encoding='utf-8')
meta = json.loads(re.search(r'```json\n(.*?)\n```', bundle, re.S).group(1))
gear_ok = set(meta['可以用的装备和情报']) if isinstance(meta['可以用的装备和情报'], dict) else {g['编号'] for g in meta['可以用的装备和情报']}
cards = [c['卡号'] for c in meta['覆盖的卡']]
probs = []
P = lambda *a: probs.append(' '.join(map(str, a)))

strip_f = lambda s: re.sub(r'\$[^$]*\$', '式', s)          # 一个公式算一个字
def check_line(where, s):
    sents = [x for x in re.split(r'(?<=[。！？])', s) if x.strip()]          # 省略号不算断句
    if len(sents) > 2: P(where, '超过两句：', s)
    for x in sents:
        n = len(strip_f(x).strip())
        if n > 25: P(where, f'一句 {n} 字（公式按 1 字）：', x)

seg, count, order, seen = None, {k: 0 for k in SEG}, [], {'母题': [], '五格': []}
gear_used, joined, rival_lines, todo = [], [], 0, []
for i, it in enumerate(ep['剧本']):
    w = f'#{i}'
    if isinstance(it, list):
        who, face, text = it
        if who in EXPR:
            if face not in EXPR[who]: P(w, f'表情不在清单：{who} {face}')
        elif who in OTHERS:
            if face != '平静': P(w, f'其他队友表情应为平静：{who} {face}')
        else: P(w, '说话人不在清单：', who)
        if who == 'rival': rival_lines += 1
        check_line(w, text)
        if seg == '日常' and '$' in text: P(w, '日常里出现式子：', text)
    elif '段' in it:
        seg = it['段']; order.append(seg)
        if seg not in SEG: P(w, '段名不对：', seg)
        continue
    elif '背景' in it:
        if it['背景'] not in BG: P(w, '背景不在清单：', it['背景'])
    elif '音乐' in it:
        if it['音乐'] not in MUSIC: P(w, '音乐不在清单：', it['音乐'])
    elif '演出' in it:
        if it['演出'] not in SHOW: P(w, '演出不在清单：', it['演出'])
    elif '黑板' in it:
        n = len(re.sub(r'\$[^$]*\$', '', it['黑板']))
        if n > 40: P(w, f'黑板文字 {n} 字：', it['黑板'])
        if seg == '日常': P(w, '日常里上了黑板')
    elif '提问' in it:
        opts = it['选项']
        if not 2 <= len(opts) <= 4: P(w, '选项数不对')
        if sum(o['对'] for o in opts) != 1: P(w, '对的选项不是正好一个')
        for o in opts:
            r = o['回应']
            if r[0] in EXPR and r[1] not in EXPR[r[0]]: P(w, f'回应表情不在清单：{r[0]} {r[1]}')
            check_line(w + '回应', r[2])
    elif '母题' in it or '五格' in it:
        k = '母题' if '母题' in it else '五格'; seen[k].append(it[k])
    elif '装备' in it:
        gear_used.append(it['装备'])
        if it['装备'] not in gear_ok: P(w, '装备编号不在材料里：', it['装备'])
    elif '入队' in it:
        joined.append(it['入队'])
    elif '图' in it:                                    # 数学图：设定集/make_figs.py 画好的 SVG
        if not (H.parent / '素材' / '图' / (it['图'] + '.svg')).exists():
            asked = {x.get('名') for x in ep.get('图需求', [])}
            if it['图'] in asked: todo.append(it['图'])          # 剧本里写了规格，等 Claude 按公式画
            else: P(w, '图不存在，也没写进“图需求”：', it['图'])
    elif '擦黑板' in it:
        pass
    else:
        P(w, '不认识的条目：', it)
    if seg and (isinstance(it, list) or any(k in it for k in ('黑板', '提问', '母题', '五格', '装备', '入队'))):
        count[seg] += 1                                   # 只数内容条目，不数背景、音乐、演出
    blob = json.dumps(it, ensure_ascii=False)
    for b in BANNED:
        if b in blob: P(w, '禁用词：', b)

if order != SEG: P('段的顺序：', order)
RANGE['交锋'] = FIGHT[min(len(cards), 4)]
# 润色版（文件名含“润色”）：交锋不许比现有定稿更长，上限改用定稿的条数
if '润色' in Path(sys.argv[1]).name:
    final = R3 / f"回收-{ep['课']}-修订.json"
    if final.exists():
        fs, fc = None, 0
        for it in json.loads(final.read_text(encoding='utf-8'))['剧本']:
            if isinstance(it, dict) and '段' in it: fs = it['段']; continue
            if fs == '交锋' and (isinstance(it, list) or any(k in it for k in ('黑板', '提问', '母题', '五格', '装备', '入队'))): fc += 1
        RANGE['交锋'] = (min(RANGE['交锋'][0], fc), fc)
for k, (lo, hi) in RANGE.items():
    if not lo <= count[k] <= hi: P(f'{k}段 {count[k]} 条，要求 {lo}—{hi}')
for c in cards:
    m, f = seen['母题'].count(c), seen['五格'].count(c)
    if m != 1 or f != 1: P(f'卡 {c}：母题 {m} 次、五格 {f} 次')
    elif ep['剧本'].index({'母题': c}) > ep['剧本'].index({'五格': c}): P(f'卡 {c}：五格在母题前面')
if sorted(joined) != sorted(outline['入队']): P('入队和大纲不一致：', joined, outline['入队'])
if rival_lines and not outline['对手']: P('大纲这集对手不出场，剧本里出场了')
unused = gear_ok - set(gear_used)
if unused: P('材料里有装备没发（不算错，确认一下）：', sorted(unused))

# 公式出处：剧本里的每个公式，规范化以后能不能在材料（卡、执教稿）里找到
norm = lambda s: re.sub(r'\\(left|right|displaystyle|,|;|!|quad|qquad| )|\s|\{|\}', '', s.replace('\\dfrac', '\\frac').replace('\\tfrac', '\\frac'))
src = norm(bundle.replace('$$', '$'))
miss = []
for it in ep['剧本']:
    texts = [it[2]] if isinstance(it, list) else [it.get('黑板', ''), it.get('提问', '')] + [x for o in it.get('选项', []) for x in (o['答'], o['回应'][2])]
    for t in texts:
        for f in re.findall(r'\$([^$]+)\$', t):
            if norm(f) not in src: miss.append(f)
print(f"{ep['课']} 第 {ep['集']} 集《{ep['集名']}》：各段条数 {count}，对手台词 {rival_lines} 句，装备 {gear_used}，入队 {joined}")
print(f'\n规则问题 {len(probs)} 条：'); [print(' -', p) for p in probs]
if todo: print('\n待 Claude 画的图：', '、'.join(todo))
print(f'\n在材料里找不到原样的公式 {len(set(miss))} 个（要人工判断是不是新推的）：')
for f in dict.fromkeys(miss): print('  $' + f + '$')
