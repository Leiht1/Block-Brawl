"""Reproducible, audition-only edits. Requires numpy/scipy/soundfile in a support runtime."""
from pathlib import Path
import hashlib, json, math
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'references/audio-cards-r1'
OUT=ROOT/'validation/2026-10-13/card-audio-r1'
(OUT/'clips').mkdir(parents=True,exist_ok=True)
RATE=44100
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sources=json.loads((REF/'sources.json').read_text(encoding='utf-8'))

def find(slug,pattern):
    paths=[p for p in (REF/slug).rglob(pattern) if not p.name.startswith('._')]
    assert len(paths)==1,(slug,pattern,paths)
    return paths[0]

def plan(letter,label,slug,pattern,seconds,start=0,hp=100,lp=6500,reverse=False,attack=.006,release=.07,extra=None):
    return dict(letter=letter,label=label,slug=slug,pattern=pattern,seconds=seconds,start=start,hp=hp,lp=lp,reverse=reverse,attack=attack,release=release,extra=extra)

groups=[
 dict(id='cast.release',name='卡牌释放',kind='通用施法',volume=.30,difference='A 短旋律魔力；B 单根暖拨弦；C 反向柔铃聚拢。',timing='出牌已提交时 0ms；不为声音等待聚光。',plans=[
  plan('A','短旋律魔力','magic-spell-sfx','magical_6_0.ogg',.26,lp=5200),
  plan('B','暖拨弦启动','vsco-harp','KSHarp_A4_mf.wav',.30,lp=6200),
  plan('C','柔铃聚拢','pleasing-bell-sound-effect','pleasing-bell.wav',.24,reverse=True,attack=.025,release=.03)]),
 dict(id='cast.travel',name='光团飞行',kind='通用施法',volume=.24,difference='A 竹杖风切的细颗粒；B 连续自然风的柔面；C 近场旋动空气。均不拉伸原件。',timing='180ms 启动，380ms 飞行窗口，560ms 到达。',plans=[
  plan('A','细竹风切','swish-bamboo-stick-weapon-swhoshes','swosh-03.flac',.38,hp=180,lp=5600),
  plan('B','柔面风流','short-wind-sound','short wind sound.wav',.38,start=1.1,hp=220,lp=4800,attack=.025),
  plan('C','近场旋动','air-whoosh','whoosh2_0.wav',.38,start=.55,hp=220,lp=5800,attack=.018)]),
 dict(id='cast.impact',name='光团命中',kind='通用施法',volume=.34,difference='A 单颗清晶铃；B 圆润颤音琴铃；C 细密魔法微光。',timing='光团实际到达时，本次静态模拟为560ms；无真实目标不应伪造命中。',plans=[
  plan('A','单颗清晶铃','bell-dingschimes','bell_ding2.wav',.38,start=.035,lp=6000),
  plan('B','圆润软铃','pleasing-bell-sound-effect','pleasing-bell.wav',.36,lp=5800),
  plan('C','细密微光','shimmer-glitter-magic','shimmer_1.flac',.40,lp=6000)]),
 dict(id='skill.fire',name='火焰冲击',kind='技能本体',volume=.38,difference='A 火杖短挥的流动火浪；B 火炬掠过的粗细变化；C 壁炉细爆裂的余烬颗粒。',timing='fire-start 时播放：安定棋盘最早640ms；首格约700ms，末格约1144ms。棋盘忙碌或冻结时启动会后移。',plans=[
  plan('A','短挥火浪','fire-staff-sound-effects','LEGIT_FIR_Fire_Staff 11-Audio.wav',.62,hp=160,lp=4700),
  plan('B','火炬掠过','torch-fire-spell','Waving Torch.wav',.66,hp=180,lp=4200),
  plan('C','轻碎余烬','fire-crackling','fire-1.wav',.48,start=1.9,hp=220,lp=4000,attack=.018)]),
 dict(id='skill.freeze',name='时间冻结',kind='技能本体',volume=.38,difference='A 细霜裂纹；B 真实冰片向内凝聚；C 短晶体共鸣停驻。C 是铃的冻结隐喻，冰材质辨识交由试听。',timing='cast 提交时立即冻结3秒：真实时序0ms播一次，持续期间安静；画面冰封本体约640ms出现。',plans=[
  plan('A','细霜骤凝','ice-spells','ice.wav',.56,hp=180,lp=5800),
  plan('B','冰片凝聚','ice-breakingshattering','LedasLuzta5.ogg',.60,reverse=True,hp=220,lp=5000,attack=.02),
  plan('C','晶鸣停驻','bell-dingschimes','bell_ding4.wav',.58,hp=280,lp=5600,release=.12)]),
 dict(id='skill.blackhole',name='黑洞吸引',kind='技能本体',volume=.38,difference='A 连续风面收缩；B 竹杖空气反卷；C 近场气流漩涡。无持续低频、无长循环。',timing='真实 card-change 开始420ms方块牵引；空闲棋盘可在0ms生效，忙碌或冻结时等真实事件。视觉本体不早于640ms。',plans=[
  plan('A','柔面收缩','wind-whoosh-loop','wind woosh loop.ogg',.56,start=.4,hp=260,lp=3900,attack=.10),
  plan('B','空气反卷','swish-bamboo-stick-weapon-swhoshes','swosh-28.flac',.62,reverse=True,hp=220,lp=4800,attack=.045),
  plan('C','近场漩涡','air-whoosh','whoosh2_0.wav',.58,start=1.8,hp=280,lp=4300,attack=.06)]),
 dict(id='skill.luck',name='幸运星',kind='技能本体',volume=.38,difference='A 温暖单铃，反馈最集中；B 三个真实竖琴采样的小型和弦，拨弦更明显；C 微光泛音更细密。',timing='cast时激活10秒、22%特殊补充概率；只在激活时响一次，不每次补充方块再响。',plans=[
  plan('A','暖星单铃','bell-dingschimes','bell_ding1.wav',.64,start=.07,hp=120,lp=5600,release=.13),
  plan('B','竖琴祝福','vsco-harp','KSHarp_C5_mf.wav',.72,lp=6000,release=.15,extra=[('KSHarp_E5_mf.wav',.075,.55),('KSHarp_G5_mf.wav',.15,.42)]),
  plan('C','微光祝福','shimmer-glitter-magic','shimmer_1.flac',.62,lp=5600,release=.10)])
]

