
import type { FractalEvent } from "@/types/fractal";

const DRUM_SAMPLES: Record<string, string> = {
    'kick': '/assets/drums/kick_drum6.wav',
    'snare': '/assets/drums/snare.wav',
    'hihat_closed': '/assets/drums/closed_hi_hat_accented.wav',
    'hihat_open': '/assets/drums/open_hh_top2.wav',
    'crash': '/assets/drums/crash1.wav',
    'ride': '/assets/drums/cymbal1.wav',
    'tom_high': '/assets/drums/hightom.wav',
    'tom_mid': '/assets/drums/midtom.wav',
    'tom_low': '/assets/drums/lowtom.wav',
};

type Sampler = {
    buffers: Map<string, AudioBuffer>;
    load: (samples: Record<string, string>) => Promise<void>;
    triggerAttack: (note: string, time: number, velocity?: number) => void;
}

function createSampler(audioContext: AudioContext, output: AudioNode): Sampler {
    const buffers = new Map<string, AudioBuffer>();

    const load = async (samples: Record<string, string>) => {
        const promises = Object.entries(samples).map(async ([note, url]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch sample: ${url} (${response.statusText})`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                buffers.set(note, audioBuffer);
            } catch (error) {
                console.error(`Error loading sample ${note} from ${url}:`, error);
            }
        });
        await Promise.all(promises);
    };

    const triggerAttack = (note: string, time: number, velocity = 1) => {
        const buffer = buffers.get(note);
        if (!buffer) return;

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(velocity, audioContext.currentTime);
        gainNode.gain.setTargetAtTime(velocity, time, 0.01);

        source.connect(gainNode);
        gainNode.connect(output);
        source.start(time);
    };

    return { buffers, load, triggerAttack };
}

export class DrumMachine {
    private audioContext: AudioContext;
    private sampler: Sampler | null = null;
    private outputNode: AudioNode;
    private preamp: GainNode;
    public isInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = destination;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 4.5;
        this.preamp.connect(this.outputNode);
    }

    async init() {
        if (this.isInitialized) return;
        this.sampler = createSampler(this.audioContext, this.preamp);
        await this.sampler.load(DRUM_SAMPLES);
        this.isInitialized = true;
        console.log('[DrumMachine] Initialized and samples loaded.');
    }

    schedule(score: FractalEvent[], barStartTime: number, tempo: number) {
        if (!this.sampler || !this.isInitialized) {
            console.warn('[DrumMachine] Attempted to schedule before initialized.');
            return;
        }

        const beatDuration = 60 / tempo;
        
        for (const event of score) {
            if (!event.type.startsWith('drum_')) continue;

            const sampleName = event.type.replace('drum_', '');
            
            // Время в событии (event.time) - это смещение в долях такта от начала такта.
            // barStartTime - это абсолютное время начала такта в AudioContext.
            const absoluteTime = barStartTime + (event.time * beatDuration);
            
            if (!isFinite(absoluteTime)) {
                console.error('[DrumMachine] Non-finite time scheduled for event:', event);
                continue;
            }

            this.sampler.triggerAttack(sampleName, absoluteTime, event.weight);
        }
    }

    public stop() {}
}
