"""Claude 2026-11-04：从设定集生成学习剧情 R3 的提示词和每集材料。
读：  设定集/人物.md、设定集/第一季大纲.json、
      gemini/04-学习剧情-R3.template.md、gemini/学习剧情材料-R2/（执教稿材料，只读）
写：  设定集/第一季大纲.md、gemini/04-学习剧情-R3.md、gemini/学习剧情材料-R3/
改名字：只改 人物.md 的两张名字表，再跑一遍本脚本。"""
from pathlib import Path
import json, re, shutil, sys

H = Path(__file__).resolve().parent
ROOT = H.parent
G = ROOT / 'gemini'
R2, R3 = G / '学习剧情材料-R2', G / '学习剧情材料-R3'
STRATS = ['转化与化归', '整体代换', '构造', '函数思想', '方程思想', '分类讨论', '退化与边界',
          '存在性检验', '数形结合', '特殊化', '正难则反', '回到定义', '放缩']
START = {'转化与化归', '整体代换', '构造'}          # 序章里已经在队里
OLD_NICK = {'阿化': '转化与化归', '阿替': '整体代换', '阿构': '构造', '阿函': '函数思想', '阿程': '方程思想',
            '阿分': '分类讨论', '阿界': '退化与边界', '阿验': '存在性检验', '阿形': '数形结合', '阿特': '特殊化',
            '阿反': '正难则反', '阿义': '回到定义', '阿缩': '放缩'}

people = (H / '人物.md').read_text(encoding='utf-8')
NAME = {}
for row in re.findall(r'^\|([^|\n]+)\|([^|\n]+)\|', people, re.M):
    k, v = row[0].strip(), row[1].strip().strip('*').strip()
    if k in STRATS and k not in NAME:
        NAME[k] = v
    if k == '对手':
        RIVAL = v
assert set(NAME) == set(STRATS), set(STRATS) - set(NAME)
m = re.search(r'<!-- gemini:start -->\n(.*?)\n<!-- gemini:end -->', people, re.S)
GEM = m.group(1).strip()
GEM = re.sub(r'^## 二、人物\n+', '', GEM)                  # 提示词里已有“七、人物”
GEM = re.sub(r'^## 三、', '### ', GEM, flags=re.M)

who = lambda s: f'{s}（{NAME[s]}）'
season = json.loads((H / '第一季大纲.json').read_text(encoding='utf-8'))
EP = season['集']
mapping = json.loads((R2 / '课时与卡对照.json').read_text(encoding='utf-8'))

# ---- 检查 ----
assert [e['课'] for e in EP] == list(mapping), '集的顺序要和执教稿课时一致'
for e in EP:
    assert e['卡'] == mapping[e['课']]['卡'], (e['课'], e['卡'])
    assert e['主讲'] in STRATS, e['主讲']
    for r in e['入队']:
        assert r in STRATS and r not in START, r
joined = [r for e in EP for r in e['入队']]
assert len(joined) == len(set(joined)), '有人入队两次'
assert START | set(joined) == set(STRATS), set(STRATS) - START - set(joined)


def render(e, level='###'):
    d, f = e['日常'], e['交锋']
    out = [f"{level} 第 {e['集']} 集《{e['集名']}》｜{e['课']} {mapping[e['课']]['课题']}｜卡 {'、'.join(map(str, e['卡']))}",
           f"- **主讲**：{who(e['主讲'])}；**入队**：{'、'.join(map(who, e['入队'])) or '无'}",
           f"- **日常**：{d['场景']}",
           f"  - 道理：{d['道理']}",
           f"  - 收刀时点破：{d['点破']}",
           f"  - 不像的地方：{d['不像的地方']}",
           f"- **来敌**：{f['来敌']}",
           f"- **受挫**：{f['受挫']}",
           f"- **转折**：{f['转折']}",
           f"- **新刀**：{f['新刀']}",
           f"- **对手（{RIVAL}）**：{e['对手'] or '不出场'}",
           f"- **人物线**：{e['人物线']}"]
    if e.get('伏笔'):
        out.append(f"- **伏笔**：{e['伏笔']}")
    out.append(f"- **钩子**：{e['钩子']}")
    return '\n'.join(out)


outline = '\n\n'.join(['### 全季暗线\n' + '\n'.join('- ' + x for x in season['暗线'])] + [render(e) for e in EP])
(H / '第一季大纲.md').write_text(
    '# 《罗盘指挥官》第一季《不等式原野》大纲（v0）\n\n由 `第一季大纲.json` 生成，改大纲请改 json 再跑 `build.py`。\n\n'
    + outline.replace('### ', '## ', 1) + '\n', encoding='utf-8')

tpl = (G / '04-学习剧情-R3.template.md').read_text(encoding='utf-8')
assert tpl.count('{{人物}}') == 1 and tpl.count('{{大纲}}') == 1
prompt = tpl.replace('{{人物}}', GEM).replace('{{大纲}}', outline)
prompt = prompt.replace('这是模板，`设定集/build.py` 会把人物和大纲填进去，生成 `04-学习剧情-R3.md`。请改模板或设定集，不要直接改生成的文件。',
                        '本文件由 `设定集/build.py` 生成。要改请改 `04-学习剧情-R3.template.md` 或 `设定集/`，再重新生成。')
assert '{{' not in prompt
out = G / '04-学习剧情-R3.md'
if out.exists() and out.read_text(encoding='utf-8') != prompt and '--prompt' not in sys.argv:
    print('提示词 R3 已经发给 Gemini，不覆盖。大纲的改动只进每集材料；真要重出提示词，加 --prompt 并另存新版本。')
else:
    out.write_text(prompt, encoding='utf-8')

R3.mkdir(exist_ok=True)
for i, e in enumerate(EP):
    src = R2 / mapping[e['课']]['文件']
    body = src.read_text(encoding='utf-8')
    k = body.index('## 一、卡、装备、队友')
    prev = EP[i - 1]['钩子'] if i else f"序章刚结束：你被名录院除名，在原野营地遇见{NAME['转化与化归']}、{NAME['整体代换']}，序章三关里{NAME['构造']}入队。"
    head = (f"# 《罗盘指挥官》学习剧情材料 R3 · 第 {e['集']} 集《{e['集名']}》（{e['课']} {mapping[e['课']]['课题']}）\n\n"
            f"请按 R3 的总要求把这一集写成剧本。先看“这一集的骨架”，再看卡和执教稿。\n\n"
            f"## 零、这一集的骨架\n\n**上一集的钩子**：{prev}\n\n" + render(e, '###') + '\n\n')
    rest = body[k:]
    for old, st in OLD_NICK.items():                       # R2 材料里的旧昵称换成新名字
        rest = rest.replace(f'"昵称": "{old}"', f'"名字": "{NAME[st]}"')
    assert '"昵称"' not in rest, e['课']
    (R3 / src.name).write_text(head + rest, encoding='utf-8')
shutil.copy2(R2 / '课时与卡对照.json', R3 / '课时与卡对照.json')

print('名字：', '、'.join(f'{s}={NAME[s]}' for s in STRATS), '；对手', RIVAL)
print('提示词', len(prompt), '字符；材料', len(list(R3.glob('L*.md'))), '份；大纲', len(EP), '集')
