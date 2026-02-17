import type { 
    Mood as FractalMood, 
    InstrumentHints as FractalInstrumentHints, 
    InstrumentPart as FractalInstrumentPart,
    FractalEvent,
    GhostChord,
    SuiteDNA as FractalSuiteDNA,
    NavigationInfo as FractalNavigationInfo
} from './fractal';
import { V2_PRESETS } from '@/lib/presets-v2';
import { BASS_PRESETS } from '@/lib/bass-presets';

/**
 * #ЗАЧЕМ: Центральный хаб типов AuraGroove.
 * #ЧТО: Ре-экспортирует типы из fractal.ts и определяет UI-специфичные структуры.
 *       Добавлена поддержка межсессионной памяти ликов.
 * #ОБНОВЛЕНО (ПЛАН №439): Поддержка многомасштабного аудита стагнации (1-2-4 такта).
 */

export type Mood = FractalMood;
export type { FractalEvent, GhostChord };
export type NavigationInfo = FractalNavigationInfo;
export type SuiteDNA = FractalSuiteDNA;
export type InstrumentPart = FractalInstrumentPart;

export type PlayableNote = {
    midi: number;
    time: number;
    duration: number;
    velocity?: number;
    part?: 'spark' | 'fill' | string;
    note?: string;
    params?: any;
    technique?: Technique;
};

export type SamplerNote = {
    note: string;
    time: number;
    velocity?: number;
    midi: number;
};

export type Score = {
    bass?: PlayableNote[];
    melody?: PlayableNote[];
    accompaniment?: PlayableNote[];
    harmony?: PlayableNote[];
    drums?: DrumsScore;
    effects?: EffectsScore;
    sparkle?: boolean;
    instrumentHints?: FractalInstrumentHints;
};

export type DrumsScore = PlayableNote[];
export type EffectsScore = SamplerNote[];

export type V1BassInstrument = 'classicBass' | 'glideBass' | 'ambientDrone' | 'resonantGliss' | 'hypnoticDrone' | 'livingRiff';
export type V2BassInstrument = keyof typeof BASS_PRESETS;
export type BassInstrument = V1BassInstrument | V2BassInstrument | 'none';

export type V1MelodyInstrument = 'synth' | 'organ' | 'mellotron' | 'theremin' | 'E-Bells_melody' | 'G-Drops' | 'acousticGuitarSolo' | 'electricGuitar' | 'ambientPad' | 'acousticGuitar' | 'none';
export type V2MelodyInstrument = keyof typeof V2_PRESETS;
export type MelodyInstrument = V1MelodyInstrument | V2MelodyInstrument | 'blackAcoustic' | 'telecaster' | 'darkTelecaster';

export type AccompanimentInstrument = Exclude<MelodyInstrument, 'piano' | 'violin' | 'flute'> | 'guitarChords';
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
    | 'drum_a-ride1'
    | 'drum_a-ride2'
    | 'drum_a-ride3'
    | 'drum_a-ride4'
    | 'drum_closed_hi_hat_ghost'
    | 'drum_hihat_open'
    | 'drum_hihat_closed'
    | 'drum_crash'
    | 'drum_cymbal_bell1'
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
    | 'perc-015'
    | 'drum_brush1'
    | 'drum_brush2'
    | 'drum_brush3'
    | 'drum_brush4';

export type InstrumentType = BassInstrument | MelodyInstrument | AccompanimentInstrument | EffectInstrument | DrumAndPercussionInstrument | 'portamento' | 'autopilot_bass' | 'none';

export type BassTechnique = 'arpeggio' | 'portamento' | 'glissando' | 'glide' | 'pulse' | 'riff' | 'long_notes' | 'walking' | 'boogie' | 'syncopated';    

export type Technique = BassTechnique | 'pluck' | 'pick' | 'harm' | 'slide' | 'hit' | 'ghost' | 'swell' | 'fill' | 'bend' | 'vibrato';
export type AccompanimentTechnique = 'choral' | 'alternating-bass-chord' | 'chord-pulsation' | 'arpeggio-fast' | 'arpeggio-slow' | 'alberti-bass' | 'paired-notes' | 'long-chords' | 'power-chords' | 'rhythmic-comp';

