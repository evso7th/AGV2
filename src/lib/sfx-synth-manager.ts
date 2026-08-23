import type { FractalEvent, Mood, Genre, SfxRule } from '@/types/fractal';

/**
 * @fileOverview Менеджер SFX V14.0 — "Ambient Dark Logic".
 * #ЗАЧЕМ: Улучшение Ambient согласно ПЛАНУ №1332.
 * #ЧТО: Перенастройка логики для темных настроений (глитчи и пэды).
 */
const SFX_SAMPLES: Record<string, string[]> = {
    perc: [
        '/assets/music/perc/110359__vinjatovix__loop-de-percusion-echo-con-la-tapa-del-jabon.ogg',
        '/assets/music/perc/184082__noisecollector__canpop14percussion.ogg',
        '/assets/music/perc/187536__waveplaysfx__perc-metallic-percussion.ogg',
        '/assets/music/perc/195585__waveplaysfx__perc-dark-rave-fx-growl.ogg',
        '/assets/music/perc/196758__waveplaysfx__perc-custom-tom.ogg',
        '/assets/music/perc/197149__waveplaysfx__perc-weird-ambient-sound.ogg',
        '/assets/music/perc/197468__waveplaysfx__perc-metallic-percussion-2.ogg',
        '/assets/music/perc/201787__waveplaysfx__perc-hi-end-perc.ogg',
        '/assets/music/perc/221363__waveplaysfx__perc-tom-click.ogg',
        '/assets/music/perc/221364__waveplaysfx__perc-tom-kick.ogg',
        '/assets/music/perc/221365__waveplaysfx__perc-perc-thinger.ogg',
        '/assets/music/perc/222055__waveplaysfx__perc-perc-1.ogg',
        '/assets/music/perc/222060__waveplaysfx__perc-another-perc.ogg',
        '/assets/music/perc/222062__waveplaysfx__perc-metallic-robot-perc.ogg',
        '/assets/music/perc/22783__franciscopadilla__80-mute-triangle.ogg',
        '/assets/music/perc/233535__waveplaysfx__perc-screech-thinger.ogg',
        '/assets/music/perc/233539__waveplaysfx__perc-click.ogg',
        '/assets/music/perc/235415__waveplaysfx__drumloop-120-bpm-edm-perc-loop-003.ogg',
        '/assets/music/perc/250536__waveplaysfx__perc-perk-3__1_.ogg',
        '/assets/music/perc/250536__waveplaysfx__perc-perk-3.ogg',
        '/assets/music/perc/352677__waveplaysfx__perc-metallic-bell-like-hit-sfx.ogg',
        '/assets/music/perc/376038__waveplaysfx__perc-short-metallic-like-sound-click.ogg',
        '/assets/music/perc/381826__waveplaysfx__drums-noisy-hat-percussion.ogg',
        '/assets/music/perc/399934__waveplaysfx__perc-short-clicksnap-perc.ogg',
        '/assets/music/perc/401937__waveplaysfx__drumloop-120-bpm-edm-tomperc-loop-030.ogg',
        '/assets/music/perc/42729__decembered__iron_boom.ogg',
        '/assets/music/perc/442349__toddcircle__clunky-tap.ogg',
        '/assets/music/perc/492027__crinkem__blow-dart.ogg',
        '/assets/music/perc/523687__jobot__suction-pop.ogg',
        '/assets/music/perc/759579__mosounds__pluck-d-bass-perk.ogg',
        '/assets/music/perc/94691__jconti__apple-crunch.ogg'
    ],
    sfx_other: [
        '/assets/music/SFX/104354__rutgermuller__metal-pipe-falling-on-concrete-in-basement-2.ogg',
        '/assets/music/SFX/249496__jasvanroe__metal-hooks-on-metal.ogg',
        '/assets/music/SFX/265073__altemark__stk.ogg',
        '/assets/music/SFX/268606__breo2012__hollow-bell.ogg',
        '/assets/music/SFX/269097__breo2012__insane.ogg',
        '/assets/music/SFX/384686__waveplaysfx__sfx-grindy-pulse-fx.ogg',
        '/assets/music/SFX/384695__waveplaysfx__sfx-atmospheric-ambient-fade.ogg',
        '/assets/music/SFX/384843__waveplaysfx__bass-classic-duueerrr-bass-sound.ogg',
        '/assets/music/SFX/399933__waveplaysfx__media-short-generic-sound-short-generic.ogg',
        '/assets/music/SFX/402692__waveplaysfx__sfx-short-bassy-industrial-hit.ogg',
        '/assets/music/SFX/417401__waveplaysfx__drums-techno-clapsnare.ogg',
        '/assets/music/SFX/41850__lancrey__sewing_machine.ogg',
        '/assets/music/SFX/424444__stone__laughingfreqmfxbassf0160bpm.ogg',
        '/assets/music/SFX/431518__djfroyd__electronic-bass-drum.ogg',
        '/assets/music/SFX/507757__waveplaysfx__sfx-hit-edm-hit-000.ogg',
        '/assets/music/SFX/50849__m-red__wavebasesingle.ogg',
        '/assets/music/SFX/511552__waveplaysfx__loop-bassy-loop-34-time.ogg',
        '/assets/music/SFX/511617__waveplaysfx__vocal-jabba-the-hutt-laugh.ogg',
        '/assets/music/SFX/518145__waveplaysfx__media-deep-bass-swell-appgame-sfx.ogg',
        '/assets/music/SFX/518148__waveplaysfx__media-simple-happy-beep-appgame-sfx-uplifting.ogg',
        '/assets/music/SFX/518748__waveplaysfx__sfx-short-warb-3.ogg',
        '/assets/music/SFX/546170__waveplaysfx__eerie-music-box-hits.ogg',
        '/assets/music/SFX/553744__waveplaysfx__sfx-hit-edm-hit-003.ogg',
        '/assets/music/SFX/577680__mistakeless__reverb-piano-chord-2.ogg',
        '/assets/music/SFX/595789__infamouslazure__magic_burst4.ogg',
        '/assets/music/SFX/632786__jorickhoofd__matchbox-closes.wav',
        '/assets/music/SFX/645985__doubledog__refrigerator-buzz-20220714.ogg',
        '/assets/music/SFX/662342__fmaudio__interface-erase-8.ogg'
    ],
    sfx_glitch: [
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864183__mirmaximus__sfx_damage_glitch_1_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864184__mirmaximus__sfx_damage_glitch_2_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864185__mirmaximus__sfx_damage_glitch_3_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864186__mirmaximus__sfx_outage_hit_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864187__mirmaximus__sfx_pc_crash_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864188__mirmaximus__sfx_computer_froze_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864189__mirmaximus__sfx_energyglitch_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864196__mirmaximus__sfx_speaker_inter2_(1).ogg',
        '/assets/music/SFX/46054__mirmaximus__glitch-city/864197__mirmaximus__sfx_speaker_interference_(1).ogg'
    ],
    sfx_common: [
        '/assets/music/SFX/sfx_100_v2/sfx100v2_air_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_air_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_air_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_door_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_door_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_door_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_door_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_door_05_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_wet_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_wet_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_wet_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_wood_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_wood_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_wood_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_footstep_wood_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_05_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_06_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_hit_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_hit_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_hit_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_items_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_items_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_lock_open_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_ambient_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_ambient_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_ambient_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_ambient_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_construction_site_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_highway_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_machine_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_machine_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_machine_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_machine_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_water_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_water_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_water_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_05_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_06_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_hit_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_hit_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_05_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_06_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_07_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_08_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_09_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_10_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_11_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_12_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_13_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_14_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_15_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_16_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_17_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_18_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_19_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_20_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_21_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_22_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_23_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_24_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_25_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_26_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_27_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_28_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_29_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_30_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_31_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_32_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_33_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_34_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_35_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_36_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_37_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_stones_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_stones_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_stones_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_switch_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_switch_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_thunder_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_03_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_04_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_hit_01_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_hit_02_(1)_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_hit_03_(1)_(1).ogg'
    ],
    tube: [
        '/assets/music/tube/102540__sandyrb__tube-pop.ogg',
        '/assets/music/tube/15876__jonathanjansen__cardboard-tube-2.ogg',
        '/assets/music/tube/222447__speedenza__metal-tube-1-small.ogg',
        '/assets/music/tube/269153__heshl__bass-caution-tube-backwards-exit-sound.ogg',
        '/assets/music/tube/278173__adharca__metal-tube-4_(1).ogg',
        '/assets/music/tube/321802__lloydevans09__pvc_pipe_hit_4.ogg',
        '/assets/music/tube/321805__lloydevans09__pvc_pipe_hit_1.ogg',
        '/assets/music/tube/321808__lloydevans09__pvc_pipe_hit_3.ogg',
        '/assets/music/tube/321809__lloydevans09__pvc_pipe_hit_2.ogg',
        '/assets/music/tube/341499__the_yura__kick-plastic-tube.ogg',
        '/assets/music/tube/421171__akustika__pvc-tube-01.ogg',
        '/assets/music/tube/426431__dersinnsspace__tube-hit-04-high.ogg',
        '/assets/music/tube/426432__dersinnsspace__tube-hit-03-mid.ogg',
        '/assets/music/tube/426436__dersinnsspace__tube-hit-05-midringing__1_.ogg',
        '/assets/music/tube/426436__dersinnsspace__tube-hit-05-midringing.ogg',
        '/assets/music/tube/486220__salvadormiranda__pvc-tubehit-1.ogg',
        '/assets/music/tube/486221__salvadormiranda__pvc-tube-hit-2.ogg',
        '/assets/music/tube/528157__gecop__irontube.ogg',
        '/assets/music/tube/555166__audio_dread__horror-impact-stinger.ogg',
        '/assets/music/tube/57914__denalwa__cardboard-tube-01a.ogg',
        '/assets/music/tube/612585__diogorusso__metalic-tube-finger-slap-48000-hz-24-bit-stereo.ogg',
        '/assets/music/tube/682838__iainmccurdy__cardboard-tube-pop.ogg',
        '/assets/music/tube/702819__silverillusionist__vacuum-tube-louder-note-d1.ogg',
        '/assets/music/tube/707925__nikasound__glass-tube-popping.ogg',
        '/assets/music/tube/768053__hewnmarrow__tud_tubeunitdrone_-034v03.wav',
        '/assets/music/tube/812799__music_is_wiggly_air__pop-from-tube-shaped-like-a-candy-cane.ogg',
        '/assets/music/tube/813361__designerschoice__toonpop-blue-snowball-microphone-cu_test-tube-top_nicholas-judy_tdc.ogg'
    ],
    voices_oga: [
        '/assets/music/voices/OGA_CC0/AlertHeavyCasulaties_(1).ogg',
        '/assets/music/voices/OGA_CC0/AllyDown_(1).ogg',
        '/assets/music/voices/OGA_CC0/BackupRequested_(1).ogg',
        '/assets/music/voices/OGA_CC0/GetOverHere_(1).ogg',
        '/assets/music/voices/OGA_CC0/I_need_backup_(1).ogg',
        '/assets/music/voices/OGA_CC0/Initializing_(1).ogg',
        '/assets/music/voices/OGA_CC0/MissionObjectiveSet_(1).ogg',
        '/assets/music/voices/OGA_CC0/OneMoreDown_(1).ogg',
        '/assets/music/voices/OGA_CC0/Ouch_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-1_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-2_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-3_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-4_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-5_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-6_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-7_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-8_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-9_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-10_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-11_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase1-12_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-1_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-2_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-3_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-4_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-5_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-6_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-7_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-8_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-9_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-10_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-11_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-12_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-13_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-14_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-15_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/phrase2-16_(1)_(1).ogg',
        '/assets/music/voices/OGA_CC0/ProjectedLifeSpanLow_(1).ogg',
        '/assets/music/voices/OGA_CC0/TakingCover_(1).ogg',
        '/assets/music/voices/OGA_CC0/TargetAcquired_(1).ogg',
        '/assets/music/voices/OGA_CC0/TargetDown_(1).ogg',
        '/assets/music/voices/OGA_CC0/TargetFound_(1).ogg',
        '/assets/music/voices/OGA_CC0/TargetLost_(1).ogg',
        '/assets/music/voices/OGA_CC0/TargetNeutralized_(1).ogg',
        '/assets/music/voices/OGA_CC0/TargetOutOfSight_(1).ogg',
        '/assets/music/voices/OGA_CC0/ThatHurt_(1).ogg',
        '/assets/music/voices/OGA_CC0/WhereAreYou_(1).ogg',
        '/assets/music/voices/OGA_CC0/WhereDidYouGo_(1).ogg'
    ],
    voices_pixabay: [
        '/assets/music/voices/pixabay/alien_i_trust-alien-i-trust-who-defines-life-if-thought-is-life-then-i-am-eternal-289010.mp3',
        '/assets/music/voices/pixabay/alien_i_trust-link-in-bio-alien-i-trust-i-exist-between-the-known-and-the-unknown-289088.mp3',
        '/assets/music/voices/pixabay/alien_i_trust-monster-bot-vocoder-by-alien-i-trust-125_bpm-275007.mp3',
        '/assets/music/voices/pixabay/alien_i_trust-sample-pack-link-in-bio-let-the-beat-drop-by-alien-i-trust-289277.mp3',
        '/assets/music/voices/pixabay/arunangshubanerjee-whispered-oh-no-in-a-funny-voice-comedic-reaction-sfx-366314.mp3',
        '/assets/music/voices/pixabay/diff_style-robot-friendly-talk-344761.mp3',
        '/assets/music/voices/pixabay/diff_style-robot-talk-344757.mp3',
        '/assets/music/voices/pixabay/edr-vocoder-program-b87-test-15917.mp3',
        '/assets/music/voices/pixabay/fidelfortune-beauty-woman-voice-ancient-chant-mystic-205225.mp3',
        '/assets/music/voices/pixabay/fidelfortune-woman-voice-very-nice-voice-and-melody-304199.mp3',
        '/assets/music/voices/pixabay/freesound_community-081089_robot-voice-come-on-let39s-get-it-on-82781.mp3',
        '/assets/music/voices/pixabay/freesound_community-082569_robot-voice-let39s-get-it-on-82780.mp3',
        '/assets/music/voices/pixabay/freesound_community-announcements-87424.mp3',
        '/assets/music/voices/pixabay/freesound_community-classcified-android-88675.mp3',
        '/assets/music/voices/pixabay/freesound_community-computer-maybe-you-should-die-104679.mp3',
        '/assets/music/voices/pixabay/freesound_community-cry-of-robot-97907.mp3',
        '/assets/music/voices/pixabay/freesound_community-cybertron-106425.mp3',
        '/assets/music/voices/pixabay/freesound_community-dead-robot-01-82175.mp3',
        '/assets/music/voices/pixabay/freesound_community-female_robot_voice_samples-33469.mp3',
        '/assets/music/voices/pixabay/freesound_community-furievox-105000.mp3',
        '/assets/music/voices/pixabay/freesound_community-initiating-shutdown-94634.mp3',
        '/assets/music/voices/pixabay/freesound_community-keepondoingit-38721.mp3',
        '/assets/music/voices/pixabay/freesound_community-know-more-103229.mp3',
        '/assets/music/voices/pixabay/freesound_community-meat-with-feelings-72551.mp3',
        '/assets/music/voices/pixabay/freesound_community-radiationz-music-106725.mp3',
        '/assets/music/voices/pixabay/freesound_community-robot-i-have-only-one-function-80403.mp3',
        '/assets/music/voices/pixabay/freesound_community-robot-statements-31911.mp3',
        '/assets/music/voices/pixabay/freesound_community-robot-voice-does-not-compute-82799.mp3',
        '/assets/music/voices/pixabay/freesound_community-robot-voice-drop-the-bass-82798.mp3',
        '/assets/music/voices/pixabay/freesound_community-robot-voice-drop-the-beat-103181.mp3',
        '/assets/music/voices/pixabay/freesound_community-russian-voice-fx-77498.mp3',
        '/assets/music/voices/pixabay/freesound_community-text-scroll-g4-180-openmpt-agogo-39617.mp3',
        '/assets/music/voices/pixabay/freesound_community-tin-man-respect-103228.mp3',
        '/assets/music/voices/pixabay/freesound_community-vietnam-robot-flashback-31835.mp3',
        '/assets/music/voices/pixabay/freesound_community-voz-robot-2-81439.mp3',
        '/assets/music/voices/pixabay/freesound_community-youarenumberone-105047.mp3',
        '/assets/music/voices/pixabay/freesound_community-you-have-been-selected-94638.mp3',
        '/assets/music/voices/pixabay/kuzu420-talking-robot-243649.mp3',
        '/assets/music/voices/pixabay/phatphrogstudio-android-voice-access-granted-477825.mp3',
        '/assets/music/voices/pixabay/phatphrogstudio-android-voice-standby-477826.mp3',
        '/assets/music/voices/pixabay/phatphrogstudio-demon-voice-smell-flesh-no-ai-479322.mp3',
        '/assets/music/voices/pixabay/phatphrogstudio-lich-demonic-voice-come-closer-502312.mp3',
        '/assets/music/voices/pixabay/phatphrogstudio-oni-demon-voice-demonic-laughter-477923.mp3',
        '/assets/music/voices/pixabay/universfield-game-over-deep-male-voice-clip-352695.mp3'
    ],
    voices_other: [
        '/assets/music/voices/Aspire_to_inspire_Dr__1__(1).ogg',
        '/assets/music/voices/Stay_strong_Enjoy_th_(1).ogg'
    ],
    vinyl: [
        '/assets/music/vinyl_disk.ogg'
    ]
};

