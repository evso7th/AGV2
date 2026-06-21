
import type { FractalEvent, Mood, Genre, SfxRule } from '@/types/fractal';

/**
 * #ЗАЧЕМ: SFX Synth Manager V4.5 — "Voice-Free Protocol".
 * #ЧТО: ПЛАН №1259 — Полное удаление сэмплов категории /voice.
 */

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
    private isReady = false;
    private isFullyInitialized = false;
    private buffers: Map<string, AudioBuffer[]> = new Map();
    private activeSources: Set<AudioBufferSourceNode> = new Set();
    private preamp: GainNode;

    constructor(context: AudioContext, destination: GainNode) {
        this.context = context;
        this.preamp = this.context.createGain();
        this.preamp.gain.value = 0.55; 
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
            const category = this.getCategoryForContext(mood, genre, rules);
            const samplePool = this.buffers.get(category);
            if (!samplePool || samplePool.length === 0) return;
            const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.preamp);
            const beatDuration = 60 / tempo;
            const startTime = barStartTime + (event.time * beatDuration);
            source.start(startTime);
            this.activeSources.add(source);
            source.onended = () => { this.activeSources.delete(source); source.disconnect(); };
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
        if (genre === 'psybient') {
            if (rand < 0.5) return 'laser';
            return 'common';
        }
        if (genre === 'blues') {
            if (rand < 0.7) return 'dark';  
            return 'common';
        }
        if (mood === 'dark' || mood === 'anxious') return 'dark';
        return 'common';
    }
    
    public allNotesOff() {
       this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
       this.activeSources.clear();
    }
}
