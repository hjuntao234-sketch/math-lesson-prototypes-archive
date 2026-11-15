"""Claude 2026-11-04：把不等式数据嵌进 game.html，生成小样 v2（写到上一级的 index.html，保持同一个发布地址）。"""
from pathlib import Path
import json
H=Path(__file__).resolve().parent
data=json.loads((H/'data-inequality.json').read_text(encoding='utf-8'))
js=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
src=(H/'game.html').read_text(encoding='utf-8')
assert src.count('__DATA__')==1
(H.parent/'index.html').write_text(src.replace('__DATA__',js),encoding='utf-8')
print('built',len(src)+len(js))
