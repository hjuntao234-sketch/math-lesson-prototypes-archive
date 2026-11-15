"""Package only authorized R2 files; compare every copied file with its source."""
from pathlib import Path
import datetime, hashlib, json, shutil, sys
from zoneinfo import ZoneInfo

P = Path(__file__).resolve().parents[3]
R = P / '立绘-GPT/批1R2'
dest = Path(sys.argv[1])
assert dest.parent == Path('~/Desktop')
assert dest.name.startswith('罗盘指挥官_第一章批1R2_')
assert not dest.exists(), 'Destination exists; do not overwrite an earlier delivery.'
ids = [f'{a}-{b}' for a in range(6,14) for b in range(1,4) if (a,b)!=(9,1)]
source_paths = [P/'关卡/第一章/战斗'/f'{i}.json' for i in ids]
source_paths += [P/'素材/守卫/siege'/n for n in ('wall.webp','wall-raised.webp','arm-c.webp','low-gap.webp','flag.webp','pivots.json')]
progress = P/'关卡/第一章/批1R2-进度.md'
assert progress.is_file()
source_paths.append(progress)
manifest_path = R/'验证/桌面副本-清单.json'
receipt_path = R/'验证/桌面副本-核对.json'
source_paths += [f for f in R.rglob('*') if f.is_file() and f not in (manifest_path,receipt_path)]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
stamp = lambda: datetime.datetime.now(ZoneInfo('Asia/Tokyo')).isoformat()
entries = [{'path':str(f.relative_to(P)), 'sha256':sha(f), 'bytes':f.stat().st_size} for f in sorted(source_paths)]
manifest = {'created':stamp(), 'source_root':str(P), 'desktop_root':str(dest),
 'note':'Payload hashes exclude this manifest and receipt to avoid self-reference; both metadata files are separately compared after copying.',
 'payload_count':len(entries), 'files':entries}
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
dest.mkdir()
for f in source_paths + [manifest_path]:
 target = dest/f.relative_to(P)
 target.parent.mkdir(parents=True,exist_ok=True)
 shutil.copy2(f,target)
mismatches = [e['path'] for e in entries if sha(P/e['path']) != e['sha256'] or sha(dest/e['path']) != e['sha256']]
expected = {e['path'] for e in entries}|{str(manifest_path.relative_to(P))}
actual = {str(f.relative_to(dest)) for f in dest.rglob('*') if f.is_file()}
manifest_ok = sha(manifest_path) == sha(dest/manifest_path.relative_to(P))
assert not mismatches and expected == actual and manifest_ok, (mismatches,expected-actual,actual-expected,manifest_ok)
receipt = {'verified':stamp(),'pass':True,'source_root':str(P),'desktop_root':str(dest),
 'payload_count':len(entries),'total_files_including_manifest_and_receipt':len(entries)+2,
 'mismatches':mismatches,'missing':sorted(expected-actual),'extra':sorted(actual-expected),
 'manifest_sha256':sha(manifest_path),'manifest_copy_equal':manifest_ok,
 'progress_sha256':sha(progress),
 'note':'Every payload file and manifest compared against its source. This identical receipt is then copied and its SHA equality asserted; it cannot include its own SHA.'}
receipt_path.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
target_receipt = dest/receipt_path.relative_to(P)
shutil.copy2(receipt_path,target_receipt)
assert sha(receipt_path) == sha(target_receipt)
assert len([f for f in dest.rglob('*') if f.is_file()]) == len(entries)+2
print(json.dumps(dict(receipt,receipt_sha256=sha(receipt_path),receipt_copy_equal=True),ensure_ascii=False,indent=2))
