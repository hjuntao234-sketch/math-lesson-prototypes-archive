"""Second audition round: GPT-Live 1, original dialogue, no backend delegation."""
import argparse
import array
import base64
import difflib
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import wave

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent / 'vendor'))
from websockets.sync.client import connect
import audition

ROOT = audition.ROOT
OUT = ROOT / '配音/序章/试镜-R2-GPTLive'
MODEL = 'gpt-live-1'
VOICES = {'塔莉':['gleam','harema','quartz'], '雅娜':['willow','nuri','brise'],
          '法比娅':['juni','noeul','bossa'], '诺曼':['meridian','vesper','shida']}
ART = {'塔莉':'tally','雅娜':'yana','法比娅':'fabia','诺曼':'norman'}
RATIONALE = {
 '塔莉':'高马尾、举着布包的动作和笑脸很有活力。声音明亮、反应快，受惊会打结；谈起被赶出来的经历，仍有不服输的热乎劲。',
 '雅娜':'短黑发、深色披风与利落站姿，与设定里的冷幽默相呼应。选偏低、干净、收尾干脆的女声，轻微沙感，稳而不拖。',
 '法比娅':'工装、木料和工具体现她的实干者身份。声音可以轻、害羞，但需要温暖的中低音支撑，承诺帮忙时有底气。',
 '诺曼':'银发、规整制服和书本强化了他讲规矩的形象。选清亮偏冷的少年男声，字句精确；招式失效时，控制感才开始松动。'}
SCENES = {
 '序-06':'A figure suddenly emerges from the fog beside you. You catch your friend before she moves. The first repeated syllable is a genuine startled catch, then urgent surprise melts into an embarrassed, relieved realization. Let the final words carry a small human smile. Address someone close by, with elastic timing; never shrill.',
 '序-07':'You show a new bag of handwritten tags after an institution threw your old ones away. There is a trace of hurt under your energy. You refuse to give up. A tiny beat separates the memory of rejection from the quietly proud comeback in the final sentence. Warm resilience, not a cheerful commercial.',
 '序-10':'Introduce yourself and the girl standing beside you to a new companion. Matter-of-fact and composed. The polite wording about being shown out of the door is a dry, private joke between fellow outsiders. A fleeting edge of amusement on 请, then a clean grounded ending.',
 '序-33':'Meet a new commander while carrying a heavy beam and tools. Your self-introduction is shy and a little breathy, but you know your craft. Each short promise gains steadiness. The final offer is sincere and dependable, gently firm rather than fragile.',
 '序-04':'An academy examiner judges a challenger from behind an open rulebook. Every word is precise and cold. Put restrained disdain into 不配, then lower and close the final phrase. Controlled youthful authority; no shouting, no elderly narrator voice.',
 '序-47':'Your prescribed attack has just missed completely. A stunned beat, then an involuntary clipped question. You look back at the book, trying to restore your certainty. 明明 carries disbelief; the last phrase tightens as confidence slips. Keep the two emotional beats distinct.',
 '序-56':'In the middle of a battle you inspect two negative hands and the positive socket. You recognize the sign mismatch while speaking. A short thinking beat at the ellipsis, then a dry, practical realization that it will not fit. Low, focused and immediate, not a classroom lecture.',
 '序-63':'After a half-beat of thought, a solution clicks. Begin almost to yourself, softly and with precise reasoning. The connective 所以 is the turn toward certainty. Give 最大值 a modest but audible lift in conviction, then finish cleanly. A quiet discovery, not a triumphant announcement.'}

def normal(text):
    text=text.lower().replace('艾克斯','x').replace('埃克斯','x')
    text=text.translate(str.maketrans({'0':'零','1':'一'}))
    return re.sub(r'[^\u4e00-\u9fffa-z0-9]','',text)

def save_json(path,data):
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');tmp.replace(path)

