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
        this.availableEvents.forEach(event => {
            initialState.set(event, 1 / this.availableEvents.length);
        });
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
    // console.log('[FractalEngine] Tick started. Current state size:', this.state.size);
    const nextState: EngineState = new Map();
    const impulse = this.generateImpulse();

    // 1. Apply decay (1-λ)w_t(j)
    for (const [event, weight] of this.state.entries()) {
      nextState.set(event, (1 - this.config.lambda) * weight);
    }
    // console.log('[FractalEngine] State after decay:', nextState);

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
    // console.log('[FractalEngine] State after resonance:', nextState);
    
    // 3. Normalize (Σw_i=1) and update state
    this.normalizeState(nextState);
    this.state = nextState;
    // console.log('[FractalEngine] State after normalization:', this.state);
  }

  // Method to convert the state 'w' into a score for the audio engine
  generateScore(): Score {
    const sortedEvents = [...this.state.entries()].sort((a, b) => b[1] - a[1]);

    const bassNotes: Note[] = [];
    const melodyNotes: Note[] = [];
    const accompanimentNotes: Note[] = [];

    // Select the top N events based on density
    const numToPlay = Math.max(1, Math.floor(this.config.density * 5)); 
    const topEvents = sortedEvents.slice(0, numToPlay);

    // 1. Bass note from the highest weighted event
    if (topEvents.length > 0) {
        const bassEventId = topEvents[0][0];
        const bassMidi = parseInt(bassEventId.split('_')[1]);
        if (!isNaN(bassMidi)) {
            bassNotes.push({ midi: bassMidi - 24, time: 0, duration: 4, velocity: 0.7 }); // Play two octaves lower for 4 beats
        }
    }

    // 2. Melody and Accompaniment from the next events
    const otherEvents = topEvents.slice(1);
    const step = 4 / (otherEvents.length || 1);
    
    otherEvents.forEach((event, index) => {
        const eventId = event[0];
        const weight = event[1];
        const midi = parseInt(eventId.split('_')[1]);

        if (!isNaN(midi)) {
            const note: Note = {
                midi: midi - 12, // One octave lower
                time: index * step,
                duration: step * 1.5,
                velocity: 0.4 + weight * 0.6 // Velocity based on weight
            };

            // Distribute between melody and accompaniment
            if (index % 2 === 0) {
                melodyNotes.push(note);
            } else {
                accompanimentNotes.push(note);
            }
        }
    });

    // 3. Return the score with instrument hints
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
    
    // console.log("[FractalEngine] Generated Score:", score);
    return score;
  }
}
