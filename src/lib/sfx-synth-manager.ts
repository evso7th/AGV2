

import type { FractalEvent, Mood, Genre } from '@/types/fractal';

const SFX_SAMPLES: Record<string, string[]> = {
    dark: [
        '/assets/music/sfx/706518__alesiadavina__horror-sound-effect-paranormal-2-vol-003.ogg',
        '/assets/music/sfx/706519__alesiadavina__halloween-sound-effect-paranormal-3-vol-003.ogg',
        '/assets/music/sfx/706521__alesiadavina__creepy-sound-effect-paranormal-5-vol-003.ogg',
        '/assets/music/sfx/722724__alesiadavina__horror-sound-monster-breath.ogg',
        '/assets/music/sfx/Agony_Labyrinth.ogg',
        '/assets/music/sfx/Cave_Breath.ogg',
        '/assets/music/sfx/Dark_spell_-_1.ogg',
    ],
    laser: [
        '/assets/music/sfx/laser/01_SFX.ogg',
        '/assets/music/sfx/laser/34_SFX.ogg',
        '/assets/music/sfx/laser/41_SFX.ogg',
        '/assets/music/sfx/laser/645999__johncanyon__moan3_mono.ogg',
        '/assets/music/sfx/laser/825552__akelley6__computer-error-beep.ogg',
        '/assets/music/sfx/laser/825554__akelley6__doggy-synth.ogg',
        '/assets/music/sfx/laser/825582__akelley6__lazer-blast.ogg',
        '/assets/music/sfx/laser/Robot_Confused.ogg',
    ],
    voice: [
        '/assets/music/sfx/voice/137943__ionicsmusic__robot-voice-no-data.ogg',
        '/assets/music/sfx/voice/187919__vasotelvi__deletion-completed.ogg.1296434.wav',
        '/assets/music/sfx/voice/196890__ionicsmusic__race-robot-finish-line.ogg',
        '/assets/music/sfx/voice/196890__ionicsmusic__race-robot-finish-line__1_.ogg',
        '/assets/music/sfx/voice/219567__qubodup__robot-shutdown-sequence-initiated.ogg',
        '/assets/music/sfx/voice/220372__thehiddenvoice__robotic-voice.ogg',
        '/assets/music/sfx/voice/234940__esseffe1__bot1.ogg',
        '/assets/music/sfx/voice/273060__carmsie__helter-skelter.ogg',
        '/assets/music/sfx/voice/277403__landlucky__game-over-sfx-and-voice.ogg',
        '/assets/music/sfx/voice/287974__deleted_user_4798915__sfx-robotic-transmission.ogg',
        '/assets/music/sfx/voice/316288__littlerobotsoundfactory__robot2_05.ogg',
        '/assets/music/sfx/voice/332848__carmsie__never-let-you-go.ogg',
        '/assets/music/sfx/voice/332848__carmsie__never-let-you-go__1_.ogg',
        '/assets/music/sfx/voice/339624__carmsie__know-more.ogg',
        '/assets/music/sfx/voice/339625__carmsie__just-a-dream.ogg',
        '/assets/music/sfx/voice/339627__carmsie__disarm-yourself.ogg',
        '/assets/music/sfx/voice/339628__carmsie__you-cannot-harm-me.ogg',
        '/assets/music/sfx/voice/339629__carmsie__tin-man-respect.ogg',
        '/assets/music/sfx/voice/339630__carmsie__theft.ogg',
        '/assets/music/sfx/voice/339631__carmsie__robot-statements.ogg',
        '/assets/music/sfx/voice/339631__carmsie__robot-statements__1_.ogg',
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
        '/assets/music/sfx/voice/747684__jeddalo__mighty-morphin-power-rangers-megazord-activated-computer-voice.ogg',
        '/assets/music/sfx/voice/759879__chungus43a__the-moonbase-doctor-who-cyberman-voice.ogg',
        '/assets/music/sfx/voice/771944__harrisonlace__robotic-deja-vu-vox.ogg',
        '/assets/music/sfx/voice/776420__chungus43a__doctor-who-cybus-cyberman-voice-recreated.ogg',
        '/assets/music/sfx/voice/783026__soundcannon42__robot-voice-analyze-neurons-for-musical-creativity.ogg',
        '/assets/music/sfx/voice/785805__alien_i_trust__sample-pack-link-in-bio-alien-i-trust-i-exist-between-the-known-and-the-unknown.ogg',
        '/assets/music/sfx/voice/789675__alien_i_trust__synth-shot-1-by-alien-i-trust.ogg',
        '/assets/music/sfx/voice/953__vate__processed-vocoder-voice.ogg',
        //'/assets/music/sfx/voice/Enjoy_every_moment_F.ogg',
        '/assets/music/sfx/voice/Enjoy_every_moment_F.ogg.824252.wav',
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
        '/assets/music/sfx/voice/mixkit-birds-chirping-near-the-river-2473.ogg',
        '/assets/music/sfx/voice/mixkit-birds-in-the-jungle-2434.ogg',
        '/assets/music/sfx/voice/mixkit-fast-small-sweep-transition-166.ogg',
        '/assets/music/sfx/voice/mixkit-morning-birds-2472.ogg',
        '/assets/music/sfx/voice/mixkit-sci-fi-robot-speaking-289.ogg',
        '/assets/music/sfx/voice/voice_game-over.ogg',
        '/assets/music/sfx/voice/wazzap_bro_relax.ogg',
        '/assets/music/sfx/voice/you_are_just_another.ogg'
    ],
    bongo: [
        '/assets/music/sfx/bongo/bongo_ bossa_perc_a.ogg',
        '/assets/music/sfx/bongo/bongo_bonga_c.ogg',
        '/assets/music/sfx/bongo/bongo_one_shot_90bpm_e_minor.ogg',
    ],
    common: [
        '/assets/music/sfx/02_SFX.ogg',
        '/assets/music/sfx/825551__akelley6__broken-radio-loop.ogg',
        '/assets/music/sfx/825553__akelley6__death-stinger.ogg',
        '/assets/music/sfx/825556__akelley6__empty-space-desert.ogg',
        '/assets/music/sfx/825558__akelley6__foxes-fall.ogg',
        '/assets/music/sfx/825572__akelley6__magic-ui.ogg',
        '/assets/music/sfx/825576__akelley6__vintage-power-down.ogg',
        '/assets/music/sfx/825577__akelley6__vintage-power-up.ogg',
        '/assets/music/sfx/825579__akelley6__wind-up-sfx.ogg',
        '/assets/music/sfx/825583__akelley6__omnipotent.ogg',
        '/assets/music/sfx/825585__akelley6__quake.ogg',
        '/assets/music/sfx/825587__akelley6__droplet-sfx.ogg',
        '/assets/music/sfx/770720__richcraftstudios__bat-screech.ogg'
    ]
};


