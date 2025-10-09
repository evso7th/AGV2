
import type { EngineState, EngineConfig, ResonanceMatrix, Seed, EventID } from '@/types/fractal';
import type { Score, Note } from '@/types/music';

export class FractalMusicEngine {
  private state: EngineState;
  private config: EngineConfig;
  private K: ResonanceMatrix;
  private availableEvents: EventID[];

  constructor(seed: Seed, availableMatricesRepo: Record<string, ResonanceMatrix>) {
    this.availableEvents = Array.from({ length: 24 }, (_, i) => `piano_${48 + i}`); // C3 to B4
    
    const initialState = new Map<EventID, number>();
    this.availableEvents.forEach(event => {
        initialState.set(event, 1 / this.availableEvents.length);
    });

    this.state = initialState;
    this.config = seed.config;
    const matrix = availableMatricesRepo[seed.resonanceMatrixId];
    if (!matrix) {
      throw new Error(`Матрица резонанса ${seed.resonanceMatrixId} не найдена!`);
    }
    this.K = matrix;

    this.normalizeState(this.state);
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
    for (const [event_j, current_weight_j] of nextState.entries()) {
      let resonanceSum = 0;
      for (const [event_i, impulseValue] of impulse.entries()) {
        if (impulseValue > 0) {
          resonanceSum += this.K(event_i, event_j) * impulseValue;
        }
      }
      // Ensure we have a value before setting
      const existingWeight = current_weight_j || 0;
      nextState.set(event_j, existingWeight + resonanceSum);
    }
    
    // 3. Normalize (Σw_i=1) and update state
    this.normalizeState(nextState);
    this.state = nextState;
  }

  // Method to convert the state 'w' into a score for the audio engine
  generateScore(): Score {
    const sortedEvents = [...this.state.entries()].sort((a, b) => b[1] - a[1]);

    const bassNotes: Note[] = [];
    const melodyNotes: Note[] = [];

    // 1. Get the bass note from the highest weighted event
    if (sortedEvents.length > 0) {
        const bassEventId = sortedEvents[0][0];
        const bassMidi = parseInt(bassEventId.split('_')[1]);
        if (!isNaN(bassMidi)) {
            bassNotes.push({ midi: bassMidi - 12, time: 0, duration: 2, velocity: 0.7 }); // Play one octave lower
        }
    }

    // 2. Get melody notes from the next 2 highest weighted events
    if (sortedEvents.length > 1) {
        const melodyEvent1Id = sortedEvents[1][0];
        const melodyMidi1 = parseInt(melodyEvent1Id.split('_')[1]);
        if (!isNaN(melodyMidi1)) {
            melodyNotes.push({ midi: melodyMidi1, time: 0.5, duration: 1, velocity: 0.6 });
        }
    }
    if (sortedEvents.length > 2) {
        const melodyEvent2Id = sortedEvents[2][0];
        const melodyMidi2 = parseInt(melodyEvent2Id.split('_')[1]);
         if (!isNaN(melodyMidi2)) {
            melodyNotes.push({ midi: melodyMidi2, time: 1.5, duration: 0.5, velocity: 0.5 });
        }
    }

    // 3. Return the score with instrument hints
    const score: Score = {
        bass: bassNotes,
        melody: melodyNotes,
        // As per the plan, hard-code instrument hints for now
        instrumentHints: {
            bass: 'ambientDrone',
            melody: 'synth',
            accompaniment: 'none' // No accompaniment for now
        }
    };
    
    return score;
  }
}
