"""Offline edits of licensed recordings; no oscillators or procedural SFX.

Run with numpy and soundfile installed. Originals and page evidence are kept in
references/audio-stage2. Runtime plays the finished WAV files without DSP.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'references/audio-stage2'
OUT = ROOT / 'dist/assets/audio'
RATE = 44100
records = []

def load(name, speed=1):
    x, rate = sf.read(SOURCE / name, always_2d=True)
    x = x.mean(axis=1)
    # Remove DC and leading/trailing recording silence, retaining 2ms of attack.
    x -= x.mean()
    active = np.flatnonzero(abs(x) > max(abs(x)) * .015)
    x = x[max(0, active[0]-int(rate*.002)):active[-1]+1]
    positions = np.arange(0, len(x)-1, rate/RATE*speed)
    x = np.interp(positions, np.arange(len(x)), x)
    return x / max(abs(x))

def fit(x, seconds, attack=.002, release=.02):
    n = round(seconds*RATE)
    x = np.pad(x[:n], (0, max(0,n-len(x))))
    a, r = min(round(attack*RATE), n), min(round(release*RATE), n)
    x[:a] *= np.linspace(0,1,a)
    x[-r:] *= np.linspace(1,0,r)
    return x

def mix(seconds, *layers):
    x = np.zeros(round(seconds*RATE))
    for sound, delay, gain in layers:
        start = round(delay*RATE)
        n = min(len(sound),len(x)-start)
        x[start:start+n] += sound[:n]*gain
    return fit(x,seconds)

def save(file, x, sources, edits, peak=.72):
    # Fixed headroom; manifest controls mix hierarchy, not runtime filters.
    x = fit(x, len(x)/RATE)
    x *= peak/max(abs(x))
    target = OUT / file
    target.parent.mkdir(parents=True,exist_ok=True)
    sf.write(target,x,RATE,subtype='PCM_16')
    records.append(dict(file=file,seconds=round(len(x)/RATE,4),peak=peak,
                        rms=round(float(np.sqrt(np.mean(x*x))),4),sources=sources,
                        edits=edits,sha256=hashlib.sha256(target.read_bytes()).hexdigest()))

wood0='impact-sounds/Audio/impactWood_light_000.ogg'
wood2='impact-sounds/Audio/impactWood_light_002.ogg'
glass='impact-sounds/Audio/impactGlass_light_001.ogg'
bounce='BounceYoFrankie.flac'
shimmer='shimmer_1.flac'
pop='p_1.ogg'
wood=fit(load(wood0),.12)
glass_hit=fit(load(glass),.12)
soft_pop=fit(load(pop),.09)
shine=fit(load(shimmer,.86),.40,release=.08)

save('block/block-swap-v1.wav',wood,[wood0],'Trim quiet tail; 120ms; 2ms/20ms fades')
save('block/block-invalid-v1.wav',fit(load(bounce,.93),.22),[bounce],
     'Trim silence; speed .93; 220ms soft rebound; fades',peak=.60)
save('block/block-fall-v1.wav',fit(load(wood2,.96),.10),[wood2],
     'One 100ms landing per batch; speed .96; fades',peak=.60)
save('block/block-match3-v2.wav',soft_pop,[pop],
     'Single bubble pop; 90ms; no glass or wood attack',peak=.66)
for level, speed in enumerate([1,1.12,1.26],1):
    layers=[(fit(load(pop,speed),.09),0,.80),
            (fit(load('p_2.ogg',speed),.09),.035,.32)]
    if level>=2:
        layers.append((fit(load('p_2.ogg',speed),.09),.07,.42))
    if level>=3:
        layers.append((fit(load('p_3.ogg',speed),.07),.10,.52))
    save(f'combo/combo{level}-v2.wav',mix(.15+(level-1)*.025,*layers),
         [pop,'p_2.ogg']+(['p_3.ogg'] if level>=3 else []),
         f'Bubble family only; speed {speed}; {level+1} pops; rising pitch and density')
# The player chose this exact reveal recording as the line clear.
# Same samples, mix and fades as the former special-create-v1; only its role changes.
save('special/special-line-v3.wav',mix(.40,(shine,0,.75),(glass_hit,0,.18)),
     [shimmer,glass],'Exact former special-create-v1 recording, reassigned to line clear',peak=.66)
# Each event uses one finished licensed magic cue, never a repeated/stacked explosion.
magic_clips=[
    ('special-create-v3','magic/virix/Misc 02.wav',.36,.62,.065,'Single short magic reveal; no explosion layers'),
    ('special-bomb-v3','magic/virix/Ice attack 2.wav',.50,.74,.075,'Single elemental magic blast; no bubble/balloon layer'),
    ('special-combo-blasts-v3','magic/virix/Fire impact 1.wav',.95,.66,.130,'Single strongest fire-magic impact; dense body, one onset, no duplicated explosion')
]
for name,source,seconds,peak,release,edits in magic_clips:
    save('special/'+name+'.wav',fit(load(source),seconds,release=release),[source],
         edits+'; trim recording silence and long reverb; fades; fixed headroom',peak=peak)
# Adopt the exact user-approved D audition, including its tail and mastered level.
# Keep a durable selected recording so rebuilds do not depend on validation output.
selected = json.loads((SOURCE/'choices/selection.json').read_text(encoding='utf-8'))
approved = SOURCE/selected['selectedFile']
assert hashlib.sha256(approved.read_bytes()).hexdigest() == selected['sha256']
assert hashlib.sha256((SOURCE/selected['source']).read_bytes()).hexdigest() == selected['originalSha256']
target = OUT/selected['targetFile']
target.write_bytes(approved.read_bytes())
sx, sr = sf.read(target)
assert sr == RATE and sx.ndim == 1
records.append(dict(file=selected['targetFile'],seconds=len(sx)/sr,
                    peak=float(np.max(abs(sx))),rms=float(np.sqrt(np.mean(sx*sx))),
                    sources=[selected['source']],edits=selected['edits'],
                    sha256=selected['sha256']))
marimba='marimba-c4.wav'
for digit,speed in [('3',1),('2',2**(2/12)),('1',2**(4/12))]:
    save(f'ui/countdown-{digit}-v2.wav',fit(load(marimba,speed),.21,release=.075),
         [marimba],f'Recorded marimba C4/D4/E4; speed {speed:.6f}; warm 210ms note',peak=.68)
save('ui/countdown-start-v2.wav',mix(.40,
     (fit(load(marimba),.36,release=.12),0,.62),
     (fit(load(marimba,2**(4/12)),.36,release=.12),.018,.55),
     (fit(load('marimba-g4.wav'),.35,release=.12),.036,.52)),
     [marimba,'marimba-g4.wav'],'C4/E4/G4 recorded marimba bloom; 18ms spacing; no pop or shimmer',peak=.78)

(SOURCE/'derivatives.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
print(f'Prepared {len(records)} licensed recording edits, {sum((OUT/r["file"]).stat().st_size for r in records)} bytes')
