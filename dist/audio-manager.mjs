import {AUDIO_MANIFEST,canonicalAudioId} from './audio-manifest.mjs';

const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
const localSource=src=>typeof src==='string'&&/^\.\/assets\/audio\/(?:ui|block|combo|special|result|bgm\/(?:lobby|battle)|maps\/(?:cliff|ice|ruins|furnace))\/[a-zA-Z0-9_-]+\.(?:ogg|mp3|wav|m4a|webm)$/.test(src);
const isDevelopment=()=>['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);

// Presentation only: play is synchronous, never awaited by gameplay, and fails closed.
export class AudioManager {
  constructor({manifest=AUDIO_MANIFEST,soundEnabled=true,bgmEnabled=true,masterVolume=1,maxConcurrent=8,maxPerChannel=3,maxEnvironmentConcurrent=2,development=isDevelopment(),logger=console.debug,now=()=>globalThis.performance?.now()??Date.now(),createAudio=src=>new globalThis.Audio(src),createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),fetchAudio=url=>globalThis.fetch(url)}={}){
    this.resources=new Map();this.active=new Set();this.lastPlayed=new Map();this.notices=new Set();
    this.channels={ui:1,effect:1,environment:1,bgm:1};this.enabled=!!soundEnabled;this.volume=clamp(masterVolume);
    this.musicEnabled=!!bgmEnabled;this.musicTarget=null;this.musicVoices=new Set();this.musicBuffers=new Map();this.musicSerial=0;this.unlocked=false;this.suspended=false;
    this.createContext=createContext;this.fetchAudio=fetchAudio;this.context=null;this.musicBus=null;
    this.maxConcurrent=Math.max(1,Math.floor(maxConcurrent)||8);this.maxPerChannel=Math.max(1,Math.floor(maxPerChannel)||3);
    this.maxEnvironmentConcurrent=Math.max(1,Math.floor(maxEnvironmentConcurrent)||2);
    this.development=development;this.logger=logger;this.now=now;this.createAudio=createAudio;
    this.registerManifest(manifest);
  }
  get soundEnabled(){return this.enabled;}
  set soundEnabled(value){this.setSoundEnabled(value);}
  get masterVolume(){return this.volume;}
  set masterVolume(value){this.setMasterVolume(value);}
  get uiVolume(){return this.channels.ui;}
  set uiVolume(value){this.setChannelVolume('ui',value);}
  get effectVolume(){return this.channels.effect;}
  set effectVolume(value){this.setChannelVolume('effect',value);}
  get environmentVolume(){return this.channels.environment;}
  set environmentVolume(value){this.setChannelVolume('environment',value);}
  get bgmEnabled(){return this.musicEnabled;}
  set bgmEnabled(value){this.setBgmEnabled(value);}
  get bgmVolume(){return this.channels.bgm;}
  set bgmVolume(value){this.setChannelVolume('bgm',value);}
  setSoundEnabled(value){this.enabled=!!value;if(!this.enabled)this.stopEffects();return this.enabled;}
  setMasterVolume(value){this.volume=clamp(value);this.updateVolumes();return this.volume;}
  setChannelVolume(channel,value){
    if(!(channel in this.channels))return false;this.channels[channel]=clamp(value);
    if(this.channels[channel]===0)for(const voice of [...this.active])if(voice.entry.channel===channel)voice.finish();
    this.updateVolumes();return true;
  }
  registerManifest(manifest){for(const [id,entry] of Object.entries(manifest))this.register(id,entry);}
  register(id,entry){
    id=canonicalAudioId(id);
    if(!this.validEntry(entry)){this.notice(id,'invalid','资源配置无效，已静默跳过');return false;}
    const variants=entry.variants?Object.freeze(Object.fromEntries(Object.entries(entry.variants).map(([key,value])=>[key,Object.freeze({...value})]))):undefined;
    this.resources.set(id,Object.freeze({volume:1,cooldownMs:100,maxDurationMs:8000,...entry,...(variants?{variants}:{})}));
    this.notices.delete(`${id}:missing`);return true;
  }
  validEntry(entry){return entry&&Object.hasOwn(this.channels,entry.channel)&&(entry.src===null||localSource(entry.src))&&['volume','cooldownMs','maxDurationMs'].every(k=>entry[k]===undefined||Number.isFinite(entry[k])&&entry[k]>=0)&&(!('maxDurationMs' in entry)||entry.maxDurationMs>0)&&
    (entry.loop===undefined||typeof entry.loop==='boolean')&&(entry.type===undefined||['bgm','sfx'].includes(entry.type))&&
    (entry.voiceLimit===undefined||Number.isInteger(entry.voiceLimit)&&entry.voiceLimit>0)&&
    (entry.variants===undefined||entry.variants!==null&&typeof entry.variants==='object'&&!Array.isArray(entry.variants)&&Object.entries(entry.variants).every(([key,v])=>/^[a-z0-9_-]+$/i.test(key)&&v&&localSource(v.src)&&(v.volume===undefined||Number.isFinite(v.volume)&&v.volume>=0)&&Object.keys(v).every(k=>['src','volume'].includes(k))));}
  notice(id,reason,message){
    if(!this.development||this.notices.has(`${id}:${reason}`))return;
    this.notices.add(`${id}:${reason}`);try{this.logger(`[AudioManager] ${id}: ${message}`);}catch{}
  }
  gain(voice){
    // Core clear/chain/skill recordings take audible priority over map material.
    const duck=voice.entry.channel==='environment'&&[...this.active].some(v=>v.entry.channel==='effect'&&['match','special'].includes(v.group))?0.50:1;
    return clamp(this.volume*this.channels[voice.entry.channel]*clamp(voice.entry.volume)*duck);
  }
  updateVolumes(){for(const voice of this.active)try{voice.node.volume=this.gain(voice);}catch{voice.finish();}this.updateMusicGain();}
  musicDuck(){
    const voices=[...this.active],core=voices.some(v=>v.entry.channel==='effect'&&['match','special'].includes(v.group)),environment=voices.some(v=>v.entry.channel==='environment');
    // Ordinary feedback makes room gently, so repeated clears keep the music
    // present. Quiet ice/dust recordings get a brief, stronger local reduction.
    const quiet=voices.some(v=>v.id==='ice.freeze')?.18:voices.some(v=>v.id==='cliff.impact')?.24:voices.some(v=>v.id==='ice.break')?.30:1;
    return Math.min(core?.65:1,environment?.60:1,quiet,voices.some(v=>['countdown','map-selection'].includes(v.group))?.50:1,voices.some(v=>v.entry.channel==='ui')?.75:1);
  }
  updateMusicGain(){
    if(!this.musicBus)return;
    const at=this.context.currentTime,p=this.musicBus.gain,target=this.volume*this.channels.bgm*this.musicDuck();
    // A short release smooths gain recovery without changing any game clock.
    p.cancelScheduledValues(at);p.setTargetAtTime(target,at,target<p.value?.025:.16);
  }
  unlock(){
    this.unlocked=true;
    try{
      if(!this.context){this.context=this.createContext();this.musicBus=this.context.createGain();this.musicBus.connect(this.context.destination);this.updateMusicGain();}
      if(!this.suspended)Promise.resolve(this.context.resume()).then(()=>this.startMusic()).catch(()=>this.notice('bgm','blocked','音乐等待下一次用户操作'));
    }catch{this.notice('bgm','unavailable','音乐设备不可用，游戏继续运行');}
  }
  setSuspended(value){
    this.suspended=!!value;
    if(value){this.stopEffects();try{Promise.resolve(this.context?.suspend()).catch(()=>{});}catch{}}
    else if(this.unlocked)this.unlock();
  }
  setBgmEnabled(value){
    this.musicEnabled=!!value;this.musicSerial++;
    if(!this.musicEnabled)this.fadeMusicOut();else if(this.unlocked)this.unlock();
    return this.musicEnabled;
  }
  setBgm(requestedId,{fadeMs=900}={}){
    const id=requestedId===null?null:canonicalAudioId(requestedId),entry=this.resources.get(id);
    if(id!==null&&(!entry?.src||entry.channel!=='bgm'||!entry.loop))return false;
    if(id===this.musicTarget)return true;
    this.musicTarget=id;this.musicFadeMs=Math.max(0,Number.isFinite(fadeMs)?fadeMs:900);this.musicSerial++;
    if(id===null)this.fadeMusicOut();else this.startMusic();
    return true;
  }
  async musicBuffer(id){
    if(!this.musicBuffers.has(id)){
      const entry=this.resources.get(id);
      // Cached failed requests stay silent; no per-frame network retry loop.
      this.musicBuffers.set(id,Promise.resolve().then(async()=>{
        const response=await this.fetchAudio(new URL(entry.src,import.meta.url).href);
        if(!response.ok)throw Error('music fetch');
        return await this.context.decodeAudioData(await response.arrayBuffer());
      }).catch(()=>{this.notice(id,'unavailable','音乐文件不可用，游戏继续运行');return null;}));
    }
    return this.musicBuffers.get(id);
  }
  async startMusic(){
    const id=this.musicTarget,serial=this.musicSerial;
    if(!id||!this.unlocked||!this.musicEnabled||this.suspended||!this.context||this.context.state!=='running')return;
    if([...this.musicVoices].some(v=>v.id===id&&!v.retiring))return;
    const buffer=await this.musicBuffer(id);
    if(!buffer||serial!==this.musicSerial||id!==this.musicTarget||!this.musicEnabled||this.suspended||this.context.state!=='running')return;
    // Concurrent unlock/decode resolutions may converge on the same track.
    if([...this.musicVoices].some(v=>v.id===id&&!v.retiring))return;
    let voice;
    try{
      const source=this.context.createBufferSource(),gain=this.context.createGain(),entry=this.resources.get(id),at=this.context.currentTime,duration=(this.musicFadeMs??900)/1000;
      source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=buffer.duration;source.connect(gain);gain.connect(this.musicBus);
      voice={id,source,gain,retiring:false,finish:()=>{if(!this.musicVoices.delete(voice))return;clearTimeout(voice.timer);try{source.onended=null;source.stop();source.disconnect();gain.disconnect();}catch{}}};
      // Rapid scene changes retain at most the current and incoming music.
      for(const old of [...this.musicVoices])if(old.retiring)old.finish();
      this.fadeMusicOut(duration*1000);this.musicVoices.add(voice);source.onended=voice.finish;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(clamp(entry.volume),at+duration);source.start();
    }catch{voice?.finish();this.notice(id,'unavailable','音乐播放失败，游戏继续运行');}
  }
  fadeMusicOut(fadeMs=900){
    if(!this.context)return;
    const at=this.context.currentTime,duration=Math.max(0,fadeMs)/1000;
    for(const voice of this.musicVoices){
      if(voice.retiring)continue;voice.retiring=true;
      const p=voice.gain.gain;
      if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(at);else{const value=p.value;p.cancelScheduledValues(at);p.setValueAtTime(value,at);}
      p.linearRampToValueAtTime(0,at+duration);
      voice.timer=setTimeout(voice.finish,fadeMs+30);voice.timer.unref?.();
    }
  }
  play(requestedId,{variant}={}){
    const id=canonicalAudioId(requestedId),resource=this.resources.get(id);
    // Unknown variants fall back to the canonical recording. No pitch/DSP at runtime.
    const entry=resource?.variants?.[variant]?{...resource,...resource.variants[variant]}:resource;
    if(entry?.channel==='bgm'){
      if(!entry.src){this.notice(id,'missing','尚未配置正式音乐，静默跳过');return false;}
      return this.setBgm(id);
    }
    if(!this.enabled)return false;
    if(!entry?.src){this.notice(id,'missing','尚未配置正式音效，静默跳过');return false;}
    if(this.volume===0||this.channels[entry.channel]===0||entry.volume===0)return false;
    const group=entry.mergeGroup||id,at=this.now();
    if(at-(this.lastPlayed.get(group)??-Infinity)<entry.cooldownMs)return false;
    // Let the accepted cue finish; never overlap/interrupt it or queue stale cues.
    if(entry.voiceLimit&&[...this.active].filter(v=>v.group===group).length>=entry.voiceLimit)return false;
    const channelLimit=entry.channel==='environment'?Math.min(this.maxPerChannel,this.maxEnvironmentConcurrent):this.maxPerChannel;
    if([...this.active].filter(v=>v.entry.channel===entry.channel).length>=channelLimit)return false;
    // Environment never consumes the last slot needed by a clear/chain/skill.
    if(this.active.size>=this.maxConcurrent&&entry.channel==='effect'&&['match','special'].includes(group)){
      [...this.active].find(v=>v.entry.channel==='environment')?.finish();
    }
    if(this.active.size>=this.maxConcurrent)return false;
    let voice;
    try{
      const node=this.createAudio(new URL(entry.src,import.meta.url).href);
      voice={id,entry,group,node,timer:null,finish:()=>{
        if(!this.active.delete(voice))return;
        clearTimeout(voice.timer);
        try{node.removeEventListener('ended',voice.finish);node.removeEventListener('error',voice.fail);node.pause();node.removeAttribute('src');node.load();}catch{}
        this.updateVolumes();
      },fail:()=>{voice.finish();this.notice(id,'unavailable','资源不可用或浏览器阻止播放，静默跳过');}};
      this.active.add(voice);node.volume=this.gain(voice);this.updateVolumes();
      if(!this.active.has(voice))return false;
      node.loop=false;
      node.addEventListener('ended',voice.finish);node.addEventListener('error',voice.fail);
      // Includes loading/pending play, so a hung file cannot retain a slot forever.
      voice.timer=setTimeout(voice.fail,entry.maxDurationMs);voice.timer.unref?.();
      this.lastPlayed.set(group,at);
      Promise.resolve(node.play()).catch(voice.fail);
      return true;
    }catch{voice?.finish();this.notice(id,'unavailable','音频设备或资源不可用，静默跳过');return false;}
  }
  stopEffects({preserveUi=false}={}){for(const voice of [...this.active])if(!preserveUi||!['ui-action','ui-confirm'].includes(voice.group))voice.finish();this.lastPlayed.clear();}
  stopAll(){this.stopEffects();this.musicTarget=null;this.musicSerial++;for(const voice of [...this.musicVoices])voice.finish();}
  snapshot(){return {soundEnabled:this.enabled,bgmEnabled:this.musicEnabled,masterVolume:this.volume,channels:{...this.channels},active:this.active.size,music:{target:this.musicTarget,playing:[...this.musicVoices].filter(v=>!v.retiring).map(v=>v.id),voices:this.musicVoices.size,duck:this.musicDuck(),unlocked:this.unlocked,suspended:this.suspended},configured:[...this.resources.values()].filter(e=>e.src).length,reserved:this.resources.size};}
}

export const audio=new AudioManager();
