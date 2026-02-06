import type { Note, MelodyInstrument, InstrumentType } from "@/types/music";

type VelocitySample = {
    velocity: number;
    file: string;
};

export const PIANO_SAMPLES: Record<string, string> = {
    'D6': '/assets/piano_samples/448604__piano_sust_pedal__d6.ogg',
    'G7': '/assets/piano_samples/448556__piano_sust_pedal__g7.ogg',
    'B7': '/assets/piano_samples/448535__piano_sust_pedal__b7.ogg',
    'G1': '/assets/piano_samples/448591__piano_sust_pedal__g1.ogg',
    'D5': '/assets/piano_samples/448619__piano_sust_pedal__d5.ogg',
    'A1': '/assets/piano_samples/448578__piano_sust_pedal__a1.ogg',
    'A0': '/assets/piano_samples/448579__piano_sust_pedal__a0.ogg',
    'A2': '/assets/piano_samples/448571__piano_sust_pedal__a2.ogg',
    'E7': '/assets/piano_samples/448610__piano_sust_pedal__e7.ogg',
    'F1': '/assets/piano_samples/448586__piano_sust_pedal__f1.ogg',
    'E5': '/assets/piano_samples/448612__piano_sust_pedal__e5.ogg',
    'A7': '/assets/piano_samples/448566__piano_sust_pedal__a7.ogg',
    'G4': '/assets/piano_samples/448592__piano_sust_pedal__g4.ogg',
    'C5': '/assets/piano_samples/448532__piano_sust_pedal__c5.ogg',
    'A3': '/assets/piano_samples/448562__piano_sust_pedal__a3.ogg',
    'C2': '/assets/piano_samples/448547__piano_sust_pedal__c2.ogg',
    'F5': '/assets/piano_samples/448582__piano_sust_pedal__f5.ogg',
    'C3': '/assets/piano_samples/448538__piano_sust_pedal__c3.ogg',
    'E1': '/assets/piano_samples/448616__piano_sust_pedal__e1.ogg',
    'G3': '/assets/piano_samples/448593__piano_sust_pedal__g3.ogg',
    'F6': '/assets/piano_samples/448583__piano_sust_pedal__f6.ogg',
    'D2': '/assets/piano_samples/448607__piano_sust_pedal__d2.ogg',
    'E6': '/assets/piano_samples/448611__piano_sust_pedal__e6.ogg',
    'G2': '/assets/piano_samples/448590__piano_sust_pedal__g2.ogg',
    'A5': '/assets/piano_samples/448560__piano_sust_pedal__a5.ogg',
    'F2': '/assets/piano_samples/448588__piano_sust_pedal__f2.ogg',
    'B1': '/assets/piano_samples/448564__piano_sust_pedal__b1.ogg',
    'G5': '/assets/piano_samples/448599__piano_sust_pedal__g5.ogg',
    'E3': '/assets/piano_samples/448614__piano_sust_pedal__e3.ogg',
    'A6': '/assets/piano_samples/448567__piano_sust_pedal__a6.ogg',
    'C1': '/assets/piano_samples/448544__piano_sust_pedal__c1.ogg',
    'E4': '/assets/piano_samples/448613__piano_sust_pedal__e4.ogg',
    'E2': '/assets/piano_samples/448615__piano_sust_pedal__e2.ogg',
    'B6': '/assets/piano_samples/448534__piano_sust_pedal__b6.ogg',
    'F3': '/assets/piano_samples/448589__piano_sust_pedal__f3.ogg',
    'D3': '/assets/piano_samples/448601__piano_sust_pedal__d3.ogg',
    'A4': '/assets/piano_samples/448561__piano_sust_pedal__a4.ogg',
    'D1': '/assets/piano_samples/448606__piano_sust_pedal__d1.ogg',
    'C8': '/assets/piano_samples/448543__piano_sust_pedal__c8.ogg',
    'B2': '/assets/piano_samples/448569__piano_sust_pedal__b2.ogg',
    'B3': '/assets/piano_samples/448568__piano_sust_pedal__b3.ogg',
    'F7': '/assets/piano_samples/448596__piano_sust_pedal__f7.ogg',
    'B4': '/assets/piano_samples/448536__piano_sust_pedal__b4.ogg',
    'C7': '/assets/piano_samples/448550__piano_sust_pedal__c7.ogg',
    'D4': '/assets/piano_samples/448602__piano_sust_pedal__d4.ogg',
    'G6': '/assets/piano_samples/448598__piano_sust_pedal__g6.ogg',
    'F4': '/assets/piano_samples/448585__piano_sust_pedal__f4.ogg',
    'C4': '/assets/piano_samples/448549__piano_sust_pedal__c4.ogg',
    'B5': '/assets/piano_samples/448537__piano_sust_pedal__b5.ogg',
    'C6': '/assets/piano_samples/448533__piano_sust_pedal__c6.ogg',
    'D7': '/assets/piano_samples/448605__piano_sust_pedal__d7.ogg',
    'B0': '/assets/piano_samples/448565__piano_sust_pedal__b0.ogg',
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
        { velocity: 1.0, file: '/assets/violin_samples/violin-arco-vibrato-single-a-4.mp3' }
    ],
    'B4': [
        { velocity: 0.5, file: '/assets/flute_samples/flute-sustain-b-note_B.wav' },
        { velocity: 1.0, file: '/assets/violin_samples/violin-arco-vibrato-single-b-4.mp3' }
    ],
    'C5': [
        { velocity: 1.0, file: '/assets/flute_samples/flute-c-major-single-note_C_major.wav' }
    ]
};

/**
 * #ЗАЧЕМ: Эта карта содержит только аутентичные сэмплы акустических аккордов.
 * #ЧТО: Удалены все вхождения Telecaster Clean для предотвращения тембрального конфликта.
 */
