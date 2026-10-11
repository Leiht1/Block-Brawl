"""Measure mixing hierarchy of actual deployment files, without claiming hearing."""
from pathlib import Path
import json,hashlib,subprocess
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'validation/2026-10-11/audio-stage4'
selected=json.loads((ROOT/'references/audio-stage4/selection.json').read_text(encoding='utf-8'))
manifest=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {AUDIO_MANIFEST} from './dist/audio-manifest.mjs';console.log(JSON.stringify(AUDIO_MANIFEST));"],cwd=ROOT,encoding='utf-8'))
gains={}
for entry in manifest.values():
    if entry['src']:gains[entry['src'].removeprefix('./assets/audio/')]=entry['volume']
    for v in entry.get('variants',{}).values():gains[v['src'].removeprefix('./assets/audio/')]=v.get('volume',entry['volume'])
levels=[]
for e in selected:
    e['volume']=manifest[e['id']]['volume']
    p=ROOT/'dist'/e['formalFile'];x,rate=sf.read(p,always_2d=True)
    assert len(x)/rate==e['seconds'] or abs(len(x)/rate-e['seconds'])<.0001
    assert hashlib.sha256(p.read_bytes()).hexdigest()==e['sha256']
    assert np.isfinite(x).all() and max(abs(x).flatten())<.8
    if e['loop']:assert 90<=e['seconds']<=180 and e['boundaryJump']<.02
    levels.append(dict(id=e['id'],seconds=len(x)/rate,volume=e['volume'],peak=float(np.max(abs(x))),rms=float(np.sqrt(np.mean(x*x))),effectivePeak=float(np.max(abs(x))*e['volume']),effectiveRms=float(np.sqrt(np.mean(x*x))*e['volume'])))
battle=next(e for e in levels if e['id']=='bgm.battle');comparisons=[]
for f,volume,duck in [('block/block-match3-v2.wav',.46,.32),('combo/combo1-v2.wav',.48,.32),('combo/combo2-v2.wav',.51,.32),('combo/combo3-v2.wav',.54,.32),('special/special-create-v3.wav',.40,.32),('special/special-combo-line-blast-v5.wav',.78,.32),('special/special-combo-blasts-v3.wav',.90,.32),('maps/cliff/cliff-fall-v2.wav',.44,.55),('maps/ice/ice-freeze-v1.wav',.39,.55),('maps/ruins/ruins-activate-v1.wav',.39,.55),('maps/furnace/furnace-spread-v1.wav',.39,.55)]:
    volume=gains[f];duck=.18 if '/ice-freeze-' in f else .60 if f.startswith('maps/') else .65
    x,r=sf.read(ROOT/'dist/assets/audio'/f,always_2d=True);rms=float(np.sqrt(np.mean(x*x)))*volume;peak=float(np.max(abs(x)))*volume
    power=np.mean(x*x,axis=1);n=round(r*.08);sums=np.r_[0,np.cumsum(power)]
    shortRms=float(np.sqrt(np.max((sums[n:]-sums[:-n])/n)))*volume
    c=dict(file=f,effectRms=rms,effectMax80ms=shortRms,effectPeak=peak,musicDuck=duck,musicRms=battle['effectiveRms']*duck,musicPeak=battle['effectivePeak']*duck,peakMarginDb=20*np.log10(peak/(battle['effectivePeak']*duck)))
    comparisons.append(c)
report=dict(levels=levels,comparisons=comparisons,allFormalFilesMatchAudition=True,scope='Mixing-level evidence only. Frequency masking, timbre and fatigue need human listening.')
(OUT/'mix-levels.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
assert all(c['effectMax80ms']>c['musicRms']*1.2 for c in comparisons)
print('6 files match audition; current manifest gains measured; 11 short-time feedback comparisons pass')
