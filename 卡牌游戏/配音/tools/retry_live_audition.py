"""Targeted take 2 for two independently reviewed dialogue discrepancies."""
import json
from pathlib import Path
import re
import shutil
import sys
sys.dont_write_bytecode=True
import live_audition as live

def main():
    live.audition.sources()
    out=live.OUT
    plan=json.loads((out/'计划.json').read_text())
    log=out/'调用记录.json'
    rows=json.loads(log.read_text())
    key=live.audition.credential()
    targets={'塔莉-序-07-quartz.mp3':'首遍额外念了哼',
             '诺曼-序-47-shida.mp3':'首遍输出转写缺少末尾这一招；延长结束静默等待'}
    for filename,reason in targets.items():
        previous=[r for r in rows if r['file']==filename and r['status']=='complete']
        if previous[-1]['normalized_transcript_matches']:
            continue
        if any(r['file']==filename and r.get('take')==2 for r in rows):
            raise RuntimeError('take2_already_attempted')
        if len(rows)+28>=260:
            raise RuntimeError('generation_call_limit')
        old=previous[-1]
        backup=out/'原始录音'/(Path(filename).stem+'-take1.mp3')
        if not backup.exists():
            shutil.copy2(out/filename,backup)
        job=next(dict(j) for j in plan['jobs'] if j['file']==filename)
        job['end_silence_seconds']=5.0
        job['instructions']+='\nThis is a strict dialogue recording. No added interjections, sighs, fillers, or extra syllables. Express emotion only through the supplied words. Finish the entire line, including its final phrase, then stop. Accuracy and completeness of the supplied dialogue take priority.'
        row={k:job[k] for k in ('person','id','voice','file')}
        row.update(model=live.MODEL,status='started',take=2,retry_reason=reason,instructions=job['instructions'])
        rows.append(row);live.save_json(log,rows)
        try:
            row.update(live.record(job,key,2))
        except Exception as error:
            row.update(status='failed',error_type=type(error).__name__)
            if isinstance(error,RuntimeError) and re.fullmatch(r'[a-zA-Z0-9_.-]+',str(error)):
                row['error_code']=str(error)
            live.save_json(log,rows)
            print('STOP retry failure; details suppressed',flush=True)
            return 2
        old['superseded_by_take']=2
        old['archived_mp3']=str(backup.relative_to(out))
        live.save_json(log,rows)
        print(json.dumps({'file':filename,'take':2,'transcript_match':row['normalized_transcript_matches'],'transcript':row['transcript']},ensure_ascii=False),flush=True)
    return 0

if __name__=='__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print('STOP',type(error).__name__,'details suppressed',flush=True)
        sys.exit(2)
