import type { ResonanceMatrix, EventID } from '@/types/fractal';

// A simple scale to work with for the first matrix
const E_MINOR_SCALE_MIDI_DEGREES = [40, 42, 43, 45, 47, 48, 50, 52, 54, 55, 57, 59, 60, 62];

export const MelancholicMinorK: ResonanceMatrix = (eventA, eventB) => {
  try {
    const midiA = parseInt(eventA.split('_')[1]);
    const midiB = parseInt(eventB.split('_')[1]);

    if (isNaN(midiA) || isNaN(midiB)) return 0;
    
    const interval = Math.abs(midiA - midiB);

    const inScaleA = E_MINOR_SCALE_MIDI_DEGREES.includes(midiA);
    const inScaleB = E_MINOR_SCALE_MIDI_DEGREES.includes(midiB);
    
    // Rule 1: Both notes must be in the E minor scale
    if (!inScaleA || !inScaleB) return 0;

    // Rule 2: Prefer consonant intervals (thirds, fourths, fifths)
    const intervalClass = interval % 12;
    if ([3, 4, 5, 7].includes(intervalClass)) {
      return 0.8; // Strong resonance
    }
    
    // Rule 3: Prefer smooth stepwise motion
    if (intervalClass === 1 || intervalClass === 2) {
      return 0.5;
    }
    
    // Rule 4: Penalize dissonant intervals like the tritone
    if (intervalClass === 6) {
        return 0.01;
    }

    return 0.1; // Weak base resonance for other diatonic intervals
  } catch (e) {
      return 0; // Return 0 if parsing fails
  }
};
