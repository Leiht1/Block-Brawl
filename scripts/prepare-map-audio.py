"""Licensed recording edits: candidate preparation first, adoption only with --adopt."""
from pathlib import Path
import argparse, hashlib, json, shutil
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'references/audio-stage3'
OUT=ROOT/'validation/2026-10-11/audio-maps'
RATE=44100
OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
catalog=json.loads((REF/'sources.json').read_text(encoding='utf-8'))

def find(pattern):
    paths=list(REF.rglob(pattern))
    assert len(paths)==1,(pattern,paths)
    return paths[0]

def load(path,seconds,start=0,speed=1,lowpass=None,reverse=False):
    x,rate=sf.read(path,always_2d=True)
    x=x.mean(axis=1);x-=x.mean()
    active=np.flatnonzero(abs(x)>np.max(abs(x))*.015)
    x=x[max(0,active[0]-int(rate*.003)):active[-1]+1]
    x=x[round(start*rate):]
    positions=np.arange(0,len(x)-1,rate/RATE*speed)
    x=np.interp(positions,np.arange(len(x)),x)
    if reverse:x=x[::-1]
    if lowpass:x=sosfilt(butter(3,lowpass,fs=RATE,output='sos'),x)
    x=x/(np.max(abs(x)) or 1)
    return fit(x,seconds)

def fit(x,seconds,attack=.006,release=.06):
    n=round(seconds*RATE);x=np.pad(x[:n],(0,max(0,n-len(x))))
    a,r=min(round(attack*RATE),n),min(round(release*RATE),n)
    x[:a]*=np.linspace(0,1,a);x[-r:]*=np.linspace(1,0,r)
    return x

def layer(path,seconds,delay=0,gain=1,**kwargs):
    return dict(path=path,seconds=seconds,delay=delay,gain=gain,**kwargs)

rock09=find('*Rocks - Elements 09.mp3')
rock02=find('*Rocks - Sequences 02.mp3')
rock24=find('*Rocks - Sequences 24.mp3')
rumble=find('rumble.flac');crack=find('rock_break*.ogg')
door=find('stone_door.ogg');grind=find('stone_rock_or_wood_moved_no_tick.mp3')
ice=find('ice.wav');cold=find('coldsnap.wav')
shatter=lambda n:find('LedasLuzta'+n+'.ogg')
fire=lambda n:find('LEGIT_FIR_Fire_Staff '+str(n)+'-Audio.wav')
fire_short=find('*Fire - Short - Swoosh Burst Sizzling 01.mp3')
fire_wind=find('*Fire - Winds - Swoosh 04.mp3')
fire_evolve=find('*Fire - Swooshes - Burst Evolving 19.mp3')
swish=lambda n:ROOT/f'references/audio-stage2/swishes/swosh-{n}.flac'
shine=ROOT/'references/audio-stage2/shimmer_1.flac'

