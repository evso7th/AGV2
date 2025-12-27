

import type { Mood as FractalMood, InstrumentHints as FractalInstrumentHints } from './fractal';

export type Mood = FractalMood;

// A musical note to be played by a synthesizer.
export type PlayableNote = {
    midi: number;         // MIDI note number (e.g., 60 for C4).
    time: number;         // When to play it, in seconds, relative to the start of the audio chunk.
    duration: number;     // How long the note should last, in seconds.
    velocity?: number;    // How loud to play it (0-1), optional.
    part?: 'spark' | 'fill' | string; // Optional identifier for special notes or parts
    note?: string; // For samplers that use note names
    params?: any; // To pass synth params from composer
    technique?: Technique;
};

// A note for the sampler, identified by a string name.
export type SamplerNote = {
    note: string;         // Note name corresponding to the sampler mapping (e.g., 'C4' for kick).
    time: number;         // When to play it, in seconds, relative to the start of the audio chunk.
    velocity?: number;    // How loud to play it (0-1), optional.
    midi: number;         // MIDI note number, can be redundant but useful for unification
};

// A score is an object containing arrays of notes for each part.
export type Score = {
    bass?: PlayableNote[];
    melody?: PlayableNote[];
    accompaniment?: PlayableNote[];
    harmony?: PlayableNote[];
    drums?: DrumsScore;
    effects?: EffectsScore;
    sparkle?: boolean; // Command to play a sparkle
    instrumentHints?: FractalInstrumentHints;
};

export type DrumsScore = PlayableNote[];
export type EffectsScore = SamplerNote[];


// --- UI Types ---
export type BassInstrument = 'classicBass' | 'glideBass' | 'ambientDrone' | 'resonantGliss' | 'hypnoticDrone' | 'livingRiff' | 'none';
export type MelodyInstrument = 'synth' | 'organ' | 'mellotron' | 'theremin' | 'electricGuitar' | 'ambientPad' | 'acousticGuitar' | 'E-Bells_melody' | 'G-Drops' | 'piano' | 'violin' | 'flute' | 'acousticGuitarSolo' | 'none';
export type AccompanimentInstrument = Exclude<MelodyInstrument, 'piano' | 'violin' | 'flute' | 'acousticGuitarSolo'> | 'guitarChords';
export type EffectInstrument = 
    'autopilot_effect_star' | 'autopilot_effect_meteor' | 'autopilot_effect_warp' | 
    'autopilot_effect_hole' | 'autopilot_effect_pulsar' | 'autopilot_effect_nebula' | 
    'autopilot_effect_comet' | 'autopilot_effect_wind' | 'autopilot_effect_echoes';

export type DrumAndPercussionInstrument =
    | 'drum_kick'
    | 'drum_snare'
    | 'drum_snare_off'
    | 'drum_snare_ghost_note'
    | 'drum_snarepress'
    | 'drum_tom_low'
    | 'drum_tom_mid'
    | 'drum_tom_high'
    | 'drum_ride'
    | 'drum_a_ride1'
    | 'drum_a_ride2'
    | 'drum_a_ride3'
    | 'drum_a_ride4'
    | 'drum_closed_hi_hat_ghost'
    | 'drum_hihat_open'
    | 'drum_hihat_closed'
    | 'cymbal_bell1'
    | 'hh_bark_short'
    | 'perc-001'
    | 'perc-002'
    | 'perc-003'
    | 'perc-004'
    | 'perc-005'
    | 'perc-006'
    | 'perc-007'
    | 'perc-008'
    | 'perc-009'
    | 'perc-010'
    | 'perc-011'
    | 'perc-012'
    | 'perc-013'
    | 'perc-014'
    | 'perc-015';

export type InstrumentType = BassInstrument | MelodyInstrument | AccompanimentInstrument | EffectInstrument | DrumAndPercussionInstrument | 'portamento' | 'autopilot_bass' | 'none';

export type InstrumentPart = 'bass' | 'melody' | 'accompaniment' | 'harmony' | 'drums' | 'effects' | 'sparkles' | 'piano' | 'violin' | 'flute' | 'guitarChords' | 'acousticGuitarSolo' | 'electricGuitar' | 'sfx';
export type BassTechnique = 'arpeggio' | 'portamento' | 'glissando' | 'glide' | 'pulse';
export type Technique = BassTechnique | 'pluck' | 'pick' | 'harm' | 'slide' | 'hit' | 'ghost' | 'swell' | 'fill';
export type AccompanimentTechnique = 'choral' | 'alternating-bass-chord' | 'chord-pulsation' | 'arpeggio-fast' | 'arpeggio-slow' | 'alberti-bass';


