from pathlib import Path
import hashlib
import json
import shutil

R = Path(__file__).resolve().parents[1]
T = R / 'tools-第2b阶段'
D = Path('~/Desktop/罗盘指挥官_立绘GPT_第2b阶段_2026-11-06')

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def inventory(root):
    return {str(p.relative_to(root)): digest(p) for p in sorted(root.rglob('*')) if p.is_file()}

assert not D.exists(), f'目标已存在，停止以免覆盖：{D}'
baseline = json.loads((T / 'baseline.json').read_text())
for item in baseline['checks']:
    assert digest(R.parent / item['path']) == item['expected'], item['path']
for name, expected in baseline['old_files'].items():
    assert digest(R / name) == expected, name

shutil.copytree(R, D)
first = inventory(R)
assert first == inventory(D), '初次复制校验失败'
progress = R / '进度-第2b阶段.md'
progress.write_text(progress.read_text() + '\n## 7. 桌面副本\n\n'
    + f'整包复制至：`{D}`。\n\n'
    + f'复制后逐文件核对SHA-256，包含本节和复制回执，共{len(first) + 1}个文件；源包和桌面副本文件集合及哈希一致。第2b阶段结束，未接入游戏、未发布。\n')
manifest = inventory(R)
receipt = T / 'desktop-copy.json'
receipt.write_text(json.dumps({
    'source': str(R), 'destination': str(D),
    'file_count_including_receipt': len(manifest) + 1,
    'verification': 'All files, including this receipt, compared after final copy; receipt excluded from its own hash manifest.',
    'sha256': manifest,
}, ensure_ascii=False, indent=2) + '\n')
for p in (progress, receipt):
    shutil.copy2(p, D / p.relative_to(R))
source = inventory(R)
destination = inventory(D)
assert source == destination, '最终复制校验失败'
for name, expected in baseline['old_files'].items():
    assert source[name] == expected, name
print(json.dumps({'files': len(source), 'all_hashes_match': True,
                  'old_files_unchanged': len(baseline['old_files']),
                  'destination': str(D)}, ensure_ascii=False))
