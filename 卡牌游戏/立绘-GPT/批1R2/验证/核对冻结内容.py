"""Read-only checks for R2 protected content; reports only under this folder."""
from pathlib import Path
import hashlib,json,re
P=Path(__file__).resolve().parents[3];R=P/'立绘-GPT/批1R2'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base=json.loads((P/'关卡/第一章/改条件-基线-20261107.json').read_text())['关']
ids=[f'{c}-{k}' for c in range(6,14) for k in range(1,4) if (c,k)!=(9,1)]
rows=[]
for i in ids:
 n=json.loads((P/'关卡/第一章/战斗'/f'{i}.json').read_text());o=json.loads((R/'旧版'/f'{i}.json').read_text());cond=n['改条件']
 h=hashlib.sha256(json.dumps(cond,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 chk={k:n[k]==o[k] for k in ['题','答','卡','次','队友','支架']}
 chk['图']=n['守卫']['图']==o['守卫']['图'];chk['部位坐标与标位']=all(n['守卫']['部位'][q]['点']==v['点'] and n['守卫']['部位'][q].get('标位')==v.get('标位') for q,v in o['守卫']['部位'].items())
 chk['改条件与旧稿逐值一致']=cond==o['改条件'];chk['改条件与Claude基线逐值一致']=cond==base[i]['改条件'];chk['改条件规范化SHA一致']=h==base[i]['sha256']
 rows.append({'id':i,'sha256':h,'baseline_sha256':base[i]['sha256'],'checks':chk})
report={'method':'json.dumps(改条件,ensure_ascii=False,sort_keys=True,separators=(",",":")) UTF-8 SHA-256；按任务基线_说明，不比较JSON外层缩进','battles':rows,'pass':all(all(r['checks'].values()) for r in rows)}
(R/'验证/改条件与冻结内容-23场.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
prompt=P.parent/'PROMPT-20261107-adventure-ch1-batch1-R2.md';table=prompt.read_text().split('## 9. 哈希表')[1]
pairs=re.findall(r'^\| `([^`]+)` \|.*?`([0-9a-f]{64})` \|',table,re.M);assert len(pairs)==16
files=[{'path':p,'expected':h,'actual':sha(P/p),'pass':sha(P/p)==h} for p,h in pairs]
(R/'验证/冻结16文件-当前.json').write_text(json.dumps(files,ensure_ascii=False,indent=2)+'\n')
print('23场改条件及保护字段：','PASS' if report['pass'] else 'FAIL');print('16文件哈希：',sum(x['pass'] for x in files),'/16')
assert report['pass'] and all(x['pass'] for x in files)