export class SfxSynthManager {
    private context: AudioContext;
    private destination: GainNode;
    private isReady = false;
    private buffers: Map<string, AudioBuffer[]> = new Map();
    private activeSources: Set<AudioBufferSourceNode> = new Set();


    constructor(context: AudioContext, destination: GainNode) {
        this.context = context;
        this.destination = destination;
    }

    public async init(): Promise<void> {
        if (this.isReady) return;
        
        console.log('[SFX] Initializing Sampler Manager...');
        
        const allCategories = Object.keys(SFX_SAMPLES);
        for (const category of allCategories) {
            const urls = SFX_SAMPLES[category];
            const categoryBuffers: AudioBuffer[] = [];
            const promises = urls.map(url => this.loadSample(url).then(buffer => {
                if(buffer) categoryBuffers.push(buffer);
            }));
            await Promise.all(promises);
            this.buffers.set(category, categoryBuffers);
             console.log(`[SFX] Loaded ${categoryBuffers.length} samples for category: ${category}`);
        }
        
        this.isReady = true;
        console.log('[SFX] Sampler Manager initialized and ready.');
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch sample: ${url} (${response.statusText})`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading SFX sample ${url}:`, error);
            return null;
        }
    }


    public trigger(events: FractalEvent[], barStartTime: number, tempo: number): void {
        console.log(`[SfxManager] Received ${events.length} events to trigger.`);
        if (!this.isReady) {
            console.warn('[SFX] Trigger called but not ready.');
            return;
        }

        events.forEach(event => {
            if (event.type !== 'sfx') return;

            const { mood, genre } = event.params as { mood: Mood, genre: Genre };
            const category = this.getCategoryForContext(mood, genre);
            const samplePool = this.buffers.get(category);

            if (!samplePool || samplePool.length === 0) {
                console.warn(`[SFX] No samples found for category: ${category}`);
                return;
            }

            const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.destination);

            const beatDuration = 60 / tempo;
            const startTime = barStartTime + (event.time * beatDuration);

            // Step 4: SFX Manager Logging
            console.log(`%c[SFX Player] Triggering effect. Category: '${category}'. Start time: ${startTime.toFixed(2)}`, 'color: #FFA500');
            source.start(startTime);
            
            this.activeSources.add(source);
            source.onended = () => {
                this.activeSources.delete(source);
                source.disconnect();
            };
        });
    }

    private getCategoryForContext(mood: Mood, genre: Genre): string {
        const rand = Math.random();
        if (rand < 0.2) return 'bongo';
        if (rand < 0.4) return 'voice';

        if (mood === 'dark' || mood === 'anxious') return 'dark';
        if (genre === 'trance' || genre === 'house' || genre === 'progressive') return 'laser';

        return 'common';
    }
    
    public allNotesOff() {
       this.activeSources.forEach(source => {
            try {
                source.stop(0);
            } catch(e) { /* ignore */ }
       });
       this.activeSources.clear();
    }

    public isSynthReady(): boolean {
        return this.isReady;
    }
}

    
