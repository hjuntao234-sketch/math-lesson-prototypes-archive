"""English audition authorized 2026-11-07. Frozen Chinese sources remain read-only."""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path
sys.dont_write_bytecode=True
import live_audition as live

OUT=live.ROOT/'配音/序章/试镜-R3-English'
VOICES={'塔莉':['gleam','quartz','delta'],'雅娜':['willow','delta','quartz'],
        '法比娅':['quartz','willow','gleam'],'诺曼':['vesper','meridian','stone']}
EN={
 '序-04':'According to the rules, anyone that slow to see the answer is unfit to carry the banner.',
 '序-06':"Wait—wait a second! I thought you were just a patch of fog... You're a person!",
 '序-07':'The Registry Academy threw out all my tags. So I wrote a whole new bagful.',
 '序-10':"I'm Jana. That's Tally. We were both politely shown the door.",
 '序-33':"I'm Fabia. If something's missing... I'll make it. If you need that in a fight, send me.",
 '序-47':"It missed? But the Register... this is exactly the move it calls for.",
 '序-56':"X is less than zero. Both hands are negative... They won't fit the positive socket.",
 '序-63':"Multiply by negative one... and the direction flips. So we need the maximum."
}
BEATS={
 '序-04':'Judge a new commander from behind your rulebook. Cool, controlled disdain; land unfit without raising your voice. Finish downward, certain of your own authority.',
 '序-06':'Someone suddenly emerges from fog. Urgent startled catch on the first wait, then astonishment and a small embarrassed smile as you realize this is a person. Quick and alive.',
 '序-07':'Show a bag of freshly written tags. The memory of having them thrown away still stings, but you bounce back. A small stubborn smile on whole new bagful; this is your defiant little victory.',
 '序-10':'Introduce yourself and your friend to a fellow outsider. Even and economical. Politely is a tiny, dry joke about being thrown out; do not laugh or explain the joke.',
 '序-33':'Shyly introduce yourself while carrying a heavy timber. Give your name softly, with a small breath. Gain quiet confidence when offering to help. Send me is a dependable promise.',
 '序-47':'Your supposedly infallible move has failed. A stunned, clipped question, then look down at the book and try to regain control. Exactly carries disbelief. Finish tense and less certain.',
 '序-56':'Inspect a guard during a battle. Both negative hands cannot fit the positive socket. Think for a moment, then give a dry, useful observation to a companion beside you.',
 '序-63':'Start after a small thinking beat. Work it out softly to yourself. The final sentence is where the idea clicks: a modest lift of confidence on maximum, with a clean ending.'
}
REASONS={
 '塔莉':'高马尾、举包动作与明亮笑脸：快、热乎，惊讶会打结，受挫仍有不服输的劲。',
 '雅娜':'短黑发、深色披风与利落站姿：低稳、少话，轻轻落下一句冷幽默。',
 '法比娅':'工装、木料与工具：温柔害羞，但在擅长的事上有底气，声音不能软塌。',
 '诺曼':'银发、制服和书本：年轻、规整、带优越感；失手后声音才发紧。'
}
NAMES={'塔莉':'Tally','雅娜':'Jana','法比娅':'Fabia','诺曼':'Norman'}
NOTES={
 '序-04':'将看得太慢落为 slow to see the answer，保留解题判断与掌旗资格。',
 '序-06':'保留重复的 wait；雾团译作 patch of fog，后句保留发现真人的反应。',
 '序-07':'名录院暂译 Registry Academy；tags 对应签，wrote 保留亲手重写，bagful 保留一包。',
 '序-10':'人物设定中的拉丁字母名为 Jana；以英语惯用语 politely shown the door 保留请出来的反讽。',
 '序-33':'make 对应构造与补缺，保留战斗时主动请求派遣。',
 '序-47':'名录书本暂译 the Register，与机构 Registry Academy 分开；保留招式失败与对书本的依赖。',
 '序-56':'保留 x<0、两只手为负、正孔不匹配三个信息，不改变数学条件。',
 '序-63':'保留乘负一、方向翻转、求最大值三个信息。'
}

def normalize(text):
    text=text.lower().replace('’',"'")
    text=re.sub(r'\byana\b','jana',text)
    text=re.sub(r'\b0\b','zero',text)
    text=re.sub(r'\b1\b','one',text)
    return re.sub(r'[^a-z0-9]','',text)

