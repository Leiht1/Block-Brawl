"""Prepare licensed natural swish auditions; never change deployed game audio."""
from pathlib import Path
import concurrent.futures, hashlib, json, re, urllib.request, zipfile
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'references/audio-swap'
OUT = ROOT / 'validation/2026-10-11/audio-swap'
REF.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
snapshot = OUT / 'game-before.json'
if not snapshot.exists():
    snapshot.write_text(json.dumps({p.relative_to(ROOT).as_posix(): sha(p) for p in (ROOT / 'dist').rglob('*') if p.is_file()}, indent=2), encoding='utf-8')

definitions = [
    ('bamboo', 'qubodup / Iwan Gabovitch', 'Swish bamboo stick', 'https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes'),
    ('light-swishes', 'artisticdude', 'Swishes Sound Pack', 'https://lpc.opengameart.org/node/4693'),
    ('cotton', 'akennedybrewer', 'Fabric Flap.wav', 'https://freesound.org/people/akennedybrewer/sounds/389170/'),
    ('fabric', 'David_Jacob', 'Moving fabric.mp3', 'https://freesound.org/people/David_Jacob/sounds/434652/'),
]

def fetch(url, target):
    if not target.exists():
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=45) as response:
            target.write_bytes(response.read())
    return target.read_text(encoding='utf-8') if target.suffix == '.html' else None

def source(definition):
    slug, author, title, page = definition
    evidence = REF / (slug + '.html')
    html = fetch(page, evidence)
    token = 'creativecommons.org/publicdomain/zero/1.0/'
    assert token in html, f'License not confirmed: {slug}'
    item = dict(slug=slug, author=author, title=title, page=page, license='CC0-1.0', licenseUrl='https://' + token,
                evidence=evidence.name, evidenceSha256=sha(evidence), checkedOn='2026-10-11')
    if 'freesound.org' in page:
        url = re.search(r'https://cdn\.freesound\.org/previews/[^"\s<>]+-hq\.mp3', html).group()
        path = REF / (slug + '.mp3')
        fetch(url, path)
        item.update(download=url, file=path.name, sha256=sha(path), formatNote='Public HQ MP3 preview; not original WAV')
    elif slug == 'light-swishes':
        url = re.search(r'https://(?:lpc\.)?opengameart.org/sites/default/files/swishes.zip', html).group()
        path = REF / 'swishes.zip'
        fetch(url, path)
        with zipfile.ZipFile(path) as archive:
            # Flatten only audio filenames; no arbitrary archive paths are extracted.
            for member in archive.namelist():
                if member.lower().endswith('.wav') and not Path(member).name.startswith('._'):
                    (REF / Path(member).name).write_bytes(archive.read(member))
        item.update(download=url, file=path.name, sha256=sha(path), formatNote='Original WAV files in ZIP')
    else:
        item.update(formatNote='Existing original FLAC recordings from licensed pack')
    return item

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    sources = list(pool.map(source, definitions))
(REF / 'sources.json').write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding='utf-8')
for p in REF.glob('._*.wav'):
    p.unlink()  # Previously extracted macOS resource forks, never audio assets.
for p in sorted(REF.glob('*.wav')) + sorted(REF.glob('*.mp3')) + sorted((ROOT / 'references/audio-stage2/swishes').glob('*.flac')):
    x, rate = sf.read(p, always_2d=True)
    x = x.mean(axis=1)
    print(p.name, 'seconds', round(len(x)/rate, 3), 'peakAt', round(np.argmax(abs(x))/rate, 3), flush=True)

RATE = 44100
plans = [
    ('A', '极短轻挥', 'light-swishes', REF/'swish-11.wav', 0, .11, 6500, '短促轻挥，作为轻巧交换的候选。'),
    ('B', '宽一点的唰', 'light-swishes', REF/'swish-4.wav', 0, .15, 6000, '空气滑过的长度略多，适合比较动作存在感。'),
    ('C', '竹棍短风切', 'bamboo', ROOT/'references/audio-stage2/swishes/swosh-02.flac', 0, .16, 5800, '竹棍实录的短风切，保留自然空气质感。'),
    ('D', '竹棍柔风切', 'bamboo', ROOT/'references/audio-stage2/swishes/swosh-04.flac', 0, .19, 4200, '另一条竹棍挥动录音，收柔高频、略长一些。'),
    ('E', '棉布拂过', 'cotton', REF/'cotton.mp3', .10, .18, 5500, '棉布穿过空气的片段，尝试更柔的材质感。'),
    ('F', '布料滑动', 'fabric', REF/'fabric.mp3', 7.06, .20, 5000, '布料随风移动中的短片段，比较滑动与风切两种方向。'),
]
candidates = []
for letter, label, slug, path, start, seconds, cutoff, description in plans:
    x, rate = sf.read(path, always_2d=True)
    x = x.mean(axis=1)
    x = x[round(start*rate):round((start+seconds)*rate)]
    x = np.interp(np.arange(round(seconds*RATE))*rate/RATE, np.arange(len(x)), x, right=0)
    x -= x.mean()
    x = sosfilt(butter(2, [90, cutoff], btype='bandpass', fs=RATE, output='sos'), x)
    attack, release = round(.015*RATE), round(.035*RATE)
    x[:attack] *= np.sin(np.linspace(0, np.pi/2, attack))**2
    x[-release:] *= np.sin(np.linspace(np.pi/2, 0, release))**2
    rms, peak = np.sqrt(np.mean(x*x)), abs(x).max()
    assert rms > 0
    x *= min(.14/rms, .65/peak)
    file = 'block-swap-'+letter+'.wav'
    sf.write(OUT/file, x, RATE, subtype='PCM_16')
    attribution = dict(next(s for s in sources if s['slug']==slug), recording=path.relative_to(ROOT).as_posix(), recordingSha256=sha(path))
    candidates.append(dict(id='block.swap', candidate=letter, label=label, description=description,
                           file=file, seconds=seconds, volume=.58, sha256=sha(OUT/file),
                           peak=float(abs(x).max()), rms=float(np.sqrt(np.mean(x*x))),
                           source=attribution, edits=dict(startSeconds=start, durationSeconds=seconds,
                           highpassHz=90, lowpassHz=cutoff, attackMs=15, releaseMs=35,
                           sampleRate=RATE, channels=1, format='PCM_16', layers=1),
                           status='awaiting-user-choice', installed=False))
(OUT/'candidates.json').write_text(json.dumps(candidates, ensure_ascii=False, indent=2), encoding='utf-8')
print('Prepared 6 swap auditions. Game audio unchanged.')
