
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
        '/assets/music/sfx/laser/825552__akelley6__computer-error-beep.ogg',
        '/assets/music/sfx/laser/825554__akelley6__doggy-synth.ogg',
        '/assets/music/sfx/laser/825582__akelley6__lazer-blast.ogg',
        '/assets/music/sfx/laser/Robot_Confused.ogg',
    ],
    voice: [
        '/assets/music/sfx/voice/137943__ionicsmusic__robot-voice-no-data.ogg',
        '/assets/music/sfx/voice/187919__vasotelvi__deletion-completed.ogg.1296434.wav',
        '/assets/music/sfx/voice/mixkit-sci-fi-robot-speaking-289.ogg',
    ],
    bongo: [
        '/assets/music/sfx/bongo/bongo_ bossa_perc_a.ogg',
        '/assets/music/sfx/bongo/bongo_bonga_c.ogg',
        '/assets/music/sfx/bongo/bongo_one_shot_90bpm_e_minor.ogg',
    ],
    common: [
        '/assets/music/sfx/02_SFX.ogg',
        '/assets/music/sfx/825587__akelley6__droplet-sfx.ogg',
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

            console.log(`[SFX] Triggering effect from category '${category}' at time ${startTime.toFixed(2)}`);
            source.start(startTime);
            
            this.activeSources.add(source);
            source.onended = () => {
                this.activeSources.delete(source);
                source.disconnect();
            };
        });
    }

    private getCategoryForContext(mood: Mood, genre: Genre): string {
        // Simple logic for now. Bongo is always an option.
        const rand = Math.random();
        if (rand < 0.2) return 'bongo';

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
