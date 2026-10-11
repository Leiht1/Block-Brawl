"""Stage 3 source archive; download to references only, never directly to game."""
from pathlib import Path
import concurrent.futures, hashlib, html, json, re, urllib.request, urllib.parse, zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'references/audio-stage3'
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
# Snapshot the existing workspace, including uncommitted work, before audio edits.
baseline = OUT / 'before.json'
if not baseline.exists():
    baseline.write_text(json.dumps({p.relative_to(ROOT).as_posix(): sha(p) for p in (ROOT/'dist').rglob('*') if p.is_file()}, indent=2), encoding='utf-8')

definitions = [
    ('free-cinematic-sound-effects', 'Gregor Quendel', 'CC-BY-4.0', 'cinematic'),
    ('fire-staff-sound-effects', 'LEGIT Audio', 'CC0-1.0', 'fire-staff'),
    ('ice-spells', 'bart; original recording by Stephan / pdsounds', 'CC0-1.0', 'ice-spells'),
    ('ice-breakingshattering', 'IgnasD', 'CC0-1.0', 'ice-shatters'),
    ('stone-door', 'bonebrah', 'CC0-1.0', 'stone-door'),
    ('stonerockorwoodmovednotick', 'omegagreg; collaborator pauliuw', 'CC0-1.0', 'stone-grind'),
    ('rumbleexplosion', 'Michel Baradari', 'CC-BY-3.0', 'rumble'),
    ('breaking-rock', 'themightyglider; derived from SoundCollectah', 'CC0-1.0', 'rock-break'),
]

def fetch(url, target):
    if target.exists(): return
    request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=90) as response:
        target.write_bytes(response.read())

def source(definition):
    slug, author, license, folder = definition
    page = 'https://opengameart.org/content/' + slug
    evidence = OUT / (slug+'.html')
    fetch(page, evidence)
    document = evidence.read_text(encoding='utf-8')
    token = 'creativecommons.org/publicdomain/zero' if license=='CC0-1.0' else 'creativecommons.org/licenses/by/'+('4.0' if '4.0' in license else '3.0')
    assert token in document, (slug, 'license mismatch')
    links = list(dict.fromkeys(html.unescape(x) for x in re.findall(r'href="(https://opengameart.org/sites/default/files/[^"?#]+\.(?:zip|ogg|mp3|flac|wav))"', document)))
    if any(x.endswith('.zip') for x in links): links=[x for x in links if x.endswith('.zip')]
    target = OUT / folder
    target.mkdir(exist_ok=True)
    files=[]
    for link in links:
        downloaded=target/Path(urllib.parse.unquote(urllib.parse.urlparse(link).path)).name
        fetch(link, downloaded)
        if downloaded.suffix=='.zip':
            with zipfile.ZipFile(downloaded) as archive:
                for info in archive.infolist():
                    if info.is_dir(): continue
                    path=(target/info.filename).resolve()
                    assert path.is_relative_to(target.resolve())
                    path.parent.mkdir(parents=True,exist_ok=True)
                    path.write_bytes(archive.read(info))
        files.append({'download':link,'archive':downloaded.relative_to(OUT).as_posix(),'sha256':sha(downloaded)})
    recordings=[{'file':p.relative_to(OUT).as_posix(),'sha256':sha(p)} for p in target.rglob('*') if p.suffix.lower() in ['.wav','.mp3','.flac','.ogg']]
    print(folder, len(recordings), 'recordings', flush=True)
    return dict(title=slug,author=author,license=license,licenseUrl='https://'+token+'/',page=page,evidence=evidence.name,evidenceSha256=sha(evidence),checkedOn='2026-10-11',downloads=files,files=recordings)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    sources=list(executor.map(source,definitions))
(OUT/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
print('Source evidence archived; runtime untouched.')
