import type { Genre, Mood } from '@/types/music';
import { vault } from './audio-cache';

/**
 * @fileOverview Плеер текстур V15.1 — "TypeScript Fixes".
 * #ЗАЧЕМ: Исправление ошибок типизации, аналогичных SfxSynthManager.
 */

export class SparklePlayer {
    private audioContext: AudioContext;
    private gainNode: GainNode;
    private preamp: GainNode;
    private melodicBuffers: AudioBuffer[] = [];
    private organicBuffers: AudioBuffer[] = [];
    public isInitialized = false;
    private isFullyInitialized = false;
    private activeSources: Set<AudioBufferSourceNode> = new Set();

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.gainNode = this.audioContext.createGain();
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.225; 
        this.preamp.connect(this.gainNode);
        this.gainNode.connect(destination);
    }

    async init(limitPerCategory: number = -1) {
        if (this.isFullyInitialized) return;
        if (limitPerCategory > 0 && this.isInitialized) return;

        try {
            const response = await fetch('/sparkles-manifest.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const sparkleSamples = await response.json();

            const categories = Object.keys(sparkleSamples) as (keyof typeof sparkleSamples)[];
            const loadTasks: Promise<void>[] = [];

            for (const cat of categories) {
                const urls = sparkleSamples[cat];
                const targetUrls = limitPerCategory > 0 ? urls.slice(0, limitPerCategory) : urls;
                const bufferTarget = cat === 'MELODIC' ? this.melodicBuffers : this.organicBuffers;

                targetUrls.forEach((url: string) => {
                    loadTasks.push(this.loadSample(url).then(buf => {
                        if (buf && !bufferTarget.includes(buf)) bufferTarget.push(buf);
                    }));
                });
            }

            await Promise.all(loadTasks);
            this.isInitialized = true;
            if (limitPerCategory === -1) this.isFullyInitialized = true;
            console.log(`[SparklePlayer] Initialized with ${this.melodicBuffers.length} melodic and ${this.organicBuffers.length} organic samples.`);
        } catch (e) {
            console.warn('[SparklePlayer] Init error:', e);
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const arrayBuffer = await vault.fetch(url);
            if (!arrayBuffer) return null;
            return await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
        } catch (error) {
            return null;
        }
    }

    public playRandomSparkle(time: number, genre?: Genre, mood?: Mood, category?: 'MELODIC' | 'ORGANIC') {
        if (!this.isInitialized) return;
        if (genre === 'blues' || genre === 'reggae') return;

        let samplePool: AudioBuffer[] = [];
        if (category) {
            samplePool = category === 'MELODIC' ? this.melodicBuffers : this.organicBuffers;
        } else {
            const melodicChance = (genre === 'ambient' || genre === 'psybient') ? 0.35 : 0.7;
            samplePool = Math.random() < melodicChance ? this.melodicBuffers : this.organicBuffers;
        }

        if (samplePool.length === 0) {
            samplePool = this.melodicBuffers.length > 0 ? this.melodicBuffers : this.organicBuffers;
        }

        if (samplePool.length === 0) return;
        
        const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.preamp);
        
        const now = Math.max(time, this.audioContext.currentTime);
        source.start(now);
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
            try { source.disconnect(); } catch(e) {}
        };
    }
    
    public setVolume(volume: number) {
        if (isFinite(volume)) {
            this.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.05);
        }
    }
    
    public stopAll() {
        this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
        this.activeSources.clear();
    }

    public dispose() { 
        this.stopAll(); 
        this.gainNode.disconnect(); 
        this.preamp.disconnect();
    }
}
