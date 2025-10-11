
import type { EngineState, EngineConfig, ResonanceMatrix, Seed, EventID } from '@/types/fractal';
import type { Score, Note, BassInstrument, MelodyInstrument, AccompanimentInstrument } from '@/types/music';

// --- Musical & Engine Constants ---
const SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10]; // E Natural Minor degrees
const KEY_ROOT_MIDI = 40; // E2
const NUM_OCTAVES = 4;
const NUM_NOTES_IN_SCALE = SCALE_DEGREES.length;
const TOTAL_EVENTS = NUM_NOTES_IN_SCALE * NUM_OCTAVES;
const MIN_MIDI = KEY_ROOT_MIDI;
const MAX_MIDI = KEY_ROOT_MIDI + (NUM_OCTAVES * 12);
const BASS_MIDI_MIN = 32; // G#1
const BASS_MIDI_MAX = 50; // D3

// --- Note Generation Helper ---
const getNoteFromDegree = (degree: number, scale: number[], root: number, octave: number): number => {
    const scaleLength = scale.length;
    // Ensure the degree is a valid index within the scale array
    const scaleIndex = ((degree % scaleLength) + scaleLength) % scaleLength;
    const noteInScale = scale[scaleIndex];
    const octaveOffset = Math.floor(degree / scaleLength);
    return root + (octave + octaveOffset) * 12 + noteInScale;
};


// --- Fractal Music Engine ---
export class FractalMusicEngine {
  private state: EngineState;
  private config: EngineConfig;
  private K: ResonanceMatrix;
  private availableEvents: EventID[] = [];
  private tickCount: number = 0;
  private melodyState = { lastDegree: 14, direction: 1 }; // State for melody generation

  constructor(seed: Seed, availableMatricesRepo: Record<string, ResonanceMatrix>) {
    this.state = new Map(Object.entries(seed.initialState));
    this.config = seed.config;
    const matrix = availableMatricesRepo[seed.resonanceMatrixId];
    if (!matrix) {
      throw new Error(`Resonance matrix ${seed.resonanceMatrixId} not found!`);
    }
    this.K = matrix;
    this.generateEventUniverse();
    this.normalizeState(this.state);
  }

  private generateEventUniverse() {
      // Instrument events
      const instruments = ['piano', 'violin', 'flute', 'synth', 'organ', 'mellotron', 'theremin', 'E-Bells_melody', 'G-Drops', 'acousticGuitarSolo', 'electricGuitar', 'guitarChords'];
      
      for (const instrument of instruments) {
        for (let octave = 0; octave < NUM_OCTAVES; octave++) {
            for (let i = 0; i < NUM_NOTES_IN_SCALE; i++) {
                const midiNote = KEY_ROOT_MIDI + (octave * 12) + SCALE_DEGREES[i];
                if (midiNote <= MAX_MIDI) {
                   this.availableEvents.push(`${instrument}_${midiNote}`);
                }
            }
        }
      }

      // Drum events
      const drumSamples = ['kick', 'snare', 'hat', 'crash', 'tom1', 'tom2', 'tom3'];
      for (const drum of drumSamples) {
          this.availableEvents.push(`drum_${drum}`);
      }

      this.availableEvents = [...new Set(this.availableEvents)]; // Ensure uniqueness
  }