# A/B/C compare different original recordings, not merely three gain settings.
plans={
 'cliff.warning':dict(title='悬崖 · 大地裂动',volume=.30,seconds=1.10,choices=[
   ('岩层低鸣＋石裂',[layer(rock02,1.10,start=2.8,speed=.82,lowpass=950),layer(crack,.35,delay=.14,gain=.28,speed=.85,lowpass=2200)],'岩层纹理为主，低通与轻降速强化重量；短裂纹交代危险来源。'),
   ('短低鸣',[layer(rumble,.85,speed=.84,lowpass=800),layer(crack,.35,delay=.25,gain=.25)],'低频充分，但原件有爆炸语义，作为对照。'),
   ('岩石连续摩擦',[layer(rock24,1.10,start=1.7,speed=.92,lowpass=1400)],'石材更明显，但颗粒较多，预警主体不如 A 稳定。')]),
 'cliff.fall':dict(title='悬崖 · 巨石坠落',volume=.34,seconds=.62,choices=[
   ('重石掠过＋撞击',[layer(swish('26'),.34,speed=.72,lowpass=2600),layer(rock09,.30,delay=.30,start=.30,speed=.84,lowpass=2600)],'空气掠过接一个石撞起音，620ms 在既有650ms坠落阶段内收尾。'),
   ('短风切＋碎石撞击',[layer(swish('04'),.28,speed=.90),layer(crack,.32,delay=.26,speed=.88)],'也含 whoosh 与撞石，但石块质感较轻。'),
   ('风切＋低鸣落地',[layer(swish('30'),.30,speed=.80),layer(rumble,.32,delay=.28,lowpass=1400)],'重量有余，碎石特征较少；不作正式首选。')]),
 'cliff.impact':dict(title='悬崖 · 尘土与碎石',volume=.25,seconds=.48,choices=[
   ('碎石散落＋尘土尾',[layer(crack,.42,speed=1.02,lowpass=4300),layer(rock09,.35,delay=.09,start=.9,gain=.32,lowpass=1400)],'短碎石在前、柔软岩尘尾在后，避免再叠一次重爆炸。'),
   ('岩石颗粒尾',[layer(rock24,.48,start=3.2,lowpass=3200)],'连续石粒版本，作为较粗糙的对照。'),
   ('岩片撞散',[layer(rock02,.48,start=5.4,lowpass=3800)],'石片层次较密，和预警同源感更强。')]),
 'ice.freeze':dict(title='冰川 · 冰晶冻结',volume=.29,seconds=.70,choices=[
   ('冰晶凝结',[layer(ice,.70,lowpass=6200)],'CC0冰系成品，连续细裂纹与晶体尾，冻结声音区别于爆破技能。'),
   ('冷霜骤凝',[layer(cold,.70,lowpass=5800)],'起音更脆、更接近断裂，用作对照。'),
   ('晶片向内汇聚',[layer(shatter('5'),.70,reverse=True,lowpass=6200)],'真实冰碎录音反向处理，凝结方向明确但更偏吸入。')]),
 'ice.break':dict(title='冰川 · 裂纹、爆裂、碎片',volume=.31,seconds=.60,choices=[
   ('细裂→破冰→晶片',[layer(cold,.16,gain=.35,lowpass=4800),layer(shatter(''),.35,delay=.12,gain=1),layer(shatter('4'),.32,delay=.26,start=.28,gain=.40)],'三层原始冰材质：先裂纹，120ms破冰主体，260ms起碎片余声；不使用电子sparkle。'),
   ('厚冰破裂',[layer(cold,.14,gain=.35),layer(shatter('33'),.46,delay=.12,gain=1)],'厚冰主体更长，碎裂密度高。'),
   ('晶片爆裂',[layer(ice,.13,gain=.28),layer(shatter('2'),.30,delay=.11),layer(shatter('5'),.35,delay=.24,start=.35,gain=.4)],'颗粒细亮版本，与 A 的裂纹/主体不同。')]),
 'ruins.activate':dict(title='遗迹 · 石质机关启动',volume=.30,seconds=1.05,choices=[
   ('古石门研动',[layer(door,1.05,start=.10,speed=1.12,lowpass=3300),layer(shine,.40,delay=.23,gain=.10,lowpass=5200)],'石门深沉摩擦为主体，轻量录音微光仅作符文点缀，无马达、金属机器和提示音。'),
   ('石盘短磨动',[layer(grind,.44,speed=.85,lowpass=3300),layer(shine,.45,delay=.14,gain=.10)],'短石磨的推动感较轻；只作为机关材质对照。'),
   ('石材推移',[layer(rock24,.95,start=6.2,speed=.90,lowpass=2800)],'纯岩石移动，缺少 A 的门/祭坛启动层次。')]),
 'furnace.warning':dict(title='熔炉 · 火焰升温',volume=.26,seconds=.55,choices=[
   ('真实火焰渐强',[layer(fire(16),.55,lowpass=3000)],'真实火杖录音主体在约480ms增强，施加渐入表达升温，550ms短尾也适合650ms扩散预告。'),
   ('火风升温',[layer(fire_wind,.55,start=2.55,lowpass=3600)],'设计火风版本，主体更绵长。'),
   ('火焰积聚',[layer(fire_evolve,.55,start=.18,lowpass=3400)],'设计火焰逐渐聚拢，能量密度较高。')]),
 'furnace.spread':dict(title='熔炉 · 火焰扩散',volume=.30,seconds=.66,choices=[
   ('火浪掠过＋余烬',[layer(fire(20),.66,lowpass=4200)],'独立真实火杖掠过录音，快速火浪与燃烧尾区分于升温及爆破技能。'),
   ('短焰喷散',[layer(fire_short,.66,start=.63,lowpass=4600)],'设计火焰喷散更锐利，保留为对照。'),
   ('短火舌',[layer(fire(11),.50,lowpass=4200)],'真实火焰短挥动版本，覆盖范围感较小。')]),
}

