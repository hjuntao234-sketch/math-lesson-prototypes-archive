from pathlib import Path
import json,hashlib,shutil
R=Path(__file__).resolve().parents[1];T=R/'tools-守卫与预备'
D=Path('~/Desktop/罗盘指挥官_守卫与预备姿势_2026-11-06')
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def inventory(root):return {str(p.relative_to(root)):h(p) for p in sorted(root.rglob('*')) if p.is_file()}
assert not D.exists(),f'桌面目标已存在，不覆盖：{D}'
b=json.loads((T/'baseline.json').read_text())
drift=json.loads((T/'source-drift.json').read_text())
for x in b['checks']:
 expected=drift['final_sha256'] if x['path']==drift['path'] else x['expected']
 assert h(R.parent/x['path'])==expected,x['path']
for n,v in b['old_files'].items():assert h(R/n)==v,n
audit=json.loads((T/'final-audit.json').read_text())
for n,v in audit['sha256'].items():assert h(R/n)==v,n
shutil.copytree(R,D)
first=inventory(R);assert first==inventory(D)
progress=R/'进度-守卫与预备.md'
progress.write_text(progress.read_text()+f'\n## 7. 桌面副本\n\n整包复制至 `{D}`。复制后逐文件核对SHA-256，含本节及复制回执共{len(first)+1}个文件；文件集合与哈希全部一致。\n\n本轮工作结束，停在交回素材；未接入、未构建、未发布。\n')
manifest=inventory(R);receipt=T/'desktop-copy.json'
receipt.write_text(json.dumps({'source':str(R),'destination':str(D),'file_count_including_receipt':len(manifest)+1,'verification':'Final file collection and SHA-256 including receipt compared; receipt excluded from own hash manifest.','sha256':manifest},ensure_ascii=False,indent=2)+'\n')
for p in [progress,receipt]:shutil.copy2(p,D/p.relative_to(R))
src=inventory(R);dst=inventory(D);assert src==dst
for n,v in b['old_files'].items():assert src[n]==v,n
print(json.dumps({'files':len(src),'all_hashes_match':True,'old_files_unchanged':len(b['old_files']),'destination':str(D)},ensure_ascii=False))
