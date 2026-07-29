import type { FractalEvent, Mood, Genre, SfxRule } from '@/types/fractal';

/**
 * #ЗАЧЕМ: Менеджер SFX V10.1 — "Voice Clarity".
 * #ЧТО: ПЛАН №1286 — Удаление 4 специфических роботизированных голосов из ротации.
 */
const SFX_SAMPLES: Record<string, string[]> = {
    dark: [
        '/assets/music/SFX/677359__saha213131__horrorcinematicdarkhorrorroomtone20_(1).ogg',
        '/assets/music/SFX/546170__waveplaysfx__eerie-music-box-hits.ogg',
        '/assets/music/SFX/269097__breo2012__insane.ogg',
        '/assets/music/sfx/Agony_Labyrinth.ogg',
        '/assets/music/sfx/Cave_Breath.ogg',
        '/assets/music/sfx/Dark_spell_-_1.ogg',
        '/assets/music/sfx/706518__alesiadavina__horror-sound-effect-paranormal-2-vol-003.ogg',
        '/assets/music/sfx/706519__alesiadavina__halloween-sound-effect-paranormal-3-vol-003.ogg',
        '/assets/music/sfx/706521__alesiadavina__creepy-sound-effect-paranormal-5-vol-003.ogg',
        '/assets/music/sfx/722724__alesiadavina__horror-sound-monster-breath.ogg',
        '/assets/music/sfx/770720__richcraftstudios__bat-screech.ogg'
    ],
    laser: [
        '/assets/music/sfx/laser/01_SFX.ogg',
        '/assets/music/sfx/laser/34_SFX.ogg',
        '/assets/music/sfx/laser/41_SFX.ogg',
        '/assets/music/sfx/laser/825582__akelley6__lazer-blast.ogg',
        '/assets/music/sfx/laser/645999__johncanyon__moan3_mono.ogg',
        '/assets/music/sfx/laser/825552__akelley6__computer-error-beep.ogg',
        '/assets/music/sfx/laser/825554__akelley6__doggy-synth.ogg',
        '/assets/music/sfx/laser/Robot_Confused.ogg'
    ],
    voice: [
        // #ЗАЧЕМ: ПЛАН №1286. 4 файла удалены из ротации (137943, 196890, 220372, 747684).
        '/assets/music/sfx/voice/219567__qubodup__robot-shutdown-sequence-initiated.ogg',
        '/assets/music/sfx/voice/234940__esseffe1__bot1.ogg',
        '/assets/music/sfx/voice/273060__carmsie__helter-skelter.ogg',
        '/assets/music/sfx/voice/277403__landlucky__game-over-sfx-and-voice.ogg',
        '/assets/music/sfx/voice/287974__deleted_user_4798915__sfx-robotic-transmission.ogg',
        '/assets/music/sfx/voice/316288__littlerobotsoundfactory__robot2_05.ogg',
        '/assets/music/sfx/voice/332848__carmsie__never-let-you-go.ogg',
        '/assets/music/sfx/voice/339624__carmsie__know-more.ogg',
        '/assets/music/sfx/voice/339625__carmsie__just-a-dream.ogg',
        '/assets/music/sfx/voice/339627__carmsie__disarm-yourself.ogg',
        '/assets/music/sfx/voice/339628__carmsie__you-cannot-harm-me.ogg',
        '/assets/music/sfx/voice/339629__carmsie__tin-man-respect.ogg',
        '/assets/music/sfx/voice/339630__carmsie__theft.ogg',
        '/assets/music/sfx/voice/339631__carmsie__robot-statements.ogg',
        '/assets/music/sfx/voice/339633__carmsie__meat-with-feelings.ogg',
        '/assets/music/sfx/voice/342258__mooncubedesign__robot-voice-drop-the-bass.ogg',
        '/assets/music/sfx/voice/342944__carmsie__evil-is-a-master-of-disguise.ogg',
        '/assets/music/sfx/voice/342945__carmsie__forever.ogg',
        '/assets/music/sfx/voice/343094__carmsie__think-about-it.ogg',
        '/assets/music/sfx/voice/343921__reitanna__robot-sneeze.ogg',
        '/assets/music/sfx/voice/349317__newagesoup__all-your-base-are-belong-to-us_robot_voice_zarvox.ogg',
        '/assets/music/sfx/voice/376196__euphrosyyn__futuristic-robotic-voice-sentences.ogg',
        '/assets/music/sfx/voice/425218__novi__robot-taking-damage.ogg',
        '/assets/music/sfx/voice/486699__nicknamelarry__scaryvoice-saying-hello-world.ogg',
        '/assets/music/sfx/voice/497616__vectorspace__robotic-transformer-2.ogg',
        '/assets/music/sfx/voice/514696__metrostock99__robot-what-is-happening-to-me.ogg',
        '/assets/music/sfx/voice/518859__sonicwarriorsounds__robotic-countdown-10-to-0.ogg',
        '/assets/music/sfx/voice/564937__anzbot__initiating-shutdown.ogg',
        '/assets/music/sfx/voice/674306__theendofacycle__robot-talk-sfx.ogg',
        '/assets/music/sfx/voice/699850__8bitmyketison__cyber-robot-voice__1_.ogg',
        '/assets/music/sfx/voice/717306__iceofdoom__the-upload-finally-finished.ogg',
        '/assets/music/sfx/voice/759879__chungus43a__the-moonbase-doctor-who-cyberman-voice.ogg',
        '/assets/music/sfx/voice/771944__harrisonlace__robotic-deja-vu-vox.ogg',
        '/assets/music/sfx/voice/776420__chungus43a__doctor-who-cybus-cyberman-voice-recreated.ogg',
        '/assets/music/sfx/voice/783026__soundcannon42__robot-voice-analyze-neurons-for-musical-creativity.ogg',
        '/assets/music/sfx/voice/785805__alien_i_trust__sample-pack-link-in-bio-alien-i-trust-i-exist-between-the-known-and-the-unknown.ogg',
        '/assets/music/sfx/voice/789675__alien_i_trust__synth-shot-1-by-alien-i-trust.ogg',
        '/assets/music/sfx/voice/953__vate__processed-vocoder-voice.ogg',
        '/assets/music/sfx/voice/Hello_who_would_you_.ogg',
        '/assets/music/sfx/voice/I_m_afraid_of_nothin.ogg',
        '/assets/music/sfx/voice/Imagination_rules_th.ogg',
        '/assets/music/sfx/voice/It_s_better_to_have_.ogg',
        '/assets/music/sfx/voice/Launch_all_airships_.ogg',
        '/assets/music/sfx/voice/Money_often_costs_to.ogg',
        '/assets/music/sfx/voice/Never_look_back.ogg',
        '/assets/music/sfx/voice/Nothing_is_certain_b.ogg',
        '/assets/music/sfx/voice/Sitting_in_a_sandpit.ogg',
        '/assets/music/sfx/voice/Time_is_the_great_he.ogg',
        '/assets/music/sfx/voice/You_are_pulling_my_l.ogg',
        '/assets/music/sfx/voice/life_is_good_be_happ.ogg',
        '/assets/music/sfx/voice/voice_game-over.ogg',
        '/assets/music/sfx/voice/wazzap_bro_relax.ogg',
        '/assets/music/sfx/voice/you_are_just_another.ogg',
        // OGA Voices (Filtered List)
        '/assets/music/sfx/voices/OGA_CC0/MissionObjectiveSet.ogg',
        '/assets/music/sfx/voices/OGA_CC0/TargetDown.ogg',
        '/assets/music/sfx/voices/OGA_CC0/AllyDown.ogg',
        '/assets/music/sfx/voices/OGA_CC0/GetOverHere.ogg',
        '/assets/music/sfx/voices/OGA_CC0/AlertHeavyCasulaties.ogg',
        '/assets/music/sfx/voices/OGA_CC0/ProjectedLifeSpanLow.ogg',
        '/assets/music/sfx/voices/OGA_CC0/TargetOutOfSight.ogg',
        '/assets/music/sfx/voices/OGA_CC0/OneMoreDown.ogg',
        '/assets/music/sfx/voices/OGA_CC0/WhereAreYou.ogg',
        '/assets/music/sfx/voices/OGA_CC0/TargetFound.ogg',
        '/assets/music/sfx/voices/OGA_CC0/WhereDidYouGo.ogg',
        '/assets/music/sfx/voices/OGA_CC0/I_need_backup.ogg',
        '/assets/music/sfx/voices/OGA_CC0/Initializing.ogg',
        '/assets/music/sfx/voices/OGA_CC0/TargetNeutralized.ogg',
        '/assets/music/sfx/voices/OGA_CC0/TargetAcquired.ogg',
        '/assets/music/sfx/voices/OGA_CC0/TargetLost.ogg',
        '/assets/music/sfx/voices/OGA_CC0/BackupRequested.ogg',
        '/assets/music/sfx/voices/OGA_CC0/TakingCover.ogg'
    ],
    tube: [
        '/assets/music/tube/682838__iainmccurdy__cardboard-tube-pop.ogg',
        '/assets/music/tube/222447__speedenza__metal-tube-1-small.ogg',
        '/assets/music/tube/528157__gecop__irontube.ogg',
        '/assets/music/tube/321802__lloydevans09__pvc_pipe_hit_4.ogg',
        '/assets/music/tube/321805__lloydevans09__pvc_pipe_hit_1.ogg',
        '/assets/music/tube/321809__lloydevans09__pvc_pipe_hit_2.ogg',
        '/assets/music/tube/321808__lloydevans09__pvc_pipe_hit_3.ogg',
        '/assets/music/tube/707925__nikasound__glass-tube-popping.ogg',
        '/assets/music/tube/486221__salvadormiranda__pvc-tube-hit-2.ogg',
        '/assets/music/tube/341499__the_yura__kick-plastic-tube.ogg'
    ],
    glitch: [
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864184__mirmaximus__sfx_damage_glitch_2.ogg',
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864187__mirmaximus__sfx_pc_crash.ogg',
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864189__mirmaximus__sfx_energyglitch.ogg',
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864188__mirmaximus__sfx_computer_froze.ogg',
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864186__mirmaximus__sfx_outage_hit.ogg'
    ],
    common: [
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_hit_03_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_02_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_01_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_switch_01_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_misc_24_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_06_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_hit_01_(1).ogg'
    ],
    loop: [
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_water_01_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_ambient_03_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_loop_machine_02_(1).ogg'
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
        this.preamp.gain.value = 0.35;
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
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            return await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            return null;
        }
    }

    public trigger(events: FractalEvent[], barStartTime: number, tempo: number): void {
        if (!this.isReady) return;
        events.forEach(event => {
            if (event.type !== 'sfx') return;
            const { mood, genre, rules } = event.params as { mood: Mood, genre: Genre, rules?: SfxRule };
            
            if (genre === 'blues') return;

            const category = this.getCategoryForContext(mood, genre, rules);
            const samplePool = this.buffers.get(category);
            if (!samplePool || samplePool.length === 0) return;

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
        if (rules && rules.categories && rules.categories.length > 0) {
            const totalWeight = rules.categories.reduce((sum, cat) => sum + cat.weight, 0);
            let rand = Math.random() * totalWeight;
            for (const category of rules.categories) {
                rand -= category.weight;
                if (rand <= 0) return category.name;
            }
        }

        const rand = Math.random();
        if (genre === 'reggae') return 'tube';

        if (genre === 'psybient') {
            if (rand < 0.4) return 'glitch';
            if (rand < 0.7) return 'laser';
            if (rand < 0.85) return 'voice';
            return 'tube';
        }

        if (genre === 'ambient') {
            if (mood === 'dark' || mood === 'anxious') {
                if (rand < 0.6) return 'dark';
                return 'voice';
            }
            if (rand < 0.7) return 'common';
            return 'loop';
        }
        
        return 'common';
    }
    
    public allNotesOff() {
       this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
       this.activeSources.clear();
    }
}
