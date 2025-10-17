
import type { FractalEvent } from "@/types/fractal";

const DRUM_SAMPLES: Record<string, string> = {
    'closed_hi_hat_accented': '/assets/drums/closed_hi_hat_accented.wav',
    'closed_hi_hat_ghost': '/assets/drums/closed_hi_hat_ghost.wav',
    'crash1': '/assets/drums/crash1.wav',
    'crash2': '/assets/drums/crash2.wav',
    'cymbal1': '/assets/drums/cymbal1.wav',
    'cymbal2': '/assets/drums/cymbal2.wav',
    'cymbal3': '/assets/drums/cymbal3.wav',
    'cymbal4.wav': '/assets/drums/cymbal4.wav',
    'cymbal_bell1': '/assets/drums/cymbal_bell1.wav',
    'cymbal_bell2': '/assets/drums/cymbal_bell2.wav',
    'hh_bark_short': '/assets/drums/hh_bark_short.wav',
    'hightom': '/assets/drums/hightom.wav',
    'kick_drum6': '/assets/drums/kick_drum6.wav',
    'lowtom': '/assets/drums/lowtom.wav',
    'midtom': '/assets/drums/midtom.wav',
    'open_hh_bottom2': '/assets/drums/open_hh_bottom2.wav',
    'open_hh_top2': '/assets/drums/open_hh_top2.wav',
    'perc-001': '/assets/drums/perc-001.wav',
    'perc-002': '/assets/drums/perc-002.wav',
    'perc-003': '/assets/drums/perc-003.wav',
    'perc-004': '/assets/drums/perc-004.wav',
    'perc-005': '/assets/drums/perc-005.wav',
    'perc-006': '/assets/drums/perc-006.wav',
    'perc-007': '/assets/drums/perc-007.wav',
    'perc-008': '/assets/drums/perc-008.wav',
    'perc-009': '/assets/drums/perc-009.wav',
    'perc-010': '/assets/drums/perc-010.wav',
    'perc-011': '/assets/drums/perc-011.wav',
    'perc-012': '/assets/drums/perc-012.wav',
    'perc-013': '/assets/drums/perc-013.wav',
    'perc-014': '/assets/drums/perc-014.wav',
    'perc-015': '/assets/drums/perc-015.wav',
    'snare': '/assets/drums/snare.wav',
    'snare_ghost_note': '/assets/drums/snare_ghost_note.wav',
    'snare_off': '/assets/drums/snare_off.wav',
    'snarepress': '/assets/drums/snarepress.wav',
    // Maintaining compatibility with old names for now
    'kick': '/assets/drums/kick_drum6.wav',
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
        console.log('[DrumMachine] Initialized and samples loaded:', Array.from(buffers.keys()));
    };

    const triggerAttack = (note: string, time: number, velocity = 1) => {
        const buffer = buffers.get(note);
        if (!buffer || !isFinite(time)) return;

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = velocity;

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
            
            const absoluteTime = barStartTime + (event.time * beatDuration);
            
            if (!isFinite(absoluteTime)) {
                console.error('[DrumMachine] Non-finite time scheduled for event:', event);
                continue;
            }
            
            console.log(`[DrumMachine] Scheduling ${event.type} at beat ${event.time.toFixed(2)} | absolute time: ${absoluteTime.toFixed(4)}`);
            this.sampler.triggerAttack(sampleName, absoluteTime, event.weight);
        }
    }

    public stop() {}
}