def read(path):
    x,rate=sf.read(path,always_2d=True); x=x.mean(axis=1)
    assert np.isfinite(x).all()
    if rate!=RATE:
        g=math.gcd(rate,RATE);x=resample_poly(x,RATE//g,rate//g)
    x-=x.mean()
    active=np.flatnonzero(abs(x)>max(abs(x))*.02)
    onset=max(0,int(active[0])-round(.003*RATE))
    return x,onset,sf.info(path)

def cut(path,p):
    x,onset,info=read(path)
    start=onset+round(p['start']*RATE); n=round(p['seconds']*RATE)
    x=x[start:start+n]
    assert len(x)>RATE*.1,(path,'too short')
    if p['reverse']: x=x[::-1].copy()
    # No lengthening or silence padding; keep the measured actual clip duration.
    if p['hp']: x=sosfilt(butter(2,p['hp'],fs=RATE,btype='highpass',output='sos'),x)
    if p['lp']: x=sosfilt(butter(2,p['lp'],fs=RATE,btype='lowpass',output='sos'),x)
    a=min(len(x),round(p['attack']*RATE)); r=min(len(x),round(p['release']*RATE))
    x[:a]*=np.linspace(0,1,a); x[-r:]*=np.linspace(1,0,r)
    return x,dict(originalSeconds=info.duration,originalSampleRate=info.samplerate,originalSubtype=info.subtype,
        cropStartSeconds=start/RATE,cropEndSeconds=(start+len(x))/RATE,reverse=p['reverse'],highpassHz=p['hp'],lowpassHz=p['lp'],attackMs=p['attack']*1000,releaseMs=p['release']*1000)

def short_rms(x):
    n=min(len(x),round(.05*RATE));s=np.concatenate(([0.],np.cumsum(x*x)))
    return float(np.sqrt(np.max((s[n:]-s[:-n])/n)))

candidates=[]
for group in groups:
    prepared=[]
    for p in group['plans']:
        path=find(p['slug'],p['pattern']);x,edit=cut(path,p);parts=[(path,edit,0,1)]
        if p['extra']:
            # At most three real notes of one instrument, mixed offline into one voice.
            for pattern,delay,gain in p['extra']:
                ep=find(p['slug'],pattern);q={**p,'seconds':p['seconds']-delay,'extra':None};y,record=cut(ep,q)
                offset=round(delay*RATE);n=min(len(y),len(x)-offset);x[offset:offset+n]+=gain*y[:n]
                parts.append((ep,record,delay,gain))
            r=round(p['release']*RATE);x[-r:]*=np.linspace(1,0,r)
        prepared.append((p,x,parts))
    # Short effects have very different decay lengths. Match their strongest 50ms
    # window, not whole-file RMS (which would over-amplify an isolated ice crack).
    target=min(.16,*[.58*short_rms(x)/max(abs(x)) for _,x,_ in prepared])
    for p,x,parts in prepared:
        gain=target/short_rms(x);x*=gain
        name=group['id'].replace('.','-')+'-'+p['letter'].lower()+'-v1-preview.wav'
        dest=OUT/'clips'/name;sf.write(dest,x,RATE,subtype='PCM_16');y,_=sf.read(dest)
        records=[]
        for path,edit,delay,mixGain in parts:
            s=next(s for s in sources if any(f['file']==path.relative_to(REF).as_posix() for f in s['files']))
            d=next((d for d in s['downloads'] if d['file']==path.relative_to(REF).as_posix()),s['downloads'][0])
            direct=d['file']==path.relative_to(REF).as_posix()
            records.append(dict(source=s['slug'],originalFile=path.relative_to(REF).as_posix(),originalFilename=d.get('originalFilename',path.name) if direct else path.name,
                originalSha256=sha(path),page=s['page'],author=s['author'],license=s['license'],licenseUrl=s['licenseUrl'],obligations=s['obligations'],attributionRequired=s['attributionRequired'],
                download=d['url'],archive=d['file'] if not direct else None,archiveSha256=d['sha256'] if not direct else None,
                evidence=s['evidence'],evidenceSha256=s['evidenceSha256'],licenseEvidence=s.get('licenseEvidence'),licenseEvidenceSha256=s.get('licenseEvidenceSha256'),
                edit={**edit,'mixDelaySeconds':delay,'mixGain':mixGain}))
        candidate=dict(id=group['id']+'.'+p['letter'].lower(),group=group['id'],letter=p['letter'],label=p['label'],clip='clips/'+name,status='preview',selected=False,implemented=False,
            seconds=len(y)/RATE,sampleRate=RATE,channels=1,subtype='PCM_16',sha256=sha(dest),peak=float(max(abs(y))),rms=float(np.sqrt(np.mean(y*y))),
            groupShortRmsTarget=float(target),shortRms50ms=short_rms(y),normalizationGain=float(gain),auditionVolume=group['volume'],sources=records,
            processing='单声道、去直流、抗混叠重采样至44.1kHz；按记录剪辑及二阶高/低通；淡入淡出；组内匹配最强50ms窗RMS与播放倍率，峰值上限0.58；无压缩、变速、变调、额外混响。'+('三颗真实竖琴音符离线混成单条；非跨来源堆叠。' if p['extra'] else '单一原始录音，不叠层。'))
        candidates.append(candidate)
manifest=dict(status='Awaiting user listening confirmation; audition only',createdOn='2026-10-13',selected=None,groups=[{k:v for k,v in g.items() if k!='plans'} for g in groups],candidates=candidates,
    reserved=['skill.quake','skill.meteor','skill.bomb','skill.storm','skill.fog','skill.overload','skill.sage','skill.rainbow'],optional='state.dissipate',
    limits='Material/provenance and signal screening are internal checks, not a human listening verdict. No official candidate chosen.')
(OUT/'candidate-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(REF/'candidate-provenance.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# 卡牌音效 R1 来源与处理记录','','状态：21条审核候选，未确认、未接入。每组A/B/C同播放倍率、最强50ms窗RMS匹配。短音不以长静音/衰减尾拉高整段RMS；保留自然瞬态差异，客观校准不等于主观等响。增益为当前正式普通消除0.46之下的层级起点。','',
 '原附件完整保存于 references/audio-cards-r1/；原本为OGG的文件保留为有损原件，试听导出PCM WAV并不使它变成无损源。','',
 'CC0无需强制署名。CC BY 3.0候选必须保留作者、原始页面、许可证链接及修改说明；交付页已附齐。幸运星B仅使用真实竖琴采样，同来源三音离线混为一条。','']
for g in manifest['groups']:
    lines+=['## '+g['name']+' · '+g['id'],'',g['difference'],'',g['timing'],'']
    for c in [c for c in candidates if c['group']==g['id']]:
        lines+=['### '+c['letter']+' · '+c['label'],'',f"候选 `{c['clip']}`，实际 {c['seconds']:.6f} 秒，播放倍率 {c['auditionVolume']}，RMS {c['rms']:.6f}，最强50ms窗RMS {c['shortRms50ms']:.6f}，峰值 {c['peak']:.6f}。",'',c['processing'],'']
        for s in c['sources']:
            lines+=[f"- 原件：`{s['originalFilename']}`；保存路径 `{s['originalFile']}`；原时长 {s['edit']['originalSeconds']:.6f} 秒。",
                    f"- 作者：{s['author']}；[来源]({s['page']})；[原始下载]({s['download']})。",
                    f"- [许可 {s['license']}]({s['licenseUrl']})；{s['obligations']}",
                    '- 精确处理：`'+json.dumps(s['edit'],ensure_ascii=False)+'`。',f"- 原件 SHA-256：`{s['originalSha256']}`；授权证据 `{s['evidence']}`。",'']
        lines+=[f"输出 SHA-256：`{c['sha256']}`；统一响度线性增益 {c['normalizationGain']:.6f}。",'']
(OUT/'CREDITS.md').write_text('\n'.join(lines),encoding='utf-8')
print('21 preview clips and complete provenance prepared; no runtime changes.')
