"""Claude 2026-11-05：查“先介绍、后使用”。
用户原话：“在学生使用人物之前就得介绍了，别迟迟不介绍”。

用法：python3 设定集/check_intro_order.py
只报问题，不改文件。查三件事：
1. 序幕、序章和 17 集剧本按播放顺序走，每个队友在第一次开口的那一场（或那一集）里必须给出入队卡，不能拖到后面；
   开口以后隔了 3 句以上才给卡，报提示；
2. 每张卡在哪一集讲，那张卡该派的队友是不是已经入队（没入队的，那张卡的战斗暂时不派人：引擎会自动去掉，这里列出来，看要不要提早入队）；
3. 序章三关派人选项里的人，开战前都已入队（对照 game.html 里的模板）。
引擎里的筛法见 v4/game.html 的 canUse / usableTeam；跑起来查看 scratchpad 的 test16（按正常进度走一遍）。"""
from pathlib import Path
import json, re

H = Path(__file__).resolve().parent
OUT = H.parent
ORDER = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L09b', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16']
NOT_MATE = {'narr', 'rival', '入队'}
vn = json.loads((OUT / 'gemini/回收/剧情-修订-R3.json').read_text(encoding='utf-8'))
eps = {}
for f in (OUT / 'gemini/学习剧情材料-R3').glob('回收-L*-修订.json'):
    e = json.loads(f.read_text(encoding='utf-8')); eps[e['课']] = e
data = json.loads((OUT / 'v4/data-inequality.json').read_text(encoding='utf-8'))
game = (OUT / 'v4/game.html').read_text(encoding='utf-8')

probs, joined, at = [], {}, {}
pending = {}   # 这一场里已经开口、还没给卡的人：名字 -> [首句位置, 之后说了几句]
def join(who, where):
    if who in pending:
        first, k = pending.pop(who)
        if k > 3: print(f'提示：{who} 在 {first} 开口，隔了 {k} 句才给入队卡')
    if who not in joined: joined[who] = where
def speak(who, where):
    for v in pending.values(): v[1] += 1
    if who in NOT_MATE or who in joined: return
    pending.setdefault(who, [where, 0])
def end_unit(unit):
    for who, (first, k) in pending.items(): probs.append(f'{who} 在 {first} 开口，{unit} 结束了还没有入队卡')
    pending.clear()

# 序幕（VN prologue）→ 学母题（引擎 learnPrologue，雅娜入队卡）→ 序章三关（p1in…p3out）
def scene(k):
    for seg in vn.get(k, []):
        for i, (who, face, text) in enumerate(seg['lines']):
            if who == '入队': join(text, k)
            else: speak(who, f'{k}[{i}]')
    end_unit(k)
# 序幕和学母题连着播：雅娜在序幕里自报名字，入队卡在学母题的黑板上
for seg in vn.get('prologue', []):
    for i, (who, face, text) in enumerate(seg['lines']):
        if who == '入队': join(text, 'prologue')
        else: speak(who, f'prologue[{i}]')
if "[{intro:'转化与化归'}]" in game: join('转化与化归', '学母题')
end_unit('序幕和学母题')
for k in ('p1in', 'p1out', 'p2in', 'p2out', 'p3in', 'p3out', 'fieldOpen'):
    at[k] = set(joined)
    scene(k)

# 序章派人选项：模板 A 用于第 1 关，B 第 2 关，C 第 3 关
def tpl_team(t):
    m = re.search(r"if\(t==='%s'\)\{(.*?)\n  if\(t==='" % t, game, re.S) or re.search(r"if\(t==='%s'\)\{(.*?)\n\}" % t, game, re.S)
    body = m.group(1) if m else ''
    whos = set(re.findall(r"who:'([^']+)'", body))
    if 'teamDirect(' in body: whos |= set(re.findall(r"who:'([^']+)'", re.search(r'function teamDirect.*?\n.*?\n.*?\];\}', game, re.S).group(0)))
    return whos - {'self', 'trap'}
for key, t, k in (('p1', 'A', 'p1in'), ('p2', 'B', 'p2in'), ('p3', 'C', 'p3in')):
    before = at[k] | ({x for x, w in joined.items() if w == k})      # 开战前剧情里入队的也算
    late = tpl_team(t) - before
    if late: print(f'提示：序章 {key} 的选项里有 {sorted(late)}，开战时还没入队，引擎会把她们去掉')

# 17 集
card_ep = {}
for L in ORDER:
    e = eps[L]
    for n in e['覆盖的卡']: card_ep.setdefault(n, L)
    for i, it in enumerate(e['剧本']):
        w = f'{L}[{i}]'
        if isinstance(it, list): speak(it[0], w)
        elif '入队' in it: join(it['入队'], L)
        elif '选项' in it:
            for o in it['选项']: speak(o['回应'][0], w + ' 选项')
    end_unit(L)
    at[L] = set(joined)

# 卡的派人：讲完这张卡时，该派的人入队了吗
for c in sorted(data['cards'], key=lambda c: c['n']):
    n = c['n']; L = card_ep.get(n)
    good = [s['name'] for s in data['strategies'] if n in s['cards']]
    if not L or not good: continue
    have = [g for g in good if g in at[L]]
    if not have:
        print(f'提示：卡 {n}（{L} 讲）该派的 {good} 讲完时都还没入队，这张卡的战斗暂时不派人')

for p in probs: print('问题：', p)
print(f'{len(joined)} 人入队；问题 {len(probs)} 个')
