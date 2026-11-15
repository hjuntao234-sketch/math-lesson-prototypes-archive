"""Run the frozen official page replay; save exact output and source fingerprints."""
from pathlib import Path
import sys,subprocess,json,hashlib,datetime
P=Path(__file__).resolve().parents[3];R=P/'立绘-GPT/批1R2/验证';mode=sys.argv[1];ids=sys.argv[2:]
assert mode in ['clean','trap'] and ids
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S');tag=f'{stamp}-{mode}-'+','.join(ids)
cmd=['/Applications/Codex.app/Contents/Resources/cua_node/bin/node','v6/tools/autoplay.cjs',mode,*ids]
metadata={'command':cmd,'start':datetime.datetime.now().isoformat(),'dist_sha256':sha(P/'v6/dist/index.html'),'battle_sha256':{i:sha(P/'关卡/第一章/战斗'/f'{i}.json') for i in ids}}
p=subprocess.run(cmd,cwd=P,capture_output=True,text=True,timeout=1200)
(R/(tag+'.json')).write_text(p.stdout);(R/(tag+'.stderr.txt')).write_text(p.stderr)
metadata.update({'exit_code':p.returncode,'finish':datetime.datetime.now().isoformat(),'source_unchanged_during_run':{i:sha(P/'关卡/第一章/战斗'/f'{i}.json')==h for i,h in metadata['battle_sha256'].items()},'dist_unchanged':metadata['dist_sha256']==sha(P/'v6/dist/index.html')})
(R/(tag+'.context.json')).write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(tag,p.stdout.strip(),flush=True)
if p.stderr:print(p.stderr)
sys.exit(p.returncode)
