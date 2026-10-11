"""Archive exact licensed sample sources and pre-change scope hashes."""
from pathlib import Path
import urllib.request, urllib.parse, hashlib, json, shutil
ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'references/audio-stage4';REF.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
baseline=REF/'before.json'
if not baseline.exists():
    baseline.write_text(json.dumps({str(p.relative_to(ROOT)):sha(p) for p in [*ROOT.glob('dist/*.mjs'),*ROOT.glob('dist/assets/audio/**/*.wav')]},indent=2),encoding='utf-8')
REV='440300901dfe9275fd84e0b7763af1f8443ae62e'
files={
 'harp-c3.wav':'Strings/Harp/KSHarp_C3_mf.wav',
 'harp-c5.wav':'Strings/Harp/KSHarp_C5_mf.wav',
 'conga.wav':'Percussion/Conga-Tap1_v1_rr1_Sum.wav',
 'tamb.wav':'Percussion/Tamb1-Shake_v1_rr1_Sum.wav',
 'snare-tap.wav':'Percussion/Snare2-taps_v1_rr1_Sum.wav',
}
records=[]
for name,remote in files.items():
    url='https://raw.githubusercontent.com/sgossner/VSCO-2-CE/'+REV+'/'+urllib.parse.quote(remote)
    p=REF/name
    if not p.exists():p.write_bytes(urllib.request.urlopen(url,timeout=40).read())
    records.append(dict(file=name,download=url,sha256=sha(p),author='Sam Gossner & Simon Dalzell; Elan Hickler/Soundemote',title='VSCO 2 Community Edition',page='https://github.com/sgossner/VSCO-2-CE',revision=REV,license='CC0-1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/'))
for name in ['marimba-c4.wav','marimba-g4.wav','vsco-LICENSE.txt','vsco-README.md']:
    shutil.copyfile(ROOT/'references/audio-stage2'/name,REF/name)
for group in json.loads((ROOT/'references/audio-stage2/sources.json').read_text(encoding='utf-8')):
    if 'Marimba' in group['title'] or 'Pop effect' in group['title']:
        records.append(group)
for pack in ['casino-audio','interface-sounds']:
    import re
    page='https://kenney.nl/assets/'+pack
    urls=re.findall(r'https://[^"\s]+\.zip',(REF/(pack+'.html')).read_text(encoding='utf-8'))
    records.append(dict(title=pack,author='Kenney',page=page,download=urls[0],archive=pack+'.zip',sha256=sha(REF/(pack+'.zip')),license='CC0-1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',files=[dict(file=str(p.relative_to(REF)),sha256=sha(p)) for p in (REF/pack).rglob('*.ogg')]))
(REF/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print('Archived sources:',len(records))
