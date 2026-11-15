"""Final local verification and progress entry for the English audition."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import subprocess
import sys
sys.dont_write_bytecode=True
import audition

ROOT=audition.ROOT
BASE=ROOT/'配音/序章'
OUT=BASE/'试镜-R3-English'
plan=json.loads((OUT/'计划.json').read_text())
rows=json.loads((OUT/'调用记录.json').read_text())
records={r['file']:r for r in rows if r['status']=='complete'}
checks=json.loads((OUT/'检查.json').read_text())
assert len(records)==24 and len(checks)==24
audition.sources()
result=subprocess.run([sys.executable,str(ROOT/'配音/check_序章台词.py')],capture_output=True,text=True)
assert result.returncode==0 and '错误 0 个' in result.stdout
full=subprocess.run([sys.executable,str(ROOT/'配音/check_序章台词.py'),'--audio'],capture_output=True,text=True)
(OUT/'正式全配检查-仍未开始.txt').write_text(full.stdout+full.stderr)

class References(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.audio=0
    def handle_starttag(self,tag,attrs):
        if tag=='audio':self.audio+=1
        for key,value in attrs:
            if key=='src':self.refs.append(value)
h=References();h.feed((BASE/'英文试镜.html').read_text())
assert h.audio==25
for ref in h.refs:assert '://' not in ref and (BASE/ref).is_file(),ref

for c in checks:
    f=OUT/c['file'];assert hashlib.sha256(f.read_bytes()).hexdigest()==c['sha256']
    r=subprocess.run(['/opt/homebrew/bin/ffmpeg','-hide_banner','-nostats','-i',str(f),'-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True)
    assert r.returncode==0
    d,_=json.JSONDecoder().raw_decode(r.stderr[r.stderr.rfind('{'):]);c['measured_lufs']=float(d['input_i']);c['measured_true_peak_db']=float(d['input_tp'])
    assert c['measured_true_peak_db']<0
(OUT/'检查.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
for root in [BASE,ROOT/'配音/tools']:
    for f in root.rglob('*'):
        if f.is_file() and f.suffix in ['.py','.json','.md','.html','.txt']:
            assert not re.search(rb'sk-(?:proj-)?[A-Za-z0-9_-]{32,}',f.read_bytes()),'Potential key in '+str(f)
completed=[r for r in rows if r['status']=='complete'];seconds=sum(r.get('session_usage_seconds') or 0 for r in completed)
matched=sum(c['transcript_matches'] for c in checks)
issues=[c['file'] for c in checks if not c['transcript_matches']]
summary={'date':'2026-11-07','delivered':24,'transcript_matches':matched,'issues':issues,'attempts':len(rows),
    'successful_recordings':len(completed),'total_generation_calls_reserved':55+len(rows),'session_seconds':seconds,
    'estimated_round_usd':seconds/60*.05,'estimated_cumulative_usd_including_previous_reserves':.580417+seconds/60*.05,
    'final_audio_seconds':sum(c['seconds'] for c in checks),'static_checker_errors':0,'frozen_hashes_matched':7,
    'html_audio_references':25,'html_local_references_all_exist':True,'browser_playback_tested':False,
    'human_listening_reviewed':False,'lufs_range':[min(c['measured_lufs'] for c in checks),max(c['measured_lufs'] for c in checks)],
    'maximum_true_peak_db':max(c['measured_true_peak_db'] for c in checks),'full_production_not_started':True}
(OUT/'交付汇总.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
progress=ROOT/'配音/序章-进度.md';previous=progress.read_text()
assert '## 当前交付：英文人物试镜' not in previous,'Already wrote current report; review before replacing'
previous=previous.replace('## 当前交付：第二轮 GPT-Live 1 人物试镜','## 第二轮历史交付：GPT-Live 1 中文人物试镜',1)
entry=f'''## 当前交付：英文人物试镜

日期：2026-11-07。按用户最新原话“最后给你个机会，你用英文配音吧，中文配音不好听”，另做一轮英语试镜；这条最新指令授权了语言转换与追加试镜。仍只交付四人各三候选、每候选两句，共 24 条；未开始 69 句全配，未接入游戏，未开子智能体。原有“预算不用考虑”和按人物图像选声的要求继续适用。

**入口：`序章/英文试镜.html`。首选八句：`序章/试镜-R3-English/首选连播-8句.mp3`。** 页面附立绘、中英逐句对照、首选及两种备选。桌面目录仍为 `罗盘指挥官_序章配音试做_20261107/`。下方中文两轮记录为历史，不代表当前语言选择。

### 模型、英文稿与选声

继续使用 `gpt-live-1`，逐次确认服务端返回的模型名。2026-11-07 按 [OpenAI 官方声线文档](https://developers.openai.com/api/docs/guides/live-conversations) 选英语预设，并按 [官方提示指南](https://developers.openai.com/api/docs/guides/live-prompting) 精简角色和场景指令。只使用预设声线，不克隆或模仿真人。

| 人物 | 英文名 | 首选 | 备选 | 表演方向 |
|---|---|---|---|---|
| 塔莉 | Tally | gleam | quartz、delta | 明亮、快，受惊打结，受挫仍不服输 |
| 雅娜 | Jana | willow | delta、quartz | 低稳利落，轻轻落下一句冷幽默 |
| 法比娅 | Fabia | quartz | willow、gleam | 害羞轻声，承诺帮忙时有底气 |
| 诺曼 | Norman | vesper | meridian、stone | 规整清冷，宣判与失手有明显心理差别 |

按官方资料，gleam、meridian 带北美英语影响；quartz 带澳洲英语影响；willow、stone 带爱尔兰英语影响；vesper 带英式英语影响；delta 带美国南部英语影响。首选是依据立绘、性格和声线资料提出的建议，并不冒充已完成真人听审。用户尚未确认英文最终选声。

8 句英文由主线程逐句翻译，保留剧情与数学条件，未修改冻结的中文源表。Jana 拼写取自 `设定集/人物.md`，读作 YAH-nah；名录院暂译 Registry Academy，书本名录暂译 the Register，尚未定为整个游戏的术语。雅娜的“请出来”译为 politely shown the door，保留反讽。数学两句仍保留 x<0、两只手为负、正孔不匹配，以及乘负一、方向翻转、求最大值。

四位角色英文声音说明完整见 `序章/试镜-R3-English/英文台词对照.md`，由原描述仅将 Mandarin-speaking 换成 English-speaking；每句场景指导用英语重写。所有请求、原中文、英文译稿、翻译说明和表演指令全文见同目录 `计划.json`。没有把原中文说明直接混入英语生成提示。

### 调用与验证

- 本轮调用 {len(rows)} 次，成功录音 {len(completed)} 次，最终交付 24 条；累计保守计 {55+len(rows)}/260 次。调用状态、转写、会话用量和 SHA-256 见 `调用记录.json`。
- 本轮成功会话用量 {seconds:.0f} 秒，按 [官方价格](https://developers.openai.com/api/docs/models/gpt-live-1) 每分钟 0.05 美元、按秒计费，估算 {seconds/60*.05:.6f} 美元；加前两轮及历史预留，累计约 {.580417+seconds/60*.05:.6f} 美元。调用前按每条 30 秒估算 24 条约 0.60 美元。上述为估算，不是账户账单。
- 最终 24 条合计 {summary['final_audio_seconds']:.3f} 秒；24 条全文件解码通过，哈希与台账一致。Live 自带输出转写规范化后 {matched}/24 与英文译稿一致；规范化只处理标点、大小写、空格、数字写法及 Jana/Yana 的同音拼写。没有另调语音转写 API，不宣称完成了独立听审。
- 已知转写差异：{('无' if not issues else '、'.join(issues))}。如有重录，历史尝试保留在调用记录；未删除失败记录或被替换原音频。
- 首尾静默裁切保留内部停顿，结束等待为 5 秒。复测响度 {summary['lufs_range'][0]:.2f} 至 {summary['lufs_range'][1]:.2f} LUFS，最高真峰值 {summary['maximum_true_peak_db']:.2f} dBTP；这是试镜，不把这些测量写成正式全配的精确响度验收。
- 7 个冻结 SHA-256 再次全部一致；中文台词静态检查 69 句、0 错误。英文翻译和试镜均在单独子目录。正式全配检查仍为 69 个缺失项，完整输出见 `序章/试镜-R3-English/正式全配检查-仍未开始.txt`，下方历史记录也保留逐项名单；本轮按停止点没有生成这些文件。
- 页面 25 个本地播放器引用（24 个单句、1 个首选合辑）和 4 张立绘均存在，无远程资源。浏览器本地文件访问限制仍在，未绕过；未做浏览器内播放或界面视觉验收。中文旧版本保留。
- 密钥仅从环境变量或系统钥匙串读取并留在内存；本轮未操作凭据网页，交付文本扫描未发现密钥原文。

本轮中英对照与技术检查完成，英文表演是否合适等待用户实际试听。本轮停止，不继续追加试镜或全配。桌面复制及逐文件 SHA-256 结果见 `交付校验.json`。

---

'''
heading='# 《罗盘指挥官》序章配音试做进度\n\n'
assert previous.startswith(heading)
progress.write_text(heading+entry+previous[len(heading):])
print(json.dumps(summary,ensure_ascii=False))
