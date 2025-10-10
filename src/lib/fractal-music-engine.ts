
import type { EngineState, EngineConfig, ResonanceMatrix, Seed, EventID } from '@/types/fractal';
import type { Score, Note, InstrumentSettings } from '@/types/music';
import { MelancholicMinorK } from './resonance-matrices';


export class FractalMusicEngine {
  private state: EngineState;
  private config: EngineConfig;
  private K: ResonanceMatrix;
  private availableEvents: EventID[];

  constructor(seed: Seed, availableMatricesRepo: Record<string, ResonanceMatrix>) {
    this.availableEvents = Array.from({ length: 36 }, (_, i) => `piano_${48 + i}`); // C3 to B5
    
    // Initialize with a uniform distribution if seed is empty
    const initialState = new Map<EventID, number>();
    if (Object.keys(seed.initialState).length === 0) {
        const randomStartIndex = Math.floor(Math.random() * this.availableEvents.length);
        const randomEvent = this.availableEvents[randomStartIndex];
        initialState.set(randomEvent, 1.0);
    } else {
        for (const [key, value] of Object.entries(seed.initialState)) {
            initialState.set(key, value);
        }
    }
    
    this.state = initialState;
    this.config = seed.config;
    const matrix = availableMatricesRepo[seed.resonanceMatrixId];
    if (!matrix) {
      throw new Error(`Матрица резонанса ${seed.resonanceMatrixId} не найдена!`);
    }
    this.K = matrix;

    this.normalizeState(this.state);
  }

  public updateConfig(newConfig: Partial<EngineConfig>) {
      this.config = { ...this.config, ...newConfig };
  }
  
  public getConfig(): EngineConfig {
      return this.config;
  }

  private generateImpulse(): Map<EventID, number> {
    const impulse: Map<EventID, number> = new Map();
    // Simple impulse: "hit" a random note to keep things dynamic
    const randomIndex = Math.floor(Math.random() * this.availableEvents.length);
    const randomEvent = this.availableEvents[randomIndex];
    impulse.set(randomEvent, 1.0 * this.config.density);
    return impulse;
  }

  private normalizeState(state: EngineState) {
      let sum = 0;
      for (const weight of state.values()) {
          sum += weight;
      }
      if (sum === 0) { // If sum is zero, reset to a uniform distribution
        for (const event of this.availableEvents) {
            state.set(event, 1 / this.availableEvents.length);
        }
        return;
      };
      for (const [event, weight] of state.entries()) {
          state.set(event, weight / sum);
      }
  }

  // Main method that implements the formula
  tick() {
    const nextState: EngineState = new Map();
    const impulse = this.generateImpulse();

    // 1. Apply decay (1-λ)w_t(j)
    for (const [event, weight] of this.state.entries()) {
      nextState.set(event, (1 - this.config.lambda) * weight);
    }

    // 2. Calculate and add new resonance Σ K_ij * δ_i
    for (const event_j of this.availableEvents) {
      let resonanceSum = 0;
      for (const [event_i, impulseValue] of impulse.entries()) {
        if (impulseValue > 0) {
          resonanceSum += this.K(event_i, event_j) * impulseValue;
        }
      }
      const existingWeight = nextState.get(event_j) || 0;
      nextState.set(event_j, existingWeight + resonanceSum);
    }
    
    // 3. Normalize (Σw_i=1) and update state
    this.normalizeState(nextState);
    this.state = nextState;
  }

  // Method to convert the state 'w' into a score for the audio engine
  generateScore(): Score {
    const sortedEvents = [...this.state.entries()].sort((a, b) => b[1] - a[1]);
    const numToPlay = Math.max(1, Math.floor(this.config.density * 5)); 
    const topEvents = sortedEvents.slice(0, numToPlay);
    
    if (topEvents.length === 0) {
        return {};
    }

    // Determine the root note and chord tones from the strongest event
    const rootEventId = topEvents[0][0];
    const rootMidi = parseInt(rootEventId.split('_')[1]);
    if (isNaN(rootMidi)) return {};

    // For E-minor scale context
    const E_MINOR_SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10];
    const rootDegree = (rootMidi - 40) % 12;
    let rootDegreeIndex = E_MINOR_SCALE_DEGREES.indexOf(rootDegree);
    if (rootDegreeIndex === -1) rootDegreeIndex = 0;

    const chordTones = [
        E_MINOR_SCALE_DEGREES[(rootDegreeIndex) % 7],
        E_MINOR_SCALE_DEGREES[(rootDegreeIndex + 2) % 7],
        E_MINOR_SCALE_DEGREES[(rootDegreeIndex + 4) % 7],
    ].map(degree => rootMidi - rootDegree + degree);

    const bassNotes: Note[] = [{ midi: rootMidi - 12, time: 0, duration: 4, velocity: 0.8 }];
    const accompanimentNotes: Note[] = [];
    
    // Generate an arpeggio for accompaniment
    const numArpNotes = Math.floor(this.config.density * 8) + 4; // 4 to 12 notes
    const stepDuration = 4 / numArpNotes; // duration of a 16th note in a 4/4 bar
    const arpPattern = [0, 1, 2, 1]; // Simple up-down pattern
    
    for (let i = 0; i < numArpNotes; i++) {
        const chordToneIndex = arpPattern[i % arpPattern.length];
        const midi = chordTones[chordToneIndex];
        const octaveShift = Math.random() < 0.3 ? 12 : 0;
        
        accompanimentNotes.push({
            midi: midi + octaveShift,
            time: i * stepDuration,
            duration: stepDuration * 2, // notes overlap slightly
            velocity: 0.5 + Math.random() * 0.2
        });
    }
    
    const melodyNotes: Note[] = [];
    if (topEvents.length > 1) {
        const melodyMidi = parseInt(topEvents[1][0].split('_')[1]);
         if (!isNaN(melodyMidi)) {
            melodyNotes.push({midi: melodyMidi, time: 0.5, duration: 3, velocity: 0.6});
         }
    }


    const score: Score = {
        bass: bassNotes,
        melody: melodyNotes,
        accompaniment: accompanimentNotes,
        instrumentHints: {
            bass: 'ambientDrone',
            melody: 'theremin',
            accompaniment: 'synth'
        }
    };
    
    return score;
  }
}
