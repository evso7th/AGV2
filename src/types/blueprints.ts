
import type { Mood, Genre, InstrumentPart, MelodyInstrument, AccompanimentInstrument, BassInstrument, FillTechnique } from './music';

/**
 * Defines the structure for a single weighted option in an instrumentation rule.
 * Example: { "name": "synth", "weight": 0.8 }
 */
export type InstrumentOption<T> = {
    name: T;
    weight: number;
};

/**
 * Defines the rules for selecting an instrument for a specific part (melody, bass, etc.).
 * The 'weighted' strategy allows for probabilistic selection from a list of options.
 */
export type InstrumentationRules<T> = {
    strategy: 'weighted';
    /** Options for the V1 synth engine. */
    v1Options?: InstrumentOption<T>[];
    /** Options for the V2 synth engine. */
    v2Options?: InstrumentOption<T>[];
};

/**
 * Defines rules for a specific instrument within a part of the blueprint.
 * This can control density, register, and other performance characteristics.
 */
export type InstrumentBehaviorRules = {
    density?: { min: number; max: number };
    register?: { preferred: 'low' | 'mid' | 'high' };
    pattern?: 'ambient_beat' | 'composer' | 'none';
    useSnare?: boolean;
    rareKick?: boolean;
    usePerc?: boolean;
    alternatePerc?: boolean;
    useGhostHat?: boolean;
    kickVolume?: number;
    source?: 'motif' | 'harmony_top_note';
    techniques?: { value: string; weight: number }[];
     ride?: {
        enabled: boolean;
        quietWindows?: { start: number, end: number }[];
    };
};

/**
 * Defines a musical phrase or section within a larger part of the composition.
 */
export type BlueprintBundle = {
    id: string;
    name: string;
    duration: { percent: number };
    characteristics: Record<string, any>; // For future expansion
    phrases: Record<string, any>;       // For future expansion
};

/**
 * Defines a major section of the musical piece (e.g., INTRO, BUILD, MAIN).
 */
export type BlueprintPart = {
    id: string;
    name: string;
    duration: { percent: number };
    layers: {
        [key in InstrumentPart]?: boolean;
    };
    instrumentation?: {
        melody?: InstrumentationRules<MelodyInstrument>;
        accompaniment?: InstrumentationRules<AccompanimentInstrument>;
        bass?: InstrumentationRules<BassInstrument>;
        harmony?: InstrumentationRules<'piano' | 'guitarChords' | 'flute' | 'violin'>;
    };
    instrumentRules: {
      [key: string]: InstrumentBehaviorRules;
    };
    bassAccompanimentDouble?: {
        enabled: boolean;
        instrument: AccompanimentInstrument;
        octaveShift: number;
    };
    bundles: BlueprintBundle[];
    outroFill: {
        type: FillTechnique;
        duration: number;
        parameters?: any;
    } | null;
};

/**
 * The root interface for a JSON music blueprint. This structure defines all
 * musical and structural rules for generating a complete piece.
 */
export interface JsonMusicBlueprint {
    id: string;
    name: string;
    description: string;
    mood: Mood;
    musical: {
        key: {
            root: string;
            scale: string;
            octave: number;
        };
        bpm: {
            base: number;
            range: [number, number];
            modifier: number;
        };
        timeSignature: {
            numerator: number;
            denominator: number;
        };
    };
    structure: {
        totalDuration: {
            preferredBars: number;
        };
        parts: BlueprintPart[];
    };
}
