// Licensed local recording edits. Provenance: assets/audio/CREDITS.md.
const entry=(channel,options={})=>Object.freeze({src:null,channel,volume:1,cooldownMs:100,maxDurationMs:8000,...options});
const core=(folder,file,volume,options={})=>entry('effect',{src:`./assets/audio/${folder}/${file}.wav`,volume,maxDurationMs:1600,...options});
const variant=(folder,file,volume)=>Object.freeze({src:`./assets/audio/${folder}/${file}.wav`,volume});
const match={mergeGroup:'match',cooldownMs:120,voiceLimit:1};
const special={mergeGroup:'special',cooldownMs:100,voiceLimit:1};
export const AUDIO_MANIFEST=Object.freeze({
  'ui.click':entry('ui'),
  'ui.back':entry('ui'),
  'ui.start':entry('ui'),
  'ui.countdown':entry('ui',{src:'./assets/audio/ui/countdown-3-v2.wav',volume:0.42,cooldownMs:500,mergeGroup:'countdown',voiceLimit:1,maxDurationMs:1600,
    variants:Object.freeze({
      '3':variant('ui','countdown-3-v2',0.42),'2':variant('ui','countdown-2-v2',0.44),
      '1':variant('ui','countdown-1-v2',0.46),start:variant('ui','countdown-start-v2',0.64)
    })}),
  'ui.win':entry('ui'),
  'ui.lose':entry('ui'),
  'block.swap':core('block','block-swap-v1',0.58,{cooldownMs:70,mergeGroup:'operation',voiceLimit:2}),
  'block.invalid':core('block','block-invalid-v1',0.32,{mergeGroup:'operation',voiceLimit:2}),
  'block.match3':core('block','block-match3-v2',0.46,match),
  'block.combo':core('combo','combo1-v2',0.48,{...match,variants:Object.freeze({
    combo1:variant('combo','combo1-v2',0.48),
    combo2:variant('combo','combo2-v2',0.51),
    combo3:variant('combo','combo3-v2',0.54)
  })}),
  'block.fall':core('block','block-fall-v1',0.24,{cooldownMs:160,mergeGroup:'operation',voiceLimit:2}),
  'special.create':core('special','special-create-v3',0.40,special),
  'special.line':core('special','special-line-v3',0.66,special),
  'special.bomb':core('special','special-bomb-v3',0.68,special),
  'special.combo':core('special','special-line-v3',0.72,{...special,cooldownMs:150,variants:Object.freeze({
    'line-line':variant('special','special-line-v3',0.72),
    'line-blast':variant('special','special-combo-line-blast-v4',0.78),
    'blast-blast':variant('special','special-combo-blasts-v3',0.90)
  })}),
  'cliff.warning':entry('environment'),
  'cliff.fall':entry('environment'),
  'cliff.impact':entry('environment'),
  'ice.freeze':entry('environment'),
  'ice.break':entry('environment'),
  'ruins.activate':entry('environment'),
  // Reserved for a future pillar event; the current turntable never emits it.
  'ruins.pillar':entry('environment'),
  'furnace.warning':entry('environment'),
  'furnace.spread':entry('environment')
});

// Examples from the design brief resolve to the same canonical resource.
export const AUDIO_ALIASES=Object.freeze({
  'combo.match3':'block.match3',
  'special.trigger':'special.line',
  'map.cliff.rockfall':'cliff.fall',
  ...Object.fromEntries(Object.keys(AUDIO_MANIFEST).filter(k=>/^(cliff|ice|ruins|furnace)\./.test(k)).flatMap(k=>[[`map.${k}`,k],[`maps.${k}`,k]]))
});

export function canonicalAudioId(id){return AUDIO_ALIASES[id]||id;}
