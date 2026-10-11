"""Prepare multiple audition candidates. --adopt copies reviewed picks verbatim.

Music is a project-original score rendered from CC0 acoustic recordings, not a
downloaded song. No runtime synthesis or processing of gameplay recordings.
"""
from pathlib import Path
import argparse,json,hashlib,shutil
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfilt,resample_poly
ROOT=Path(__file__).resolve().parents[1];REF=ROOT/'references/audio-stage4'
OUT=ROOT/'validation/2026-10-11/audio-stage4';RATE=44100
(OUT/'clips').mkdir(parents=True,exist_ok=True)
records=[];score=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def read(p,limit=None,low=6000):
    x,r=sf.read(p,always_2d=True);x=x.mean(axis=1);x-=x.mean()
    if r!=RATE:x=resample_poly(x,RATE,r)
    active=np.flatnonzero(abs(x)>max(abs(x))*.012)
    x=x[max(0,active[0]-130):]
    if limit:x=x[:round(limit*RATE)]
    x=sosfilt(butter(2,low,fs=RATE,output='sos'),x)
    x/=max(abs(x));a=min(180,len(x));x[:a]*=np.linspace(0,1,a)
    n=min(round(.045*RATE),len(x));x[-n:]*=np.linspace(1,0,n)
    return x
def locate(pack,name):return next((REF/pack).rglob(name))
samples={name:read(REF/(name+'.wav'),limit,low) for name,limit,low in [('marimba-c4',1.6,5200),('harp-c3',2,4400),('harp-c5',1.5,4800),('conga',.16,2400),('tamb',.12,4200),('snare-tap',.14,3000)]}
def pitched(sample,base,note,duration=None):
    x=np.interp(np.arange(0,len(sample)-1,2**((note-base)/12)),np.arange(len(sample)),sample)
    if duration:
        x=x[:round(duration*RATE)];n=min(len(x),round(.05*RATE));x[-n:]*=np.linspace(1,0,n)
    return x
def add(buf,x,seconds,gain,pan=0,wrap=False):
    start=round(seconds*RATE);y=x[:,None]*np.array([1-pan*.35,1+pan*.35])[None,:]*gain
    if wrap:
        a=np.arange(start,start+len(x))%len(buf);np.add.at(buf,a,y)
    else:
        n=min(len(x),len(buf)-start)
        if n>0:buf[start:start+n]+=y[:n]
def save(id,key,label,x,volume,sources,reason,bpm=None):
    x-=x.mean(axis=0);rms=float(np.sqrt(np.mean(x*x)));x*=min(.105/rms,.48/np.max(abs(x))) if bpm else min(.19/rms,.68/np.max(abs(x)))
    ext='ogg' if bpm else 'wav';file=f'clips/{id.replace(".","-")}-{key}.{ext}';p=OUT/file
    # libsndfile on Windows needs bounded Vorbis input blocks (long single
    # writes can exceed the native stack).
    with sf.SoundFile(p,'w',samplerate=RATE,channels=2,format='OGG' if bpm else 'WAV',subtype='VORBIS' if bpm else 'PCM_16') as f:
        for start in range(0,len(x),8192):f.write(x[start:start+8192])
    y,r=sf.read(p,always_2d=True)
    records.append(dict(id=id,key=key,label=label,file=file,seconds=round(len(y)/r,4),bpm=bpm,volume=volume,loop=bool(bpm),sourceFiles=sources,license='Project-original arrangement; samples CC0-1.0' if bpm else 'CC0-1.0',reason=reason,peak=float(np.max(abs(y))),rms=float(np.sqrt(np.mean(y*y))),boundaryJump=float(np.max(abs(y[-1]-y[0]))),sha256=sha(p)))
def music(kind,key,bpm,version):
    beat=60/bpm;buf=np.zeros((round(64*4*beat*RATE),2),dtype=np.float32)
    chords=[(48,[60,64,67]),(45,[57,60,64]),(53,[60,65,69]),(43,[59,62,67])]
    motif=[[0,1,2,1],[2,1,0,1],[0,2,1,2],[1,0,2,1]]
    for bar in range(64):
        section=bar//16;root,notes=chords[(bar//2)%4];pos=bar*4
        # Four 16-bar sections: theme, response, sparse bridge, varied return.
        density=section!=2 or bar%2==0
        for off,pitch,gain in [(0,root,.24),(2,root+7,.15)]:
            add(buf,pitched(samples['harp-c3'],48,pitch,.8),(pos+off)*beat,gain,-.15,True)
        offs=[.5,2.5] if kind=='lobby' else [.5,1.5,2.5,3.5]
        if version==2:offs=offs[:2]
        for off in offs:
            for note in notes[:2]:add(buf,pitched(samples['harp-c5'],72,note,.45),(pos+off)*beat,.065 if kind=='lobby' else .09,.5,True)
        if density:
            steps=[0,1.5,2.5] if kind=='lobby' else [0,.75,1.5,2.5,3.25]
            if bar%4==3:steps=steps[:2]  # breathing room at phrase endings
            if version==1:steps=[s+.25 for s in steps]
            if version==2:steps=steps[:2]
            for j,off in enumerate(steps):
                pitch=notes[motif[bar%4][j%4]]+(12 if section==1 and bar%4==1 else 0)
                sample=samples['harp-c5'] if version==1 else samples['marimba-c4']
                base=72 if version==1 else 60
                add(buf,pitched(sample,base,pitch,.65),(pos+off)*beat,.21 if kind=='lobby' else .18,-.4,True)
                score.append(dict(track=kind+'-'+key,bar=bar,beat=off,note=pitch))
        for off in ([1,3] if kind=='lobby' else [0,1.5,2,3.5]):
            add(buf,samples['conga'],(pos+off)*beat,.042 if kind=='lobby' else .075,0,True)
        if kind=='battle':
            for off in np.arange(.5,4,1 if version==2 else .5):add(buf,samples['tamb'],(pos+off)*beat,.026,.25,True)
            for off in [1,3]:add(buf,samples['snare-tap'],(pos+off)*beat,.034,0,True)
    labels=['木琴积木小径','拨弦森林散步','留白午后'] if kind=='lobby' else ['木琴派对接力','拨弦跳跃赛','轻打击练习赛']
    reasons=['主旋律有短小动机，木质音色与积木一致；四段结构有留白','拨弦主音与和弦较接近，轮廓弱于A','更稀疏，但对战推进与大厅记忆点偏弱']
    source_paths=[*REF.glob('harp-*.wav'),REF/'conga.wav']
    if version!=1:source_paths.append(REF/'marimba-c4.wav')
    if kind=='battle':source_paths.extend([REF/'tamb.wav',REF/'snare-tap.wav'])
    save('bgm.'+kind,key,labels[version],buf,.30 if kind=='lobby' else .28,[p.relative_to(ROOT).as_posix() for p in source_paths],reasons[version],bpm)
