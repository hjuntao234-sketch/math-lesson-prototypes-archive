"""Collect only official runs whose recorded battle digest matches current source."""
from pathlib import Path
import hashlib, json

P = Path(__file__).resolve().parents[3]
V = P / '立绘-GPT/批1R2/验证'
ids = [f'{a}-{b}' for a in range(6,14) for b in range(1,4) if (a,b)!=(9,1)]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
latest = {}
for ctxfile in sorted(V.glob('*.context.json')):
    ctx = json.loads(ctxfile.read_text())
    mode = ctx['command'][2]
    if mode not in ('clean','trap') or ctx['exit_code'] != 0 or not ctx['dist_unchanged']:
        continue
    rawfile = ctxfile.with_name(ctxfile.name.replace('.context.json','.json'))
    rows = json.loads(rawfile.read_text())
    page_errors = [r.get('pageErrors') for r in rows if 'pageErrors' in r]
    if page_errors != [[]]:
        continue
    for r in rows:
        i = r.get('id')
        if i not in ids or not r.get('ok') or not r.get('end'):
            continue
        if ctx['battle_sha256'][i] != sha(P / '关卡/第一章/战斗' / (i+'.json')):
            continue
        if not ctx['source_unchanged_during_run'][i]:
            continue
        if mode == 'clean' and (r['round'] != r['layers'] or r['stars'] != 3 or r['traps'] != 0):
            continue
        latest[(i,mode)] = dict(r, raw=str(rawfile.relative_to(P)), context=str(ctxfile.relative_to(P)), battle_sha256=ctx['battle_sha256'][i])
rows = [{'id': i, 'clean': latest.get((i,'clean')), 'trap': latest.get((i,'trap'))} for i in ids]
missing = [{'id': i,'mode': m} for i in ids for m in ('clean','trap') if (i,m) not in latest]
result = {'scope':'Official full page replay; latest battle SHA required; not student simulation or exhaustive wrong-option coverage.',
          'all_46_current_passed': not missing, 'missing':missing, 'battles':rows}
(V/'最新版23场对战汇总.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':len(latest),'required':46,'missing':missing},ensure_ascii=False))
