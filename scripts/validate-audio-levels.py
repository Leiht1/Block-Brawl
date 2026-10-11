"""Measure deployed PCM clips, including manifest playback gains."""
from pathlib import Path
import json
import hashlib
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'validation/2026-10-11/audio-selected'
assets = json.loads((OUT / 'audio-assets.json').read_text(encoding='utf-8'))
records = []
for a in assets:
    x, rate = sf.read(ROOT / 'dist/assets/audio' / a['file'], always_2d=True)
    assert rate == 44100 and x.shape[1] == 1
    assert np.isfinite(x).all() and 0 < np.max(abs(x)) < .83
    assert 0 < len(x)/rate <= 1.2
    y = x * a['volume']
    records.append(dict(file=a['file'],seconds=len(x)/rate,rate=rate,channels=1,
                        peak=float(np.max(abs(x))),volume=a['volume'],
                        effectivePeak=float(np.max(abs(y))),
                        effectiveRms=float(np.sqrt(np.mean(y*y))),
                        effectiveEnergy=float(np.sum(y*y)/rate)))

tiers = [next(r for r in records if r['file']==f) for f in [
    'block/block-match3-v2.wav', 'special/special-line-v3.wav',
    'special/special-combo-line-blast-v5.wav', 'special/special-combo-blasts-v3.wav']]
# Include the shared line recording at the line+line event's actual .72 gain.
line_pair = dict(tiers[1])
for field in ['effectivePeak','effectiveRms']:
    line_pair[field] *= .72/line_pair['volume']
line_pair['effectiveEnergy'] *= (.72/line_pair['volume'])**2
line_pair.update(volume=.72,variant='line-line')
tiers.insert(2,line_pair)
for lower,higher in zip(tiers,tiers[1:]):
    assert higher['effectiveEnergy'] > lower['effectiveEnergy']
    higher['energyIncreaseDb'] = float(10*np.log10(higher['effectiveEnergy']/lower['effectiveEnergy']))
combos = [next(r for r in records if r['file']==f'combo/combo{i}-v2.wav') for i in range(1,4)]
assert all(b['effectiveEnergy']>a['effectiveEnergy'] for a,b in zip(combos,combos[1:]))
previous = json.loads((ROOT/'references/audio-stage2/magic/previous-derivatives.json').read_text(encoding='utf-8'))
old_create = next(a for a in previous if a['file']=='special/special-create-v1.wav')
line_sha = hashlib.sha256((ROOT/'dist/assets/audio/special/special-line-v3.wav').read_bytes()).hexdigest()
assert line_sha == old_create['sha256']
edits = json.loads((ROOT/'references/audio-stage2/derivatives.json').read_text(encoding='utf-8'))
magic = [a for a in edits if a['file'].startswith('special/') and a['file']!='special/special-line-v3.wav']
assert len(magic)==4 and all(len(a['sources'])==1 for a in magic)
(OUT/'levels.json').write_text(json.dumps(dict(files=records,tiers=tiers,
    selectedLine=dict(matchesFormerCreate=True,sha256=line_sha),
    magicCues=[dict(file=a['file'],singleSource=a['sources'][0]) for a in magic],
    checks='PCM loads; finite samples; mono 44.1kHz; no clipping; full-cue tier and chain energy rise; RMS measured separately',
    limitation='Numerical checks do not replace subjective listening.'),indent=2),encoding='utf-8')
print(f'Measured {len(records)} PCM clips; full-cue tier and chain energies rise; RMS recorded.')
