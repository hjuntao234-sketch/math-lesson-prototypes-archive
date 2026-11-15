"""Verify complete local delivery and prepend its evidence to progress."""
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
sys.dont_write_bytecode=True
import english_prologue as ep

plan=json.loads((ep.OUT/'计划.json').read_text())
rows=json.loads((ep.OUT/'调用记录.json').read_text())
checks=json.loads((ep.OUT/'成品检查.json').read_text())
latest={r['id']:r for r in rows if r['status'] in ['complete','reused_selected']}
assert len(checks)==69 and len(latest)==69
assert all(c['loudness_ok'] and c['transcript_match'] and c['decode_ok'] for c in checks)
for c in checks:assert hashlib.sha256((ep.BASE/c['file']).read_bytes()).hexdigest()==c['sha256']
sources=ep.live.audition.sources()
validation=subprocess.run([sys.executable,str(ep.ROOT/'配音/check_序章台词.py'),'--audio'],capture_output=True,text=True)
(ep.OUT/'原检查-最终.txt').write_text(validation.stdout+validation.stderr)
assert validation.returncode==0 and '错误 0 个' in validation.stdout

class Refs(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.audio=0;self.ordered=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='audio':self.audio+=1
        if tag=='audio' and 'data-id' in a:self.ordered.append(a['data-id'])
        for k,v in attrs:
            if k in ['src','href']:self.refs.append(v)
h=Refs();h.feed((ep.BASE/'试听.html').read_text())
assert h.audio==70 and h.ordered==[j['id'] for j in plan['jobs']]
for ref in h.refs:assert '://' not in ref and (ep.BASE/ref).is_file(),ref
compilation=ep.OUT/'全篇连播-English.mp3'
subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(compilation),'-f','null','-'],capture_output=True,check=True)
duration=float(subprocess.run(['/opt/homebrew/bin/ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(compilation)],capture_output=True,text=True,check=True).stdout.strip())
for root in [ep.BASE,ep.ROOT/'配音/tools']:
    for f in root.rglob('*'):
        if f.is_file() and f.suffix in ['.py','.json','.md','.html','.txt']:
            assert not re.search(rb'sk-(?:proj-)?[A-Za-z0-9_-]{32,}',f.read_bytes()),'Potential credential in '+str(f)

new=[r for r in rows if r.get('api_call',True)]
success=[r for r in new if r['status']=='complete']
seconds=sum(r.get('session_usage_seconds') or 0 for r in success)
cost=seconds/60*.05
retries=[{'id':r['id'],'take':r['take'],'reason':r.get('retake_note','')} for r in new if r['take']>1]
summary={'date':'2026-11-07','model':ep.live.MODEL,'language':'English','voices':plan['voices'],
    'final_lines':69,'reused_selected_auditions':sum(r['status']=='reused_selected' for r in latest.values()),
    'new_generation_attempts':len(new),'successful_new_recordings':len(success),'retries':retries,
    'cumulative_generation_call_reserve':ep.PRIOR_CALLS+len(new),'limit':260,
    'new_session_seconds':seconds,'estimated_new_usd':cost,'estimated_cumulative_usd_with_previous_reserves':.797917+cost,
    'final_mp3_seconds':sum(c['seconds'] for c in checks),'compilation_seconds':duration,
    'original_checker_errors':0,'frozen_hashes_matched':len(sources),'decoded':69,'transcript_matches':69,
    'lufs_range':[min(c['lufs'] for c in checks),max(c['lufs'] for c in checks)],
    'maximum_true_peak_db':max(c['true_peak_db'] for c in checks),'loudness_tolerance_lu':.25,
    'html_audio_references':70,'html_local_references_all_exist':True,
    'browser_playback_tested':False,'human_listening_reviewed':False,'independent_translation_reviewed':False,
    'compilation_sha256':hashlib.sha256(compilation.read_bytes()).hexdigest(),'source_hashes':sources,
    'status':'序章英文全配交付；等待用户试听和Claude审读；停止'}
ep.live.save_json(ep.OUT/'交付汇总.json',summary)

progress=ep.ROOT/'配音/序章-进度.md';previous=progress.read_text()
assert '## 当前交付：序章69句英文全配' not in previous
previous=previous.replace('## 当前交付：英文人物试镜','## 英文试镜历史交付',1)
entry=f'''## 当前交付：序章69句英文全配

日期：2026-11-07。用户确认原话：“就用英文版本了，注意语气语调”。原话及选声对应关系写入 `序章/选声.md`。按上一轮首选方案完成 69 句英文全配，保留中文对照；全配完成后停止，不继续第一章，不接入游戏。未开子智能体。

**入口：`序章/试听.html`。完整连播：`序章/正式-English/全篇连播-English.mp3`，约 {duration/60:.2f} 分钟。** 69 个单句文件按原表文件名放在 `序章/序-01.mp3` 至 `序章/序-69.mp3`；`key` 与中文原句仍来自冻结源表，完整映射、英文文本和逐句提示见 `序章/正式-English/计划.json`。按台词表顺序试听，包含不同战斗分支，并非去分支后的连续剧情。

### 选声、翻译与语气语调

塔莉 gleam、雅娜 willow、法比娅 quartz、诺曼 vesper；模型 `gpt-live-1`。所有新会话核实服务端返回的模型名。依据 2026-11-07 查阅的 [OpenAI 官方声线文档](https://developers.openai.com/api/docs/guides/live-conversations) 与 [表演提示指南](https://developers.openai.com/api/docs/guides/live-prompting)，沿用选定的英语预设，不创建自定义声线，不模仿真人。

主线程逐句写作并对照全部 69 句；8 条已选英文试镜直接沿用原始录音，保持选定表演，其余 61 条新录。四位人物声音说明全文及所有逐句表演指导见 `序章/正式-English/中英对白与表演.md`；每次重录的附加指令保存在调用记录，不掩盖初次尝试。

- 塔莉：区分起绰号时的笑意、发现变化时的惊讶、想抢着上场的急切、遇到反扑的警告和解题后的喜悦。第 11/66 句按剧情保留未完语气，口述 Snap 简短收住。
- 雅娜：平常低稳、句尾干净；好奇与邀请判断时让问句上扬；冷幽默保留一点笑意；数学条件用短停顿分开，保持同伴在旁提醒的语气。
- 法比娅：自我介绍轻、略害羞；指出结构和确认最大值时逐渐笃定；让功与递交武器、罗盘时温暖；警告敌人反扑时保持她的克制。
- 诺曼：从考场宣判、照本宣科的把握，到招式落空后的惊讶与紧绷，再到压着火挽回面子；每一阶段分别给出指令。

翻译保留资源、公式与操作：2 点心力和两次查看；x>0、乘积 25、x=5；x−1 与 x 相差 1、t=3；x<0、乘积 9、−x 与 −9/x、x=−3、乘负一后求最大值。`负 9/x` 明确读作 negative nine divided by X。完整逐句对照及数学词义核对见 `翻译核对.md`。中文原台词、声音设定、剧情与关卡文件未改。

### 录音、重录与响度

- 本阶段新增 API 尝试 {len(new)} 次，成功录音 {len(success)} 次：61 句首录，以及序-28、序-66、序-69 各一次重录。另沿用 8 条已选试镜；最终 69 条。累计保守计 {ep.PRIOR_CALLS+len(new)}/260 次。
- 序-28 首遍重复了 Why is this，第二遍改为在句间短暂静默，不重启短语；序-66 首遍在 name 后续说了 uh maybe，第二遍明确在 name 后结束。两条第二遍均匹配全文。原 WAV 与被替换的试听 MP3 保留。
- 首次原检查器报序-69 时长可疑：5.22 秒、9 个中文字、每秒 1.7 字。该检查器按中文字符数估时，英文原句本身完整；按任务要求仍重录一次，保持温暖语气，仅把交罗盘时的句间停顿缩短，没有变速。复查 69 句、0 错误。初次结果与最终结果分别保存在 `原检查-首轮.txt`、`原检查-最终.txt`，不把首轮写成一次通过。
- 使用 ffmpeg 做首尾静默裁切、两遍 loudnorm 和必要的幅度校正；不压缩时间，不改变音高，保留内部自然停顿。逐条测量最终 MP3，响度为 {summary['lufs_range'][0]:.2f} 至 {summary['lufs_range'][1]:.2f} LUFS（目标 −16，容差 ±0.25 LU），最高真峰值 {summary['maximum_true_peak_db']:.2f} dBTP，低于 −1.5 dBTP。原始录音和母带处理文件保留。
- 69/69 文件完整解码通过，69/69 最终 Live 输出转写与英文稿经标点、大小写、数字及 Jana/Yana 同音拼写规范化后一致。自带转写不是独立语音识别或真人听审，不能据此判定全部语气已验收。

### 费用与交付检查

调用前为 61 条新录按每条 30 秒预留，估算 1.525 美元；含历史预留累计 2.322917 美元。用户此前“预算不用考虑”的授权继续有效，260 次调用上限继续约束。

本阶段成功会话用量 {seconds:.0f} 秒，按 [官方模型计价](https://developers.openai.com/api/docs/models/gpt-live-1) 每分钟 0.05 美元、按秒计费，估算 {cost:.6f} 美元；含前轮历史预留累计 {.797917+cost:.6f} 美元。没有后端模型委派或额外转写 API 调用。这是按接口用量估算，不是账户账单。

- 再次核对 7 个冻结文件 SHA-256，全部一致；原 `check_序章台词.py --audio` 最终输出“序章台词 69 句，错误 0 个”。
- 网页 69 个逐句播放器和 1 个合辑播放器均引用本地文件；顺序与台词表一致，4 张立绘、对白文稿和试镜回看链接均存在，无远程依赖；8 处原“听这里”已映射为英文读法或表演提示并突出显示。
- 浏览器工具的本地 file:// 访问限制仍在，未绕过；未完成浏览器实际播放或页面视觉验收。已核对 HTML 引用、音频完整解码、顺序、转写和响度。用户可在桌面双击试听页或直接打开连播 MP3。
- 密钥只从环境变量或系统钥匙串读入内存，本阶段未操作凭据网页；交付文本扫描未发现密钥原文。没有上传学生信息或写入密钥。
- 尚未完成人工逐句听审或独立翻译审读；语气、音色和自然度以用户实际试听为准。无已知未解决的文件、哈希、转写、响度或原检查器错误。

桌面交付目录仍为 `~/Desktop/罗盘指挥官_序章配音试做_20261107/`，复制 `序章/`、`tools/` 和本进度后逐文件核对 SHA-256；结果见桌面 `交付校验.json`。全部完成后停止，等待用户试听和 Claude 审读。

---

'''
heading='# 《罗盘指挥官》序章配音试做进度\n\n';assert previous.startswith(heading)
progress.write_text(heading+entry+previous[len(heading):])
print(json.dumps(summary,ensure_ascii=False))
