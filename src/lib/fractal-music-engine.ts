
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
    // This part of the logic was flawed, let's correct it to resonate from the existing state, not just the impulse
    const eventsWithWeight = [...this.state.entries()].filter(([, weight]) => weight > 0.01);
    
    for (const [event_j, current_weight_j] of nextState.entries()) {
        let resonanceSum = 0;
        
        // Resonance from existing active nodes
        for (const [event_i, weight_i] of eventsWithWeight) {
             resonanceSum += this.K(event_i, event_j) * weight_i * this.config.organic * 0.1;
        }

        // Add impulse energy
        if (impulse.has(event_j)) {
            resonanceSum += impulse.get(event_j)!;
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

    const totalWeight = [...this.state.values()].reduce((sum, w) => sum + w, 0);
    if (totalWeight < 0.1 || Math.random() > (density * 1.5)) {
        return {};
    }
    
    const sortedEvents = [...this.state.entries()]
        .map(([id, weight]) => ({ id, weight, midi: parseInt(id.split('_')[1])}))
        .filter(event => !isNaN(event.midi) && event.weight > 0.01) // Filter out insignificant events
        .sort((a, b) => b.weight - a.weight);

    if (sortedEvents.length === 0) return {};

    const numActiveNotes = Math.max(1, Math.min(sortedEvents.length, Math.floor(density * 7) + 2));
    let activeEvents = sortedEvents.slice(0, numActiveNotes);
    activeEvents.sort((a, b) => a.midi - b.midi); // Sort by pitch for easier distribution
    
    let remainingEvents = [...activeEvents];

    // 1. Assign Bass Note (the lowest, most resonant note)
    const bassEvent = remainingEvents.shift();
    if (bassEvent) {
        const bassMidi = (bassEvent.midi % 12) + KEY_ROOT_MIDI - 12; // Transpose to bass range
        score.bass!.push({ midi: Math.max(BASS_MIDI_MIN, Math.min(bassMidi, BASS_MIDI_MAX)), time: 0, duration: 3.9, velocity: 0.8 });
    }

    // 2. Assign Accompaniment (chordal or arpeggiated texture)
    const accompCount = Math.min(remainingEvents.length, Math.floor(density * 3));
    if (accompCount > 0) {
        const accompEvents = remainingEvents.splice(0, accompCount);
        let timeOffset = 0.1;
        accompEvents.forEach(event => {
            score.accompaniment!.push({ midi: event.midi, time: timeOffset, duration: 2.5 + Math.random(), velocity: 0.5 + event.weight * 0.3 });
            timeOffset += 0.2 + Math.random() * 0.3; // Stagger accompaniment notes
        });
    }

    // 3. Assign Melody (highest remaining notes)
    const melodyCount = Math.min(remainingEvents.length, Math.floor(density * 4));
    if (melodyCount > 0) {
        const melodyEvents = remainingEvents.splice(0, melodyCount).sort((a,b) => b.weight - a.weight);
        let melodyTime = Math.random() * 0.5;
        const timeStep = 4.0 / melodyEvents.length;
        melodyEvents.forEach(event => {
            score.melody!.push({ midi: event.midi, time: melodyTime, duration: 1.5 + Math.random(), velocity: 0.6 + event.weight * 0.4 });
            melodyTime += timeStep;
        });
    }

    // 4. Dynamic Instrument Hints
    let bassHint: BassInstrument = 'ambientDrone';
    if(score.bass && score.bass.length > 1) bassHint = 'classicBass';
    else if (density > 0.6) bassHint = 'resonantGliss';

    let melodyHint: MelodyInstrument = 'theremin';
    if(score.melody && score.melody.length > 2) melodyHint = 'synth';
    
    let accompHint: AccompanimentInstrument = 'mellotron';
    if (score.accompaniment && score.accompaniment.length > 1) {
        const interval = Math.abs(score.accompaniment[0].midi - score.accompaniment[1].midi);
        if (interval > 4) accompHint = 'organ';
    }


    score.instrumentHints = {
        bass: bassHint,
        melody: melodyHint,
        accompaniment: accompHint
    };

    return score;
  }
}

    