"""Archive licensed original attachments for audition only. Never writes dist/."""
from pathlib import Path
import concurrent.futures, hashlib, html, json, re, urllib.request, urllib.parse, zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'references/audio-cards-r1'
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
baseline = OUT / 'runtime-before.json'
if not baseline.exists():
    protected = list((ROOT/'dist/assets/audio').rglob('*')) + [ROOT/'dist'/name for name in
        ['audio-manager.mjs','audio-manifest.mjs','audio-events.mjs','cards.mjs','card-cast-vfx.mjs','skill-body-vfx.mjs']]
    baseline.write_text(json.dumps({p.relative_to(ROOT).as_posix():sha(p) for p in protected if p.is_file()},indent=2),encoding='utf-8')

definitions = [
    ('magic-spell-sfx','JaggedStone','CC0-1.0',None),
    ('pleasing-bell-sound-effect','Julie Damsgaard / Spring Spring / Spring Enterprises','CC0-1.0',None),
    ('bell-dingschimes','PWL','CC0-1.0',None),
    ('swishes-sound-pack','artisticdude','CC0-1.0',None),
    ('swish-bamboo-stick-weapon-swhoshes','qubodup / Iwan Gabovitch','CC0-1.0',None),
    ('short-wind-sound','remaxim','CC0-1.0',None),
    ('air-whoosh','pyranostudios','CC0-1.0',None),
    ('wind-whoosh-loop','SketchMan3','CC0-1.0',None),
    ('teleport-spell','Ogrebane','CC0-1.0',None),
    ('fire-staff-sound-effects','LEGIT Audio','CC0-1.0',r'\.zip$'),
    ('torch-fire-spell','spookymodem','CC-BY-3.0',None),
    ('fire-crackling','AntumDeluge','CC0-1.0',r'\.wav$'),
    ('ice-spells','bart; original recording Stephan / pdsounds','CC0-1.0',None),
    ('ice-breakingshattering','IgnasD','CC0-1.0',None),
    ('shimmer-glitter-magic','The Berklee College of Music; submitted by qubodup','CC-BY-3.0',None),
]

def fetch(url, path):
    if path.exists() and (path.suffix!='.zip' or zipfile.is_zipfile(path)): return
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(req,timeout=60) as r:
        temporary=path.with_name(path.name+'.part')
        total=0
        with temporary.open('wb') as f:
            while chunk:=r.read(1024*1024):
                f.write(chunk);total+=len(chunk)
                if total>1024*1024: print(path.name,round(total/1024/1024,1),'MiB',flush=True)
        assert not r.headers.get('Content-Length') or total==int(r.headers['Content-Length'])
        temporary.replace(path)

