
import type { MusicBlueprint, Mood } from '@/types/fractal';

const MELANCHOLIC_AMBIENT_BLUEPRINT: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Emerald Drift',
  mood: 'melancholic',
  
  // TIMING & STRUCTURE
  timing: {
    bpm: 52,
    suiteMinutes: 12,
    secondsPerBar: 4.615,
    barsPerMinute: 13,
    totalBars: 156,
    partsDistribution: [
      { part: 'INTRO_A', bars: 8 },
      { part: 'INTRO_B', bars: 8 },
      { part: 'INTRO_C', bars: 8 },
      { part: 'BUILD',   bars: 24 },
      { part: 'MAIN',    bars: 48 }, // Two main sections can be implemented here
      { part: 'RELEASE', bars: 24 },
      { part: 'OUTRO',   bars: 36 }
    ]
  },
  
  // HARMONY
  harmony: {
    key: { root: 'D', scale: 'dorian', octave: 2 }, // D E F G A B C
    chords: {
      primary: [
        { name: 'Dm9', notes: ['D', 'F', 'A', 'C', 'E'], midi: [38, 41, 45, 48, 52], tension: 0.2 },
        { name: 'Gm7', notes: ['G', 'Bb', 'D', 'F'], midi: [43, 46, 50, 53], tension: 0.3 },
        { name: 'Am7', notes: ['A', 'C', 'E', 'G'], midi: [45, 48, 52, 55], tension: 0.25 },
        { name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], midi: [41, 45, 48, 52], tension: 0.28 }
      ],
      secondary: [
        { name: 'Cmaj7', notes: ['C', 'E', 'G', 'B'], midi: [48, 52, 55, 59], tension: 0.4 },
        { name: 'Dm11', notes: ['D', 'F', 'A', 'C', 'G'], midi: [38, 41, 45, 48, 55], tension: 0.35 }
      ],
    },
    progressions: {
      INTRO_A: ['Dm9'],
      INTRO_B: ['Dm9'],
      INTRO_C: ['Dm9', 'Gm7'],
      BUILD:   ['Dm9', 'Gm7', 'Am7', 'Fmaj7'],
      MAIN:    ['Dm9', 'Cmaj7', 'Gm7', 'Am7', 'Fmaj7', 'Dm9'],
      RELEASE: ['Gm7', 'Fmaj7', 'Dm9'],
      OUTRO:   ['Dm9']
    },
    motion: {
      ascending: 0.20,
      descending: 0.60,
      static: 0.20
    }
  },
  
  // VOICINGS
  voicings: {
    preferredType: 'open',
    voiceCount: { min: 3, max: 5 },
    spread: { min: 12, max: 24 }, // 1-2 octaves
    examples: {
      'Dm9_open': [38, 52, 57, 60], // D2 E3 A3 C4
      'Gm7_open': [43, 53, 58, 62]  // G2 F3 Bb3 D4
    }
  },
  
  // BASS
  bass: {
    registerByPart: {
      INTRO_A: { min: 26, max: 38 }, // D1-D2
      INTRO_B: { min: 26, max: 38 },
      INTRO_C: { min: 26, max: 42 },
      BUILD:   { min: 26, max: 45 },
      MAIN:    { min: 26, max: 50 },
      RELEASE: { min: 26, max: 42 },
      OUTRO:   { min: 24, max: 34 }
    },
    techniquesByPart: {
      INTRO_A: [{ technique: 'drone', weight: 1.0 }],
      INTRO_B: [{ technique: 'drone', weight: 1.0 }],
      INTRO_C: [{ technique: 'drone', weight: 0.8 }, { technique: 'pedal', weight: 0.2 }],
      BUILD:   [{ technique: 'pedal', weight: 0.6 }, { technique: 'walking', weight: 0.4 }],
      MAIN:    [{ technique: 'walking', weight: 0.5 }, { technique: 'ostinato', weight: 0.5 }],
      RELEASE: [{ technique: 'pedal', weight: 0.8 }, { technique: 'drone', weight: 0.2 }],
      OUTRO:   [{ technique: 'drone', weight: 1.0 }]
    },
    densityByPart: {
      INTRO_A: 0.25,
      INTRO_B: 0.25,
      INTRO_C: 0.35,
      BUILD:   0.60,
      MAIN:    0.75,
      RELEASE: 0.50,
      OUTRO:   0.35
    }
  },
  
  // PAD
  pad: {
    techniquesByPart: {
      INTRO_A: [{ technique: 'swell', weight: 1.0 }],
      INTRO_B: [{ technique: 'swell', weight: 0.8 }, { technique: 'sustained', weight: 0.2 }],
      INTRO_C: [{ technique: 'sustained', weight: 0.7 }, { technique: 'drone_layer', weight: 0.3 }],
      BUILD:   [{ technique: 'sustained', weight: 0.5 }, { technique: 'arpeggio_slow', weight: 0.5 }],
      MAIN:    [{ technique: 'arpeggio_fast', weight: 0.4 }, { technique: 'sustained', weight: 0.4 }, { technique: 'choral', weight: 0.2 }],
      RELEASE: [{ technique: 'swell', weight: 0.7 }, { technique: 'sustained', weight: 0.3 }],
      OUTRO:   [{ technique: 'sustained', weight: 1.0 }]
    },
    densityByPart: {
      INTRO_A: 0.3,
      INTRO_B: 0.4,
      INTRO_C: 0.5,
      BUILD:   0.65,
      MAIN:    0.8,
      RELEASE: 0.6,
      OUTRO:   0.4
    }
  },
  
  // DRUMS
  drums: {
    activeParts: ['INTRO_C', 'BUILD', 'MAIN', 'RELEASE'],
    kit: [
      { type: 'kick', pattern: 'half_time', velocity: { min: 60, max: 75 }, probability: 0.8 },
      { type: 'snare_ghost_note', pattern: 'off_beats', velocity: { min: 40, max: 55 }, probability: 0.5 },
      { type: 'hihat_closed', pattern: 'eighths', velocity: { min: 35, max: 50 }, probability: 0.7 }
    ],
    densityByPart: {
      INTRO_C: 0.2,
      BUILD: 0.5,
      MAIN:  0.7,
      RELEASE: 0.4
    }
  },
  
  // LAYERS (INSTRUMENTATION)
  layers: {
    INTRO_A: { bass: false, pad: true,  accompaniment: true, harmony: false, arpeggio: false, melody: false, drums: false, sparkles: false, sfx: true },
    INTRO_B: { bass: true, pad: true, accompaniment: true, harmony: true, arpeggio: false, melody: false, drums: false, sparkles: true, sfx: true },
    INTRO_C: { bass: true, pad: true, accompaniment: true, harmony: true, arpeggio: true, melody: false, drums: true, sparkles: true, sfx: true },
    BUILD:   { bass: true, pad: true, accompaniment: true, harmony: true, arpeggio: true, melody: true,  drums: true, sparkles: true, sfx: true },
    MAIN:    { bass: true, pad: true, accompaniment: true, harmony: true, arpeggio: true, melody: true,  drums: true, sparkles: true, sfx: true },
    RELEASE: { bass: true, pad: true, accompaniment: true, harmony: false, arpeggio: true, melody: false, drums: true, sparkles: true, sfx: false },
    OUTRO:   { bass: true, pad: true, accompaniment: false, harmony: false, arpeggio: false, melody: false, drums: false, sparkles: false, sfx: true }
  },
  
  // MUTATIONS
  mutations: {
    microProbability: 0.40,
    mediumProbability: 0.70,
    allowedTranspositions: [0, 2, 3, 5, 7, 9, 10], // Dorian scale intervals
    microTypes: ['transpose', 'rhythmic_shift'],
    mediumTypes: ['inversion', 'register_shift']
  },
  
  // FILLS
  fills: {
    bundle: { type: 'bass_fill', duration: 1, probability: 0.5 },
    part:   { type: 'drum_fill', duration: 2, probability: 0.8 }
  },
  
  // UNIQUE CHARACTERISTICS
  unique: {
    filterCutoff: { min: 0.45, max: 0.80 },
    reverbSize: 0.88,
    character: 'задумчивый, интроспективный, дождливый',
    ambientEvents: [
      { type: 'reverse_swell', probability: 0.05, activeParts: ['BUILD', 'MAIN'] },
      { type: 'vinyl_crackle', probability: 0.03, activeParts: ['MAIN', 'RELEASE'] }
    ]
  }
};


