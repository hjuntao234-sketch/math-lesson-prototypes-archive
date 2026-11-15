#!/usr/bin/env python3
"""Generate only the 24 first-round auditions. Never stores credentials or HTTP errors."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '配音/序章'
MODEL = 'gpt-4o-mini-tts-2025-12-15'
VOICES = {'塔莉': ['coral', 'nova', 'shimmer'], '雅娜': ['sage', 'marin', 'coral'],
          '法比娅': ['shimmer', 'marin', 'nova'], '诺曼': ['cedar', 'ash', 'echo']}
LEDGER = OUT / '调用记录.json'
FFPROBE = '/opt/homebrew/bin/ffprobe'

def dump(path, obj):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)

def sources():
    task = ROOT.parent / 'PROMPT-20261107-adventure-voice-prologue-openai.md'
    checks = []
    for name, expected in re.findall(r'\| `([^`]+)` \| `([a-f0-9]{64})` \|', task.read_text()):
        actual = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError('frozen_hash_mismatch')
        checks.append({'file': name, 'sha256': actual, 'match': True})
    if len(checks) != 7:
        raise RuntimeError('expected_seven_hashes')
    return checks

def config():
    lines = json.loads((ROOT / '配音/序章-台词.json').read_text())['台词']
    settings = (ROOT / '配音/声音设定.md').read_text()
    people = {}
    for name, voices in VOICES.items():
        section = re.search(r'## ' + name + r'[^\n]*\n(.*?)(?=\n## |\Z)', settings, re.S)[1]
        people[name] = {'voices': voices,
                        'description': re.search(r'- 一句话：(.*)', section)[1],
                        'instructions': re.search(r'- English: (.*)', section)[1]}
    return lines, people

def chars(line):
    return len(re.sub(r'[\s，。！？、：；“”‘’……—（）]', '', line['念法']))

def estimate(line, person, seconds=None):
    # Engineering budget reserve, NOT an official tokens/second conversion or billing receipt.
    sec = seconds if seconds is not None else chars(line) / 1.8 + 2
    text_bytes = len((person['instructions'] + '\n表演：' + line['表演'] + line['念法']).encode())
    return sec * 100 * 12 / 1_000_000 + text_bytes * .60 / 1_000_000

def prepare():
    hashes = sources()
    lines, people = config()
    OUT.mkdir(exist_ok=True)
    (OUT / '试镜').mkdir(exist_ok=True)
    jobs = []
    for name, person in people.items():
        for line in lines:
            if line['人'] == name and line['试镜']:
                for voice in person['voices']:
                    jobs.append({'person': name, 'id': line['id'], 'voice': voice,
                                 'file': f"{name}-{line['id']}-{voice}.mp3",
                                 'input': line['念法'],
                                 'instructions': person['instructions'] + '\n表演：' + line['表演'],
                                 'estimated_usd': estimate(line, person), 'chars': chars(line)})
    if len(jobs) != 24 or len({v[0] for v in VOICES.values()}) != 4:
        raise RuntimeError('invalid_audition_plan')
    full = sum(estimate(x, people[x['人']]) for x in lines)
    first = sum(x['estimated_usd'] for x in jobs)
    plan = {'date': '2026-11-07', 'model': MODEL, 'sources': hashes, 'people': people,
            'budget': {'limit_usd': 5, 'max_tts_calls': 260,
                       'first24_estimate_usd': first, 'first24_plus_full69_estimate_usd': first + full,
                       'max255_estimate_usd': first * 2 + full * 3,
                       'assumptions': '1.8 spoken characters/second plus 2 seconds per clip; 100 audio tokens/second reserve; input UTF-8 bytes used as conservative token count. Not official duration pricing. No STT planned.'},
            'jobs': jobs}
    if plan['budget']['max255_estimate_usd'] >= 4.5:
        raise RuntimeError('planned_budget_too_high')
    dump(OUT / '试镜计划.json', plan)
    return plan

def credential():
    key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not key:
        result = subprocess.run(['security', 'find-generic-password', '-s', 'compass-openai-tts', '-w'],
                                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        if result.returncode == 0:
            key = result.stdout.decode().strip()
    if not key:
        raise RuntimeError('credential_unavailable')
    return key

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def generate(plan, limit, resume_auth=False):
    records = json.loads(LEDGER.read_text()) if LEDGER.exists() else []
    if resume_auth:
        for row in records:
            if row['status'] == 'failed_or_uncertain' and row.get('http_status') == 401:
                row['reviewed_auth_failure'] = True
                row['review_note'] = 'Credentials corrected by user; keep failed attempt and permit a new attempt.'
        dump(LEDGER, records)
    if any(x['status'] != 'complete' and not x.get('reviewed_auth_failure') for x in records):
        raise RuntimeError('prior_attempt_needs_manual_review_no_automatic_retry')
    key = credential()
    opener = urllib.request.build_opener(NoRedirect)
    done = {x['file']: x for x in records if x['status'] == 'complete'}
    count = 0
    for job in plan['jobs']:
        target = OUT / '试镜' / job['file']
        if job['file'] in done:
            if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest() != done[job['file']]['sha256']:
                raise RuntimeError('existing_audio_changed')
            continue
        if target.exists():
            raise RuntimeError('untracked_audio_do_not_overwrite')
        if count >= limit:
            break
        reserve = max(.06, job['estimated_usd'] * 2)
        # One prior empty-body /audio/speech diagnostic is conservatively counted too.
        if len(records) + 1 >= 260 or sum(x['estimated_usd'] for x in records) + reserve >= 4.5:
            raise RuntimeError('budget_guard_stop')
        row = {'person': job['person'], 'id': job['id'], 'voice': job['voice'], 'file': job['file'],
               'model': MODEL, 'started_at': datetime.now().astimezone().isoformat(),
               'status': 'started', 'estimated_usd': reserve}
        records.append(row)
        dump(LEDGER, records)
        payload = json.dumps({'model': MODEL, 'voice': job['voice'], 'input': job['input'],
                              'instructions': job['instructions'], 'response_format': 'mp3'}, ensure_ascii=False).encode()
        req = urllib.request.Request('https://api.openai.com/v1/audio/speech', data=payload,
                                     headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}, method='POST')
        try:
            with opener.open(req, timeout=90) as response:
                audio = response.read()
            if len(audio) < 2000:
                raise RuntimeError('audio_too_small')
            target.write_bytes(audio)
            probe = subprocess.run([FFPROBE, '-v', 'error', '-show_entries', 'format=duration',
                                    '-of', 'default=nw=1:nk=1', str(target)], capture_output=True, text=True)
            sec = float(probe.stdout.strip())
            if sec <= 0:
                raise RuntimeError('invalid_duration')
            row.update(status='complete', seconds=sec, bytes=len(audio), sha256=hashlib.sha256(audio).hexdigest(),
                       estimated_usd=sec * .0012 + len((job['instructions'] + job['input']).encode()) * .0000006)
            dump(LEDGER, records)
            count += 1
            completed = sum(x['status'] == 'complete' for x in records)
            print(f"{completed}/24 complete: {job['person']} {job['id']} {job['voice']} ({sec:.2f}s)", flush=True)
        except Exception as exc:
            row['status'] = 'failed_or_uncertain'
            row['error_type'] = type(exc).__name__
            if isinstance(exc, urllib.error.HTTPError):
                row['http_status'] = exc.code
            dump(LEDGER, records)
            # Do not print raw exceptions, headers, response bodies, or credentials.
            print('STOP:', row['error_type'], row.get('http_status', ''), flush=True)
            return 2
    return 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', action='store_true')
    parser.add_argument('--limit', type=int, default=24)
    parser.add_argument('--resume-after-auth-fix', action='store_true',
                        help='Only after manual review and user credential correction; preserves failed attempts.')
    args = parser.parse_args()
    plan = prepare()
    print(json.dumps(plan['budget'], ensure_ascii=False), flush=True)
    return generate(plan, args.limit, args.resume_after_auth_fix) if args.generate else 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print('STOP:', type(exc).__name__, '(details suppressed to protect credentials)', flush=True)
        sys.exit(2)
