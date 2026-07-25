import type { FractalEvent, Mood, Genre, SfxRule } from '@/types/fractal';

/**
 * #ЗАЧЕМ: Менеджер SFX (Очищенная версия V6.0).
 * #ЧТО: ПЛАН ПО ОЧИСТКЕ — Все массивы сэмплов обнулены. Система готова к приему нового контента.
 */
const SFX_SAMPLES: Record<string, string[]> = {
    dark: [],
    laser: [],
    voice: [],
    bongo: [],
    common: []
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
            // #ЗАЧЕМ: Защита от пустых массивов.
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
            if (rand < 0.45) return 'voice';
            if (rand < 0.75) return 'laser';
            return 'common';
        }
        if (genre === 'ambient') { 
            if (rand < 0.25) return 'voice'; 
            if (mood === 'dark' || mood === 'anxious') return rand < 0.6 ? 'dark' : 'voice';
            return 'common';
        }
        if (genre === 'blues') {
            if (rand < 0.15) return 'voice'; 
            if (rand < 0.7) return 'dark';  
            return 'common';
        }
        
        if (mood === 'dark' || mood === 'anxious') return rand < 0.6 ? 'dark' : 'voice';
        return 'common';
    }
    
    public allNotesOff() {
       this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
       this.activeSources.clear();
    }
}
