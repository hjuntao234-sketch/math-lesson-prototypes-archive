"""把 关卡/卡牌/前情.json 排成读得舒服的文案稿。用法：python3 关卡/make_scene_doc.py"""
import json
from pathlib import Path
R = Path(__file__).resolve().parent
P = json.loads((R / '卡牌/前情.json').read_text(encoding='utf-8'))
NM = {'转化与化归': '雅娜', '整体代换': '塔莉', '退化与边界': '奥菈', '数形结合': '伊露', '方程思想': '芭兰', '函数思想': '芙洛', '旁': '旁白'}
out = ['# 试玩章战前文案', '', '由 `关卡/卡牌/前情.json` 生成，改文案请改 json 再跑 `python3 关卡/make_scene_doc.py`。', '']
TITLE = {'椭圆-外点': '第一只：压着半张脸的守卫', '椭圆-内点': '第二只：肚子里有颗钉子的守卫'}
for lid, S in P.items():
    out += [f'## {TITLE.get(lid, lid)}', '', f'**地点**：{S["地点"]}', '']
    for st in S['场']:
        pre = f'（如果 `{st["若"]}`）' if '若' in st else ''
        if '旁' in st: out.append(f'{pre}*{st["旁"]}*\n')
        if '碑' in st: out.append('> **墙上刻着：** ' + st['碑'].replace('\n', ' ') + '\n')
        if '说' in st: out.append(f'{pre}**{NM[st["说"]]}**：{st["文"]}\n')
        if st.get('显'): out.append('【画面：守卫、铜桩、绳子变成坐标系，题板滑入】\n')
        if '选' in st:
            out.append('**【你选】**\n')
            for o in st['选']:
                out.append(f'- {o["文"]}')
                for w, t in o['回']:
                    out.append(f'  - {NM[w]}：{t}')
            out.append('')
        if '拖' in st:
            d = st['拖']
            out.append(f'**【你亲手拖绳子】** 提示：{d["提示"]}\n')
            for k, (w, t) in d['触'].items():
                out.append(f'- 拖到“{k}”：{NM[w]}：{t}')
            out.append('')
    out += ['**【选队卡上的话】**', '']
    for w, t in S['队话'].items(): out.append(f'- {NM[w]}：{t}')
    out += ['', '**【选完，没带的人】**（只出现一句）', '']
    for w, t in S['留'].items(): out.append(f'- 没带{NM[w]}：{t}')
    out += ['', '**【开打那一下】**', '']
    for st in S['醒']:
        if '旁' in st: out.append(f'*{st["旁"]}*\n')
        if '说' in st: out.append(f'**{NM[st["说"]]}**：{st["文"]}\n')
    out += ['**【打完，接回开打前猜的】**', '']
    for k, t in S['猜后'].items(): out.append(f'- {k}：{t}')
    out.append('')
(R.parent / '设定集/试玩章文案.md').write_text('\n'.join(out), encoding='utf-8')
print('ok')