def provenance(path):
    if path.is_relative_to(REF):
        name=path.relative_to(REF).as_posix()
        source=next(s for s in catalog if any(f['file']==name for f in s['files']))
        return dict(file=name,sha256=sha(path),author=source['author'],license=source['license'],page=source['page'],licenseUrl=source['licenseUrl'])
    swishes='/swishes/' in path.as_posix()
    return dict(file='../audio-stage2/'+path.relative_to(ROOT/'references/audio-stage2').as_posix(),sha256=sha(path),author='qubodup / Iwan Gabovitch' if swishes else 'The Berklee College of Music',license='CC0-1.0' if swishes else 'CC-BY-3.0',page='https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes' if swishes else 'https://opengameart.org/content/shimmer-glitter-magic',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/' if swishes else 'https://creativecommons.org/licenses/by/3.0/')

parser=argparse.ArgumentParser();parser.add_argument('--adopt',action='store_true');args=parser.parse_args()
if not args.adopt:
    records=[]
    for id,plan in plans.items():
        for letter,(label,layers,reason) in zip('ABC',plan['choices']):
            x=np.zeros(round(plan['seconds']*RATE))
            for l in layers:
                options={k:v for k,v in l.items() if k not in ['path','seconds','delay','gain']}
                y=load(l['path'],l['seconds'],**options)*l['gain'];start=round(l['delay']*RATE)
                n=min(len(y),len(x)-start);x[start:start+n]+=y[:n]
            # Rising energy for heating; no alarm cadence or tonal oscillator.
            if id=='furnace.warning': x*=np.linspace(.12,1,len(x))
            x=fit(x,plan['seconds']);peak=np.max(abs(x));rms=np.sqrt(np.mean(x*x))
            x*=min(.14/rms,.65/peak)
            file=id.replace('.','-')+'-'+letter+'.wav';p=OUT/file;sf.write(p,x,RATE,subtype='PCM_16')
            records.append(dict(id=id,title=plan['title'],candidate=letter,label=label,file=file,volume=plan['volume'],seconds=plan['seconds'],peak=float(np.max(abs(x))),rms=float(np.sqrt(np.mean(x*x))),effectiveRms=float(np.sqrt(np.mean(x*x)))*plan['volume'],sha256=sha(p),reason=reason,sources=[provenance(l['path']) for l in layers],edits=[{k:(v.relative_to(ROOT).as_posix() if k=='path' else v) for k,v in l.items()} for l in layers]))
    (OUT/'candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Prepared 24 candidates in audition directory; game files unchanged.')
else:
    selection=json.loads((REF/'selection.json').read_text(encoding='utf-8'))
    assert not selection.get('pendingReplacement'), 'User must choose pending cliff replacements before bulk adoption'
    records=json.loads((OUT/'candidates.json').read_text(encoding='utf-8'))
    adopted=[]
    for choice in selection['choices']:
        reviewRecords=json.loads((ROOT/choice['review']).read_text(encoding='utf-8')) if choice.get('review') else records
        a=next(r for r in reviewRecords if r['id']==choice['id'] and r['candidate']==choice['candidate'])
        p=(ROOT/choice['review']).parent/a['file'] if choice.get('review') else OUT/a['file']
        assert sha(p)==choice['sha256']==a['sha256']
        folder,name=a['id'].split('.');file=choice.get('targetFile',f'maps/{folder}/{folder}-{name}-v1.wav')
        target=ROOT/'dist/assets/audio'/file;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
        adopted.append(dict(a,file=file,auditionFile=a['file'],selectedBy=choice.get('approvedBy','agent'),selectionBasis=choice['reason']))
    (REF/'derivatives.json').write_text(json.dumps(adopted,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Adopted exact locked candidates:',len(adopted))