def plan():
    hashes=audition.sources(); lines,people=audition.config()
    OUT.mkdir(exist_ok=True);(OUT/'原始录音').mkdir(exist_ok=True);(OUT/'人物').mkdir(exist_ok=True)
    jobs=[]
    for name,voices in VOICES.items():
        shutil.copy2(ROOT/f'素材/全身/calm-{ART[name]}.webp',OUT/f'人物/{ART[name]}.webp')
        for line in lines:
            if line['人']!=name or not line['试镜']:continue
            instruction=(
                'Record exactly one fictional character line in clear, idiomatic Mandarin Chinese. '
                'You are speaking to another character inside a dramatic scene. Perform the intention, with natural breath, stress and changing emotion. '
                'Speak only the supplied dialogue once, word for word. Do not read directions, add words, greetings or explanations. '
                'Keep repeated syllables only where the dialogue contains them. Do not sing or use sound effects. '
                +people[name]['instructions']+'\nOriginal performance direction: '+line['表演']
                +'\nScene and acting beats: '+SCENES[line['id']]
                +'\nBackchannel policy: Remain silent except for the exact requested line. '
                '\nInterruption policy: Complete this one recording and then remain silent. '
                '\nDelegation policy: No backend capabilities. Never generate <|SpawnThinking|>.')
            for voice in voices:
                jobs.append({'person':name,'id':line['id'],'voice':voice,'file':f"{name}-{line['id']}-{voice}.mp3",
                             'input':line['念法'],'instructions':instruction,'source_performance':line['表演']})
    p={'date':'2026-11-07','model':MODEL,'budget_user_override':'预算不用考虑','sources':hashes,
       'voices':VOICES,'people':{n:{'description':people[n]['description'],'rationale':RATIONALE[n],'art':ART[n]} for n in VOICES},
       'jobs':jobs,'official_price_usd_per_session_minute':.05,'max_total_generation_calls':260,
       'estimated_round_seconds_at_30_seconds_each':720,'estimated_round_usd':.60}
    save_json(OUT/'计划.json',p);return p

