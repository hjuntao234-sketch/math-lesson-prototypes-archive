"""检查序章配音台词表，以及（如果已经生成）音频文件。

用法：python3 配音/check_序章台词.py        只查台词表
      python3 配音/check_序章台词.py --audio 再查 配音/序章/ 下的音频

Claude 2026-11-07 写。不读任何密钥，不联网。
"""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent
TABLE = R / '配音/序章-台词.json'
VN = R / 'gemini/回收/剧情-修订-R3.json'
BATTLES = [R / f'关卡/第一章/战斗/{b}.json' for b in ('p1-1', 'p2-1', 'p3-1')]
NAME = {'整体代换': '塔莉', '转化与化归': '雅娜', '构造': '法比娅', 'rival': '诺曼'}


def spoken_in_sources():
    found = set()
    vn = json.loads(VN.read_text(encoding='utf-8'))
    for key in ['prologue', 'p1in', 'p1out', 'p2in', 'p2out', 'p3in', 'p3out', 'fieldOpen']:
        for blk in vn[key]:
            for ln in blk['lines']:
                if len(ln) >= 3:
                    found.add((ln[0], ln[2]))

    def walk(x):
        if isinstance(x, dict):
            for k, v in x.items():
                if k in ('说', '开场') and isinstance(v, list):
                    for e in v:
                        if isinstance(e, list) and len(e) >= 2:
                            found.add((e[0], e[1]))
                else:
                    walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    for b in BATTLES:
        walk(json.loads(b.read_text(encoding='utf-8')))
    return found


def main():
    errs = []
    doc = json.loads(TABLE.read_text(encoding='utf-8'))
    lines = doc['台词']
    src = spoken_in_sources()
    ids, files, keys = set(), set(), set()
    for o in lines:
        tag = o['id']
        if o['id'] in ids:
            errs.append(f'{tag} id 重复')
        ids.add(o['id'])
        if o['文件'] in files:
            errs.append(f'{tag} 文件名重复')
        files.add(o['文件'])
        k = hashlib.sha1(f"{o['说话']}|{o['原文']}".encode('utf-8')).hexdigest()[:10]
        if o['key'] != k:
            errs.append(f'{tag} key 不对：应为 {k}')
        if k in keys:
            errs.append(f'{tag} key 重复')
        keys.add(k)
        if NAME.get(o['说话']) != o['人']:
            errs.append(f'{tag} 说话 {o["说话"]} 和 人 {o["人"]} 对不上')
        if (o['说话'], o['原文']) not in src:
            errs.append(f'{tag} 原文在游戏里找不到了（剧本改过？）：{o["原文"][:20]}')
        if re.search(r'[$\\{}]', o['念法']):
            errs.append(f'{tag} 念法里还有公式符号')
        if not o['表演']:
            errs.append(f'{tag} 表演为空')
    n_aud = sum(1 for o in lines if o['试镜'])
    if n_aud != 8:
        errs.append(f'试镜句应为 8 句，现在 {n_aud}')
    if len(lines) != 69:
        errs.append(f'台词应为 69 句，现在 {len(lines)}')

    if '--audio' in sys.argv:
        d = R / '配音/序章'
        probe = shutil.which('ffprobe')
        for o in lines:
            f = d / o['文件']
            if not f.exists() or f.stat().st_size < 2000:
                errs.append(f'{o["id"]} 音频缺失或太小：{f.name}')
                continue
            if probe:
                out = subprocess.run([probe, '-v', 'error', '-show_entries', 'format=duration',
                                      '-of', 'default=nw=1:nk=1', str(f)], capture_output=True, text=True)
                try:
                    sec = float(out.stdout.strip())
                except ValueError:
                    errs.append(f'{o["id"]} 读不出时长')
                    continue
                n = len(re.sub(r'[\s，。！？、：；“”‘’……—（）]', '', o['念法']))
                rate = n / sec if sec else 0
                if sec < 0.6 or rate > 8 or rate < 1.8:
                    errs.append(f'{o["id"]} 时长可疑：{sec:.2f} 秒，{n} 字，每秒 {rate:.1f} 字')
        if not probe:
            print('提示：没找到 ffprobe，只查了文件在不在。')

    for e in errs:
        print('错误：' + e)
    print(f'序章台词 {len(lines)} 句，错误 {len(errs)} 个。')
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
