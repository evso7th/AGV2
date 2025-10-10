
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
const BASS_MIDI_MIN = 32; // G#1
const BASS_MIDI_MAX = 50; // D3


// --- Fractal Music Engine ---
export class FractalMusicEngine {
  private state: EngineState;
  private config: EngineConfig;
  private K: ResonanceMatrix;
  private availableEvents: EventID[] = [];
  private tickCount: number = 0;

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
    
    // Rhythmic impulse: quarter notes
    const quarter = this.tickCount % 4;
    const beatStrength = (quarter === 0) ? 1.0 : (quarter % 2 === 0 ? 0.5 : 0.25);

    if (Math.random() < impulseStrength * beatStrength) {
        const randomEventIndex = Math.floor(Math.random() * this.availableEvents.length);
        const eventToExcite = this.availableEvents[randomEventIndex];
        impulse.set(eventToExcite, beatStrength * impulseStrength);
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
    this.tickCount++;
    const nextState: EngineState = new Map();
    const impulse = this.generateImpulse();
    const lambda = this.config.lambda;

    // 1. Apply damping to all possible events
    for (const event of this.availableEvents) {
        const currentWeight = this.state.get(event) || 0;
        nextState.set(event, (1 - lambda) * currentWeight);
    }

    // 2. Calculate and add new resonance from the impulse
    for (const [event_j, current_weight_j] of nextState.entries()) {
        let resonanceSum = 0;
        for (const [event_i, impulseValue] of impulse.entries()) {
            if (impulseValue > 0) {
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

    // PAUSE LOGIC: if total energy is very low, create silence
    const totalWeight = [...this.state.values()].reduce((sum, w) => sum + w, 0);
    if (totalWeight < 0.1 || Math.random() > (this.config.density * 1.5)) {
        return {}; // Return empty score for a pause
    }
    
    const sortedEvents = [...this.state.entries()]
        .map(([id, weight]) => ({ id, weight, midi: parseInt(id.split('_')[1])}))
        .filter(event => !isNaN(event.midi))
        .sort((a, b) => b.weight - a.weight);

    const numActiveNotes = Math.max(2, Math.floor(density * 7));
    const activeEvents = sortedEvents.slice(0, numActiveNotes);
    
    if (activeEvents.length < 2) return score;

    // --- Note Distribution Logic ---
    const bassCandidates = activeEvents.filter(e => e.midi < 60).sort((a,b) => a.midi - b.midi);
    const melodyCandidates = activeEvents.filter(e => e.midi >= 60).sort((a,b) => b.midi - a.midi);
    
    let usedIndices = new Set<number>();

    // 1. Assign Bass Note (lowest available)
    if (bassCandidates.length > 0) {
        const bassEvent = bassCandidates[0];
        const bassMidi = (bassEvent.midi % 12) + KEY_ROOT_MIDI - 12; // Transpose to bass range
        score.bass!.push({ midi: Math.max(BASS_MIDI_MIN, bassMidi), time: 0, duration: 3.8, velocity: 0.8 });
        usedIndices.add(activeEvents.findIndex(e => e.id === bassEvent.id));
    } else { // If no low notes are active, take the lowest of all and transpose it down
        const lowestEvent = activeEvents.reduce((prev, curr) => curr.midi < prev.midi ? curr : prev);
        const bassMidi = (lowestEvent.midi % 12) + KEY_ROOT_MIDI - 12;
        score.bass!.push({ midi: Math.max(BASS_MIDI_MIN, bassMidi), time: 0, duration: 3.8, velocity: 0.7 });
        usedIndices.add(activeEvents.findIndex(e => e.id === lowestEvent.id));
    }
    
    // 2. Assign Accompaniment (up to 3 notes from the remaining pool)
    const accompCount = Math.min(melodyCandidates.length -1, Math.floor(density * 3));
    let accompTime = 0.2;
    for(let i=0; i < melodyCandidates.length && score.accompaniment!.length < accompCount; i++) {
        if (!usedIndices.has(activeEvents.findIndex(e => e.id === melodyCandidates[i].id))) {
            const event = melodyCandidates[i];
            const midi = (event.midi % 24) + KEY_ROOT_MIDI + 12; // Mid range
            score.accompaniment!.push({ midi: midi, time: accompTime, duration: 2.5 + Math.random(), velocity: 0.5 + Math.random() * 0.2 });
            usedIndices.add(activeEvents.findIndex(e => e.id === event.id));
            accompTime += 0.3; // Stagger accompaniment notes
        }
    }

    // 3. Assign Melody (highest remaining notes)
    const melodyCount = Math.min(melodyCandidates.length, Math.floor(density * 4));
    let melodyTime = Math.random() * 0.5;
    for (let i = 0; i < melodyCandidates.length && score.melody!.length < melodyCount; i++) {
        const eventIndex = activeEvents.findIndex(e => e.id === melodyCandidates[i].id);
        if (!usedIndices.has(eventIndex)) {
            const event = melodyCandidates[i];
            const midi = (event.midi % 24) + KEY_ROOT_MIDI + 24; // High range
            score.melody!.push({ midi: midi, time: melodyTime, duration: 1.5 + Math.random(), velocity: 0.6 + Math.random() * 0.3 });
            usedIndices.add(eventIndex);
            melodyTime += 4 / (melodyCount + 1);
        }
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

    