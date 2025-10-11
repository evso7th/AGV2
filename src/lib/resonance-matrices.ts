
import type { ResonanceMatrix, EventID } from '@/types/fractal';

// A simple scale to work with for the first matrix
const E_MINOR_SCALE_MIDI_DEGREES = [40, 42, 43, 45, 47, 48, 50]; // MIDI note numbers for E minor scale starting at E2

const PERCUSSION_SOUNDS: Record<string, number> = {
    'kick': 60, 'snare': 62, 'hat': 64, 'crash': 67, 'tom1': 69, 'tom2': 71, 'tom3': 72, 'ride': 65
};


export const MelancholicMinorK: ResonanceMatrix = (eventA, eventB) => {
  try {
    const [typeA, valueA] = eventA.split('_');
    const [typeB, valueB] = eventB.split('_');

    // Rule for drum interactions
    if (typeA.startsWith('drum') && typeB.startsWith('drum')) {
        if (valueA === 'kick' && (valueB === 'hat' || valueB === 'ride')) return 0.6; // Kick and hi-hats go together
        if (valueA === 'snare' && (valueB === 'hat' || valueB === 'ride')) return 0.5;
        return 0.1; // Low base resonance for other drum parts
    }
    
    // Rule for bass and kick drum synchronization
    if ((typeA === 'bass' && typeB === 'drum_kick') || (typeA === 'drum_kick' && typeB === 'bass')) {
        return 0.8; // Strong resonance between bass and kick
    }

    // --- Melodic/Harmonic Rules ---
    const midiA = parseInt(valueA);
    const midiB = parseInt(valueB);

    if (isNaN(midiA) || isNaN(midiB)) return 0;
    
    const degreeA = midiA % 12;
    const degreeB = midiB % 12;
    
    const scaleDegrees = E_MINOR_SCALE_MIDI_DEGREES.map(n => n % 12);

    const inScaleA = scaleDegrees.includes(degreeA);
    const inScaleB = scaleDegrees.includes(degreeB);
    if (!inScaleA || !inScaleB) return 0;

    // Give bass notes a slightly higher base resonance
    let baseResonance = (typeA === 'bass' || typeB === 'bass') ? 0.2 : 0.1;

    const interval = Math.abs(midiA - midiB);
    const semitoneInterval = interval % 12;

    switch (semitoneInterval) {
        case 0: return baseResonance + 0.3; // Unison
        case 1: return baseResonance + 0.4; // Stepwise motion
        case 2: return baseResonance + 0.5; // Stepwise motion
        case 3: return baseResonance + 0.8; // Minor third (consonant)
        case 4: return baseResonance + 0.8; // Major third (consonant)
        case 5: return baseResonance + 0.7; // Perfect fourth
        case 7: return baseResonance + 0.9; // Perfect fifth (strongest)
        case 8: return baseResonance + 0.6; // Minor sixth
        case 9: return baseResonance + 0.6; // Major sixth
        case 10: return baseResonance + 0.2; // Minor seventh
        case 11: return baseResonance + 0.2; // Major seventh
        case 6: return baseResonance * 0.1; // Tritone (dissonant)
        default: return baseResonance;
    }
  } catch (e) {
      return 0;
  }
};