def source(d):
    slug,author,license,selector=d
    page='https://opengameart.org/content/'+slug
    evidence=OUT/(slug+'.html'); fetch(page,evidence)
    doc=evidence.read_text(encoding='utf-8')
    token='creativecommons.org/publicdomain/zero/1.0/' if license=='CC0-1.0' else 'creativecommons.org/licenses/by/3.0/'
    assert token in doc,(slug,'license mismatch')
    # Only file-field attachments; never the separately embedded audio preview.
    fields=re.findall(r'<div class="field field-name-field-art-files[\s\S]*?(?=<div class="field field-name-|<ul class="links|<div id="comments|$)',doc)
    assert fields,(slug,'file field absent')
    links=list(dict.fromkeys(html.unescape(x) for x in re.findall(r'href="(https://opengameart.org/sites/default/files/[^"?#]+\.(?:zip|7z|ogg|mp3|flac|wav))"',''.join(fields))))
    if selector: links=[x for x in links if re.search(selector,x)]
    elif any(x.endswith(('.zip','.7z')) for x in links): links=[x for x in links if x.endswith(('.zip','.7z'))]
    assert links,(slug,'no original attachment')
    folder=OUT/slug; folder.mkdir(exist_ok=True)
    downloads=[]
    for url in links:
        p=folder/Path(urllib.parse.unquote(urllib.parse.urlparse(url).path)).name
        fetch(url,p)
        anchor=next((a for a in re.findall(r'<a [^>]*>', ''.join(fields)) if html.unescape(url) in html.unescape(a)), '')
        filename=re.search(r'download="([^"]+)"',anchor)
        downloads.append(dict(url=url,file=p.relative_to(OUT).as_posix(),originalFilename=html.unescape(filename[1]) if filename else p.name,sha256=sha(p)))
        if p.suffix=='.zip':
            with zipfile.ZipFile(p) as z:
                for info in z.infolist():
                    if info.is_dir() or Path(info.filename).name.startswith('._'): continue
                    target=(folder/info.filename).resolve()
                    assert target.is_relative_to(folder.resolve())
                    target.parent.mkdir(parents=True,exist_ok=True)
                    if not target.exists(): target.write_bytes(z.read(info))
        if p.suffix=='.7z':
            import py7zr
            with py7zr.SevenZipFile(p) as z:
                for name in z.getnames(): assert (folder/name).resolve().is_relative_to(folder.resolve())
                z.extractall(folder)
    files=[dict(file=p.relative_to(OUT).as_posix(),sha256=sha(p)) for p in folder.rglob('*') if p.suffix.lower() in ['.wav','.ogg','.mp3','.flac'] and not p.name.startswith('._')]
    print(slug,':',len(files),'original files',flush=True)
    return dict(slug=slug,author=author,license=license,licenseUrl='https://'+token,page=page,
        evidence=evidence.name,evidenceSha256=sha(evidence),checkedOn='2026-10-13',downloads=downloads,files=files,
        attributionRequired=license!='CC0-1.0',obligations='署名作者、附来源与许可证链接、注明剪辑修改；禁止额外限制。' if license!='CC0-1.0' else 'CC0，无强制署名；本审核仍保留作者与来源。',
        originalDelivery='Publisher file-field attachment; compressed originals keep their original format, not advertised as lossless.')

sources=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for result in pool.map(source,definitions): sources.append(result)
revision='440300901dfe9275fd84e0b7763af1f8443ae62e'
folder=OUT/'vsco-harp'; folder.mkdir(exist_ok=True)
raw='https://raw.githubusercontent.com/sgossner/VSCO-2-CE/'+revision+'/'
fetch(raw+'LICENSE',folder/'LICENSE.txt');fetch(raw+'README.md',folder/'README.md')
assert 'Creative Commons' in (folder/'LICENSE.txt').read_text(encoding='utf-8')
downloads=[]
for name in ['KSHarp_C5_mf.wav','KSHarp_E5_mf.wav','KSHarp_G5_mf.wav','KSHarp_A4_mf.wav']:
    url=raw+'Strings/Harp/'+name; p=folder/name;fetch(url,p)
    downloads.append(dict(url=url,file=p.relative_to(OUT).as_posix(),originalFilename=name,sha256=sha(p)))
sources.append(dict(slug='vsco-harp',author='VSCO 2 CE: Sam Gossner & Simon Dalzell; sample cutting Elan Hickler / Soundemote (repository credits)',license='CC0-1.0',
    licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',page='https://github.com/sgossner/VSCO-2-CE',revision=revision,
    evidence='vsco-harp/README.md',evidenceSha256=sha(folder/'README.md'),licenseEvidence='vsco-harp/LICENSE.txt',licenseEvidenceSha256=sha(folder/'LICENSE.txt'),checkedOn='2026-10-13',downloads=downloads,
    files=[dict(file=d['file'],sha256=d['sha256']) for d in downloads],attributionRequired=False,obligations='CC0，无强制署名；本审核保留采样与编排来源。',originalDelivery='Pinned GitHub WAV source samples.'))
(OUT/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
print('Source and license archive complete; game untouched.')