def plan():
    hashes=live.audition.sources();lines,people=live.audition.config()
    OUT.mkdir(exist_ok=True);(OUT/'原始录音').mkdir(exist_ok=True);(OUT/'人物').mkdir(exist_ok=True)
    jobs=[]
    for name,voices in VOICES.items():
        shutil.copy2(live.ROOT/f'素材/全身/calm-{live.ART[name]}.webp',OUT/f'人物/{live.ART[name]}.webp')
        for line in lines:
            if line['人']!=name or not line['试镜']:continue
            character=people[name]['instructions'].replace('Mandarin-speaking','English-speaking')
            instructions=(f'Play {NAMES[name]}, a fictional young character in an English-language fantasy adventure. '
                'Talk to one person beside you with believable, spontaneous emotion. '
                +character+'\nScene: '+BEATS[line['id']]
                +'\nPronunciation: Jana is YAH-nah; Tally is TAL-ee; Fabia is FAH-bee-ah. '
                'Use the exact supplied English dialogue once, including every word. Use natural breath, stress and pauses. '
                'Do not speak stage directions, add words, or repeat the line. '
                '\nBackchannel policy: Stay silent outside this line.'
                '\nInterruption policy: Finish the complete line, then remain silent.'
                '\nDelegation policy: No backend tools. Never generate <|SpawnThinking|>.')
            for voice in voices:
                jobs.append({'person':name,'id':line['id'],'voice':voice,'file':f"{name}-{line['id']}-{voice}.mp3",
                    'input':EN[line['id']],'source_chinese':line['念法'],'source_performance':line['表演'],
                    'translation_note':NOTES[line['id']],'instructions':instructions,
                    'cue_prefix':'Perform this exact English dialogue once, then stay silent. Dialogue: ',
                    'end_silence_seconds':5.0})
    assert len(jobs)==24
    p={'date':'2026-11-07','model':live.MODEL,'language':'English','user_authorization':'最后给你个机会，你用英文配音吧，中文配音不好听',
        'sources':hashes,'voices':VOICES,'people':{n:{'english_name':NAMES[n],'description':people[n]['description'],
        'rationale':REASONS[n],'art':live.ART[n],'instructions':people[n]['instructions'].replace('Mandarin-speaking','English-speaking')} for n in VOICES},
        'jobs':jobs,'preexisting_call_reserve':55,'max_total_generation_calls':260,
        'estimated_session_seconds_per_call':30,'estimated_round_usd':.60,
        'official_price_usd_per_session_minute':.05,'budget_override':'预算不用考虑',
        'docs':['https://developers.openai.com/api/docs/guides/live-conversations','https://developers.openai.com/api/docs/guides/live-prompting'],
        'stop':'English auditions only; no full 69-line production'}
    live.save_json(OUT/'计划.json',p);return p

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--generate',action='store_true');ap.add_argument('--limit',type=int,default=24);args=ap.parse_args()
    p=plan();log=OUT/'调用记录.json';rows=json.loads(log.read_text()) if log.exists() else []
    if not args.generate:print('English plan: 24 clips; seven frozen hashes matched');return 0
    if any(r['status']!='complete' and not r.get('reviewed') for r in rows):raise RuntimeError('prior_attempt_needs_review')
    live.OUT=OUT;live.normal=normalize;key=live.audition.credential()
    done={r['file'] for r in rows if r['status']=='complete'}
    jobs=sorted(p['jobs'],key=lambda j:VOICES[j['person']].index(j['voice']))
    count=0
    for job in jobs:
        if job['file'] in done:continue
        if count>=args.limit:break
        if len(rows)+55>=260:raise RuntimeError('generation_call_limit')
        row={k:job[k] for k in ('person','id','voice','file')};row.update(model=live.MODEL,status='started',language='English')
        rows.append(row);live.save_json(log,rows)
        try:row.update(live.record(job,key,1))
        except Exception as error:
            row.update(status='failed',error_type=type(error).__name__)
            if isinstance(error,RuntimeError) and re.fullmatch(r'[a-zA-Z0-9_.-]+',str(error)):row['error_code']=str(error)
            response=getattr(error,'response',None)
            if response is not None:row['http_status']=response.status_code
            live.save_json(log,rows);print('STOP',row.get('error_code',row['error_type']),row.get('http_status',''),flush=True);return 2
        live.save_json(log,rows);count+=1
        print(json.dumps({'completed':len(done)+count,'file':job['file'],'seconds':row['seconds'],'transcript_match':row['normalized_transcript_matches']},ensure_ascii=False),flush=True)
    return 0

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as error:print('STOP',type(error).__name__,'details suppressed',flush=True);sys.exit(2)
