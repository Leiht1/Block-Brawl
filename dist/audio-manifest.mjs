// Licensed local recording edits. Provenance: assets/audio/CREDITS.md.
const entry=(channel,options={})=>Object.freeze({src:null,channel,type:'sfx',loop:false,volume:1,cooldownMs:100,maxDurationMs:8000,...options});
const stage4Source=Object.freeze({title:'方块乱斗原创编排 · VSCO 2 Community Edition acoustic recordings',author:'Project arrangement; samples Sam Gossner & Simon Dalzell / Elan Hickler',url:'https://github.com/sgossner/VSCO-2-CE',license:'Project-original arrangement; samples CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',evidence:'references/audio-stage4/sources.json'});
const music=(name,volume,bpm,seconds)=>entry('bgm',{src:`./assets/audio/bgm/${name}/bgm-${name}-v1.ogg`,type:'bgm',loop:true,volume,bpm,seconds,source:stage4Source,license:stage4Source.license});
const ui=(name,volume,seconds,options={})=>entry('ui',{src:`./assets/audio/ui/${name}-v1.wav`,volume,seconds,voiceLimit:1,mergeGroup:'ui-action',cooldownMs:85,maxDurationMs:Math.ceil(seconds*1000)+500,source:stage4Source,license:'CC0-1.0',...options});
const core=(folder,file,volume,options={})=>entry('effect',{src:`./assets/audio/${folder}/${file}.wav`,volume,maxDurationMs:1600,...options});
const variant=(folder,file,volume)=>Object.freeze({src:`./assets/audio/${folder}/${file}.wav`,volume});
const match={mergeGroup:'match',cooldownMs:120,voiceLimit:1};
const special={mergeGroup:'special',cooldownMs:100,voiceLimit:1};
const environment=(map,phase,volume,seconds,cooldownMs=250,version=1)=>entry('environment',{
  src:`./assets/audio/maps/${map}/${map}-${phase}-v${version}.wav`,volume,
  mergeGroup:`environment:${map}:${phase}`,voiceLimit:1,cooldownMs,maxDurationMs:Math.ceil(seconds*1000)+650
});
export const AUDIO_MANIFEST=Object.freeze({
  'bgm.lobby':music('lobby',0.66,100,153.6),
  'bgm.battle':music('battle',0.60,128,120),
  'ui.click':ui('ui-click',0.38,0.09,{source:Object.freeze({title:'Pop effect sounds — p_2',author:'trezegames',url:'https://opengameart.org/content/pop-effect-sounds',license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/'})}),
  'ui.confirm':ui('ui-confirm',0.34,0.32,{mergeGroup:'ui-confirm',cooldownMs:350}),
  'map.shuffle':ui('map-shuffle',0.42,0.42,{mergeGroup:'map-selection',cooldownMs:550,source:Object.freeze({title:'Casino Audio — card-fan-1',author:'Kenney',url:'https://kenney.nl/assets/casino-audio',license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/'})}),
  'map.reveal':ui('map-reveal',0.38,0.66,{mergeGroup:'map-selection',cooldownMs:550}),
  'ui.countdown':entry('ui',{src:'./assets/audio/ui/countdown-3-v2.wav',volume:0.30,cooldownMs:500,mergeGroup:'countdown',voiceLimit:1,maxDurationMs:1600,
    variants:Object.freeze({
      '3':variant('ui','countdown-3-v2',0.30),'2':variant('ui','countdown-2-v2',0.32),
      '1':variant('ui','countdown-1-v2',0.34),start:variant('ui','countdown-start-v2',0.40)
    })}),
  'ui.win':entry('ui'),
  'ui.lose':entry('ui'),
  'block.swap':core('block','block-swap-v2',0.42,{cooldownMs:70,mergeGroup:'operation',voiceLimit:2}),
  'block.invalid':core('block','block-invalid-v1',0.32,{mergeGroup:'operation',voiceLimit:2}),
  'block.match3':core('block','block-match3-v2',0.46,match),
  'block.combo':core('combo','combo1-v2',0.48,{...match,variants:Object.freeze({
    combo1:variant('combo','combo1-v2',0.48),
    combo2:variant('combo','combo2-v2',0.51),
    combo3:variant('combo','combo3-v2',0.54)
  })}),
  'block.fall':core('block','block-fall-v1',0.24,{cooldownMs:160,mergeGroup:'operation',voiceLimit:2}),
  'special.create':core('special','special-create-v3',0.34,special),
  'special.line':core('special','special-line-v3',0.46,special),
  'special.bomb':core('special','special-bomb-v3',0.48,special),
  'special.combo':core('special','special-line-v3',0.50,{...special,cooldownMs:150,variants:Object.freeze({
    'line-line':variant('special','special-line-v3',0.50),
    'line-blast':variant('special','special-combo-line-blast-v5',0.56),
    'blast-blast':variant('special','special-combo-blasts-v3',0.28)
  })}),
  'cliff.warning':environment('cliff','warning',0.40,1.10,900),
  'cliff.fall':environment('cliff','fall',0.44,0.62,350,2),
  'cliff.impact':environment('cliff','impact',0.33,0.48,350,2),
  'ice.freeze':environment('ice','freeze',0.39,0.70,500),
  'ice.break':environment('ice','break',0.40,0.60,180),
  'ruins.activate':environment('ruins','activate',0.39,1.05,900),
  // Reserved for a future pillar event; the current turntable never emits it.
  'ruins.pillar':entry('environment'),
  'furnace.warning':environment('furnace','warning',0.35,0.55,400),
  'furnace.spread':environment('furnace','spread',0.39,0.66,500)
});

// Examples from the design brief resolve to the same canonical resource.
export const AUDIO_ALIASES=Object.freeze({
  'ui.back':'ui.click','ui.start':'ui.confirm','ui.mapReveal':'map.reveal',
  'combo.match3':'block.match3',
  'special.trigger':'special.line',
  'map.cliff.rockfall':'cliff.fall',
  ...Object.fromEntries(Object.keys(AUDIO_MANIFEST).filter(k=>/^(cliff|ice|ruins|furnace)\./.test(k)).flatMap(k=>[[`map.${k}`,k],[`maps.${k}`,k]]))
});

export function canonicalAudioId(id){return AUDIO_ALIASES[id]||id;}
