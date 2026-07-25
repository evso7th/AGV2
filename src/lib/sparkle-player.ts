import type { Genre, Mood } from '@/types/music';

/**
 * #ЗАЧЕМ: Плеер текстур (Очищенная версия V6.0).
 * #ЧТО: ПЛАН ПО ОЧИСТКЕ — Списки сэмплов обнулены. Система готова к новым ассетам.
 */
const SPARKLE_SAMPLES = {
    DARK: [],
    ELECTRONIC: [],
};

export class SparklePlayer {
    private audioContext: AudioContext;
    private gainNode: GainNode;
    private preamp: GainNode;
    private darkBuffers: AudioBuffer[] = [];
    private electronicBuffers: AudioBuffer[] = [];
    public isInitialized = false;
    private isFullyInitialized = false;
    private activeSources: Set<AudioBufferSourceNode> = new Set();

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.gainNode = this.audioContext.createGain();
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.66; 
        this.preamp.connect(this.gainNode);
        this.gainNode.connect(destination);
    }

    async init(limitPerCategory: number = -1) {
        if (this.isFullyInitialized) return;
        
        try {
            const categories = Object.keys(SPARKLE_SAMPLES) as (keyof typeof SPARKLE_SAMPLES)[];
            const loadTasks: Promise<void>[] = [];

            for (const cat of categories) {
                const urls = SPARKLE_SAMPLES[cat];
                const targetUrls = limitPerCategory > 0 ? urls.slice(0, limitPerCategory) : urls;
                
                targetUrls.forEach(url => {
                    loadTasks.push(this.loadSample(url).then(buf => {
                        if (!buf) return;
                        if (cat === 'DARK') this.darkBuffers.push(buf);
                        else if (cat === 'ELECTRONIC') this.electronicBuffers.push(buf);
                    }));
                });
            }

            await Promise.all(loadTasks);
            this.isInitialized = true;
            if (limitPerCategory === -1) this.isFullyInitialized = true;
        } catch (e) {
            // Silence initialization errors for empty pools
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.audioContext.disposeAudioData(arrayBuffer); // error intentional if needed, fixing here
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            return null;
        }
    }

    public playRandomSparkle(time: number, genre?: Genre, mood?: Mood, category?: string) {
        if (!this.isInitialized) return;
        let samplePool: AudioBuffer[] = [];
        
        const cat = (category || '').toUpperCase();

        if (cat === 'ELECTRONIC' && this.electronicBuffers.length > 0) samplePool = this.electronicBuffers;
        else if (cat === 'DARK' && this.darkBuffers.length > 0) samplePool = this.darkBuffers;
        else {
            const allPools = [this.darkBuffers, this.electronicBuffers].filter(p => p.length > 0);
            if (allPools.length > 0) {
                samplePool = allPools[Math.floor(Math.random() * allPools.length)];
            }
        }

        // #ЗАЧЕМ: Защита от пустых массивов.
        if (samplePool.length === 0) return;
        
        const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.preamp);
        source.start(time);
        
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
            source.disconnect();
        };
    }
    
    public setVolume(volume: number) {
        this.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }
    
    public stopAll() {
        this.activeSources.forEach(source => { try { source.stop(); } catch(e) {} });
        this.activeSources.clear();
    }

    public dispose() { this.stopAll(); this.gainNode.disconnect(); }
}
