from pathlib import Path
import hashlib,json,shutil
R=Path(__file__).resolve().parents[1]
D=Path('~/Desktop/罗盘指挥官_立绘GPT_第2阶段_2026-11-05')
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
if D.exists() and any(D.iterdir()):raise RuntimeError('目标目录已有内容；为保留既有文件停止复制')
D.mkdir(exist_ok=True)
files=[f for f in R.rglob('*') if f.is_file()]
for f in files:
 t=D/f.relative_to(R);t.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,t);assert h(f)==h(t),str(f)
receipt=R/'tools-第2阶段/desktop-copy.json'
count=len(files)+int(not receipt.exists())
report=R/'进度-第2阶段.md'
with report.open('a') as out:out.write(f'\n## 10. 桌面副本\n整包已复制到 {D}。共{count}个文件，逐个SHA-256比对一致。复制记录见tools-第2阶段/desktop-copy.json。\n')
shutil.copy2(report,D/report.relative_to(R))
manifest={str(f.relative_to(R)):h(f) for f in R.rglob('*') if f.is_file() and f!=receipt}
receipt.write_text(json.dumps({'destination':str(D),'file_count':count,'verified_all_files':True,'hashes_except_this_receipt':manifest},ensure_ascii=False,indent=2)+'\n')
shutil.copy2(receipt,D/receipt.relative_to(R))
files=[f for f in R.rglob('*') if f.is_file()]
assert len(files)==count
assert len([f for f in D.rglob('*') if f.is_file()])==count
for f in files:assert h(f)==h(D/f.relative_to(R)),str(f)
# Ensure all pre-existing files and designated source files remain unchanged.
b=json.loads((R/'tools-第2阶段/baseline.json').read_text())
for n,v in b['stage1_files'].items():assert h(R/n)==v,n
for x in b['checks']:assert h(R.parent/x['path'])==x['expected'],x['path']
print(json.dumps({'destination':str(D),'file_count':count,'bytes':sum(f.stat().st_size for f in files),'all_hashes_match':True,'baseline_41_match':True,'stage1_112_unchanged':True},ensure_ascii=False))