def record(job,key,attempt):
    start=time.monotonic();pcm=bytearray();transcript='';started=False;closed=False;close_sent=False
    last_voice=None;next_send=0;usage=None;reason=None;events=[]
    cue=job.get('cue_prefix','现在开始，用普通话逐字表演下面这一句，完整说一次后保持安静。只说引号内台词：')+job['input']
    session={'model':MODEL,'instructions':job['instructions'],
             'input':[{'type':'message','role':'developer','content':[{'type':'input_text','text':cue}]}],
             'audio':{'format':{'type':'audio/pcm','rate':24000},'output':{'voice':job['voice']}},
             'delegation':{'type':'client'},'store':False}
    silence=base64.b64encode(bytes(4800)).decode()
    with connect('wss://api.openai.com/v1/live/sessions',additional_headers={'Authorization':'Bearer '+key},
                 open_timeout=20,close_timeout=5,max_size=8_000_000) as ws:
        ws.send(json.dumps({'type':'session.start','session':session},ensure_ascii=False))
        while time.monotonic()-start < 55:
            now=time.monotonic()
            if started and not close_sent and now>=next_send:
                ws.send(json.dumps({'type':'session.input_audio.append','audio':silence}));next_send=now+.1
            finished=(last_voice is not None and now-last_voice>job.get('end_silence_seconds',2.0) and len(pcm)>48000 and bool(transcript))
            if started and not close_sent and (finished or now-start>40):
                ws.send(json.dumps({'type':'session.close'}));close_sent=True
            try:e=json.loads(ws.recv(timeout=.08))
            except TimeoutError:continue
            kind=e.get('type','');
            if kind=='session.started':
                started=True;events.append(kind)
                if e.get('session',{}).get('model')!=MODEL:raise RuntimeError('resolved_model_mismatch')
                ws.send(json.dumps({'type':'session.commentary.append','event_id':'perform_line','delegation_id':None,'content':cue},ensure_ascii=False))
            elif kind=='session.output_audio.delta':
                b=base64.b64decode(e['delta']);pcm.extend(b)
                values=array.array('h',b)
                rms=math.sqrt(sum(x*x for x in values)/max(1,len(values)))
                if rms>50:last_voice=now
            elif kind=='session.output_transcript.delta':transcript+=e['delta']
            elif kind=='session.usage.updated':usage=e.get('usage',{}).get('seconds')
            elif kind=='session.closed':
                usage=e.get('usage',{}).get('seconds',usage);reason=e.get('reason');closed=True;events.append(kind);break
            elif kind=='error':
                er=e.get('error',{});code=str(er.get('code','unknown'))
                if code=='missing_scope' and 'History compaction is disabled' in er.get('message',''):
                    events.append('history_compaction_disabled_for_short_session')
                    continue
                if not re.fullmatch(r'[a-zA-Z0-9_.-]{1,80}',code):code='redacted'
                raise RuntimeError('api_error_'+code)
    if not started or not pcm or not closed:raise RuntimeError('incomplete_audio_or_session_finalization')
    stem=Path(job['file']).stem+f'-take{attempt}'
    wav=OUT/'原始录音'/f'{stem}.wav'
    with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(pcm)
    mp3=OUT/job['file']
    filt='silenceremove=start_periods=1:start_duration=0.02:start_threshold=-55dB:start_silence=0.12,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-55dB:start_silence=0.25,areverse,loudnorm=I=-16:TP=-1.5:LRA=11'
    subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-y','-i',str(wav),'-af',filt,'-ar','24000','-c:a','libmp3lame','-b:a','192k',str(mp3)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    probe=subprocess.run(['/opt/homebrew/bin/ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(mp3)],capture_output=True,text=True,check=True)
    duration=float(probe.stdout.strip());similarity=difflib.SequenceMatcher(None,normal(job['input']),normal(transcript)).ratio()
    return {'status':'complete','seconds':duration,'session_usage_seconds':usage,'estimated_usd':((usage if usage is not None else time.monotonic()-start)/60)*.05,
            'transcript':transcript,'normalized_transcript_matches':normal(job['input'])==normal(transcript),
            'transcript_similarity':similarity,'session_closed':closed,'close_reason':reason,
            'sha256':hashlib.sha256(mp3.read_bytes()).hexdigest(),'source_wav':str(wav.relative_to(OUT)), 'session_events':events}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--generate',action='store_true');ap.add_argument('--limit',type=int,default=24);args=ap.parse_args()
    p=plan();log=OUT/'调用记录.json';rows=json.loads(log.read_text()) if log.exists() else []
    if not args.generate:print('GPT-Live 1 plan ready: 24 clips');return 0
    key=audition.credential();done={r['file'] for r in rows if r.get('status')=='complete'};count=0
    for job in p['jobs']:
        if job['file'] in done:continue
        if count>=args.limit:break
        if len(rows)+28>=260:raise RuntimeError('generation_call_limit')
        if any(r.get('status')=='failed' and not r.get('reviewed') for r in rows):raise RuntimeError('prior_failure_needs_review')
        row={'person':job['person'],'id':job['id'],'voice':job['voice'],'file':job['file'],'model':MODEL,'status':'started'}
        rows.append(row);save_json(log,rows)
        try:row.update(record(job,key,1))
        except Exception as error:
            row['status']='failed';row['error_type']=type(error).__name__
            if isinstance(error,RuntimeError) and re.fullmatch(r'[a-zA-Z0-9_.-]+',str(error)):row['error_code']=str(error)
            response=getattr(error,'response',None)
            if response is not None:row['http_status']=response.status_code
            save_json(log,rows);print('STOP',row.get('error_code',row['error_type']),row.get('http_status',''),flush=True);return 2
        save_json(log,rows);count+=1
        print(f"{len(done)+count}/24: {job['person']} {job['id']} {job['voice']} {row['seconds']:.2f}s transcript_match={row['normalized_transcript_matches']}",flush=True)
    return 0

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as error:
        print('STOP',type(error).__name__,'details suppressed',flush=True);sys.exit(2)
