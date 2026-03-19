import type { InstrumentType } from '@/types/fractal';

export const PERCUSSION_SETS: Record<string, InstrumentType[]> = {
    ELECTRONIC: [
        'perc-001', 'perc-002', 'perc-003', 'perc-004', 'perc-005', 
        'perc-006', 'perc-007', 'perc-008', 'perc-009', 'perc-010',
        'hh_big_a_bit_open', 'hh_a_bit_open', 'hh_closed_a_bit_open'
    ],
    ACOUSTIC: [
        'drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_crash', 
        'drum_ride', 'drum_snare_off', 'drum_snare_ghost_note'
    ]
};

// Keep other potential exports from the old file if they are needed elsewhere
// For now, this is the minimal fix.
