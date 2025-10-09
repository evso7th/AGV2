import type { ResonanceMatrix, EventID } from '@/types/fractal';

// A simple scale to work with for the first matrix
const E_MINOR_SCALE_MIDI_DEGREES = [40, 42, 43, 45, 47, 48, 50]; // MIDI note numbers for E minor scale starting at E2

export const MelancholicMinorK: ResonanceMatrix = (eventA, eventB) => {
  try {
    const midiA = parseInt(eventA.split('_')[1]);
    const midiB = parseInt(eventB.split('_')[1]);

    if (isNaN(midiA) || isNaN(midiB)) return 0;
    
    // Convert to scale degrees (0-11) to check for inclusion regardless of octave
    const degreeA = midiA % 12;
    const degreeB = midiB % 12;
    
    const scaleDegrees = E_MINOR_SCALE_MIDI_DEGREES.map(n => n % 12);

    // Rule 1: Both notes must be in the E minor scale
    const inScaleA = scaleDegrees.includes(degreeA);
    const inScaleB = scaleDegrees.includes(degreeB);
    if (!inScaleA || !inScaleB) return 0;

    const interval = Math.abs(midiA - midiB) % 12;

    // Rule 2: Prefer consonant intervals (minor/major thirds, perfect fourths, perfect fifths)
    if ([3, 4, 5, 7].includes(interval)) {
      return 0.8; // Strong resonance
    }
    
    // Rule 3: Prefer smooth stepwise motion (major/minor seconds)
    if (interval === 1 || interval === 2) {
      return 0.5;
    }
    
    // Rule 4: Penalize dissonant intervals like the tritone
    if (interval === 6) {
        return 0.01;
    }

    // Unison has a moderate resonance
    if (interval === 0) {
        return 0.3;
    }

    return 0.1; // Weak base resonance for other diatonic intervals (e.g., sixths)
  } catch (e) {
      return 0; // Return 0 if parsing fails
  }
};