for kind,bpms in [('lobby',[100,96,108]),('battle',[128,132,124])]:
    for i,key in enumerate('ABC'):music(kind,key,bpms[i],i)
def effect(id,key,label,seconds,layers,sources,reason,volume):
    buf=np.zeros((round(seconds*RATE),2))
    for x,start,gain in layers:add(buf,x,start,gain)
    n=round(.015*RATE);buf[-n:]*=np.linspace(1,0,n)[:,None]
    save(id,key,label,buf,volume,sources,reason)
pop=ROOT/'references/audio-stage2/p_2.ogg';bubble=read(pop,.10,4500)
for key,label,name in [('A','柔软泡泡点按',None),('B','轻木质点按','click_001.ogg'),('C','圆润按钮点按','click_003.ogg')]:
    p=pop if name is None else locate('interface-sounds',name)
    effect('ui.click',key,label,.09 if key=='A' else .12,[(read(p,.12,3800),0,1)],[str(p.relative_to(ROOT))],'A短促柔和，沿用泡泡家族；B/C保留候选对比',.38)
for key,notes,label in [('A',[60,64,67],'木琴短句确认'),('B',[60,67,72],'上扬三音确认'),('C',[64,67],'简短拨弦确认')]:
    effect('ui.confirm',key,label,.32,[(pitched(samples['marimba-c4' if key!='C' else 'harp-c5'],60 if key!='C' else 72,n,.28),j*.06,1) for j,n in enumerate(notes)],['references/audio-stage4/'+('marimba-c4.wav' if key!='C' else 'harp-c5.wav')],'A上扬大三和弦，较click明显但短于揭晓；B跨度更大；C轮廓较弱',.46)
for key,name,label in [('A','card-shuffle.ogg','真实纸牌洗动'),('B','card-fan-1.ogg','纸牌展扇'),('C','card-shove-2.ogg','纸牌轻推')]:
    p=locate('casino-audio',name)
    effect('map.shuffle',key,label,.42,[(read(p,.42,5200),0,1)],[p.relative_to(ROOT).as_posix()],'B纸牌展扇摩擦更均匀，420ms内可辨；录音RMS高于A/C，低增益下仍清楚' if key=='B' else '保留对比：动作较稀疏，剪辑后平均响度弱于B',.36)
for key,notes,label in [('A',[60,64,67,72],'木琴与拨弦揭晓'),('B',[60,62,67,72],'悬念展开'),('C',[67,72,76],'高位奖励闪光')]:
    layers=[(pitched(samples['marimba-c4'],60,n,.52),j*.07,1) for j,n in enumerate(notes)]
    layers.append((pitched(samples['harp-c5'],72,72,.4),.23,.3))
    effect('map.reveal',key,label,.66,layers,['references/audio-stage4/marimba-c4.wav','references/audio-stage4/harp-c5.wav'],'A大三和弦有清楚落点，低于高位C，B悬念较长',.50)
(OUT/'candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(REF/'score.json').write_text(json.dumps(dict(author='方块乱斗项目原创编排',form='64 bars; four 16-bar sections; C/Am/F/G; acoustic samples',notes=score),ensure_ascii=False),encoding='utf-8')
if argparse.ArgumentParser().parse_known_args()[1]==['--adopt']:
    selections=[]
    for r in records:
        if r['key']!=('B' if r['id']=='map.shuffle' else 'A'):continue
        folder='bgm/'+r['id'].split('.')[1] if r['loop'] else 'ui';suffix='ogg' if r['loop'] else 'wav'
        target=ROOT/'dist/assets/audio'/folder/(r['id'].replace('.','-')+'-v1.'+suffix);target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(OUT/r['file'],target);selections.append({**r,'formalFile':target.relative_to(ROOT/'dist').as_posix()})
    (REF/'selection.json').write_text(json.dumps(selections,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(records),'candidates')
