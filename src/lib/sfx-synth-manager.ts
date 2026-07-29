import type { FractalEvent, Mood, Genre, SfxRule } from '@/types/fractal';

/**
 * #ЗАЧЕМ: Менеджер SFX V10.0 — "The Living World".
 * #ЧТО: Подключение всех категорий: Wood, Glass, Metal, Glitch, Voice, Tubes.
 *       Реализация "Silent Kitchen" для Ambient/Psybient/Reggae.
 */
const SFX_SAMPLES: Record<string, string[]> = {
    dark: [
        '/assets/music/SFX/677359__saha213131__horrorcinematicdarkhorrorroomtone20_(1).ogg',
        '/assets/music/SFX/546170__waveplaysfx__eerie-music-box-hits.ogg',
        '/assets/music/SFX/269097__breo2012__insane.ogg'
    ],
    laser: [
        '/assets/music/sfx/laser/01_SFX.ogg',
        '/assets/music/sfx/laser/34_SFX.ogg',
        '/assets/music/sfx/laser/41_SFX.ogg',
        '/assets/music/sfx/laser/825582__akelley6__lazer-blast.ogg'
    ],
    voice: [
        '/assets/music/sfx/voice/137943__ionicsmusic__robot-voice-no-data.ogg',
        '/assets/music/sfx/voice/219567__qubodup__robot-shutdown-sequence-initiated.ogg',
        '/assets/music/sfx/voice/339624__carmsie__know-more.ogg',
        '/assets/music/sfx/voice/339633__carmsie__meat-with-feelings.ogg',
        '/assets/music/sfx/voice/783026__soundcannon42__robot-voice-analyze-neurons-for-musical-creativity.ogg'
    ],
    tube: [
        '/assets/music/tube/682838__iainmccurdy__cardboard-tube-pop.ogg',
        '/assets/music/tube/222447__speedenza__metal-tube-1-small.ogg',
        '/assets/music/tube/528157__gecop__irontube.ogg',
        '/assets/music/tube/321802__lloydevans09__pvc_pipe_hit_4.ogg',
        '/assets/music/tube/321805__lloydevans09__pvc_pipe_hit_1.ogg',
        '/assets/music/tube/486221__salvadormiranda__pvc-tube-hit-2.ogg',
        '/assets/music/tube/341499__the_yura__kick-plastic-tube.ogg'
    ],
    glitch: [
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864184__mirmaximus__sfx_damage_glitch_2.ogg',
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864187__mirmaximus__sfx_pc_crash.ogg',
        '/assets/music/sfx/46054__mirmaximus__glitch-city/864189__mirmaximus__sfx_energyglitch.ogg'
    ],
    common: [
        '/assets/music/SFX/sfx_100_v2/sfx100v2_wood_hit_03_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_glass_02_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_metal_01_(1).ogg',
        '/assets/music/SFX/sfx_100_v2/sfx100v2_switch_01_(1).ogg'
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
        this.preamp.gain.value = 0.35; // Снижено для фонового баланса V10.0
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
            
            // Блюз не играет SFX
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

        // Специальная логика для Reggae: только трубки
        if (genre === 'reggae') return 'tube';

        // Логика для Psybient: акцент на глитчи и голоса
        if (genre === 'psybient') {
            if (rand < 0.4) return 'glitch';
            if (rand < 0.7) return 'laser';
            if (rand < 0.85) return 'voice';
            return 'tube';
        }

        // Логика для Ambient: органика и пространство
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
