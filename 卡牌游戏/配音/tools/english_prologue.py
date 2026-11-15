"""Generate selected English performances. Three independent sessions; no agents."""
import argparse
from concurrent.futures import ThreadPoolExecutor,wait,FIRST_COMPLETED
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
sys.dont_write_bytecode=True
import live_audition as live
import english_audition as casting
from prologue_english_text import EN,BEATS,GLOSSARY,NOTES

ROOT=live.ROOT
BASE=ROOT/'配音/序章'
OUT=BASE/'正式-English'
VOICES={name:voices[0] for name,voices in casting.VOICES.items()}
PRIOR_CALLS=79

def normalize(text):
    text=text.lower().replace('’',"'")
    text=re.sub(r'\byana\b','jana',text)
    numbers={'0':'zero','1':'one','2':'two','3':'three','5':'five','7':'seven','9':'nine','12':'twelve','25':'twenty five'}
    text=re.sub(r'\b(?:25|12|[0123579])\b',lambda m:numbers[m.group()],text)
    text=text.replace('×','x')
    return re.sub(r'[^a-z0-9]','',text)

def prepare():
    hashes=live.audition.sources();lines,people=live.audition.config()
    OUT.mkdir(exist_ok=True);(OUT/'原始录音').mkdir(exist_ok=True)
    jobs=[]
    for line in lines:
        n=int(line['id'].split('-')[1]);name=line['人']
        character=people[name]['instructions'].replace('Mandarin-speaking','English-speaking')
        instruction=(f'Play {casting.NAMES[name]}, a fictional young character in an English-language fantasy adventure. '
          'Talk to one nearby companion with believable spontaneous emotion. '+character
          +'\nScene and acting: '+BEATS[n]
          +'\nPronunciation: Jana is YAH-nah; Tally is TAL-ee; Fabia is FAH-bee-ah. X and T are the English letter names. '
          'Use the exact supplied English dialogue once, including every word. Use natural breath, stress and pauses. '
          'Do not speak directions, add words, or repeat the line. '
          '\nBackchannel policy: Stay silent outside this line.'
          '\nInterruption policy: Finish the whole line, then remain silent.'
          '\nDelegation policy: No backend tools. Never generate <|SpawnThinking|>.')
        jobs.append({'person':name,'id':line['id'],'key':line['key'],'voice':VOICES[name],'file':line['文件'],
            'input':EN[n],'source_chinese':line['原文'],'source_spoken_chinese':line['念法'],
            'source_performance':line['表演'],'scene':line['场景'],'listen_for':line['听这里'],
            'acting':BEATS[n],'translation_note':NOTES.get(n,casting.NOTES.get(line['id'],'')),
            'instructions':instruction,'cue_prefix':'Perform this exact English dialogue once, then stay silent. Dialogue: ',
            'end_silence_seconds':5.0})
    assert len(jobs)==69 and len({j['file'] for j in jobs})==69
    p={'date':'2026-11-07','model':live.MODEL,'language':'English','user_confirmation':'就用英文版本了，注意语气语调',
       'sources':hashes,'voices':VOICES,'glossary':GLOSSARY,'jobs':jobs,
       'character_instructions':{n:people[n]['instructions'].replace('Mandarin-speaking','English-speaking') for n in VOICES},
       'prior_generation_calls':PRIOR_CALLS,'maximum_total_generation_calls':260,
       'new_lines_planned':61,'selected_auditions_reused':8,'price_usd_per_session_minute':.05,
       'estimated_new_generation_usd':61*30/60*.05,'estimated_cumulative_usd_before_retries':.797917+61*30/60*.05,
       'budget_override':'预算不用考虑','stop':'69-line prologue only, no game integration'}
    live.save_json(OUT/'计划.json',p)
    return p

def reuse_selected(plan,rows):
    existing={r['id'] for r in rows}
    old=json.loads((casting.OUT/'调用记录.json').read_text())
    for j in plan['jobs']:
        if j['id'] not in casting.EN or j['id'] in existing:continue
        r=next(r for r in old if r['id']==j['id'] and r['voice']==j['voice'] and r['status']=='complete')
        assert normalize(r['transcript'])==normalize(j['input'])
        source=casting.OUT/r['source_wav'];target=OUT/'原始录音'/(Path(j['file']).stem+'-selected.wav')
        shutil.copy2(source,target);shutil.copy2(casting.OUT/r['file'],OUT/j['file'])
        rows.append({'id':j['id'],'person':j['person'],'file':j['file'],'voice':j['voice'],'model':live.MODEL,
            'status':'reused_selected','take':0,'source_wav':str(target.relative_to(OUT)),
            'audition_source':str(source.relative_to(BASE)),'raw_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
            'transcript':r['transcript'],'normalized_transcript_matches':True,'api_call':False,
            'note':'Preserves selected performance; only mastering changes for final output.'})