  public updateConfig(newConfig: Partial<EngineConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
  
  public getConfig(): EngineConfig {
    return this.config;
  }

  private generateImpulse(): Map<EventID, number> {
    const impulse = new Map<EventID, number>();
    const impulseStrength = this.config.density;
    
    const beatsPerBar = 4;
    const beatInMeasure = this.tickCount % beatsPerBar;
    
    // Strong kick on the 1st beat
    if (beatInMeasure === 0 && Math.random() < 0.8) {
        impulse.set('drum_kick', impulseStrength);
    }
    // Snare on the 3rd beat
    if (beatInMeasure === 2 && Math.random() < 0.7 * impulseStrength) {
        impulse.set('drum_snare', 0.8 * impulseStrength);
    }
    // Hi-hats on off-beats
    if (beatInMeasure % 1 !== 0.5 && Math.random() < 0.5 * impulseStrength) {
        impulse.set('drum_hat', 0.4 * impulseStrength);
    }
    
    // Chance to excite a random note
    if (Math.random() < impulseStrength * 0.3) {
        const randomEventIndex = Math.floor(Math.random() * (this.availableEvents.length - 7)); // Avoid drums
        const eventToExcite = this.availableEvents[randomEventIndex];
        impulse.set(eventToExcite, impulseStrength * 0.5);
    }

    return impulse;
  }

  private normalizeState(state: EngineState) {
    let totalWeight = 0;
    for (const weight of state.values()) {
        totalWeight += weight;
    }

    if (totalWeight === 0) {
        if (this.availableEvents.length > 0) {
            const randomEventIndex = Math.floor(Math.random() * this.availableEvents.length);
            state.set(this.availableEvents[randomEventIndex], 1.0);
        }
        return;
    }
    
    // Normalize, but also apply a power curve to accentuate peaks
    for (const [event, weight] of state.entries()) {
        state.set(event, Math.pow(weight / totalWeight, 1.5));
    }
    
    // Re-normalize after power curve
    totalWeight = 0;
    for (const weight of state.values()) { totalWeight += weight; }
    if (totalWeight > 0) {
        for (const [event, weight] of state.entries()) {
            state.set(event, weight / totalWeight);
        }
    }
  }

  public tick() {
    this.tickCount++;
    const nextState: EngineState = new Map();
    const impulse = this.generateImpulse();
    const lambda = 1.0 - (this.config.organic * 0.5 + 0.3); // More memory for higher organic values

    // 1. Apply damping to all possible events
    for (const event of this.availableEvents) {
        const currentWeight = this.state.get(event) || 0;
        nextState.set(event, (1 - lambda) * currentWeight);
    }

    // 2. Calculate and add new resonance from the existing state and the new impulse
    const eventsWithWeight = [...this.state.entries()].filter(([, weight]) => weight > 0.0001);
    
    for (const [event_j] of nextState.entries()) {
        let resonanceSum = 0;
        // Resonance from existing active nodes (self-listening)
        for (const [event_i, weight_i] of eventsWithWeight) {
             resonanceSum += this.K(event_i, event_j) * weight_i * this.config.organic * 0.1;
        }

        // Add impulse energy
        if (impulse.has(event_j)) {
            resonanceSum += impulse.get(event_j)!;
        }
        
        nextState.set(event_j, (nextState.get(event_j) || 0) + resonanceSum);
    }
    
    // 3. Normalize and update the state
    this.normalizeState(nextState);
    this.state = nextState;
  }

  public generateScore(): Score {
    const score: Score = { melody: [], accompaniment: [], bass: [], drums: [] };
    const density = this.config.density;

    const sortedEvents = [...this.state.entries()]
        .map(([id, weight]) => {
            const [type, value] = id.split('_');
            return { id, weight, type, value, midi: parseInt(value) };
        })
        .filter(event => event.weight > 0.01) // Filter out noise
        .sort((a, b) => b.weight - a.weight);

    if (sortedEvents.length === 0) return { instrumentHints: {} };
    
    const musicalEvents = sortedEvents.filter(e => e.type !== 'drum');
    
    // --- BASS ---
    const bassRootCandidates = musicalEvents.filter(e => e.midi < 55).sort((a,b)=>b.weight-a.weight);
    if (bassRootCandidates.length > 0) {
        const rootBassNote = (bassRootCandidates[0].midi % 12) + KEY_ROOT_MIDI - 12;
        const step = 0.5; // 8th notes
        const numSteps = 8;
        const arpPattern = [0, 7, 3, 5, 0, 5, 3, 7]; // Root, 5th, min3, 4th...
        
        for (let i = 0; i < numSteps; i++) {
            if (Math.random() < density * 0.9) { // High probability of playing a note
                const degree = arpPattern[i % arpPattern.length];
                const noteMidi = rootBassNote + degree;
                const midi = Math.max(BASS_MIDI_MIN, Math.min(noteMidi, BASS_MIDI_MAX));
                score.bass!.push({
                    midi,
                    time: i * step,
                    duration: step * (1.2 + Math.random() * 0.8), // Slightly varied duration for groove
                    velocity: 0.7 + Math.random() * 0.3
                });
            }
        }
    }


    // --- ACCOMPANIMENT & MELODY ---
    const midHighEvents = musicalEvents.filter(e => e.midi >= 55).sort((a,b)=>a.midi - b.midi);
    
    // MELODY: Create a more structured phrase
    let melodyNotesCount = Math.floor(density * 5) + 1;
    let time = Math.random() * 0.5;
    for(let i=0; i < melodyNotesCount; i++) {
        if (this.melodyState.lastDegree > NUM_NOTES_IN_SCALE * 2.5) this.melodyState.direction = -1;
        if (this.melodyState.lastDegree < NUM_NOTES_IN_SCALE) this.melodyState.direction = 1;

        const step = Math.random() < 0.7 ? 1 : 2; // Prefer stepwise motion
        this.melodyState.lastDegree += this.melodyState.direction * step;

        const midi = getNoteFromDegree(this.melodyState.lastDegree, SCALE_DEGREES, KEY_ROOT_MIDI, 2);
        if (midi < MAX_MIDI) {
            const duration = 0.5 + Math.random() * 1.5;
            score.melody!.push({ midi, time, duration, velocity: 0.6 + Math.random() * 0.2 });
            time += (duration * 0.5) + (Math.random() * 0.5);
        }
    }
    
    // ACCOMPANIMENT: Fill harmony around melody
    let accompNotesCount = Math.floor(density * 3);
    let accompEvents = midHighEvents.slice(0, accompNotesCount);
    let timeOffset = 0.2;
    accompEvents.forEach(event => {
        score.accompaniment!.push({ midi: event.midi, time: timeOffset, duration: 3.0 + Math.random(), velocity: 0.4 + event.weight * 0.4 });
        timeOffset += 1.0 + Math.random();
    });


    // --- DYNAMIC INSTRUMENT HINTS ---
    let bassHint: BassInstrument = 'ambientDrone';
    if(score.bass && score.bass.length > 0) {
        if (score.bass.length > 2) bassHint = 'classicBass';
        else if (density < 0.4) bassHint = 'ambientDrone';
        else bassHint = 'glideBass';
    }

    let melodyHint: MelodyInstrument = 'flute';
    if (score.melody && score.melody.length > 0) {
        const avgDuration = score.melody.reduce((sum, n) => sum + n.duration, 0) / score.melody.length;
        const avgMidi = score.melody.reduce((sum, n) => sum + n.midi, 0) / score.melody.length;
        
        if (avgMidi > 78) melodyHint = Math.random() < 0.5 ? 'piano' : 'acousticGuitarSolo';
        else if (avgDuration < 1.9) melodyHint = 'acousticGuitarSolo';
        else if (avgDuration > 3.0) melodyHint = 'organ';
        else melodyHint = (Math.random() < 0.5) ? 'flute' : 'mellotron';
    }
    
    let accompHint: AccompanimentInstrument = 'mellotron';
    if (score.accompaniment && score.accompaniment.length > 0) {
        if (score.accompaniment.length <= 2) {
             accompHint = 'violin'; // Use violin for sparse, expressive lines
        } else if (score.accompaniment.length >= 3) {
            accompHint = 'guitarChords'; // Use guitar for chordal textures
        } else {
            if (density > 0.6) accompHint = 'organ';
            else accompHint = 'mellotron';
        }
    }


    score.instrumentHints = {
        bass: bassHint,
        melody: melodyHint,
        accompaniment: accompHint
    };

    return score;
  }
}
