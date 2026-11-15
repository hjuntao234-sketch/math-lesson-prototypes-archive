#!/usr/bin/env python3
"""Build a standalone audition page only after all 24 MP3s exist and decode."""
from pathlib import Path
import hashlib
import html
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '配音/序章'
plan = json.loads((OUT / '试镜计划.json').read_text())
jobs = plan['jobs']
checks = []
for job in jobs:
    f = OUT / '试镜' / job['file']
    if not f.exists() or f.stat().st_size < 2000:
        raise SystemExit('STOP: audition audio missing')
    probe = subprocess.run(['/opt/homebrew/bin/ffprobe', '-v', 'error', '-show_entries',
                            'format=duration', '-of', 'default=nw=1:nk=1', str(f)],
                           capture_output=True, text=True, check=True)
    sec = float(probe.stdout.strip())
    decode = subprocess.run(['/opt/homebrew/bin/ffmpeg', '-v', 'error', '-i', str(f),
                             '-f', 'null', '-'], capture_output=True)
    if decode.returncode or sec <= 0:
        raise SystemExit('STOP: audio decode failed')
    rate = job['chars'] / sec
    checks.append({'file': job['file'], 'seconds': sec, 'chars_per_second': rate,
                   'duration_warning': sec < .6 or rate > 8 or rate < 1.8,
                   'decode_ok': True, 'sha256': hashlib.sha256(f.read_bytes()).hexdigest()})
assert len(checks) == 24
(OUT / '试镜检查.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n')
esc = html.escape
sections = []
for i, (person, settings) in enumerate(plan['people'].items()):
    cards = []
    for n, voice in enumerate(settings['voices'], 1):
        clips = []
        for job in jobs:
            if job['person'] == person and job['voice'] == voice:
                clips.append(f'<div class="clip"><span class="line-id">{esc(job["id"])}</span>'
                             f'<p>{esc(job["input"])}</p><audio controls preload="metadata" '
                             f'aria-label="{esc(person)} {esc(voice)} {esc(job["id"])}" '
                             f'src="试镜/{esc(job["file"], quote=True)}"></audio></div>')
        cards.append(f'<article><div class="voice"><small>候选 {n}</small><h3>{voice}</h3></div>{"".join(clips)}</article>')
    options = ''.join(f'<option value="{v}">{v}</option>' for v in settings['voices'])
    sections.append(f'<section id="person-{i}"><div class="person"><div><h2>{person}</h2>'
                    f'<p>{esc(settings["description"])}</p></div><label>我的选择 '
                    f'<select data-person="{person}" aria-label="{person}的声音"><option value="">还没选</option>'
                    f'{options}<option value="都不行，换一批">都不行，换一批</option></select></label></div>'
                    f'<div class="candidates">{"".join(cards)}</div></section>')
page = '''<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>罗盘指挥官 · 序章试镜</title>
<style>
:root{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#2b332e;background:#f5f3ee}
*{box-sizing:border-box}body{margin:0}main{max-width:1180px;margin:auto;padding:44px 24px 64px}
header{padding:12px 0 28px;border-bottom:1px solid #dcded5}h1{font-size:34px;margin:12px 0}header p{max-width:760px;line-height:1.8;color:#586459}
.eyebrow{font-size:12px;letter-spacing:2px;color:#677a58}nav{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0 0}nav a{color:#3c5740;background:#e7eadf;padding:9px 16px;border-radius:24px;text-decoration:none}
section{padding-top:30px}.person{display:flex;gap:16px;justify-content:space-between;align-items:center;margin-bottom:16px}.person h2{font-size:25px;margin:0}.person p{margin:8px 0;color:#667260}
.candidates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}article{background:white;border:1px solid #e0e2d8;border-radius:16px;padding:20px;min-width:0}.voice{display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid #eef0e9}.voice small{color:#71806b}.voice h3{margin:0;font-size:21px;font-weight:600}.clip{margin-top:20px}.line-id{font-size:12px;color:#7f8c76}.clip p{line-height:1.65;min-height:80px;font-size:15px;margin:8px 0 12px}audio{width:100%;height:42px}select{font:inherit;padding:8px 12px;border:1px solid #ccd4c5;border-radius:8px;background:#fff;color:#334435}label{font-size:14px;white-space:nowrap}.result{margin-top:36px;border:1px solid #cdd6c3;border-radius:16px;padding:24px;background:#edf1e7}.result h2{margin:0 0 12px;font-size:20px}output{display:block;line-height:1.8;white-space:pre-wrap;user-select:all;color:#314c34}.hint{font-size:13px;color:#6d7667;line-height:1.7}footer{text-align:center;padding-top:32px;color:#71806b;font-size:13px}@media(max-width:800px){main{padding:24px 16px}.candidates{grid-template-columns:1fr}.person{align-items:flex-start;flex-direction:column}.clip p{min-height:0}h1{font-size:28px}}
</style><main><header><div class="eyebrow">罗盘指挥官 / 序章配音试做</div><h1>听见角色，选出声音</h1>
<p>四位角色，每人三个候选；同一个声音各演两句，听听平常说话和情绪变化。听完后，每人选一个名字，把下方选择发回聊天。也可以选“都不行，换一批”。</p>
<nav>''' + ''.join(f'<a href="#person-{i}">{name}</a>' for i, name in enumerate(plan['people'])) + '''</nav></header>''' + ''.join(sections) + '''
<div class="result"><h2>你的选择</h2><output id="selection">还没有选择声音。</output><p class="hint">在每组右侧选择声音后，选中文字复制到聊天即可。此页面只在本机试听，不会上传选择；刷新页面会清空选择。</p></div>
<footer>配音为 AI 生成</footer></main><script>
const players=[...document.querySelectorAll('audio')];
players.forEach(a=>a.addEventListener('play',()=>players.forEach(b=>{if(b!==a)b.pause()})));
document.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>{
document.getElementById('selection').textContent=[...document.querySelectorAll('select')].map(x=>x.dataset.person+'：'+(x.value||'待选')).join('；');
}));
</script></html>'''
(OUT / '试镜.html').write_text(page)
print(json.dumps({'audio_count': len(checks), 'decoded': 24,
                  'duration_warnings': [x['file'] for x in checks if x['duration_warning']],
                  'total_seconds': sum(x['seconds'] for x in checks)}, ensure_ascii=False))