export class SfxSynthManager {
    private context: AudioContext;
    private isReady = false;
    private isFullyInitialized = false;
    private buffers: Map<string, AudioBuffer[]> = new Map();
    private activeSources: Set<AudioBufferSourceNode> = new Set();
    private preamp: GainNode;

    constructor(context: AudioContext, destination: GainNode) {
        this.context = context;
        this.preamp = this.context.createGain();
        this.preamp.gain.value = 0.65;
        this.preamp.connect(destination);
    }

    public async init(limitPerCategory: number = -1): Promise<void> {
        if (this.isFullyInitialized) return;
        if (limitPerCategory > 0 && this.isReady) return;

        const allCategories = Object.keys(SFX_SAMPLES);
        for (const category of allCategories) {
            const urls = SFX_SAMPLES[category];
            const targetUrls = limitPerCategory > 0 ? urls.slice(0, limitPerCategory) : urls;
            
            if (!this.buffers.has(category)) this.buffers.set(category, []);
            const categoryBuffers = this.buffers.get(category)!;

            const promises = targetUrls.map(url => this.loadSample(url).then(buffer => {
                if(buffer && !categoryBuffers.includes(buffer)) categoryBuffers.push(buffer);
            }));
            await Promise.all(promises);
        }
        this.isReady = true;
        if (limitPerCategory === -1) this.isFullyInitialized = true;
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`SFX sample not found: ${url}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            return await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading SFX sample: ${url}`, error);
            return null;
        }
    }

    public triggerManual(category: string, time: number, volume: number = 0.4): void {
        if (!this.isReady) return;
        const samplePool = this.buffers.get(category);
        if (!samplePool || samplePool.length === 0) return;

        const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        const manualGain = this.context.createGain();
        manualGain.gain.value = volume;
        source.connect(manualGain).connect(this.preamp);
        
        const now = Math.max(time, this.context.currentTime);
        source.start(now);
        this.activeSources.add(source);
        source.onended = () => { 
            this.activeSources.delete(source); 
            try { manualGain.disconnect(); } catch(e) {}
            try { source.disconnect(); } catch(e) {} 
        };
    }

    public trigger(events: FractalEvent[], barStartTime: number, tempo: number): void {
        if (!this.isReady) return;
        events.forEach(event => {
            if (event.type !== 'sfx') return;
            const { mood, genre, rules } = event.params as { mood: Mood, genre: Genre, rules?: SfxRule };
            
            const category = this.getCategoryForContext(mood, genre, rules);
            const samplePool = this.buffers.get(category);
            if (!samplePool || samplePool.length === 0) {
                return;
            }

            const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.preamp);
            
            const beatDuration = 60 / tempo;
            const startTime = barStartTime + (event.time * beatDuration);
            
            if (isFinite(startTime) && startTime >= this.context.currentTime) {
                source.start(startTime);
                this.activeSources.add(source);
                source.onended = () => { 
                    this.activeSources.delete(source); 
                    try { source.disconnect(); } catch(e) {} 
                };
            }
        });
    }

    private getCategoryForContext(mood: Mood, genre: Genre, rules?: SfxRule): string {
        const aliases: Record<string, string> = {
            'dark': 'sfx_glitch',
            'voice': 'voices_pixabay',
            'DARK': 'sfx_glitch',
            'ELECTRONIC': 'sfx_common'
        };

        if (rules && rules.categories && rules.categories.length > 0) {
            const totalWeight = rules.categories.reduce((sum, cat) => sum + cat.weight, 0);
            let rand = Math.random() * totalWeight;
            for (const category of rules.categories) {
                rand -= category.weight;
                if (rand <= 0) {
                    const name = category.name;
                    return aliases[name] || name;
                }
            }
        }
        
        const rand = Math.random();

        if (genre === 'reggae') {
            return rand < 0.7 ? 'tube' : 'perc';
        }

        if (genre === 'foundry') {
            return rand < 0.6 ? 'sfx_glitch' : 'sfx_other';
        }

        if (genre === 'ambient') {
            // #ЗАЧЕМ: Реализация ПЛАНА №1332. Глитчи и пэды для темного настроения.
            if (mood === 'dark' || mood === 'anxious' || mood === 'gloomy' || mood === 'melancholic') {
                 if(rand < 0.45) return 'sfx_glitch';
                 if(rand < 0.75) return 'sfx_other';
                 return 'perc';
            }
            if (rand < 0.5) return 'sfx_common';
            return 'voices_oga';
        }
        
        if (genre === 'blues') {
            if (rand < 0.8) return 'perc';
            return 'vinyl';
        }

        return 'sfx_common';
    }
    
    public allNotesOff() {
       this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
       this.activeSources.clear();
    }
}
