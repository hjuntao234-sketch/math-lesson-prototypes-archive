"""Validate and package the bilingual English audition, without more API calls."""
from pathlib import Path
import hashlib
import html
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'配音/序章'
OUT=BASE/'试镜-R3-English'
plan=json.loads((OUT/'计划.json').read_text())
rows=json.loads((OUT/'调用记录.json').read_text())
records={r['file']:r for r in rows if r['status']=='complete'}
assert len(records)==24,'Need all 24 English auditions'
checks=[]
for job in plan['jobs']:
    f=OUT/job['file'];record=records[job['file']]
    assert f.stat().st_size>2000
    sha=hashlib.sha256(f.read_bytes()).hexdigest();assert sha==record['sha256']
    r=subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(f),'-f','null','-'],capture_output=True)
    assert r.returncode==0
    checks.append({'file':job['file'],'sha256':sha,'decode_ok':True,'seconds':record['seconds'],
        'expected':job['input'],'transcript':record['transcript'],'transcript_matches':record['normalized_transcript_matches']})
(OUT/'检查.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
esc=html.escape
def clip(job):
    return f'''<div class="clip"><small>{job['id']}</small><p class="en" lang="en">{esc(job['input'])}</p><p class="zh">{esc(job['source_chinese'])}</p><audio controls preload="metadata" aria-label="{esc(job['person']+' '+job['voice']+' '+job['id'])}" src="试镜-R3-English/{esc(job['file'],quote=True)}"></audio></div>'''

sections=[];primary=[]
for name,voices in plan['voices'].items():
    person=plan['people'][name];jobs=[j for j in plan['jobs'] if j['person']==name and j['voice']==voices[0]]
    primary.extend(jobs)
    alternates=[]
    for v in voices[1:]:
        alternates.append(f'<article><h3>{v}</h3>'+''.join(clip(j) for j in plan['jobs'] if j['person']==name and j['voice']==v)+'</article>')
    options=''.join(f'<option value="{v}">{v}</option>' for v in voices)
    sections.append(f'''<section id="{person['art']}"><div class="character"><img src="试镜-R3-English/人物/{person['art']}.webp" alt="{name}立绘"><div><span class="tag">{person['english_name']}</span><h2>{name}</h2><p class="one">{esc(person['description'])}</p><p class="reason">{esc(person['rationale'])}</p><label>声音 <select data-person="{name}" aria-label="{name}选声">{options}<option value="仍不合适">仍不合适</option></select></label></div></div><div class="featured"><div class="voice-heading"><h3>{voices[0]}</h3><span>首选建议</span></div><div class="pair">{''.join(clip(j) for j in jobs)}</div></div><details><summary>另外两个英语声线</summary><div class="alternatives">{''.join(alternates)}</div></details></section>''')

# Reuse the local typography and responsive layout already delivered.
old=(BASE/'试镜-R2-GPTLive.html').read_text()
css=re.search(r'<style>(.*?)</style>',old,re.S)[1]+'.clip p.en{font-size:17px;line-height:1.65;min-height:76px}.clip p.zh{font-size:13px;color:#7c8279;line-height:1.7;min-height:44px}.character img{height:240px}.tag{letter-spacing:1.5px}.listen{margin-top:18px}.listen audio{max-width:600px}@media(max-width:650px){.clip p.en,.clip p.zh{min-height:0}.character img{height:170px}}'
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>罗盘指挥官 · 英文人物试镜</title><style>'''+css+'''</style><main><header><div class="tag">罗盘指挥官 / ENGLISH CAST AUDITIONS</div><h1>英文人物试镜</h1><p>四个角色，英语对白。保留原剧情和数学含义，按英文对白习惯翻译；每人一个首选、两个备选，附中文对照。先听下面的八句首选连播，再比较单句。</p><div class="listen"><audio controls preload="metadata" aria-label="四人首选八句连播" src="试镜-R3-English/首选连播-8句.mp3"></audio><p class="note">顺序：塔莉 → 雅娜 → 法比娅 → 诺曼，每人两句。</p></div><nav>'''+''.join(f'<a href="#{plan["people"][n]["art"]}">{n}</a>' for n in plan['voices'])+'''</nav></header>'''+''.join(sections)+'''<div class="result"><h2>当前选声方案</h2><output id="selection"></output><p class="note">选项只在本页显示，不会上传。尚未开始全配；演出是否贴合，以你的实际试听为准。</p></div><footer>配音为 AI 生成 · GPT-Live 1 · English</footer></main><script>
const players=[...document.querySelectorAll('audio')];players.forEach(a=>a.addEventListener('play',()=>players.forEach(b=>{if(b!==a)b.pause()})));
function updateSelection(){document.getElementById('selection').textContent=[...document.querySelectorAll('select')].map(s=>s.dataset.person+'：'+s.value).join('；');}
document.querySelectorAll('select').forEach(s=>s.addEventListener('change',updateSelection));updateSelection();
</script></html>'''
(BASE/'英文试镜.html').write_text(page)

pcm=bytearray();order=[]
for job in primary:
    if pcm:pcm.extend(bytes(24000*2))
    r=subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(OUT/job['file']),'-ar','24000','-ac','1','-f','s16le','pipe:1'],capture_output=True,check=True)
    pcm.extend(r.stdout);order.append({k:job[k] for k in ['person','id','voice','file','input','source_chinese']})
subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-y','-f','s16le','-ar','24000','-ac','1','-i','pipe:0','-c:a','libmp3lame','-b:a','192k',str(OUT/'首选连播-8句.mp3')],input=bytes(pcm),capture_output=True,check=True)
(OUT/'首选连播-顺序.json').write_text(json.dumps(order,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'files':24,'transcript_matches':sum(c['transcript_matches'] for c in checks),'issues':[c['file'] for c in checks if not c['transcript_matches']]},ensure_ascii=False))
