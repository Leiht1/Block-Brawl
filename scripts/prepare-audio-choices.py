"""Build audition-only edits. Never writes game assets or the runtime manifest."""
from pathlib import Path
import hashlib
import json
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'references/audio-stage2'
OUT = ROOT / 'validation/2026-10-11/audio-choices'
RATE = 44100
(OUT / 'clips').mkdir(parents=True, exist_ok=True)
cc0 = 'https://creativecommons.org/publicdomain/zero/1.0/'
ccby = 'https://creativecommons.org/licenses/by/3.0/'
definitions = [
    dict(key='A', label='旋律法术一', file='choices/raw/magical_1.ogg',
         author='JaggedStone', title='Magic Spell SFX — magical_1', license='CC0-1.0', licenseUrl=cc0,
         page='https://opengameart.org/content/magic-spell-sfx', evidence='choices/raw/magic-spell-sfx.html',
         download='https://opengameart.org/sites/default/files/magical_1.ogg'),
    dict(key='B', label='旋律法术二', file='choices/raw/magical_4.ogg',
         author='JaggedStone', title='Magic Spell SFX — magical_4', license='CC0-1.0', licenseUrl=cc0,
         page='https://opengameart.org/content/magic-spell-sfx', evidence='choices/raw/magic-spell-sfx.html',
         download='https://opengameart.org/sites/default/files/magical_4.ogg'),
    dict(key='C', label='空间法术', file='choices/raw/teleport.wav',
         author='Ogrebane', title='Teleport Spell', license='CC0-1.0', licenseUrl=cc0,
         page='https://opengameart.org/content/teleport-spell', evidence='choices/raw/teleport-spell.html',
         download='https://opengameart.org/sites/default/files/teleport.wav'),
    dict(key='D', label='光系法术', file='magic/virix/Healing Full.wav',
         author='ViRiX Dreamcore (David Mckee)', title='Magic SFX Sample — Healing Full', license='CC-BY-3.0', licenseUrl=ccby,
         page='https://opengameart.org/content/magic-sfx-sample', evidence='magic/magic-sfx-sample.html',
         authorUrl='https://soundcloud.com/virix', archive='magic/magic-sfx.zip',
         download='https://opengameart.org/sites/default/files/Magic%20SFX%20Preview%20Pack.zip'),
]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
records = []
for d in definitions:
    raw = REF / d['file']
    x, rate = sf.read(raw, always_2d=True)
    x = x.mean(axis=1)
    x -= x.mean()
    active = np.flatnonzero(abs(x) > np.max(abs(x)) * .015)
    start = max(0, active[0] - round(rate * .002))
    x = x[start:active[-1]+1]
    positions = np.arange(0, len(x)-1, rate/RATE)
    x = np.interp(positions, np.arange(len(x)), x)
    # Keep each original's start and development; shorten only the tail to 1.2s.
    x = x[:round(1.2*RATE)]
    a, r = round(.002*RATE), round(.12*RATE)
    x[:a] *= np.linspace(0,1,a)
    x[-r:] *= np.linspace(1,0,r)
    # Comparable audition level, without compression, EQ, pitch shifts or layering.
    rms = np.sqrt(np.mean(x*x))
    x *= min(.16/rms, .76/np.max(abs(x)))
    target = OUT / 'clips' / f"{d['key'].lower()}.wav"
    sf.write(target, x, RATE, subtype='PCM_16')
    y, saved_rate = sf.read(target)
    assert saved_rate == RATE and np.isfinite(y).all() and 0 < np.max(abs(y)) < .77
    record = dict(**d, originalSha256=sha(raw), evidenceSha256=sha(REF/d['evidence']),
                  clip=f"clips/{target.name}", sha256=sha(target), seconds=len(y)/RATE,
                  originalStartSeconds=start/rate, peak=float(np.max(abs(y))),
                  rms=float(np.sqrt(np.mean(y*y))), auditionVolume=.78,
                  edits='Mono; remove DC/leading silence; retain first 1.2s; 2ms attack/120ms release; RMS target .16 with peak cap .76; no EQ, pitch shift or layering',
                  checkedOn='2026-10-11', implemented=False)
    if d.get('archive'):
        record['archiveSha256'] = sha(REF/d['archive'])
    records.append(record)
selection_file = REF/'choices/selection.json'
selection = json.loads(selection_file.read_text(encoding='utf-8')) if selection_file.exists() else None
if selection:
    chosen = next(r for r in records if r['key'] == selection['key'])
    assert chosen['sha256'] == selection['sha256']
    chosen.update(implemented=True, deployedFile=selection['targetFile'])
manifest = dict(selected=selection['key'] if selection else None,
                status='User-selected D implemented' if selection else 'Awaiting user choice; audition only', candidates=records)
(OUT/'candidate-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
(REF/'choices/candidate-provenance.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('Prepared four audition clips outside game assets; selection state preserved.')
