from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter,sosfilt
root=Path(__file__).resolve().parents[1]/'references/audio-cards-r1'
for slug,pattern,window,hp,lp in [
 ('fire-crackling','fire-1.wav',.56,220,4800),('ice-spells','ice.wav',.56,180,5800),
 ('ice-spells','coldsnap.wav',.56,180,5800),('bell-dingschimes','bell_ding1.wav',.64,120,5600),
 ('fire-staff-sound-effects','LEGIT_FIR_Fire_Staff 11-Audio.wav',.62,160,4700),
 ('torch-fire-spell','Waving Torch.wav',.66,180,4200)]:
 p=next((root/slug).rglob(pattern));x,r=sf.read(p,always_2d=True);x=x.mean(axis=1);x-=x.mean()
 x=sosfilt(butter(2,hp,fs=r,btype='highpass',output='sos'),x);x=sosfilt(butter(2,lp,fs=r,output='sos'),x)
 options=[]
 for start in np.arange(0,len(x)/r-window,.05):
  y=x[round(start*r):round((start+window)*r)].copy();a=int(r*.008);n=int(r*.08);y[:a]*=np.linspace(0,1,a);y[-n:]*=np.linspace(1,0,n)
  rms=np.sqrt(np.mean(y*y));peak=max(abs(y));options.append((round(start,3),round(float(rms),4),round(float(peak/rms),2)))
 # Strong material windows and moderate crests; print options rather than silently auto-selecting.
 options=sorted(options,key=lambda q:q[1],reverse=True)
 print(pattern,'strong windows',options[:8],'moderate crest',sorted(options[:max(10,len(options)//2)],key=lambda q:q[2])[:6])