export const ACOUSTIC_GUITAR_CHORD_SAMPLES: Record<string, string> = {
  'Cdim': '/assets/guitars_hords_samples/1657cdim.ogg',
  'Cm': '/assets/guitars_hords_samples/1658cm.ogg',
  'Cm6': '/assets/guitars_hords_samples/1659cm6.ogg',
  'Cm7': '/assets/guitars_hords_samples/1660cm7.ogg',
  'C': '/assets/guitars_hords_samples/1662c.ogg',
  'C6': '/assets/guitars_hords_samples/1663c6.ogg',
  'C7': '/assets/guitars_hords_samples/1664c7.ogg',
  'C9': '/assets/guitars_hords_samples/1665c9.ogg',
  'B': '/assets/guitars_hords_samples/4279-b.ogg',
  'B6': '/assets/guitars_hords_samples/4280-b6.ogg',
  'B7': '/assets/guitars_hords_samples/4281-b7.ogg',
  'B9': '/assets/guitars_hords_samples/4283-b9.ogg',
  'Bb': '/assets/guitars_hords_samples/4284-bb.ogg',
  'Bb6': '/assets/guitars_hords_samples/4285-bb6.ogg',
  'Bb7': '/assets/guitars_hords_samples/4286-bb7.ogg',
  'Bbm': '/assets/guitars_hords_samples/4287-bbm.ogg',
  'Bm': '/assets/guitars_hords_samples/4288-bm.ogg',
  'Bm6': '/assets/guitars_hords_samples/4289-bm6.ogg',
  'Bm7': '/assets/guitars_hords_samples/4290-bm7.ogg',
  'Baug': '/assets/guitars_hords_samples/4291-baug.ogg',
  'Bdim': '/assets/guitars_hords_samples/4292-bdim.ogg',
  'A': '/assets/guitars_hords_samples/4562-a.ogg',
  'A6': '/assets/guitars_hords_samples/4564-a6.ogg',
  'A7': '/assets/guitars_hords_samples/4565-a7.ogg',
  'Adim': '/assets/guitars_hords_samples/4566-adim.ogg',
  'Am': '/assets/guitars_hords_samples/4567-am.ogg',
  'Am6': '/assets/guitars_hords_samples/4568-am6.ogg',
  'Am7': '/assets/guitars_hords_samples/4569-am7.ogg',
  'Ab': '/assets/guitars_hords_samples/5715-ab.ogg',
  'Ab6': '/assets/guitars_hords_samples/5839ab-6.ogg',
  'Ab7': '/assets/guitars_hords_samples/5840ab-7.ogg',
  'Ab9': '/assets/guitars_hords_samples/5841ab-9.ogg',
  'Abaug': '/assets/guitars_hords_samples/5843abaug.ogg',
  'Abdim': '/assets/guitars_hords_samples/5844abdim.ogg',
  'Abm6': '/assets/guitars_hords_samples/5845abm-6.ogg',
  'Abm7': '/assets/guitars_hords_samples/5846abm-7.ogg',
  'Abm': '/assets/guitars_hords_samples/5847abm.ogg',
};

export type GuitarTechniqueSamples = {
  pluck?: string;
  pick?: string;
  harm?: string;
};

export const ACOUSTIC_GUITAR_SOLO_SAMPLES: Record<string, GuitarTechniqueSamples> = {
    'E2': {
        pick: '/assets/acoustic_guitar_samples/8396_speedy_clean_e_str_pick.mp3',
        pluck: '/assets/acoustic_guitar_samples/8397_speedy_clean_e_str_pluck.mp3',
        harm: '/assets/acoustic_guitar_samples/8395_speedy_clean_e_harm.mp3'
    },
    'A2': {
        pick: '/assets/acoustic_guitar_samples/8382_speedy_clean_a_str_pick.mp3',
        pluck: '/assets/acoustic_guitar_samples/8383_speedy_clean_a_str_pluck.mp3',
        harm: '/assets/acoustic_guitar_samples/8381_speedy_clean_a_harm.mp3'
    },
    'D3': {
        pick: '/assets/acoustic_guitar_samples/8388_speedy_clean_d_str_pick.mp3',
        pluck: '/assets/acoustic_guitar_samples/8389_speedy_clean_d_str_pluck.mp3',
        harm: '/assets/acoustic_guitar_samples/8387_speedy_clean_d_harm.mp3'
    },
    'G3': {
        pick: '/assets/acoustic_guitar_samples/8402_speedy_clean_g_str_pick.mp3',
        pluck: '/assets/acoustic_guitar_samples/8403_speedy_clean_g_str_pluck.mp3',
        harm: '/assets/acoustic_guitar_samples/8401_speedy_clean_g_harm1.mp3'
    },
    'B3': {
        pick: '/assets/acoustic_guitar_samples/8385_speedy_clean_b_str_pick.mp3',
        pluck: '/assets/acoustic_guitar_samples/8386_speedy_clean_b_str_pluck.mp3',
        harm: '/assets/acoustic_guitar_samples/8384_speedy_clean_b_harm.mp3'
    },
    'E4': {
        pick: '/assets/acoustic_guitar_samples/8393_speedy_clean_e1st_str_pick.mp3',
        pluck: '/assets/acoustic_guitar_samples/8394_speedy_clean_e1st_str_pluck.mp3',
        harm: '/assets/acoustic_guitar_samples/8392_speedy_clean_e1st_harm.mp3'
    },
};

export const ACOUSTIC_GUITAR_SLIDE_SAMPLES: string[] = [
    '/assets/acoustic_guitar_samples/8398_speedy_clean_finger_slide2_delay.mp3',
    '/assets/acoustic_guitar_samples/8399_speedy_clean_finger_slide_delay.mp3'
];
