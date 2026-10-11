// Game events resolve to semantic IDs; this module never reads an audio file.
export const AUDIO_EVENT_MAP=Object.freeze({
  ui_click:'ui.click',ui_back:'ui.click',ui_confirm:'ui.confirm',map_shuffle:'map.shuffle',map_reveal:'map.reveal',game_start:'ui.confirm',countdown_tick:'ui.countdown',countdown_start:'ui.countdown',game_win:'ui.win',game_lose:'ui.lose',
  block_swap:'block.swap',block_invalid:'block.invalid',match_complete:'block.match3',chain_match:'block.combo',block_fall:'block.fall',
  special_create:'special.create',special_line:'special.line',special_bomb:'special.bomb',special_combo:'special.combo',special_trigger:'special.line',
  rock_warning:'cliff.warning',rock_fall:'cliff.fall',rock_impact:'cliff.impact',
  ice_freeze:'ice.freeze',ice_break:'ice.break',ruins_activate:'ruins.activate',ruins_pillar:'ruins.pillar',furnace_warning:'furnace.warning',furnace_spread:'furnace.spread'
});

export function resolveEngineAudioEvent(e){
  if(e.kind==='swap')return 'block_swap';
  if(e.kind==='revert')return 'block_invalid';
  if(e.kind==='fall')return 'block_fall';
  // A special clear has its own release cue. Avoid a simultaneous ordinary pop.
  if(e.kind==='clear')return e.comboType||e.tiles?.some(t=>t.tile?.special)?null:e.depth>1?'chain_match':'match_complete';
  if(e.kind==='special-create')return 'special_create';
  if(e.kind==='special-trigger')return e.tile?.special==='blast'?'special_bomb':'special_line';
  if(e.kind==='combo-trigger')return 'special_combo';
  if(e.kind==='rock-warning')return 'rock_warning';
  if(e.kind==='rock-fall')return 'rock_fall';
  if(e.kind==='rock-blocked')return 'rock_impact';
  if(e.kind==='map-warning')return e.type==='mechanism'?'ruins_activate':e.type==='fire'?'furnace_warning':null;
  if(e.kind==='map-spread-warning'&&e.type==='fire')return 'furnace_warning';
  if(e.kind==='map-blocked')return e.type==='freeze'?'ice_freeze':e.type==='fire'?'furnace_spread':null;
  if(e.kind==='map-restored'&&e.type==='freeze'&&e.reason==='clear')return 'ice_break';
  return null;
}

export function createAudioEvents(audio){
  const batches=new Map();let observed=null,lastStatus=null,lastDigit=null,lastScreen=null,lastReveal=null,lastRevealPhase=null,lastShuffle=-1,music=null;
  const stopEffects=options=>audio.stopEffects?audio.stopEffects(options):audio.stopAll();
  const emit=(name,options)=>AUDIO_EVENT_MAP[name]?audio.play(AUDIO_EVENT_MAP[name],options):false;
  return {
    emit,
    reset(){batches.clear();stopEffects();},
    engine(e,source='player'){
      if(e.kind==='reset'){if(source==='player'){batches.clear();stopEffects({preserveUi:true});}return false;}
      const name=resolveEngineAudioEvent(e);if(!name)return false;
      if(/^(rock|map)-/.test(e.kind)){
        // One cue per phase/time/round across cells AND both boards. No game timer.
        const signature=`${e.round}:${e.time}`;
        if(batches.get(name)===signature)return false;
        batches.set(name,signature);
      }
      const options=name==='chain_match'?{variant:`combo${Math.min(3,Math.max(1,(e.depth||2)-1))}`}:
        name==='special_combo'?{variant:e.type}:undefined;
      return emit(name,options);
    },
    observeFlow(flow,now){
      if(!flow)return;
      const session=flow.arena||flow.session,screen=flow.screen,status=session?.status,changed=lastScreen!==screen;
      if(changed){stopEffects({preserveUi:true});batches.clear();lastScreen=screen;}
      const nextMusic=screen==='arena'&&status==='playing'?'bgm.battle':'bgm.lobby';
      if(music!==nextMusic){music=nextMusic;audio.setBgm?.(music,{fadeMs:900});}
      // Observe the existing reveal clock; no rerolls or changes to its timing.
      if(flow.reveal){
        if(lastReveal!==flow.reveal){lastReveal=flow.reveal;lastRevealPhase=null;lastShuffle=-1;}
        const state=flow.reveal.at(now),cycle=Math.floor(Math.max(0,now-flow.reveal.start)/650);
        if(state.phase==='cycling'&&cycle<3&&cycle!==lastShuffle){lastShuffle=cycle;emit('map_shuffle');}
        if(['locked','complete'].includes(state.phase)&&!['locked','complete'].includes(lastRevealPhase))emit('map_reveal');
        lastRevealPhase=state.phase;
      }else{lastReveal=null;lastRevealPhase=null;lastShuffle=-1;}
      if(observed!==session){observed=session;lastStatus=null;lastDigit=null;}
      if(status==='countdown'){
        const digit=session.countdown(now);if(lastDigit!==digit){lastDigit=digit;emit('countdown_tick',{variant:String(digit)});}
      }else lastDigit=null;
      if(lastStatus!==status){
        if(status==='playing')lastStatus==='countdown'?emit('countdown_start',{variant:'start'}):emit('game_start');
        if(flow.arena&&status==='finished')emit(session.winner==='player'?'game_win':'game_lose');
        if(flow.session&&['won','lost'].includes(status))emit(status==='won'?'game_win':'game_lose');
        lastStatus=status;
      }
      if(screen==='sandbox'&&!session&&changed)emit('game_start');
    },
    uiButton(button){
      if(!button||button.disabled||button.closest('[hidden], [inert]'))return false;
      const confirm=button.id==='arena-ready'||button.id==='open-arena';
      return emit(confirm?'ui_confirm':'ui_click');
    }
  };
}
