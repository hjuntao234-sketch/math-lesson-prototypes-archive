from pathlib import Path
import json,hashlib,shutil,sys
P=Path(__file__).resolve().parents[2];R=P/'立绘-GPT/批2a'
D=Path('~/Desktop/罗盘指挥官_第一章批2a_2026-11-07')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
folders=['balance','arch','siege','zigzag','mirror','boss-b','boss-end','boss-a','boss-c','boss-d','minion']
files=[P/'关卡/第一章/批2a-进度.md']
for n in folders:files.extend(f for f in (P/'素材/守卫'/n).rglob('*') if f.is_file())
files.extend(P/'素材/全身'/('ready-'+n+'.webp') for n in ['ilu','divi','ora','quidda','mira'])
files.extend(P/'素材/守卫/p3'/n for n in ['guard.json','pivots.json','arm-long-down.webp','arm-short-down.webp'])
files.extend(f for f in R.rglob('*') if f.is_file() and f.name not in ['交付SHA256.json','桌面哈希核对.json'])
files=sorted(set(files))
manifest={str(f.relative_to(P)):sha(f) for f in files}
m=R/'交付SHA256.json';m.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
if '--copy' not in sys.argv:
 print('manifest files:',len(manifest),'plus manifest and final receipt');sys.exit(0)
allfiles=files+[m]
for f in allfiles:
 dest=D/f.relative_to(P);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
wrong=[str(f.relative_to(P)) for f in allfiles if sha(f)!=sha(D/f.relative_to(P))]
assert not wrong,wrong
receipt={'文件数':len(allfiles),'逐文件SHA256一致':True,'桌面':str(D),'含交付清单':True,'另附本核对回执':True,'交付清单SHA256':sha(m)}
f=R/'桌面哈希核对.json';f.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');shutil.copy2(f,D/f.relative_to(P));assert sha(f)==sha(D/f.relative_to(P))
expected={str(f.relative_to(P)) for f in allfiles+[f]};actual={str(q.relative_to(D)) for q in D.rglob('*') if q.is_file()}
assert actual==expected,{'extra':list(actual-expected),'missing':list(expected-actual)}
print(json.dumps({**receipt,'含回执最终文件总数':len(actual),'进度文件SHA256':sha(P/'关卡/第一章/批2a-进度.md')},ensure_ascii=False,indent=2))

