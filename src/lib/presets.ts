
import type { Note, MelodyInstrument, InstrumentType } from "@/types/music";

const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|WebOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export type PresetOptions = {
    type?: 'Synth' | 'FMSynth' | 'AMSynth' | 'NoiseSynth';
    options?: any;
    attack?: number;
    release?: number;
    portamento?: number;
    filterCutoff?: number;
    q?: number;
    oscType?: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'fatsine' | 'fmsine' | 'amsine' | 'pwm' | 'fatsawtooth';
    [key: string]: any; 
};

export const PRESETS: Record<string, PresetOptions> = {
    // Melody & Accompaniment Presets
    organ: {
        attack: 0.2,
        release: 1.0,
        portamento: 0,
        filterCutoff: 600,
        q: 0.7,
        oscType: 'triangle',
    },
    mellotron: {
        type: 'FMSynth',
        options: {
            harmonicity: 3,
            modulationIndex: 0.5,
            oscillator: { type: "sine" },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.8 },
            modulation: { type: "sine" },
            modulationEnvelope: { attack: 0.2, decay: 0.5, sustain: 0.1, release: 0.8 }
        },
        // Provide flat params for simple worklet synths
        attack: 0.1,
        release: 0.8,
        filterCutoff: 500,
        q: 0.5,
        oscType: 'fatsine',
    },
    synth: {
        attack: 0.15,
        release: 1.0,
        portamento: 0.03,
        filterCutoff: 700,
        q: 1,
        oscType: 'triangle',
    },
    theremin: {
        attack: 0.3,
        release: 1.5,
        portamento: 0.08,
        filterCutoff: 600,
        q: 0.6,
        oscType: 'sine',
    },
    'E-Bells_melody': {
        type: 'FMSynth',
        options: {
            harmonicity: 1.4,
            modulationIndex: 20,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 1.6 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.4 }
        },
        attack: 0.001, release: 1.6, filterCutoff: 8000, q: 2, oscType: 'fmsine'
    },
    'E-Bells_bass': {
        type: 'FMSynth',
        options: {
            harmonicity: 1.4,
            modulationIndex: 15,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 2.5 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.01, decay: 1.0, sustain: 0, release: 1.0 }
        },
        attack: 0.01, release: 2.5, filterCutoff: 4000, q: 1.5, oscType: 'fmsine'
    },
    'G-Drops': {
        type: 'FMSynth',
        options: {
            harmonicity: 0.5,
            modulationIndex: 3.5,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.7, sustain: 0.1, release: 0.4 },
            modulation: { type: 'triangle' },
            modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.2 }
        },
        attack: 0.01, release: 0.4, filterCutoff: 2000, q: 1, oscType: 'fmsine'
    },
    
    // Legacy Bass Preset
    portamento: {
       attack: 0.1,
       release: isMobile() ? 2.0 : 4.0,
       portamento: 0.05,
       filterCutoff: 1000,
       q: 1,
       oscType: 'triangle'
    },

    // Autopilot Presets
    autopilot_bass: {
        type: 'Synth',
        options: {
            oscillator: { type: "fmsine", harmonicity: 0.5 },
            filter: { Q: 1, type: 'lowpass', rolloff: -12 },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 },
            filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 1, baseFrequency: 200, octaves: 1.5 }
        },
        attack: 0.1, release: 1.2, filterCutoff: 800, q: 1, oscType: 'fmsine'
    },

    // Effect Presets
    autopilot_effect_star: { type: 'FMSynth', options: { oscillator: { type: 'fmsine', modulationType: 'sine', harmonicity: 0.8 }, envelope: { attack: 0.01, decay: 0.8, sustain: 0, release: 0.5 } }, attack: 0.01, release: 0.5, filterCutoff: 5000, q: 1, oscType: 'fmsine'},
    autopilot_effect_meteor: { type: 'NoiseSynth', options: { noise: { type: 'white' }, filter: { type: 'bandpass', Q: 15 }, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2, attackCurve: 'exponential' } } },
    autopilot_effect_warp: { type: 'NoiseSynth', options: { noise: { type: 'pink', playbackRate: 0.2 }, filter: { type: 'lowpass', Q: 2 }, envelope: { attack: 0.5, decay: 0.8, sustain: 0.1, release: 1 } } },
    autopilot_effect_hole: { type: 'AMSynth', options: { oscillator: { type: 'amsine', harmonicity: 0.2 }, envelope: { attack: 2, decay: 2, sustain: 0, release: 1 } }, attack: 2, release: 1, filterCutoff: 200, q: 1, oscType: 'amsine' },
    autopilot_effect_pulsar: { type: 'Synth', options: { oscillator: { type: 'pwm', modulationFrequency: 0.2 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.2 } }, attack: 0.01, release: 0.2, filterCutoff: 3000, q: 1, oscType: 'pwm' },
    autopilot_effect_nebula: { type: 'Synth', options: { oscillator: { type: 'fatsawtooth', count: 5, spread: 80 }, envelope: { attack: 1.5, decay: 2, sustain: 0.5, release: 2 } }, attack: 1.5, release: 2, filterCutoff: 1000, q: 0.8, oscType: 'fatsawtooth' },
    autopilot_effect_comet: { type: 'Synth', options: { oscillator: { type: 'pulse', width: 0.1 }, envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.8 } }, attack: 0.01, release: 0.8, filterCutoff: 4000, q: 1.2, oscType: 'pulse' },
    autopilot_effect_wind: { type: 'NoiseSynth', options: { noise: { type: 'brown' }, filter: { type: 'bandpass', Q: 8 }, envelope: { attack: 2, decay: 5, sustain: 0.1, release: 3 } } },
    autopilot_effect_echoes: { type: 'Synth', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.5 } }, attack: 0.01, release: 0.5, filterCutoff: 2500, q: 1, oscType: 'triangle' },
};


export const getPresetParams = (instrumentName: InstrumentType, note: Note): Omit<PresetOptions, 'type' | 'options'> & { frequency: number, velocity: number } | null => {
    let freq = 0;
    try {
        freq = 440 * Math.pow(2, (note.midi - 69) / 12);
    } catch(e) {
        console.error("Failed to calculate frequency for note:", note, e);
        return null;
    }

    if (isNaN(freq)) {
        console.error("Calculated frequency is NaN for note:", note);
        return null;
    }

    const preset = PRESETS[instrumentName];
    if (!preset) {
        console.warn(`[getPresetParams] Preset not found for instrument: ${instrumentName}`);
        return null;
    }

    const { type, options, ...rest } = preset;

    return {
        frequency: freq,
        velocity: note.velocity || 0.7,
        ...rest,
    };
};
