
import type { EngineState, EngineConfig, ResonanceMatrix, Seed, EventID } from '@/types/fractal';
import type { Score, Note } from '@/types/music';

// --- Musical & Engine Constants ---
const SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10]; // E Natural Minor degrees
const KEY_ROOT_MIDI = 40; // E2
const NUM_OCTAVES = 4;
const NUM_NOTES_IN_SCALE = SCALE_DEGREES.length;
const TOTAL_EVENTS = NUM_NOTES_IN_SCALE * NUM_OCTAVES;
const MIN_MIDI = KEY_ROOT_MIDI;
const MAX_MIDI = KEY_ROOT_MIDI + (NUM_OCTAVES * 12);

// --- Fractal Music Engine ---
export class FractalMusicEngine {
  private state: EngineState;
  private config: EngineConfig;
  private K: ResonanceMatrix;
  private availableEvents: EventID[] = [];

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
      for (let octave = 0; octave < NUM_OCTAVES; octave++) {
          for (let i = 0; i < NUM_NOTES_IN_SCALE; i++) {
              const midiNote = KEY_ROOT_MIDI + (octave * 12) + SCALE_DEGREES[i];
              // For now, we assume all events are 'piano'. This can be expanded later.
              this.availableEvents.push(`piano_${midiNote}`);
          }
      }
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
    
    // Simple impulse: excite a random note in the available universe
    if (Math.random() < impulseStrength) {
        const randomEventIndex = Math.floor(Math.random() * this.availableEvents.length);
        const eventToExcite = this.availableEvents[randomEventIndex];
        impulse.set(eventToExcite, 1.0);
    }

    return impulse;
  }

  private normalizeState(state: EngineState) {
    let totalWeight = 0;
    for (const weight of state.values()) {
        totalWeight += weight;
    }

    if (totalWeight === 0) {
        // If the system is "dead", re-energize a random node
        if (this.availableEvents.length > 0) {
            const randomEventIndex = Math.floor(Math.random() * this.availableEvents.length);
            state.set(this.availableEvents[randomEventIndex], 1.0);
        }
        return;
    }

    for (const [event, weight] of state.entries()) {
        state.set(event, weight / totalWeight);
    }
  }

  public tick() {
    const nextState: EngineState = new Map();
    const impulse = this.generateImpulse();
    const lambda = this.config.lambda;

    // 1. Apply damping to all possible events
    for (const event of this.availableEvents) {
        const currentWeight = this.state.get(event) || 0;
        nextState.set(event, (1 - lambda) * currentWeight);
    }

    // 2. Calculate and add new resonance from the impulse
    // The impulse excites the system, and its energy propagates based on the K matrix.
    for (const [event_j, current_weight_j] of nextState.entries()) {
        let resonanceSum = 0;
        for (const [event_i, impulseValue] of impulse.entries()) {
            if (impulseValue > 0) {
                // The resonance K(i,j) determines how much energy flows from excited event i to event j
                resonanceSum += this.K(event_i, event_j) * impulseValue;
            }
        }
        nextState.set(event_j, (current_weight_j || 0) + resonanceSum);
    }
    
    // 3. Normalize and update the state
    this.normalizeState(nextState);
    this.state = nextState;
  }

  public generateScore(): Score {
      const score: Score = { melody: [], accompaniment: [], bass: [] };
      const density = this.config.density;

      // Get the top N most active "neurons" (events)
      const sortedEvents = [...this.state.entries()]
          .sort(([, weightA], [, weightB]) => weightB - weightA);

      const numMelodyNotes = Math.max(1, Math.floor(density * 4));
      const numAccompanimentNotes = Math.max(1, Math.floor(density * 3));
      const numBassNotes = 1;

      const activeEvents = sortedEvents.slice(0, numMelodyNotes + numAccompanimentNotes + numBassNotes);
      
      if (activeEvents.length === 0) return score;

      // PAUSE LOGIC: if total energy is very low, create silence
      const totalWeight = [...this.state.values()].reduce((sum, w) => sum + w, 0);
      if (totalWeight < 0.1 || Math.random() > (density * 1.5)) {
          return {}; // Return empty score for a pause
      }

      let eventIndex = 0;

      // Generate Bass
      if (activeEvents[eventIndex]) {
          const bassEvent = activeEvents[eventIndex++];
          const midi = parseInt(bassEvent[0].split('_')[1]);
          // Transpose to bass range
          const bassMidi = (midi % 12) + KEY_ROOT_MIDI - 12; 
          score.bass!.push({ midi: Math.max(BASS_MIDI_MIN, bassMidi), time: 0, duration: 3.5, velocity: 0.7 });
      }
      
      // Generate Accompaniment (Chord Tones)
      for (let i = 0; i < numAccompanimentNotes; i++) {
          if (!activeEvents[eventIndex]) break;
          const event = activeEvents[eventIndex++];
          const midi = parseInt(event[0].split('_')[1]);
          // Place in mid-range
          const accompMidi = (midi % 24) + KEY_ROOT_MIDI + 12;
          score.accompaniment!.push({ midi: accompMidi, time: i * 0.2, duration: 2, velocity: 0.5 + Math.random() * 0.2 });
      }

      // Generate Melody
      for (let i = 0; i < numMelodyNotes; i++) {
          if (!activeEvents[eventIndex]) break;
           const event = activeEvents[eventIndex++];
           const midi = parseInt(event[0].split('_')[1]);
           // Place in higher range
           const melodyMidi = (midi % 24) + KEY_ROOT_MIDI + 24;
           score.melody!.push({ midi: Math.min(melodyMidi, MAX_MIDI + 12), time: i * (4 / numMelodyNotes) + Math.random() * 0.2, duration: 1.5, velocity: 0.6 + Math.random() * 0.3 });
      }

      // Add instrument hints
      score.instrumentHints = {
          bass: 'glideBass',
          melody: 'theremin',
          accompaniment: 'mellotron'
      };

      return score;
  }
}

    