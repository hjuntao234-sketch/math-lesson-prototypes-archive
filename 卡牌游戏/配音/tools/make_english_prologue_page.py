"""Build the local bilingual 69-line listening page and sequential compilation."""
import hashlib
import html
import json
from pathlib import Path
import subprocess
import sys
sys.dont_write_bytecode=True
import english_prologue as ep

PLAN=json.loads((ep.OUT/'计划.json').read_text())
CHECKS={r['id']:r for r in json.loads((ep.OUT/'成品检查.json').read_text())}
assert len(CHECKS)==69 and all(r['loudness_ok'] for r in CHECKS.values())
ESC=html.escape
SCENES={'prologue':'序章 · 相遇','p1in':'第一战 · 战前','p1-1':'第一战 · 三个条件','p1out':'第一战 · 战后',
        'p2in':'第二战 · 新同伴','p2-1':'第二战 · 补上缺失','p2out':'第二战 · 战后',
        'p3in':'第三战 · 隔日再见','p3-1':'第三战 · 翻转','p3out':'第三战 · 交付武器','fieldOpen':'原野 · 出发'}
FOCUS={5:'起长名字时的笑意，以及 Comfy 的轻快落点。',20:'X is greater than zero 的字母和比较关系。',
       23:'equal 条件与后面的提问要分清。',37:'one apart 指两者相差常数 1。',44:'T 读字母 tee；数值为 three。',
       50:'先把功劳让给对方，再轻声说明 added the missing one。',59:'negative X 与 negative nine divided by X 分成两个清楚的量。',
       61:'equal 条件与砍完翻回去的提醒。'}
def display_chinese(s):return s.replace('\\dfrac9x','9/x').replace('$','')

sections=[];current=None;parts=[]
for j in PLAN['jobs']:
    if j['scene']!=current:
        if current is not None:sections.append('<section><h2>'+SCENES[current]+'</h2>'+''.join(parts)+'</section>')
        current=j['scene'];parts=[]
    assert hashlib.sha256((ep.BASE/j['file']).read_bytes()).hexdigest()==CHECKS[j['id']]['sha256']
    focus=FOCUS.get(int(j['id'].split('-')[1]))
    flag=f'<p class="focus">重点听：{ESC(focus)}</p>' if focus else ''
    parts.append(f'''<article id="line-{j['id']}" class="line"><div class="meta"><span class="number">{j['id']}</span><strong>{j['person']}</strong><span class="voice">{j['voice']}</span></div><p class="english" lang="en">{ESC(j['input'])}</p><p class="chinese">{ESC(display_chinese(j['source_chinese']))}</p>{flag}<audio controls preload="none" data-id="{j['id']}" aria-label="{j['id']} {j['person']}" src="{j['file']}"></audio></article>''')
