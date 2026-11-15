"""Master completed English takes; measure decoded MP3 loudness and true peak."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
sys.dont_write_bytecode=True
import english_prologue as ep

FF='/opt/homebrew/bin/ffmpeg'
FP='/opt/homebrew/bin/ffprobe'
WORK=ep.OUT/'母带处理'

def run(args):
    p=subprocess.run(args,capture_output=True,text=True)
    if p.returncode:raise RuntimeError('audio_processing_failed')
    return p

def measure(f):
    p=run([FF,'-hide_banner','-nostats','-i',str(f),'-af','loudnorm=I=-16:TP=-2:LRA=11:print_format=json','-f','null','-'])
    data,_=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):]);return data

def master(job,row):
    WORK.mkdir(exist_ok=True)
    raw=ep.OUT/row['source_wav'];stem=Path(job['file']).stem
    trimmed=WORK/(stem+'-trim.wav');base=WORK/(stem+'-master0.wav');final=ep.BASE/job['file']
    trim='silenceremove=start_periods=1:start_duration=0.02:start_threshold=-55dB:start_silence=0.12,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-55dB:start_silence=0.25,areverse'
    run([FF,'-v','error','-y','-i',str(raw),'-af',trim,'-ar','24000','-ac','1','-c:a','pcm_s24le',str(trimmed)])
    first=measure(trimmed)
    filt=(f"loudnorm=I=-16:TP=-2:LRA=11:measured_I={first['input_i']}:measured_TP={first['input_tp']}"
          f":measured_LRA={first['input_lra']}:measured_thresh={first['input_thresh']}:offset={first['target_offset']}:linear=true")
    run([FF,'-v','error','-y','-i',str(trimmed),'-af',filt,'-ar','24000','-ac','1','-c:a','pcm_s24le',str(base)])
    metrics=None;history=[]
    for attempt in range(5):
        run([FF,'-v','error','-y','-i',str(base),'-c:a','libmp3lame','-b:a','192k',str(final)])
        metrics=measure(final);loud=float(metrics['input_i']);peak=float(metrics['input_tp'])
        history.append({'iteration':attempt,'lufs':loud,'true_peak_db':peak})
        if abs(loud+16)<=.25 and peak<=-1.5:break
        gain=-16-loud
        nxt=WORK/(stem+f'-master{attempt+1}.wav')
        # Ceiling has encoding headroom; the exported MP3 is still measured directly.
        run([FF,'-v','error','-y','-i',str(base),'-af',f'volume={gain:.4f}dB,alimiter=limit=0.794328:level=false',
             '-ar','24000','-ac','1','-c:a','pcm_s24le',str(nxt)])
        base=nxt
    duration=float(run([FP,'-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(final)]).stdout.strip())
    run([FF,'-v','error','-i',str(final),'-f','null','-'])
    return {'id':job['id'],'file':job['file'],'voice':job['voice'],'source_wav':row['source_wav'],
        'raw_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),
        'seconds':duration,'lufs':float(metrics['input_i']),'true_peak_db':float(metrics['input_tp']),
        'mastering_passes':history,'loudness_ok':abs(float(metrics['input_i'])+16)<=.25 and float(metrics['input_tp'])<=-1.5,
        'decode_ok':True,'transcript':row['transcript'],'transcript_match':ep.normalize(row['transcript'])==ep.normalize(job['input']),
        'reused_audition':row['status']=='reused_selected'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--ready-only',action='store_true');args=ap.parse_args()
    p=json.loads((ep.OUT/'计划.json').read_text());rows=json.loads((ep.OUT/'调用记录.json').read_text())
    selected={r['id']:r for r in rows if r['status'] in ['complete','reused_selected']}
    if not args.ready_only:assert len(selected)==69,'Need all recordings'
    log=ep.OUT/'成品检查.json';old=json.loads(log.read_text()) if log.exists() else []
    records={r['id']:r for r in old}
    for j in p['jobs']:
        if j['id'] not in selected:continue
        row=selected[j['id']];raw=ep.OUT/row['source_wav'];prev=records.get(j['id']);target=ep.BASE/j['file']
        if prev and prev['loudness_ok'] and prev['raw_sha256']==hashlib.sha256(raw.read_bytes()).hexdigest() and target.exists() and prev['sha256']==hashlib.sha256(target.read_bytes()).hexdigest():continue
        records[j['id']]=master(j,row)
        ep.live.save_json(log,sorted(records.values(),key=lambda x:x['id']))
    vals=list(records.values());print(json.dumps({'mastered':len(vals),'loudness_issues':[r['id'] for r in vals if not r['loudness_ok']],
        'transcript_issues':[r['id'] for r in vals if not r['transcript_match']],
        'lufs_range':[min(r['lufs'] for r in vals),max(r['lufs'] for r in vals)],'max_peak':max(r['true_peak_db'] for r in vals)},ensure_ascii=False))

if __name__=='__main__':main()
