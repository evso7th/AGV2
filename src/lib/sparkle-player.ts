
import type { Genre, Mood } from '@/types/music';

const SPARKLE_SAMPLES = {
    NON_ELECTRONIC: [
        '/assets/music/droplets/sweepingbells.ogg',//есть
        '/assets/music/droplets/icepad.ogg',//есть
        '/assets/music/droplets/dreams.mp3',//есть
        '/assets/music/droplets/Sleep.ogg',//есть
        '/assets/music/droplets/AcChord.ogg',//есть
        '/assets/music/droplets/SweetHarpRev1.ogg', //есть
        '/assets/music/droplets/end.mp3', //есть
        '/assets/music/droplets/BirdFX.ogg',//есть
        '/assets/music/droplets/vibes_a.ogg',//есть
        '/assets/music/droplets/belldom.ogg',//есть
        '/assets/music/droplets/merimbo.ogg',//есть
        '/assets/music/droplets/ocean.mp3',//есть
        '/assets/music/droplets/BeepFreak.ogg',//есть
        '/assets/music/droplets/GlassBell.ogg',//есть
        '/assets/music/droplets/EPstein.ogg',//есть
        '/assets/music/droplets/Fearsome.ogg',//есть
        '/assets/music/droplets/Dizzy.ogg',//есть
        '/assets/music/droplets/BladeWalker.ogg',
        '/assets/music/droplets/Confusion.ogg',
        '/assets/music/droplets/Koto1.ogg',
        '/assets/music/droplets/Freakystones.ogg',
        
    ],
    ELECTRONIC: [
        '/assets/music/droplets/electro/Tubator.ogg',//есть
        '/assets/music/droplets/electro/SalvingPad.ogg',//есть
        '/assets/music/droplets/electro/NoiseFxB06.ogg',//есть
        '/assets/music/droplets/electro/CloseA.ogg',//есть
        '/assets/music/droplets/electro/E_Rhythm.ogg',//есть
        '/assets/music/droplets/electro/HousedBass7.ogg',//есть
        '/assets/music/droplets/electro/Starter.ogg',//есть,
        '/assets/music/droplets/electro/ElectroShock.ogg',//есть
        '/assets/music/droplets/electro/MelancholicPad.ogg',//есть
        '/assets/music/droplets/electro/Electricity.ogg',//есть
        
    ],
    DARK: [
        '/assets/music/droplets/dark/Abstruse.ogg',//*
        '/assets/music/droplets/dark/Fearsome.ogg',//*
        '/assets/music/droplets/dark/Grounding.ogg',//*
        '/assets/music/droplets/dark/Gulls.ogg',//*
        '/assets/music/droplets/dark/BladeWalker.ogg',
        '/assets/music/droplets/dark/Drill.ogg'
    ]
};

export class SparklePlayer {
    private audioContext: AudioContext;
    private gainNode: GainNode;
    private nonElectroBuffers: AudioBuffer[] = [];
    private electroBuffers: AudioBuffer[] = [];
    private darkBuffers: AudioBuffer[] = [];
    public isInitialized = false;
    private activeSources: Set<AudioBufferSourceNode> = new Set();


    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(destination);
    }

    async init() {
        if (this.isInitialized) return;
        try {
            const loadPromises = [
                ...SPARKLE_SAMPLES.NON_ELECTRONIC.map(url => this.loadSample(url)),
                ...SPARKLE_SAMPLES.ELECTRONIC.map(url => this.loadSample(url)),
                ...SPARKLE_SAMPLES.DARK.map(url => this.loadSample(url)),
            ];
            
            const allBuffers = await Promise.all(loadPromises);
            
            const nonElectronicCount = SPARKLE_SAMPLES.NON_ELECTRONIC.length;
            const electronicCount = SPARKLE_SAMPLES.ELECTRONIC.length;
            
            this.nonElectroBuffers = allBuffers.slice(0, nonElectronicCount).filter(b => b) as AudioBuffer[];
            this.electroBuffers = allBuffers.slice(nonElectronicCount, nonElectronicCount + electronicCount).filter(b => b) as AudioBuffer[];
            this.darkBuffers = allBuffers.slice(nonElectronicCount + electronicCount).filter(b => b) as AudioBuffer[];

            this.isInitialized = true;
            console.log('[SparklePlayer] Initialized and samples loaded.');
        } catch (e) {
            console.error('[SparklePlayer] Failed to initialize:', e);
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch sparkle sample: ${url}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            (buffer as any).url = url; // Attach URL for logging
            return buffer;
        } catch (error) {
            console.error(`Error loading sparkle sample ${url}:`, error);
            return null;
        }
    }

    public playRandomSparkle(time: number, genre?: Genre, mood?: Mood) {
        if (!this.isInitialized) return;

        const electronicGenres: Genre[] = ['house', 'progressive', 'rnb', 'trance', 'rock', 'blues'];
        let samplePool: AudioBuffer[];

        if (mood === 'dark') {
            samplePool = this.darkBuffers;
            console.log('[SparklePlayer] Using DARK sample set.');
        } else if (genre && electronicGenres.includes(genre)) {
            samplePool = this.electroBuffers;
            console.log(`[SparklePlayer] Using ELECTRONIC sample set for genre: ${genre}.`);
        } else {
            samplePool = this.nonElectroBuffers;
            console.log(`[SparklePlayer] Using NON-ELECTRONIC sample set for genre: ${genre || 'default'}.`);
        }

        if (samplePool.length === 0) {
             console.warn(`[SparklePlayer] No samples loaded for the selected genre/mood pool.`);
             return;
        }
        
        const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);
        
        const sampleUrlForLogging = (buffer as any)?.url || 'Unknown';
        console.log(`[SparklePlayer] Playing sample: ${sampleUrlForLogging.substring(sampleUrlForLogging.lastIndexOf('/') + 1)} at time ${time.toFixed(2)}`);
        source.start(time);
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
        };
    }
    
    public setVolume(volume: number) {
        this.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }
    
    public stopAll() {
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch(e) {
                // Ignore errors from stopping already-stopped sources
            }
        });
        this.activeSources.clear();
    }

    public dispose() {
        this.stopAll();
        this.gainNode.disconnect();
    }
}
