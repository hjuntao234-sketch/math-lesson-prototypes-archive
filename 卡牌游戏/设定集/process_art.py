"""Claude 2026-11-04：把 Gemini 出的立绘抠成透明图、背景压成 webp，放进 ../素材/。
- 立绘：缩到宽 600 → 取左上角底色做 colorkey → 只压“明显偏绿”的像素（G 超过 R、B 较大者的 1.25 倍才压，青色斗篷、橄榄色背心不受影响；不用 despill，它会把斗篷变蓝；也不腐蚀，腐蚀会吃掉纸签的细绳）→ cwebp。
- 背景：原尺寸 cwebp。
原件只读，在 gemini/回收/原件-第2批/。"""
from pathlib import Path
import subprocess, sys

H = Path(__file__).resolve().parent
SRC = H.parent / 'gemini' / '回收' / '原件-第2批'
OUT = H.parent / '素材'
TMP = OUT / '_tmp'
SPRITES = {  # 原件 → 文件名（雅娜的表情都是在“更像女孩”的那张 image2 上改的）
    'image3': 'yana-平静', 'image4': 'yana-微笑', 'image5': 'yana-思考', 'image6': 'yana-惊讶', 'image7': 'yana-得意', 'image8': 'yana-动摇',
    'image9': 'tally-平静', 'image10': 'tally-大笑', 'image11': 'tally-思考', 'image12': 'tally-惊讶', 'image13': 'tally-着急', 'image14': 'tally-低落',
}
BGS = {'image15': 'bg-market', 'image16': 'bg-river', 'image17': 'bg-garden', 'image18': 'bg-bridge', 'image19': 'bg-deep'}

run = lambda *a: subprocess.run(a, check=True, capture_output=True)
def corner(png):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(png), '-vf', 'format=rgb24,crop=2:2:6:6', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         check=True, capture_output=True).stdout
    return '0x%02X%02X%02X' % tuple(raw[:3])

OUT.mkdir(exist_ok=True); TMP.mkdir(exist_ok=True)
for k, name in SPRITES.items():
    src, tmp = SRC / f'{k}.png', TMP / f'{name}.png'
    c = corner(src)
    run('ffmpeg', '-loglevel', 'error', '-y', '-i', str(src), '-filter_complex',
        f'[0]scale=600:-1:flags=lanczos,colorkey={c}:0.30:0.08,format=rgba,'
        "geq=r='r(X,Y)':b='b(X,Y)':a='alpha(X,Y)':g='if(gt(g(X,Y),1.25*max(r(X,Y),b(X,Y))),max(r(X,Y),b(X,Y)),g(X,Y))'",
        str(tmp))
    run('cwebp', '-quiet', '-q', '82', '-alpha_q', '90', '-exact', str(tmp), '-o', str(OUT / f'{name}.webp'))
    print(name, c, (OUT / f'{name}.webp').stat().st_size // 1024, 'KB')
for k, name in BGS.items():
    run('cwebp', '-quiet', '-q', '78', str(SRC / f'{k}.png'), '-o', str(OUT / f'{name}.webp'))
    print(name, (OUT / f'{name}.webp').stat().st_size // 1024, 'KB')
if '--keep-tmp' not in sys.argv:
    for p in TMP.glob('*.png'): p.unlink()
    TMP.rmdir()
