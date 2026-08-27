import type { Genre, Mood } from '@/types/music';
import { vault } from './audio-cache';

/**
 * @fileOverview Плеер текстур V14.2 — "Vault Integration".
 * #ЗАЧЕМ: Перевод на оффлайн-кэш (ПЛАН №2220).
 */
const SPARKLE_SAMPLES = {
    MELODIC: [
        '/assets/music/sparkles/ambient/freesound_community-021382_ambient-spacewav-69144.mp3',
        '/assets/music/sparkles/ambient/freesound_community-a-place-in-space-72508.mp3',
        '/assets/music/sparkles/ambient/freesound_community-medieval_village_atmosphere-79282.mp3',
        '/assets/music/sparkles/ambient/freesound_community-void-ripples-35291.mp3',
        '/assets/music/sparkles/ambient/freesound_community-lost-stars-27849.mp3',
        '/assets/music/sparkles/513184__eliwynnmusic__ambient-4_(1).ogg',
        '/assets/music/sparkles/513185__eliwynnmusic__ambient-3_(1).ogg',
        '/assets/music/sparkles/513186__eliwynnmusic__ambient-2_(1).ogg',
        '/assets/music/sparkles/513187__eliwynnmusic__ambient-1_(1).ogg',
        '/assets/music/sparkles/413585__sergeyionov__cr-ambient-chord_(1).ogg',
        '/assets/music/sparkles/413584__sergeyionov__cr-atmospheric-alarm_(1).ogg',
        '/assets/music/sparkles/572127__kazarin0v__atmosphere-noise_(1).ogg',
        '/assets/music/sparkles/620113__waveplaysfx__synth-atmos-blue-pad-phrase.ogg'
    ],
    ORGANIC: [
        '/assets/music/sparkles/ambient/freesound_community-ambiance_brook_calm-20028.mp3',
        '/assets/music/sparkles/ambient/freesound_community-backyard-nature-14737.mp3',
        '/assets/music/sparkles/ambient/freesound_community-badlands-wind-slow-open-barren-landscape-near-stream-alberta-100315-18027.mp3',
        '/assets/music/sparkles/ambient/freesound_community-gentle-ocean-waves-birdsong-and-gull-7109.mp3',
        '/assets/music/sparkles/ambient/freesound_community-sea-and-seagull-wave-5932.mp3',
        '/assets/music/sparkles/ambient/freesound_community-stream-river-water-up-close-6061.mp3',
        '/assets/music/sparkles/ambient/freesound_community-waves-14877.mp3',
        '/assets/music/sparkles/ambient/freesound_community-rain-light-6704.mp3',
        '/assets/music/sparkles/ambient/freesound_community-wind-2-6196.mp3',
        '/assets/music/sparkles/ambient/freesound_morning-breeze-and-birds-35105.mp3',
        '/assets/music/sparkles/ambient/freesound_community-droplets-in-a-cave-6785.mp3',
        '/assets/music/sparkles/ambient/freesound_community-leaves-rustling-14633.mp3',
        '/assets/music/sparkles/256441__adeathy__ambience_04_white_(1).ogg',
        '/assets/music/sparkles/256442__adeathy__ambience_03_lightgrey_(1).ogg',
        '/assets/music/sparkles/256444__adeathy__ambience_01_black_(1).ogg',
        '/assets/music/sparkles/256445__adeathy__ambience_02_darkgrey_(1).ogg',
        '/assets/music/sparkles/413597__sergeyionov__cr-water-sonar_(1).ogg',
        '/assets/music/sparkles/799303__cvltiv8r__ambient-drone-df-h-df-g-jh-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799305__cvltiv8r__ambient-drone-234896806485-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799307__cvltiv8r__ambient-drone-304583405683058-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799310__cvltiv8r__ambient-drone-4-t-2-34-rt-tt-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799311__cvltiv8r__ambient-drone-40693-04569-03-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799312__cvltiv8r__ambient-drone-456-7-7ws-ss-sss-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799324__cvltiv8r__ambient-drone-_ety__y_rh__fh_d_yh_fu-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799333__cvltiv8r__ambient-drone-dgjk-j-l-u-k-d-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799334__cvltiv8r__ambient-drone-ds-sd-d-fgc-v-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799339__cvltiv8r__ambient-drone-fg-h-jk-fg-gg-g-g-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799341__cvltiv8r__ambient-drone-j-l-j-o-hi-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799351__cvltiv8r__ambient-drone-u-e-tu-d-tg-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799354__cvltiv8r__ambient-drone-wq-hj-meh-o-u-u-io-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/849523__cvltiv8r__alien-craft-ambience-fx_(1).ogg',
        '/assets/music/sparkles/529138__waveplaysfx__ambient-loop-deep-ambient-pulses-3-added-drums.ogg',
        '/assets/music/sparkles/384844__waveplaysfx__ambient-bass-deep-dark-phasing-bassy-swell.ogg',
        '/assets/music/sparkles/388950__waveplaysfx__ambient-bass-deep-soft-bassy-hit-alternate.ogg'
    ]
};

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
        this.preamp.gain.value = 0.225; // Снижено в 2 раза с 0.45
        this.preamp.connect(this.gainNode);
        this.gainNode.connect(destination);
    }

    async init(limitPerCategory: number = -1) {
        if (this.isFullyInitialized) return;
        if (limitPerCategory > 0 && this.isReady) return;

        try {
            const categories = Object.keys(SPARKLE_SAMPLES) as (keyof typeof SPARKLE_SAMPLES)[];
            const loadTasks: Promise<void>[] = [];

            for (const cat of categories) {
                const urls = SPARKLE_SAMPLES[cat];
                const targetUrls = limitPerCategory > 0 ? urls.slice(0, limitPerCategory) : urls;
                const bufferTarget = cat === 'MELODIC' ? this.melodicBuffers : this.organicBuffers;

                targetUrls.forEach(url => {
                    loadTasks.push(this.loadSample(url).then(buf => {
                        if (buf && !bufferTarget.includes(buf)) bufferTarget.push(buf);
                    }));
                });
            }

            await Promise.all(loadTasks);
            this.isInitialized = true;
            if (limitPerCategory === -1) this.isFullyInitialized = true;
        } catch (e) {
            console.warn('[SparklePlayer] Init error:', e);
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const arrayBuffer = await vault.fetch(url);
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