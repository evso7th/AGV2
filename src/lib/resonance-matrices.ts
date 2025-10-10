
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

    const interval = Math.abs(midiA - midiB);
    const semitoneInterval = interval % 12;

    // Rule 2 & 3: Favor consonant intervals and stepwise motion
    switch (semitoneInterval) {
        case 0: return 0.4; // Unison, moderate resonance
        case 1: return 0.5; // Minor second (step)
        case 2: return 0.6; // Major second (step)
        case 3: return 0.9; // Minor third (consonant)
        case 4: return 0.9; // Major third (consonant)
        case 5: return 0.8; // Perfect fourth (consonant)
        case 7: return 1.0; // Perfect fifth (strongest consonant)
        case 8: return 0.7; // Minor sixth
        case 9: return 0.7; // Major sixth
        case 10: return 0.3; // Minor seventh (mildly dissonant)
        case 11: return 0.3; // Major seventh (mildly dissonant)
        case 6: return 0.01; // Tritone (very dissonant)
        default: return 0.1;
    }
  } catch (e) {
      return 0; // Return 0 if parsing fails
  }
};
