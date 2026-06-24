import type { Genre, Mood } from '@/types/music';

/**
 * @fileOverview Обновление библиотеки Sparkles V5.1 — "Silent Protocol".
 * #ЗАЧЕМ: ПЛАН №1282 — Отключение логов перед деплоем.
 */
const SPARKLE_SAMPLES = {
    DARK: [
        '/assets/music/droplets/dark/31_SFX_1.ogg',
        '/assets/music/droplets/dark/Fearsome.ogg',
        '/assets/music/droplets/dark/Analog_Stab_Cm_70Bpm.ogg',
        '/assets/music/droplets/dark/Grounding.ogg',
        '/assets/music/droplets/dark/CS_Bend_Synth_Dm_70Bpm.ogg',
        '/assets/music/droplets/dark/22-Synth.ogg',
        '/assets/music/droplets/dark/50_SFX_2.ogg',
        '/assets/music/droplets/dark/PianoAm_90Bpm.ogg',
        '/assets/music/droplets/dark/07Space_Chimes_Am.ogg',
        '/assets/music/droplets/dark/CS_Grit_Synth_Dm_70Bpm.ogg',
        '/assets/music/droplets/dark/Pluck_Lead_C_70Bpm.ogg',
        '/assets/music/droplets/dark/Dark_Kick_70Bpm.ogg',
        '/assets/music/droplets/dark/01_SFX.ogg',
        '/assets/music/droplets/dark/01_Synth_2.ogg',
        '/assets/music/droplets/dark/Gulls.ogg',
        '/assets/music/droplets/dark/34_SFX.ogg',
        '/assets/music/droplets/dark/10The_Light_That_Burns_Am_70Bpm.ogg',
        '/assets/music/droplets/dark/Drill.ogg',
        '/assets/music/droplets/dark/11-Synth.ogg',
        '/assets/music/droplets/dark/Bright_Bells_C_70Bpm.ogg',
        '/assets/music/droplets/dark/09_SFX_Hit.ogg',
        '/assets/music/droplets/dark/Panning_Synth_C_70Bpm.ogg',
        '/assets/music/droplets/dark/Cosmic_FX_C_70Bpm.ogg',
        '/assets/music/droplets/dark/Big_Synth_Pad_Hit_Cm_70Bpm.ogg',
        '/assets/music/droplets/dark/Abstruse.ogg',
        '/assets/music/droplets/dark/41_SFX.ogg',
        '/assets/music/droplets/dark/Synth_Cm.ogg',
        '/assets/music/droplets/dark/BladeWalker.ogg',
        '/assets/music/droplets/dark/02_SFX.ogg',
        '/assets/music/droplets/dark/27_SFX_2.ogg',
        '/assets/music/droplets/dark/28_SFX.ogg',
        '/assets/music/droplets/dark/Ghosthack_-_Warm_Lead_C_70Bpm.ogg',
        '/assets/music/droplets/dark/10-Synth.ogg',
        '/assets/music/droplets/dark/03Rain_On_Mars_Am.ogg',
        '/assets/music/droplets/dark/Light_Bells_Dm_70Bpm.ogg',
        '/assets/music/droplets/dark/09Martian_Forrest_Am_70Bpm.ogg',
        '/assets/music/droplets/dark/Reverse_SynthAm_90Bpm.ogg',
        '/assets/music/droplets/dark/04In_The_Shadows_Am_70Bpm.ogg',
        '/assets/music/droplets/dark/12Broken_Replicant_70Bpm.ogg',
        '/assets/music/droplets/dark/Deep_Kick_FX_70Bpm.ogg',
        '/assets/music/droplets/dark/Bell_Pluck_C_70Bpm.ogg',
        '/assets/music/droplets/dark/Dark_Matter_Synth_C_70Bpm.ogg',
    ],
    ELECTRONIC: [
        '/assets/music/droplets/electro/Tubator.ogg',
        '/assets/music/droplets/electro/SalvingPad.ogg',
        '/assets/music/droplets/electro/Coil.ogg',
        '/assets/music/droplets/electro/Plucker (1).ogg',
        '/assets/music/droplets/electro/NoiseFxB06.ogg',
        '/assets/music/droplets/electro/Plucker.ogg',
        '/assets/music/droplets/electro/CloseA.ogg',
        '/assets/music/droplets/electro/E_Rhythm.ogg',
        '/assets/music/droplets/electro/HousedBass7.ogg',
        '/assets/music/droplets/electro/Brass Pad.ogg',
        '/assets/music/droplets/electro/Slow Motion.ogg',
        '/assets/music/droplets/electro/WhooshB.ogg',
        '/assets/music/droplets/electro/New Rave.ogg',
        '/assets/music/droplets/electro/Metallix.ogg',
        '/assets/music/droplets/electro/Deep Sea.ogg',
        '/assets/music/droplets/electro/Raw Oscillator.ogg',
        '/assets/music/droplets/electro/Flanged Bells.ogg',
        '/assets/music/droplets/electro/Starter.ogg',
        '/assets/music/droplets/electro/ElectroShock.ogg',
        '/assets/music/droplets/electro/Electro Train.ogg',
        '/assets/music/droplets/electro/MelancholicPad.ogg',
        '/assets/music/droplets/electro/African Night.ogg',
        '/assets/music/droplets/electro/Barebelli.ogg',
        '/assets/music/droplets/electro/Electricity.ogg',
        '/assets/music/droplets/electro/Triologic.ogg',
        '/assets/music/droplets/electro/Repeated.ogg',
        '/assets/music/droplets/electro/Solina.ogg',
        '/assets/music/droplets/electro/Smoking.ogg',
        '/assets/music/droplets/electro/Collision.ogg',
        '/assets/music/droplets/electro/Riot.ogg',
        '/assets/music/droplets/electro/Tekki.ogg',
    ],
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
            // console.error('[SparklePlayer] Failed to initialize:', e);
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            (buffer as any).url = url; 
            return buffer;
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
