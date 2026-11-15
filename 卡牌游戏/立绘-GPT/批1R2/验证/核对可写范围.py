"""Compare project files with the pre-task snapshot; only report allowed R2 changes."""
from pathlib import Path
import hashlib,json
P=Path(__file__).resolve().parents[3];R=P/'立绘-GPT/批1R2'
baseline=json.loads((R/'baseline.json').read_text())
ids=[f'{a}-{b}' for a in range(6,14) for b in range(1,4) if (a,b)!=(9,1)]
allowed={f'关卡/第一章/战斗/{i}.json' for i in ids}|{f'素材/守卫/siege/{n}' for n in ('wall.webp','wall-raised.webp','arm-c.webp','low-gap.webp','flag.webp','pivots.json')}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
changed=[n for n,h in baseline.items() if not (P/n).is_file() or sha(P/n)!=h]
new=[]
for f in P.rglob('*'):
 if not f.is_file():continue
 n=str(f.relative_to(P))
 if n in baseline or n.startswith('v6/dist/') or n.startswith('立绘-GPT/批1R2/') or n=='关卡/第一章/批1R2-进度.md':continue
 new.append(n)
result={'baseline_files':len(baseline),'changed_old':changed,'unexpected_changed_old':[n for n in changed if n not in allowed],'new_outside_whitelist':new}
(R/'验证/可写范围-当前.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('修改原文件',len(changed),'越界修改',len(result['unexpected_changed_old']),'越界新文件',len(new))
assert not result['unexpected_changed_old'] and not new
