"""New cliff auditions only. Never copies candidates into dist."""
from pathlib import Path
import hashlib,json,re,urllib.request
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfilt

ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'references/audio-stage3/cliff-reselection'
OUT=ROOT/'validation/2026-10-11/audio-maps/cliff-reselection'
OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sources=[]
definitions=[
 ('alancat','AlanCat','rockfall2a.wav','https://freesound.org/people/AlanCat/sounds/389303/','CC0-1.0'),
 ('adamgryu','adamgryu','Rocks.wav','https://freesound.org/people/adamgryu/sounds/336023/','CC0-1.0'),
 ('falling-rock','spookymodem','Falling Rock','https://opengameart.org/content/falling-rock','CC-BY-3.0'),
 ('stubb','_stubb','Rock Tumble 2.wav','https://freesound.org/people/_stubb/sounds/389618/','CC0-1.0'),
 ('sand','martinimeniscus / Florentine Films SFX','sand pour on sand FF662.aif','https://freesound.org/people/martinimeniscus/sounds/199332/','CC0-1.0'),
]
for slug,author,title,page,license in definitions:
 evidence=REF/(slug+'.html');document=evidence.read_text(encoding='utf-8')
 token='creativecommons.org/publicdomain/zero/1.0/' if license=='CC0-1.0' else 'creativecommons.org/licenses/by/3.0/'
 assert token in document
 if 'freesound.org' in page:
  # Public licensed HQ preview, not the login-protected original download.
  download=re.search(r'https://cdn\.freesound\.org/previews/[^"\s<>]+-hq\.mp3',document).group()
  target=REF/(slug+'.mp3');kind='public HQ MP3 preview (not original WAV)'
 else:
  download=re.search(r'https://opengameart.org/sites/default/files/Falling%20Rock.wav',document).group()
  target=REF/(slug+'.wav');kind='original WAV'
 if not target.exists():
  with urllib.request.urlopen(urllib.request.Request(download,headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as response:target.write_bytes(response.read())
 sources.append(dict(slug=slug,author=author,title=title,page=page,license=license,licenseUrl='https://'+token,evidence=evidence.name,evidenceSha256=sha(evidence),download=download,file=target.name,sha256=sha(target),formatNote=kind,checkedOn='2026-10-11'))
(REF/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')

RATE=44100
def load(path):
 x,rate=sf.read(path,always_2d=True);x=x.mean(axis=1);x-=x.mean();active=np.flatnonzero(abs(x)>abs(x).max()*.01)
 x=x[max(0,active[0]-round(.004*rate)):active[-1]+1]
 positions=np.arange(0,len(x)-1,rate/RATE);x=np.interp(positions,np.arange(len(x)),x)
 return x/(abs(x).max() or 1)

recordings={s['slug']:load(REF/s['file']) for s in sources}
for slug,x in recordings.items():print(slug,'duration',round(len(x)/RATE,3),'peakAt',round(np.argmax(abs(x))/RATE,3),flush=True)

def fit(x,seconds,attack=.008,release=.055):
 n=round(seconds*RATE);x=np.pad(x[:n],(0,max(0,n-len(x))))
 a=min(round(attack*RATE),n);r=min(round(release*RATE),n);x[:a]*=np.linspace(0,1,a);x[-r:]*=np.linspace(1,0,r);return x
def layer(slug,seconds,delay=0,gain=1,start=0,speed=1,lowpass=4800,peak=False):
 x=recordings[slug]
 if peak:start=max(0,np.argmax(abs(x))/RATE-.02)
 x=x[round(start*RATE):];positions=np.arange(0,len(x)-1,speed);x=np.interp(positions,np.arange(len(x)),x)
 x=sosfilt(butter(3,lowpass,fs=RATE,output='sos'),x);x=x/(abs(x).max() or 1)
 return dict(slug=slug,sound=fit(x,seconds),seconds=seconds,delay=delay,gain=gain,start=round(start,5),speed=speed,lowpass=lowpass)

for number in ['02','04','26','30']:
 slug='swish-'+number;path=ROOT/f'references/audio-stage2/swishes/swosh-{number}.flac';recordings[slug]=load(path)
 sources.append(dict(slug=slug,author='qubodup / Iwan Gabovitch',title='Swish bamboo stick',page='https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes',license='CC0-1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',file=path.relative_to(ROOT).as_posix(),sha256=sha(path)))

plans=[
 ('cliff.fall','D','重石滚坠',.62,.44,[layer('swish-02',.27,speed=.78,lowpass=2500),layer('stubb',.35,delay=.25,speed=.82,lowpass=3600,peak=True)],'风切后接花岗岩／混凝土石块滚落录音；主体短而厚。'),
 ('cliff.fall','E','洞顶岩块坠落',.62,.44,[layer('swish-30',.26,lowpass=3000),layer('falling-rock',.35,delay=.25,speed=.92,lowpass=4200,peak=True)],'风切接洞塌落石录音，岩块撞散的颗粒更多。'),
 ('cliff.fall','F','自然崖壁落石',.62,.44,[layer('swish-04',.27,speed=.85,lowpass=2700),layer('alancat',.35,delay=.25,speed=.9,lowpass=4000,peak=True)],'实录悬崖落石和小石级联，保留自然石质撞击。'),
 ('cliff.fall','G','碎岩重落',.62,.44,[layer('swish-26',.27,speed=.85,lowpass=3000),layer('adamgryu',.35,delay=.25,speed=.78,lowpass=3800,peak=True)],'另一组石块录音，略降速增加块体感，与当前设计岩石素材区分。'),
 ('cliff.impact','D','沙尘散开',.48,.33,[layer('sand',.48,start=2.6,lowpass=5800),layer('stubb',.27,delay=.12,start=.7,gain=.16,lowpass=4400)],'以细沙落沙录音为主，少量石粒尾；避免第二次重撞。'),
 ('cliff.impact','E','小石级联',.48,.33,[layer('alancat',.48,start=8.0,lowpass=5000)],'实录落石中的小石尾段，颗粒滚动比沙尘更清晰。'),
 ('cliff.impact','F','洞塌碎屑尾',.48,.33,[layer('falling-rock',.48,start=2.2,lowpass=4800)],'洞塌录音的碎屑散落段，更粗一些，不加爆炸。'),
 ('cliff.impact','G','砂砾混散',.48,.33,[layer('adamgryu',.38,start=1.0,lowpass=4400),layer('sand',.35,delay=.12,start=5.0,gain=.5,lowpass=5400)],'较粗石粒与细沙尾混合，中间材质层次。'),
]
records=[]
for id,letter,label,seconds,volume,layers,description in plans:
 x=np.zeros(round(seconds*RATE))
 for l in layers:
  start=round(l['delay']*RATE);y=l['sound']*l['gain'];n=min(len(y),len(x)-start);x[start:start+n]+=y[:n]
 x=fit(x,seconds);peak=abs(x).max();rms=np.sqrt(np.mean(x*x));assert rms>0
 x*=min(.14/rms,.65/peak)
 file=id.replace('.','-')+'-'+letter+'-v2.wav';p=OUT/file;sf.write(p,x,RATE,subtype='PCM_16')
 edits=[{k:v for k,v in l.items() if k!='sound'} for l in layers]
 records.append(dict(id=id,candidate=letter,label=label,description=description,file=file,seconds=seconds,volume=volume,sha256=sha(p),peak=float(abs(x).max()),rms=float(np.sqrt(np.mean(x*x))),effectiveRms=float(np.sqrt(np.mean(x*x)))*volume,sources=[next(s for s in sources if s['slug']==l['slug']) for l in layers],edits=edits,status='awaiting-user-choice',installed=False))
(OUT/'candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(REF/'pending.json').write_text(json.dumps(dict(warning=dict(candidate='A',approvedBy='user',sha256=sha(ROOT/'dist/assets/audio/maps/cliff/cliff-warning-v1.wav')),fall='awaiting-user-choice',impact='awaiting-user-choice',candidates='../validation/2026-10-11/audio-maps/cliff-reselection/candidates.json'),ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared 8 new auditions. No game audio recordings changed.')
