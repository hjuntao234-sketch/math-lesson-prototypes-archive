"""Claude 2026-11-04：生成小样 v3（写到上一级的 index.html，保持同一个发布地址）。
- 不等式数据：data-inequality.json（从罗盘 v1.18 只读抽取，不含真题）
- 剧情：../gemini/回收/剧情-修订.json（Gemini 初稿，Claude 修订）
- 图：assets/*.webp 内嵌成 data URI；配乐：assets/bgm-*.mp3 复制到上一级 assets/，网页按相对路径读取"""
from pathlib import Path
import base64, json, shutil

H = Path(__file__).resolve().parent
OUT = H.parent
dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
data = json.loads((H / 'data-inequality.json').read_text(encoding='utf-8'))
vn = json.loads((OUT / 'gemini/回收/剧情-修订.json').read_text(encoding='utf-8'))
img = {p.stem: 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode() for p in sorted((H / 'assets').glob('*.webp'))}
src = (H / 'game.html').read_text(encoding='utf-8')
for k, v in (('__DATA__', data), ('__VN__', vn), ('__IMG__', img)):
    assert src.count(k) == 1, k
    src = src.replace(k, dump(v))
(OUT / 'index.html').write_text(src, encoding='utf-8')
(OUT / 'assets').mkdir(exist_ok=True)
for p in sorted((H / 'assets').glob('bgm-*.mp3')):
    shutil.copy2(p, OUT / 'assets' / p.name)
print('built', len(src.encode()), 'bytes;', len(img), 'images;', len(list((OUT / 'assets').glob('*.mp3'))), 'tracks')
