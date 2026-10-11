"""Compare full manifest and variants: actual RMS, short-time RMS, and gains.
No waveform edits. Short cue strength is measured over 80ms, not judged from
peak amplitude alone or from long silences in the recording.
"""
from pathlib import Path
import json,hashlib,subprocess,math
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'validation/2026-10-11/audio-balance'
script="import {AUDIO_MANIFEST} from './dist/audio-manifest.mjs'; console.log(JSON.stringify(AUDIO_MANIFEST));"
manifest=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT,encoding='utf-8'))
(OUT/'after-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
before=json.loads((OUT/'before-levels.json').read_text(encoding='utf-8'));lookup={(e['id'],e['variant']):e for e in before};rows=[]
for id,e in manifest.items():
    if not e['src']:continue
    for variant,r in [('base',e),*[(k,{**e,**v}) for k,v in e.get('variants',{}).items()]]:
        old=lookup[(id,variant)];p=ROOT/'dist'/r['src'];assert hashlib.sha256(p.read_bytes()).hexdigest()==old['sha256']
        x,rate=sf.read(p,always_2d=True);power=np.mean(x*x,axis=1);n=round(rate*.08);sums=np.r_[0,np.cumsum(power)]
        env=np.sqrt((sums[n:]-sums[:-n])/n) if len(x)>n else np.sqrt(power.mean()).reshape(1)
        volume=r['volume'];row={**old,'volume':volume,'rms':float(np.sqrt(power.mean())),'peak':float(np.max(abs(x))),'max80ms':float(np.max(env)),
         'beforeEffectiveRms':old['rms']*old['volume'],'afterEffectiveRms':float(np.sqrt(power.mean()))*volume,
         'beforeMax80ms':old['max80ms']*old['volume'],'afterMax80ms':float(np.max(env))*volume,'gainChangeDb':20*math.log10(volume/old['volume'])}
        if r['type']=='sfx':assert row['afterMax80ms']<.13,(id,variant,row['afterMax80ms'])
        rows.append(row)
pick=lambda id,v='base':next(e for e in rows if e['id']==id and e['variant']==v)
assert abs(pick('bgm.lobby')['gainChangeDb']-20*math.log10(manifest['bgm.lobby']['volume']/.30))<.01
assert pick('special.combo','blast-blast')['afterMax80ms']/pick('block.match3')['afterMax80ms']<2.3
assert all(pick('block.combo',v)['volume']==lookup[('block.combo',v)]['volume'] for v in ['combo1','combo2','combo3'])
battle=pick('bgm.battle');music=dict(beforeIdleRms=battle['beforeEffectiveRms'],afterIdleRms=battle['afterEffectiveRms'],beforeClearRms=battle['beforeEffectiveRms']*.32,afterClearRms=battle['afterEffectiveRms']*.65,clearGainChangeDb=20*math.log10((battle['afterEffectiveRms']*.65)/(battle['beforeEffectiveRms']*.32)))
scope=json.loads((OUT/'scope-before.json').read_text(encoding='utf-8'))
for file,sha in scope.items():
    if file in ['dist/audio-manifest.mjs','dist/audio-manager.mjs']:continue
    assert hashlib.sha256((ROOT/file).read_bytes()).hexdigest()==sha,file
report=dict(rows=rows,music=music,allAudioFileBytesUnchanged=True,gameplayModulesUnchanged=True,note='Measurements and real-browser checks; subjective listening is not claimed.')
(OUT/'balance-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS',len(rows),'manifest/variant levels; SFX 80ms RMS cap 0.13; all recordings and gameplay modules unchanged')
print('Lobby boost',round(pick('bgm.lobby')['gainChangeDb'],2),'dB; battle during clears boost',round(music['clearGainChangeDb'],2),'dB; blast+blast change',round(pick('special.combo','blast-blast')['gainChangeDb'],2),'dB')