def safe_record(job,key,take):
    try:return live.record(job,key,take)
    except Exception as error:
        out={'status':'failed','error_type':type(error).__name__}
        if isinstance(error,RuntimeError) and re.fullmatch(r'[a-zA-Z0-9_.-]+',str(error)):out['error_code']=str(error)
        response=getattr(error,'response',None)
        if response is not None:out['http_status']=response.status_code
        return out

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--generate',action='store_true');ap.add_argument('--retry',default='');args=ap.parse_args()
    p=prepare();log=OUT/'调用记录.json';rows=json.loads(log.read_text()) if log.exists() else []
    reuse_selected(p,rows);live.save_json(log,rows)
    if not args.generate:print('69-line English plan ready; 8 selected takes retained; 7 frozen hashes match');return 0
    if any(r['status'] in ['started','failed'] and not r.get('reviewed') for r in rows):raise RuntimeError('prior_attempt_needs_review')
    done={r['id'] for r in rows if r['status'] in ['complete','reused_selected']}
    retry=set(args.retry.split(',')) if args.retry else set()
    assert retry<=set(j['id'] for j in p['jobs'])
    jobs=[j for j in p['jobs'] if j['id'] in retry or j['id'] not in done]
    corrections={
      '序-28':'Keep the surprise, but put the hesitation into a silent pause between the questions. Do not restart or repeat any phrase. Say Why is this one wrapped in bandages exactly once.',
      '序-66':'The scene cuts off after the word name. Finish the supplied word name with the sense of an interrupted thought, then remain completely silent. Do not say uh, maybe, an invented name, or any other word.',
      '序-69':'Keep the warm, gentle smile and inviting question. Use a normal flowing conversational pace, with only a brief handover beat between the two sentences. Do not stretch vowels or leave a long dramatic pause. Say exactly the supplied words.'}
    for j in jobs:
        if j['id'] in retry:
            j['retake_note']=corrections.get(j['id'],'Retake the exact line with no added, missing or repeated words.')
            j['instructions']+='\nRetake correction: '+j['retake_note']
    live.OUT=OUT;live.normal=normalize;key=live.audition.credential()
    stopped=False;pending={};todo=iter(jobs)
    with ThreadPoolExecutor(max_workers=3) as pool:
        def submit_one():
            nonlocal stopped
            if stopped:return False
            try:j=next(todo)
            except StopIteration:return False
            calls=sum(r.get('api_call',True) for r in rows)
            if PRIOR_CALLS+calls>=260:stopped=True;return False
            take=1+sum(r['id']==j['id'] and r.get('api_call',True) for r in rows)
            if take>3:stopped=True;return False
            if take>1:
                oldmp3=OUT/j['file']
                if oldmp3.exists():shutil.copy2(oldmp3,OUT/'原始录音'/(oldmp3.stem+f'-take{take-1}.mp3'))
            row={k:j[k] for k in ['id','person','file','voice']};row.update(model=live.MODEL,status='started',take=take,api_call=True)
            if j.get('retake_note'):row.update(retake_note=j['retake_note'],instructions=j['instructions'])
            rows.append(row);live.save_json(log,rows)
            pending[pool.submit(safe_record,j,key,take)]=row
            return True
        for _ in range(3):submit_one()
        while pending:
            finished,_=wait(pending,return_when=FIRST_COMPLETED)
            for future in finished:
                row=pending.pop(future);row.update(future.result());live.save_json(log,rows)
                if row['status']=='failed':stopped=True
                finished_ids={r['id'] for r in rows if r['status'] in ['complete','reused_selected']}
                print(json.dumps({'ready':len(finished_ids),'id':row['id'],'status':row['status'],'match':row.get('normalized_transcript_matches')},ensure_ascii=False),flush=True)
            while len(pending)<3 and submit_one():pass
    return 2 if stopped else 0

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as error:print('STOP',type(error).__name__,'details suppressed',flush=True);sys.exit(2)
