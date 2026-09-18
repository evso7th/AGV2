import type { FractalEvent, Mood, Genre } from '@/types/fractal';
import { vault } from './audio-cache';

/**
 * @fileOverview Менеджер SFX V15.1 — "TypeScript Fixes".
 * #ЗАЧЕМ: Исправление ошибок типизации после перехода на динамические манифесты.
 */

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
        this.preamp.gain.value = 0.325;
        this.preamp.connect(destination);
    }

    public async init(limitPerCategory: number = -1): Promise<void> {
        if (this.isFullyInitialized) return;
        if (limitPerCategory > 0 && this.isReady) return;

        try {
            const response = await fetch('/sfx-manifest.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const sfxSamples = await response.json();

            const allCategories = Object.keys(sfxSamples);
            for (const category of allCategories) {
                const urls = sfxSamples[category];
                const targetUrls = limitPerCategory > 0 ? urls.slice(0, limitPerCategory) : urls;
                
                if (!this.buffers.has(category)) this.buffers.set(category, []);
                const categoryBuffers = this.buffers.get(category)!;

                const promises = targetUrls.map((url: string) => this.loadSample(url).then(buffer => {
                    if(buffer && !categoryBuffers.includes(buffer)) categoryBuffers.push(buffer);
                }));
                await Promise.all(promises);
            }
            this.isReady = true;
            if (limitPerCategory === -1) this.isFullyInitialized = true;
            console.log(`[SfxSynthManager] Initialized with ${this.buffers.size} categories.`);
        } catch (e) {
            console.warn('[SfxSynthManager] Init error:', e);
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const arrayBuffer = await vault.fetch(url);
            if (!arrayBuffer) return null;
            return await this.context.decodeAudioData(arrayBuffer.slice(0));
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
            const { mood, genre, rules } = event.params as { mood: Mood, genre: Genre, rules?: { categories: { name: string; weight: number }[] } };
            
            const category = this.getCategoryForContext(mood, genre, rules);
            const samplePool = this.buffers.get(category);
            if (!samplePool || samplePool.length === 0) {
                // Fallback if a specific category like 'voices_oga' doesn't exist in the new manifest
                const fallbackPool = this.buffers.get('voices') || this.buffers.get('sfx_other');
                if (!fallbackPool || fallbackPool.length === 0) return;
                this.playSample(fallbackPool, barStartTime + (event.time * (60 / tempo)));
                return;
            }

            this.playSample(samplePool, barStartTime + (event.time * (60/tempo)));
        });
    }
    
    private playSample(pool: AudioBuffer[], time: number) {
        if (pool.length === 0) return;
        const buffer = pool[Math.floor(Math.random() * pool.length)];
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.preamp);
        
        const startTime = Math.max(time, this.context.currentTime);
        if (isFinite(startTime)) {
            source.start(startTime);
            this.activeSources.add(source);
            source.onended = () => { 
                this.activeSources.delete(source); 
                try { source.disconnect(); } catch(e) {} 
            };
        }
    }

    private getCategoryForContext(mood: Mood, genre: Genre, rules?: { categories: { name: string; weight: number }[] }): string {
        // Note: The manifest keys are now directory-based: ['perc', 'sfx_other', 'tube', 'voices', 'vinyl']
        // The old granular categories like 'sfx_glitch' or 'voices_oga' no longer exist as primary keys.
        // The logic here needs to map the desired sound to the new, broader categories.

        if (rules && rules.categories && rules.categories.length > 0) {
            const totalWeight = rules.categories.reduce((sum: number, cat: { weight: number }) => sum + cat.weight, 0);
            let rand = Math.random() * totalWeight;
            for (const category of rules.categories) {
                rand -= category.weight;
                if (rand <= 0) {
                    // Map old granular names to new broader categories
                    const name = category.name;
                    if (name.includes('voice')) return 'voices';
                    if (name.includes('glitch')) return 'sfx_other';
                    if (this.buffers.has(name)) return name; // e.g. 'perc', 'tube'
                    return 'sfx_other'; // Default fallback
                }
            }
        }
        
        const rand = Math.random();

        if ((genre as string) === 'reggae') {
            return rand < 0.7 ? 'tube' : 'perc';
        }

        if ((genre as string) === 'foundry') {
            // 'sfx_glitch' was mapped to the 'SFX' directory, which is now 'sfx_other'
            return 'sfx_other';
        }

        if ((genre as string) === 'ambient') {
            if (mood === 'dark' || mood === 'anxious' || mood === 'gloomy' || mood === 'melancholic') {
                 if(rand < 0.6) return 'sfx_other'; // Formerly glitch/other
                 return 'perc';
            }
            if (rand < 0.5) return 'sfx_other'; // Formerly sfx_common
            return 'voices'; // Formerly voices_oga
        }
        
        if ((genre as string) === 'blues') {
            if (rand < 0.8) return 'perc';
            return 'vinyl';
        }

        return 'sfx_other'; // Default fallback, formerly 'sfx_common'
    }
    
    public allNotesOff() {
       this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
       this.activeSources.clear();
    }
}
