
import type { FractalEvent } from "@/types/fractal";

const DRUM_SAMPLES: Record<string, string> = {
    // semantic names
    'kick': '/assets/drums/kick_drum6.wav',
    'snare': '/assets/drums/snare.wav',
    'hat': '/assets/drums/closed_hi_hat_accented.wav',
    'open_hat': '/assets/drums/open_hh_top2.wav',
    'crash': '/assets/drums/crash1.wav',
    'tom1': '/assets/drums/hightom.wav',
    'tom2': '/assets/drums/midtom.wav',
    'tom3': '/assets/drums/lowtom.wav',
    
    // Percussion one-shots (mapped to C2-D#3)
    'perc1': '/assets/drums/perc-001.wav',
    'perc2': '/assets/drums/perc-002.wav',
    'perc3': '/assets/drums/perc-003.wav',
    'perc4': '/assets/drums/perc-004.wav',
    'perc5': '/assets/drums/perc-005.wav',
    'perc6': '/assets/drums/perc-006.wav',
    'perc7': '/assets/drums/perc-007.wav',
    'perc8': '/assets/drums/perc-008.wav',
    'perc9': '/assets/drums/perc-009.wav',
    'perc10': '/assets/drums/perc-010.wav',
    'perc11': '/assets/drums/perc-011.wav',
    'perc12': '/assets/drums/perc-012.wav',
    'perc13': '/assets/drums/perc-013.wav',
    'perc14': '/assets/drums/perc-014.wav',
    'perc15': '/assets/drums/perc-015.wav',
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
        if (!buffer) {
            return;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(velocity, audioContext.currentTime);
        
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
        this.preamp.gain.value = 4.5; // Boost volume by 4.5x
        this.preamp.connect(this.outputNode);
    }

    async init() {
        if (this.isInitialized) return;
        this.sampler = createSampler(this.audioContext, this.preamp);
        await this.sampler.load(DRUM_SAMPLES);
        this.isInitialized = true;
    }

    schedule(score: FractalEvent[], startTime: number) {
        if (!this.sampler || !this.isInitialized) {
            return;
        }
        
        for (const event of score) {
            // Extract drum sample name from event type (e.g., 'drum_kick' -> 'kick')
            const sampleName = event.type.replace('drum_', '');
            // Calculate absolute time for the event
            const absoluteTime = startTime + event.time;
            this.sampler.triggerAttack(sampleName, absoluteTime, event.weight);
        }
    }

    public stop() {
        // Since we schedule samples with precise timing and they are short-lived,
        // a specific 'stop' for scheduled notes is often not necessary.
    }
}
