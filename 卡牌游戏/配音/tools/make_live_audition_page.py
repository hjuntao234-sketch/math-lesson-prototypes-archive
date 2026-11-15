"""Build the portrait-guided GPT-Live audition and retain first-round comparison."""
from pathlib import Path
import hashlib
import html
import json
import subprocess

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'配音/序章'
OUT=BASE/'试镜-R2-GPTLive'
plan=json.loads((OUT/'计划.json').read_text())
rows=json.loads((OUT/'调用记录.json').read_text())
records={r['file']:r for r in rows if r.get('status')=='complete'}
assert len(records)==24,'Need all 24 clips before delivery'
checks=[]
for job in plan['jobs']:
    f=OUT/job['file'];r=records[job['file']]
    assert f.stat().st_size>2000
    decode=subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(f),'-f','null','-'],capture_output=True)
    assert decode.returncode==0
    h=hashlib.sha256(f.read_bytes()).hexdigest();assert h==r['sha256']
    checks.append({'file':job['file'],'decode_ok':True,'sha256':h,'seconds':r['seconds'],
                   'transcript_matches':r['normalized_transcript_matches'],
                   'transcript':r['transcript'],'expected':job['input']})
(OUT/'检查.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
esc=html.escape
old=json.loads((BASE/'试镜计划.json').read_text())
old_first={p:s['voices'][0] for p,s in old['people'].items()}

def clip(job,voice=None,older=False):
    person=job['person'];v=voice or job['voice'];filename=f"{person}-{job['id']}-{v}.mp3"
    folder='试镜' if older else '试镜-R2-GPTLive'
    label=('旧版 '+v) if older else v
    return f'<div class="clip"><small>{job["id"]}</small><p>{esc(job["input"])}</p><audio controls preload="metadata" aria-label="{esc(person+" "+label+" "+job["id"])}" src="{folder}/{esc(filename,quote=True)}"></audio></div>'

sections=[];primary=[]
for name,voices in plan['voices'].items():
    person=plan['people'][name];first=voices[0]
    chosen=[j for j in plan['jobs'] if j['person']==name and j['voice']==first]
    primary.extend('试镜-R2-GPTLive/'+j['file'] for j in chosen)
    featured=''.join(clip(j) for j in chosen)
    alternatives=[]
    for v in voices[1:]:
        content=''.join(clip(j) for j in plan['jobs'] if j['person']==name and j['voice']==v)
        alternatives.append(f'<article><h3>{v}</h3>{content}</article>')
    before=''.join(clip(j,old_first[name],True) for j in chosen)
    opts=''.join(f'<option value="{v}">{v}</option>' for v in voices)
    sections.append(f'''<section id="{person['art']}"><div class="character"><img src="试镜-R2-GPTLive/人物/{person['art']}.webp" alt="{name}全身立绘"><div><span class="tag">人物与声音</span><h2>{name}</h2><p class="one">{esc(person['description'])}</p><p class="reason">{esc(person['rationale'])}</p><label>当前首选 <select data-person="{name}" aria-label="{name}的声音">{opts}<option value="仍不合适">仍不合适</option></select></label></div></div><div class="featured"><div class="voice-heading"><h3>{first}</h3><span>建议先听</span></div><div class="pair">{featured}</div></div><details><summary>另外两个候选</summary><div class="alternatives">{''.join(alternatives)}</div></details><details><summary>与上一轮 mini TTS 对照</summary><div class="pair old">{before}</div></details></section>''')

page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>罗盘指挥官 · GPT-Live 1 人物试镜</title><style>
:root{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#2b332e;background:#f4f1ea;color-scheme:light}*{box-sizing:border-box}body{margin:0}main{max-width:1040px;margin:auto;padding:40px 22px 70px}header{padding-bottom:24px;border-bottom:1px solid #d4dacb}.tag{font-size:12px;letter-spacing:2px;color:#6b795d}h1{font-size:34px;margin:12px 0}header p{color:#5e6955;line-height:1.8;max-width:800px}.controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:24px 0 16px}button{border:0;border-radius:9px;padding:12px 20px;background:#3d5842;color:white;font:inherit;cursor:pointer}button.secondary{background:#e0e5d8;color:#3d5842}nav{display:flex;gap:16px;flex-wrap:wrap}nav a{color:#4c6548;text-decoration:none}section{margin-top:32px;background:#fff;border:1px solid #dde2d5;border-radius:20px;padding:26px}.character{display:flex;gap:26px;align-items:center}.character img{width:145px;height:225px;object-fit:contain;background:#f1f2ec;border-radius:14px;padding:6px}.character>div{flex:1}.character h2{font-size:28px;margin:8px 0}.one{font-size:17px;color:#3d5943}.reason{line-height:1.8;color:#65705d;max-width:650px}label{font-size:14px}select{font:inherit;background:#f7f9f3;border:1px solid #c7d2be;border-radius:8px;padding:7px 12px;color:#355238}.featured{margin-top:20px;background:#f3f6ed;padding:20px;border-radius:14px}.voice-heading{display:flex;gap:14px;align-items:center}.voice-heading h3{margin:0;font-size:23px}.voice-heading span{font-size:12px;color:#5e7650}.pair,.alternatives{display:grid;grid-template-columns:1fr 1fr;gap:24px}.clip{margin-top:16px;min-width:0}.clip small{color:#78836f;font-size:12px}.clip p{line-height:1.75;min-height:58px;margin:6px 0 12px}audio{height:42px;width:100%}details{margin-top:17px;border-top:1px solid #ecefe6;padding-top:15px}summary{cursor:pointer;color:#53684c;font-size:14px}article{min-width:0;padding:12px}article h3{margin:10px 0}.old{padding:10px 20px}.result{margin-top:30px;padding:24px;border-radius:16px;background:#e9efdf}.result h2{font-size:20px;margin-top:0}output{line-height:1.8;user-select:all}.note{font-size:13px;color:#6b7760;line-height:1.7}footer{text-align:center;color:#73816a;font-size:13px;padding-top:28px}@media(max-width:650px){main{padding:24px 14px}.character{gap:14px;align-items:flex-start}.character img{width:100px;height:160px}.character h2{font-size:24px}.pair,.alternatives{grid-template-columns:1fr}section{padding:18px}.reason{font-size:14px}.clip p{min-height:0}h1{font-size:27px}}
</style><main><header><div class="tag">罗盘指挥官 / 第二轮人物试镜</div><h1>看着角色，听见她与他</h1><p>本轮使用 <strong>GPT-Live 1</strong>。按人物立绘与性格筛选声音，每人放一个首选、两个备选。先听首选的八句，感受同一个人在不同情境里的变化；也可以展开备选和上一轮对照。</p><div class="controls"><button id="playPrimary">连播四人首选 · 8 句</button><button class="secondary" id="stop">停止</button><span id="now" class="note"></span></div><nav>'''+''.join(f'<a href="#{plan["people"][n]["art"]}">{n}</a>' for n in plan['voices'])+'''</nav></header>'''+''.join(sections)+'''<div class="result"><h2>当前选声方案</h2><output id="selection"></output><p class="note">这是本轮首选建议，尚未开始 69 句全配。可以调整下拉选项，把选择发回聊天；选择不会自动上传。音色与演出是否合适，以你的实际试听为准。</p></div><footer>配音为 AI 生成 · GPT-Live 1</footer></main><script>
const list='''+json.dumps(primary,ensure_ascii=False)+''';const players=[...document.querySelectorAll('audio')];let index=-1;let autoplay=false;
function stop(){autoplay=false;index=-1;players.forEach(a=>a.pause());document.getElementById('now').textContent='';}
function playAt(i){if(i>=list.length){stop();return;}index=i;const a=players.find(x=>x.getAttribute('src')===list[i]);document.getElementById('now').textContent=(i+1)+' / 8 · '+a.getAttribute('aria-label');a.currentTime=0;a.play().catch(()=>{stop();document.getElementById('now').textContent='请点播放器继续试听';});}
players.forEach(a=>{a.addEventListener('play',()=>{if(autoplay&&a.getAttribute('src')!==list[index]){autoplay=false;index=-1;document.getElementById('now').textContent='';}players.forEach(b=>{if(b!==a)b.pause()});});a.addEventListener('ended',()=>{if(autoplay&&a.getAttribute('src')===list[index])playAt(index+1)});});
document.getElementById('playPrimary').onclick=()=>{stop();autoplay=true;playAt(0)};document.getElementById('stop').onclick=stop;
function selection(){document.getElementById('selection').textContent=[...document.querySelectorAll('select')].map(s=>s.dataset.person+'：'+s.value).join('；');}
document.querySelectorAll('select').forEach(s=>s.addEventListener('change',selection));selection();
</script></html>'''
(BASE/'试镜-R2-GPTLive.html').write_text(page)
print(json.dumps({'mp3_checked':24,'transcript_matches':sum(x['transcript_matches'] for x in checks),
                  'needs_review':[x['file'] for x in checks if not x['transcript_matches']],
                  'usage_seconds':sum(r.get('session_usage_seconds') or 0 for r in records.values())},ensure_ascii=False))
