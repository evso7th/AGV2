
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
        return 0.9; // Strong resonance between bass and kick
    }

    // --- Melodic/Harmonic Rules ---
    const midiA = parseInt(valueA);
    const midiB = parseInt(valueB);

    if (isNaN(midiA) || isNaN(midiB)) return 0;
    
    // Bass resonance with itself
    if (typeA === 'bass' && typeB === 'bass') {
        const interval = Math.abs(midiA - midiB) % 12;
        if ([3, 4, 7].includes(interval)) return 0.7; // thirds and fifths
        if ([2, 5].includes(interval)) return 0.5; // steps
        return 0.2;
    }

    // Bass resonating with melody/accomp
    if (typeA === 'bass' || typeB === 'bass') {
       const interval = Math.abs(midiA - midiB) % 12;
       if (interval === 0 || interval === 7) return 0.8; // Octave/Unison and Fifths are strong anchors
       return 0.3;
    }
    
    // --- Default melodic/harmonic rules from before ---
    const degreeA = midiA % 12;
    const degreeB = midiB % 12;
    
    const scaleDegrees = E_MINOR_SCALE_MIDI_DEGREES.map(n => n % 12);

    const inScaleA = scaleDegrees.includes(degreeA);
    const inScaleB = scaleDegrees.includes(degreeB);
    if (!inScaleA || !inScaleB) return 0;

    const interval = Math.abs(midiA - midiB);
    const semitoneInterval = interval % 12;

    switch (semitoneInterval) {
        case 0: return 0.3; // Unison
        case 1: return 0.4; // Stepwise motion
        case 2: return 0.5; // Stepwise motion
        case 3: return 0.8; // Minor third (consonant)
        case 4: return 0.8; // Major third (consonant)
        case 5: return 0.7; // Perfect fourth
        case 7: return 0.9; // Perfect fifth (strongest)
        case 8: return 0.6; // Minor sixth
        case 9: return 0.6; // Major sixth
        case 10: return 0.2; // Minor seventh
        case 11: return 0.2; // Major seventh
        case 6: return 0.1; // Tritone (dissonant)
        default: return 0.1;
    }
  } catch (e) {
      return 0;
  }
};
