
type VelocitySample = {
    velocity: number;
    file: string;
};

export const PIANO_SAMPLES: Record<string, string> = {
    'C3': '/assets/piano_samples/the-sound-of-the-note-do.mp3',
    'D3': '/assets/piano_samples/re-note-sound.mp3',
    'E3': '/assets/piano_samples/the-sound-of-the-note-mi.mp3',
    'F3': '/assets/piano_samples/fa-note-sound.mp3',
    'G3': '/assets/piano_samples/the-sound-of-the-note-sol-extended.mp3',
    'A3': '/assets/piano_samples/the-sound-of-the-note-la.mp3',
    'C4': '/assets/piano_samples/c-note-sound.mp3',
    'C5': '/assets/piano_samples/the-sound-of-the-note-do-in-the-second-octave.mp3',
    'D5': '/assets/piano_samples/the-sound-of-the-note-d-is-stretched.mp3',
    'A5': '/assets/piano_samples/the-sound-of-the-note-a-is-stretched.mp3',
    'C6': '/assets/piano_samples/sound-note-c-stretched.mp3',
};

export const VIOLIN_SAMPLES: Record<string, VelocitySample[]> = {
    'A2': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-a-2.mp3' }, { velocity: 0.5, file: '/assets/violin_samples/violin-arco-vibrato-single-a-2-lowered.mp3' }],
    'A3': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-a-3.mp3' }, { velocity: 0.5, file: '/assets/violin_samples/violin-arco-vibrato-single-a-3-lowered.mp3' }],
    'A4': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-a-4.mp3' }],
    'A5': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-a-5.mp3' }, { velocity: 0.7, file: '/assets/violin_samples/violin-arco-vibrato-single-a-5-long.mp3' }],
    'B2': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-b-2.mp3' }],
    'B3': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-b-3.mp3' }],
    'B4': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-b-4.mp3' }],
    'B5': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-b-5.mp3' }],
    'C3': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-c-3.mp3' }, { velocity: 0.5, file: '/assets/violin_samples/violin-arco-vibrato-single-c-3-gentle.mp3' }],
    'C4': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-c-4.mp3' }, { velocity: 0.7, file: '/assets/violin_samples/violin-arco-vibrato-single-c-4-voiced.mp3' }],
    'C5': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-c-5.mp3' }, { velocity: 0.6, file: '/assets/violin_samples/violin-arco-vibrato-single-c-5-vibrating.mp3' }],
    'D3': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-d-3.mp3' }, { velocity: 0.6, file: '/assets/violin_samples/violin-arco-vibrato-single-d-3-vibrating.mp3' }],
    'D4': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-d-4.mp3' }],
    'D5': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-d-5.mp3' }, { velocity: 0.5, file: '/assets/violin_samples/violin-arco-vibrato-single-d-5-lowered.mp3' }],
    'E3': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-e-3.mp3' }],
    'E4': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-e-4.mp3' }],
    'E5': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-e-5.mp3' }, { velocity: 0.6, file: '/assets/violin_samples/violin-arco-vibrato-single-e-5 (1).mp3' }],
    'F3': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-f-3.mp3' }, { velocity: 0.5, file: '/assets/violin_samples/violin-arco-vibrato-single-f-3-lowered.mp3' }],
    'F4': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-f-4.mp3' }],
    'F5': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-f-5.mp3' }],
    'G2': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-g-2.mp3' }],
    'G3': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-g-3.mp3' }],
    'G4': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-g-4.mp3' }],
    'G5': [{ velocity: 1, file: '/assets/violin_samples/violin-arco-vibrato-single-g-5.mp3' }],
};


export const FLUTE_SAMPLES: Record<string, VelocitySample[]> = {
    'C4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-c-note_C.wav' },
        { velocity: 1.0, file: '/assets/flute_samples/flute-sustain-vibrato-c-note_C.wav' }
    ],
    'D4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-d-note_D.wav' },
        { velocity: 1.0, file: '/assets/flute_samples/flute-sustain-vibrato-d-note_D.wav' }
    ],
    'E4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-e-note_E.wav' },
        { velocity: 1.0, file: '/assets/flute_samples/flute-sustain-vibrato-e-note.wav' }
    ],
    'F4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-f-note_F.wav' },
        { velocity: 1.0, file: '/assets/flute_samples/flute-sustain-vibrato-f-note_F.wav' }
    ],
    'G4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-g-note_G.wav' },
        { velocity: 1.0, file: '/assets/flute_samples/flute-sustain-vibrato-g-note_G.wav' }
    ],
    'A4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-a-note_A.wav' },
        { velocity: 1.0, file: '/assets/flute_samples/flute-sustain-vibrato-a-note_A.wav' }
    ],
    'B4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-b-note_B.wav' },
        { velocity: 1.0, file: '/assets/flute_samples/flute-sustain-vibrato-b-note_B.wav' }
    ],
    'C5': [
        { velocity: 1.0, file: '/assets/flute_samples/flute-c-major-single-note_C_major.wav' }
    ]
};

export const ACOUSTIC_GUITAR_CHORD_SAMPLES: Record<string, string> = {
    'Dm': '/assets/guitars_hords_samples/guitar-chord-d-minor-dm-rising.mp3',
    'Em': '/assets/guitars_hords_samples/guitar-chord-e-minor-em-ascending.mp3',
    'Fm': '/assets/guitars_hords_samples/guitar-chord-f-minor-fm-ascending.mp3',
    'G': '/assets/guitars_hords_samples/guitar-chord-g-major-g.mp3',
    'A': '/assets/guitars_hords_samples/guitar-chord-in-a-major.mp3',
    'Am': '/assets/guitars_hords_samples/guitar-chord-in-a-minor-am.mp3',
    'Bm': '/assets/guitars_hords_samples/guitar-chord-in-b-minor-bm.mp3',
    'C': '/assets/guitars_hords_samples/guitar-chord-in-c-major-c.mp3',
    'D': '/assets/guitars_hords_samples/guitar-chord-in-d-major.mp3'
};

export const ACOUSTIC_GUITAR_SOLO_SAMPLES: Record<string, VelocitySample[]> = {
    'A3': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-a-3_120bpm.mp3' }],
    'B3': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-b3_120bpm.mp3' }],
    'C3': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-c-3_120bpm.mp3' }],
    'C4': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-c-note-clean.mp3' }],
    'D3': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-d-3_120bpm.mp3' }],
    'D4': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-d-note-regular-clean.mp3' }],
    'E3': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-e3_120bpm.mp3' }],
    'F3': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-f-3_120bpm.mp3' }],
    'G3': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-g-3_120bpm.mp3' }],
    'E4': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-e3_120bpm.mp3' }],
    'F4': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-f-note-clean-high.mp3' }],
    'G4': [{ velocity: 1, file: '/assets/acoustic_guitar_samples/acoustic-guitar-string-g-note-bright-clean.mp3' }]
};