export const AMBIENT_BLUEPRINTS: Record<Mood, MusicBlueprint> = {
    melancholic: MELANCHOLIC_AMBIENT_BLUEPRINT,
    // Note: Other moods are simplified for brevity but would follow the same detailed structure.
    dark: {
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'dark_ambient',
        name: 'Abyssal Descent',
        mood: 'dark',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 40 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'C', scale: 'phrygian', octave: 2 },
            progressions: {
                INTRO_A: ['Cm'], INTRO_B: ['Cm'], INTRO_C: ['Cm', 'Fm'],
                BUILD: ['Cm', 'Db', 'Abmaj7', 'Fm'],
                MAIN: ['Cm', 'Gm7b5', 'Db', 'Fm', 'Ebm'],
                RELEASE: ['Abmaj7', 'Fm', 'Db', 'Cm'],
                OUTRO: ['Cm']
            },
            motion: { ascending: 0.05, descending: 0.85, static: 0.10 }
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'мрачный, давящий, суб-бас', subBassBoost: 3, noiselevel: -40, reverbSize: 1.0 }
    },
    gloomy: {
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'gloomy_ambient',
        name: 'Ashen Horizons',
        mood: 'gloomy',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 46, totalBars: 150 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'A', scale: 'aeolian', octave: 2 },
            progressions: {
                INTRO_A: ['Am7'], INTRO_B: ['Am7'], INTRO_C: ['Am7', 'Dm7'],
                BUILD: ['Am7', 'Dm7', 'Fmaj7', 'Em7'],
                MAIN: ['Am7', 'Em7', 'Fmaj7', 'Dm7', 'Cmaj7'],
                RELEASE: ['Fmaj7', 'Dm7', 'Em7', 'Am7'],
                OUTRO: ['Am7']
            },
            motion: { ascending: 0.15, descending: 0.65, static: 0.20 }
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'холодный, дистанцированный, тяжёлый', reverbSize: 0.92 }
    },
    calm: {
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'calm_ambient',
        name: 'Still Waters',
        mood: 'calm',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 54 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'G', scale: 'mixolydian', octave: 3 },
             progressions: {
                INTRO_A: ['Gmaj7'], INTRO_B: ['Gmaj7'], INTRO_C: ['Gmaj7', 'Cmaj7'],
                BUILD: ['Gmaj7', 'Cmaj7', 'Dsus4', 'Am7'],
                MAIN: ['Gmaj7', 'Em7', 'Cmaj7', 'Dsus4', 'Gadd9'],
                RELEASE: ['Cmaj7', 'Am7', 'F', 'Gmaj7'],
                OUTRO: ['Gmaj7']
            },
            motion: { ascending: 0.30, descending: 0.40, static: 0.30 }
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'теплый, обволакивающий, умиротворяющий', reverbSize: 0.82 }
    },
    dreamy: {
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'dreamy_ambient',
        name: 'Celestial Drift',
        mood: 'dreamy',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 58 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'F', scale: 'lydian', octave: 3 },
            progressions: {
                INTRO_A: ['Fmaj7#11'], INTRO_B: ['Fmaj7#11'], INTRO_C: ['Fmaj7#11', 'Cmaj7'],
                BUILD: ['Fmaj7#11', 'Gmaj7', 'Cmaj7', 'Dm7'],
                MAIN: ['Fmaj7#11', 'Am7', 'Gmaj7', 'Cmaj7', 'Em7'],
                RELEASE: ['Cmaj7', 'Gmaj7', 'Am7', 'Fmaj7#11'],
                OUTRO: ['Fmaj7#11']
            },
            motion: { ascending: 0.50, descending: 0.25, static: 0.25 }
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'воздушный, парящий, светящийся', reverbSize: 0.95, shimmerMix: 0.18 }
    },
    joyful: {
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'joyful_ambient',
        name: 'Golden Horizons',
        mood: 'joyful',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 62 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'C', scale: 'ionian', octave: 3 },
            progressions: {
                INTRO_A: ['Cmaj7'], INTRO_B: ['Cadd9'], INTRO_C: ['Cmaj7', 'Fmaj7'],
                BUILD: ['Cmaj7', 'Am7', 'Fmaj7', 'Gmaj7'],
                MAIN: ['Cmaj7', 'Em7', 'Am7', 'Fmaj7', 'Gsus4'],
                RELEASE: ['Fmaj7', 'Dm7', 'Gmaj7', 'Cmaj7'],
                OUTRO: ['Cmaj7']
            },
            motion: { ascending: 0.65, descending: 0.15, static: 0.20 }
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'светлый, энергичный, позитивный', reverbSize: 0.78, brightness: 2 }
    },
    enthusiastic: {
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'enthusiastic_ambient',
        name: 'Radiant Ascent',
        mood: 'enthusiastic',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 68 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'E', scale: 'lydian', octave: 3 },
            progressions: {
                INTRO_A: ['Emaj7#11'], INTRO_B: ['Emaj9'], INTRO_C: ['Emaj7#11', 'Bmaj7'],
                BUILD: ['Emaj7#11', 'C#m7', 'Amaj7', 'Bmaj7'],
                MAIN: ['Emaj7#11', 'G#m7', 'C#m7', 'Amaj7', 'F#maj7', 'Bmaj7'],
                RELEASE: ['Amaj7', 'F#maj7', 'Bmaj7', 'Emaj7#11'],
                OUTRO: ['Emaj7#11']
            },
            motion: { ascending: 0.75, descending: 0.10, static: 0.15 }
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'яркий, энергичный, восторженный', reverbSize: 0.70, brightness: 3, swing: 0.08 }
    },
    epic: { // Added based on mood list
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'epic_ambient',
        name: 'Monolithic Dawn',
        mood: 'epic',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 60, suiteMinutes: 10 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'E', scale: 'lydian', octave: 2 },
            progressions: {
                INTRO_A: ['Em'], INTRO_B: ['Em', 'Cmaj7'], INTRO_C: ['Em', 'Cmaj7', 'G'],
                BUILD: ['Am', 'G', 'C', 'F'],
                MAIN: ['Am', 'F', 'C', 'G', 'E7', 'Am'],
                RELEASE: ['F', 'C', 'G', 'Am'],
                OUTRO: ['Am']
            },
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'величественный, широкий, драматичный', reverbSize: 0.9, subBassBoost: 2 }
    },
    anxious: { // Added based on mood list
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'anxious_ambient',
        name: 'Closing Walls',
        mood: 'anxious',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 72, suiteMinutes: 8 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'E', scale: 'locrian', octave: 3 },
            progressions: {
                INTRO_A: ['Edim'], INTRO_B: ['Edim', 'Fm'], INTRO_C: ['Edim', 'Fm', 'Bdim'],
                BUILD: ['Edim', 'Bdim', 'Fm', 'Cdim'],
                MAIN: ['Edim', 'G#dim', 'Cdim', 'Fdim'],
                RELEASE: ['Bdim', 'Fm', 'Edim'],
                OUTRO: ['Edim']
            },
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'тревожный, клаустрофобный, неровный', reverbSize: 0.6, swing: 0.15 }
    },
     contemplative: { // Added based on mood list
        ...MELANCHOLIC_AMBIENT_BLUEPRINT,
        id: 'contemplative_ambient',
        name: 'Evening Glass',
        mood: 'contemplative',
        timing: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.timing, bpm: 50 },
        harmony: {
            ...MELANCHOLIC_AMBIENT_BLUEPRINT.harmony,
            key: { root: 'G', scale: 'mixolydian', octave: 3 },
             progressions: {
                INTRO_A: ['Gmaj7'], INTRO_B: ['Gmaj7'], INTRO_C: ['Gmaj7', 'Cmaj7'],
                BUILD: ['Gmaj7', 'Cmaj7', 'Dsus4', 'Am7'],
                MAIN: ['Gmaj7', 'Em7', 'Cmaj7', 'Dsus4', 'Gadd9'],
                RELEASE: ['Cmaj7', 'Am7', 'F', 'Gmaj7'],
                OUTRO: ['Gmaj7']
            },
            motion: { ascending: 0.30, descending: 0.40, static: 0.30 }
        },
        unique: { ...MELANCHOLIC_AMBIENT_BLUEPRINT.unique, character: 'спокойный, рефлексивный, ясный', reverbSize: 0.85 }
    },
};