export type InstrumentSettings = {
  bass: {
      name: BassInstrument;
      volume: number;
      technique: BassTechnique;
  };
  melody: {
      name: MelodyInstrument;
      volume: number;
  };
  accompaniment: {
      name: AccompanimentInstrument;
      volume: number;
  };
  harmony: {
      name: 'piano' | 'guitarChords' | 'flute' | 'violin' | 'none';
      volume: number;
  };
   pianoAccompaniment: {
    name: 'piano';
    volume: number;
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

export type WorkerSettings = {
  bpm: number;
  score: ScoreName;
  genre: Genre;
  instrumentSettings: InstrumentSettings;
  drumSettings: DrumSettings;
  textureSettings: TextureSettings;
  density: number;
  composerControlsInstruments: boolean;
  mood: Mood;
  seed?: number;
  introBars: number;
  sessionLickHistory?: string[];
  ancestor?: any;
};

export type TimerSettings = {
    duration: number;
    timeLeft: number;
    isActive: boolean;
};

export type ScoreName = 'evolve' | 'omega' | 'journey' | 'dreamtales' | 'multeity' | 'neuro_f_matrix';
export type Genre = 'trance' | 'ambient' | 'progressive' | 'rock' | 'house' | 'rnb' | 'ballad' | 'reggae' | 'blues' | 'celtic';

export type MutationType = 'transpose' | 'rhythmic_shift' | 'velocity_curve' | 'inversion' | 'register_shift' | 'voicing_change' | 'retrograde' | 'augmentation';

export type FillTechnique = 'filter_sweep' | 'reverb_burst' | 'harmonic_glide' | 'density_pause' | 'granular_freeze' | 'roll' | 'crescendo' | 'shimmer_burst';

export type FillPolicy = {
  type: FillTechnique;
  duration: number;
  parameters?: any;
};

type MelodySource = 'motif' | 'harmony_top_note' | 'blues_solo';

export type InstrumentBehaviorRules = {
    density?: { min: number, max: number };
    register?: { preferred: 'low' | 'mid' | 'high' };
    kitName?: string; 
    pattern?: 'ambient_beat' | 'composer' | 'none';
    kickVolume?: number;
    source?: MelodySource;
    style?: 'solo' | 'fingerstyle' | 'chord-melody'; 
    techniques?: { value: string; weight: number }[];
     ride?: {
        enabled: boolean;
        quietWindows?: { start: number, end: number }[];
        probability?: number;
        volume?: number;
    };
    presetModifiers?: {
        octaveShift?: number;
        cutoff?: number;      
        resonance?: number;   
        distortion?: number;  
    };
    fills?: { onBundleBoundary?: boolean };
    useSnare?: boolean;
    rareKick?: boolean;
    usePerc?: boolean;
    alternatePerc?: boolean;
    useGhostHat?: boolean;
    useBrushes?: boolean;
    soloPlan?: string;
    soloToPatternRatio?: number;
    fingerstyle?: { bars: number[]; pattern: string; voicingName: string; }[];
    strum?: { bars: number[]; pattern: string; voicingName: string; }[];
};

export type InstrumentOption<T> = {
    name: T;
    weight: number;
};

export type InstrumentActivationRule<T = any> = {
    activationChance: number;
    instrumentOptions: InstrumentOption<T>[];
    transient?: boolean;
};

export type Stage = {
    duration: { percent: number };
    instrumentation: Partial<Record<InstrumentPart, InstrumentActivationRule>>;
};

export type InstrumentationRules<T> = {
    strategy: 'weighted';
    options?: InstrumentOption<T>[];
    v1Options?: InstrumentOption<T>[];
    v2Options?: InstrumentOption<T>[];
};

export type BlueprintBundle = {
  id: string;
  name: string;
  duration: { percent: number };
  characteristics: any; 
  phrases: any;
  outroFill?: FillPolicy | null;
};

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
  stagedInstrumentation?: Stage[];
  instrumentRules: {
      [key: string]: InstrumentBehaviorRules;
  };
  bassAccompanimentDouble?: {
    enabled: boolean;
    instrument: AccompanimentInstrument;
    octaveShift: number;
  };
  bundles: BlueprintBundle[];
  outroFill: FillPolicy | null;
  introRules?: any;
  harmonicJourney?: HarmonicCenter[];
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
        harmonicJourney: any[];
        tensionProfile: any;
    };
    structure: {
        totalDuration: { preferredBars: number };
        parts: BlueprintPart[];
    };
    mutations: any;
    ambientEvents: any[];
    continuity: any;
    rendering: any;
};

export type InstrumentHints = FractalInstrumentHints & {
    /** 
     * #ЗАЧЕМ: Реализация архитектуры "Dramatic Gravity".
     */
    summonProgress?: Partial<Record<InstrumentPart, number>>;
};

export interface BluesCognitiveState {
  phraseState: 'call' | 'call_var' | 'response';
  tensionLevel: number;
  phraseHistory: string[]; // History of single bar hashes
  pianoHistory: string[];  // History of piano bar hashes
  accompHistory: string[]; // History of accompaniment bar hashes
  mesoHistory: string[];   // History of 2-bar hashes
  macroHistory: string[];  // History of 4-bar hashes
  lastPhraseHash: string;
  blueNotePending: boolean;
  emotion: {
    melancholy: number;
    darkness: number;
  };
  /** #ЗАЧЕМ: Многоуровневые счетчики стагнации (План №439). */
  stagnationStrikes: {
    micro: number;
    meso: number;
    macro: number;
  };
  vaccineActive?: { part: string, type: 'jitter' | 'inversion' | 'transposition' | 'rhythm' };
}