export type InstrumentSettings = {
  bass: {
      name: BassInstrument;
      volume: number; // 0-1
      technique: BassTechnique;
  };
  melody: {
      name: MelodyInstrument;
      volume: number; // 0-1
  };
  accompaniment: {
      name: AccompanimentInstrument;
      volume: number; // 0-1
  };
  harmony: {
      name: 'piano' | 'guitarChords' | 'acousticGuitarSolo' | 'flute' | 'violin' | 'none';
      volume: number; // 0-1
  };
};

export type DrumSettings = {
    pattern: 'ambient_beat' | 'composer' | 'none';
    volume: number;
    kickVolume: number;
    enabled: boolean;
};

export type SfxSettings = {
    enabled: boolean;
    volume: number;
};


export type TextureSettings = {
    sparkles: {
        enabled: boolean;
        volume: number;
    };
    sfx: SfxSettings;
};

export type TimerSettings = {
    duration: number; // in seconds
    timeLeft: number;
    isActive: boolean;
};

export type ScoreName = 'evolve' | 'omega' | 'journey' | 'dreamtales' | 'multeity' | 'neuro_f_matrix';
export type Genre = 'trance' | 'ambient' | 'progressive' | 'rock' | 'house' | 'rnb' | 'ballad' | 'reggae' | 'blues' | 'celtic';

// Settings sent from the UI to the main engine/worker.
export type WorkerSettings = {
    bpm: number;
    score: ScoreName;
    genre: Genre;
    drumSettings: Omit<DrumSettings, 'volume'>;
    instrumentSettings: InstrumentSettings;
    textureSettings: TextureSettings;
    density: number; // Controls musical density, 0 to 1
    composerControlsInstruments: boolean;
    mood: Mood;
    seed?: number;
};


// --- BLUEPRINT STRUCTURE ---

export type MutationType = 'transpose' | 'rhythmic_shift' | 'velocity_curve' | 'inversion' | 'register_shift' | 'voicing_change' | 'retrograde' | 'augmentation';

export type MutationPolicy = {
  // Simplified for now
};

export type FillTechnique = 'filter_sweep' | 'reverb_burst' | 'harmonic_glide' | 'density_pause' | 'granular_freeze' | 'roll' | 'crescendo';

export type FillPolicy = {
  type: FillTechnique;
  duration: number; // in bars
  parameters: any;
};

export type InstrumentRules = {
  // Simplified for now
};

export type InstrumentOption<T> = {
    name: T;
    weight: number; // 0.0 to 1.0
};

export type InstrumentationRules<T> = {
    strategy: 'weighted';
    options: InstrumentOption<T>[];
};

export type BlueprintBundle = {
  id: string;
  name: string;
  duration: { percent: number }; // Duration as a percentage of the parent part
  characteristics: any; 
  phrases: any;
};

export type BlueprintPart = {
  id: string;
  name: string;
  duration: { percent: number }; // Duration as a percentage of the total suite
  layers: {
    [key in InstrumentPart]?: boolean;
  };
  instrumentation?: {
      melody?: InstrumentationRules<MelodyInstrument>;
      accompaniment?: InstrumentationRules<AccompanimentInstrument>;
      bass?: InstrumentationRules<BassInstrument>;
  };
  instrumentEntry?: { [key: string]: number };
  instrumentExit?: { [key: string]: number };
  instrumentRules: {
    [key: string]: any;
  };
  bassAccompanimentDouble?: {
    enabled: boolean;
    instrument: AccompanimentInstrument;
    octaveShift: number;
  };
  bundles: BlueprintBundle[];
  outroFill: FillPolicy | null;
};

export type HarmonicCenter = {
    partIndex: number;
    center: string;
    satellites: string[];
    weight: number;
};

export type TensionProfile = {
    type: 'arc' | 'plateau' | 'wave' | 'crescendo';
    peakPosition: number;
    curve: (progress: number, peakPosition: number) => number;
};

export type MusicBlueprint = {
    id: string;
    name: string;
    description: string;
    mood: Mood;
    musical: {
        key: { root: string; scale: string; octave: number };
        bpm: { base: number; range: [number, number], modifier: number };
        timeSignature: { numerator: number; denominator: number };
        harmonicJourney: any[]; // Define this type more strictly later
        tensionProfile: any; // Define this type more strictly later
    };
    structure: {
        totalDuration: { preferredBars: number };
        parts: BlueprintPart[];
    };
    mutations: any; // Define this type more strictly later
    ambientEvents: any[]; // Define this type more strictly later
    continuity: any; // Define this type more strictly later
    rendering: any; // Define this type more strictly later
};
