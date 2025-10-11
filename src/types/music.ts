

// A musical note to be played by a synthesizer.
export type Note = {
    midi: number;         // MIDI note number (e.g., 60 for C4).
    time: number;         // When to play it, in seconds, relative to the start of the audio chunk.
    duration: number;     // How long the note should last, in seconds.
    velocity?: number;    // How loud to play it (0-1), optional.
    part?: 'spark';       // Optional identifier for special notes
    note?: string; // For samplers that use note names
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
    bass?: Note[];
    melody?: Note[];
    accompaniment?: Note[];
    drums?: DrumsScore;
    effects?: EffectsScore;
    sparkle?: boolean; // Command to play a sparkle
    pad?: string; // Command to change pad
    instrumentHints?: {
        bass?: BassInstrument;
        melody?: MelodyInstrument;
        accompaniment?: AccompanimentInstrument;
        bassTechnique?: BassTechnique; // Added for NFM to control bass style
    }
};

export type DrumsScore = Note[];
export type EffectsScore = SamplerNote[];


// --- UI Types ---
export type BassInstrument = 'classicBass' | 'glideBass' | 'ambientDrone' | 'resonantGliss' | 'hypnoticDrone' | 'livingRiff' | 'piano' | 'violin' | 'flute' | 'acousticGuitarSolo' | 'none';
export type MelodyInstrument = 'piano' | 'violin' | 'flute' | 'synth' | 'organ' | 'mellotron' | 'theremin' | 'E-Bells_melody' | 'G-Drops' | 'acousticGuitarSolo' | 'electricGuitar' | 'none';
export type AccompanimentInstrument = MelodyInstrument | 'guitarChords';
export type EffectInstrument = 
    'autopilot_effect_star' | 'autopilot_effect_meteor' | 'autopilot_effect_warp' | 
    'autopilot_effect_hole' | 'autopilot_effect_pulsar' | 'autopilot_effect_nebula' | 
    'autopilot_effect_comet' | 'autopilot_effect_wind' | 'autopilot_effect_echoes';

export type InstrumentType = BassInstrument | MelodyInstrument | AccompanimentInstrument | EffectInstrument | 'portamento' | 'autopilot_bass' | 'none';

export type InstrumentPart = 'bass' | 'melody' | 'accompaniment' | 'drums' | 'effects' | 'sparkles' | 'pads' | 'piano' | 'violin' | 'flute' | 'guitarChords' | 'acousticGuitarSolo';
export type BassTechnique = 'arpeggio' | 'portamento' | 'glissando' | 'glide' | 'pulse';


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
};

export type DrumSettings = {
    pattern: 'ambient_beat' | 'composer' | 'none';
    volume: number;
    kickVolume: number;
    enabled: boolean;
};

export type EffectsSettings = {
    enabled: boolean;
};

export type TextureSettings = {
    sparkles: {
        enabled: boolean;
        volume: number;
    };
    pads: {
        enabled: boolean;
        volume: number;
    };
};

export type TimerSettings = {
    duration: number; // in seconds
    timeLeft: number;
    isActive: boolean;
};

export type ScoreName = 'evolve' | 'omega' | 'journey' | 'dreamtales' | 'multeity' | 'neuro_f_matrix';

// Settings sent from the UI to the main engine/worker.
export type WorkerSettings = {
    bpm: number;
    score: ScoreName;
    drumSettings: Omit<DrumSettings, 'volume'>;
    instrumentSettings: InstrumentSettings;
    textureSettings: Omit<TextureSettings, 'volume'>;
    density: number; // Controls musical density, 0 to 1
    composerControlsInstruments: boolean;
};