sections.append('<section><h2>'+SCENES[current]+'</h2>'+''.join(parts)+'</section>')
cast=''.join(f'<div class="person"><img src="试镜-R3-English/人物/{ep.live.ART[n]}.webp" alt="{n}立绘"><div><strong>{n}</strong><small>{v}</small></div></div>' for n,v in PLAN['voices'].items())
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>罗盘指挥官 · 序章英文配音</title><style>
:root{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#29332d;background:#f4f1ea;color-scheme:light}*{box-sizing:border-box}body{margin:0}main{max-width:960px;margin:auto;padding:38px 22px 70px}h1{font-size:32px;line-height:1.3;margin:14px 0}.kicker{font-size:12px;letter-spacing:2px;color:#6a7b59}.intro{color:#65715e;line-height:1.8}.cast{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:25px 0}.person{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #dbe2d1;background:white;border-radius:14px}.person img{width:58px;height:100px;object-fit:contain}.person small{display:block;color:#7a8474;margin-top:6px}.toolbar{position:sticky;top:0;z-index:2;background:#f4f1eaed;backdrop-filter:blur(10px);display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 0;border-bottom:1px solid #d9dfd2}button{border:0;background:#3d5842;color:white;padding:11px 17px;border-radius:8px;font:inherit;cursor:pointer}.secondary{background:#e0e7d8;color:#3d5842}#status{font-size:13px;color:#65715e}section{margin-top:32px}h2{font-size:20px;color:#4a6244;font-weight:600}.line{background:white;border:1px solid #dde4d6;border-radius:15px;padding:20px 24px;margin:13px 0;scroll-margin-top:100px}.line.active{border-color:#7e9b69;box-shadow:0 0 0 2px #dce9d0}.meta{display:flex;gap:13px;align-items:center}.number{font-size:12px;color:#849078}.voice{margin-left:auto;font-size:12px;color:#849078}.english{font-size:18px;line-height:1.75;margin:12px 0 6px}.chinese{font-size:14px;line-height:1.8;color:#788171;margin:0 0 12px}.focus{padding:8px 12px;background:#fff7dd;color:#8a6c25;font-size:13px;line-height:1.65;border-radius:7px}audio{display:block;width:100%;height:41px}.compilation{margin:24px 0;padding:20px;background:#e9efdf;border-radius:15px}.compilation p{font-size:13px;color:#65715e;line-height:1.7}.links a{color:#526d48}footer{margin-top:34px;text-align:center;font-size:13px;color:#78836e}@media(max-width:640px){main{padding:25px 13px}.cast{grid-template-columns:repeat(2,1fr);gap:8px}.person img{height:82px;width:48px}.line{padding:17px}.english{font-size:17px}h1{font-size:27px}}
</style><main><header><div class="kicker">罗盘指挥官 / PROLOGUE · ENGLISH</div><h1>序章英文配音</h1><p class="intro">69 句人物对白，按台词表顺序排列，含不同战斗分支。可从头连播，也可单独听一句；黄色提示标出了值得留意的读法和表演。</p><div class="cast">'''+cast+'''</div></header><div class="toolbar"><button id="start">从头连播</button><button id="pause" class="secondary">暂停</button><button id="resume" class="secondary">继续</button><span id="status">尚未播放</span></div>'''+''.join(sections)+'''<div class="compilation"><strong>整篇连续音频</strong><p>方便直接试听或带走；同样按台词表顺序，含分支台词。</p><audio id="compiled" controls preload="none" aria-label="序章69句英文连续音频" src="正式-English/全篇连播-English.mp3"></audio></div><p class="links"><a href="正式-English/中英对白与表演.md">中英对白与逐句表演稿</a> · <a href="英文试镜.html">回看英文试镜</a></p><footer>配音为 AI 生成 · GPT-Live 1 · English</footer></main><script>
const players=[...document.querySelectorAll('audio[data-id]')],all=[...document.querySelectorAll('audio')];let queue=false,index=-1,active=null;
const status=document.getElementById('status');function mark(a){active=a;document.querySelectorAll('.line').forEach(e=>e.classList.remove('active'));if(a.dataset.id){a.closest('.line').classList.add('active');status.textContent=(players.indexOf(a)+1)+' / 69 · '+a.getAttribute('aria-label')}else{status.textContent='正在播放整篇连续音频'}}
function playAt(i){if(i>=players.length){queue=false;index=-1;status.textContent='69 句播放完毕';return;}index=i;const a=players[i];a.currentTime=0;a.closest('.line').scrollIntoView({block:'center',behavior:'smooth'});a.play().catch(()=>{queue=false;status.textContent='请点该句播放器继续';});}
all.forEach(a=>{a.addEventListener('play',()=>{all.forEach(b=>{if(b!==a)b.pause()});if(a!==players[index]){queue=false;index=players.indexOf(a)}mark(a);});a.addEventListener('error',()=>{queue=false;status.textContent='该音频未能加载，请检查文件是否完整。'});});
players.forEach(a=>a.addEventListener('ended',()=>{if(queue&&players[index]===a)playAt(index+1)}));
document.getElementById('start').onclick=()=>{all.forEach(a=>a.pause());queue=true;playAt(0)};
document.getElementById('pause').onclick=()=>{all.forEach(a=>a.pause());status.textContent='已暂停'+(index>=0?' · '+(index+1)+' / 69':'')};
document.getElementById('resume').onclick=()=>{if(active&&active.id==='compiled'){active.play().catch(()=>{});return;}if(index<0){queue=true;playAt(0)}else{queue=true;players[index].play().catch(()=>{queue=false})}};
</script></html>'''
(ep.BASE/'试听.html').write_text(page)
text=['# 序章英文对白与表演稿','2026-11-07。用户确认英文版；保留中文冻结源表。顺序含不同战斗分支。', '## 术语']
text.extend(f'- {a}：{b}' for a,b in PLAN['glossary'].items())
for j in PLAN['jobs']:
    text.extend([f"## {j['id']} · {j['person']} · {j['scene']}",f"中文原句：{j['source_chinese']}",f"英文对白：{j['input']}",f"中文原表演：{j['source_performance']}",f"英文表演指导：{j['acting']}"])
    if j['translation_note']:text.append('翻译说明：'+j['translation_note'])
text.append('## 四位人物声音说明全文')
for name,direction in PLAN['character_instructions'].items():text.extend([f'### {name} · {PLAN["voices"][name]}',direction])
(ep.OUT/'中英对白与表演.md').write_text('\n\n'.join(text)+'\n')

pcm=bytearray();timeline=[];previous_scene=None
for j in PLAN['jobs']:
    if pcm:pcm.extend(bytes(int(24000*2*(1.1 if j['scene']!=previous_scene else .55))))
    offset=len(pcm)/48000
    r=subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(ep.BASE/j['file']),'-ar','24000','-ac','1','-f','s16le','pipe:1'],capture_output=True,check=True)
    pcm.extend(r.stdout);timeline.append({'id':j['id'],'person':j['person'],'start_seconds':offset,'end_seconds':len(pcm)/48000});previous_scene=j['scene']
subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-y','-f','s16le','-ar','24000','-ac','1','-i','pipe:0','-c:a','libmp3lame','-b:a','192k',str(ep.OUT/'全篇连播-English.mp3')],input=bytes(pcm),capture_output=True,check=True)
(ep.OUT/'连播时间轴.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'page':'试听.html','lines':69,'compiled_seconds':len(pcm)/48000,'highlighted_lines':len(FOCUS)},ensure_ascii=False))
