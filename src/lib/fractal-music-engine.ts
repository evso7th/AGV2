
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
    
    // Rhythmic impulse: quarter notes, with varying strength
    const beatInBar = this.tickCount % 4; // Assuming 4 beats per bar
    const beatStrength = (beatInBar === 0) ? 1.0 : (beatInBar % 2 === 0 ? 0.5 : 0.25);

    if (Math.random() < impulseStrength * beatStrength * 0.5) { // Reduced probability
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

    // 2. Calculate and add new resonance from the existing state and the new impulse
    const eventsWithWeight = [...this.state.entries()].filter(([, weight]) => weight > 0.001); // Lower threshold
    
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
    if (totalWeight < 0.05 || Math.random() > (density * 1.2)) { // Add more chance for silence
        return { instrumentHints: {} }; // Return empty with hints object
    }
    
    const sortedEvents = [...this.state.entries()]
        .map(([id, weight]) => ({ id, weight, midi: parseInt(id.split('_')[1])}))
        .filter(event => !isNaN(event.midi) && event.weight > 0.02) // Increased threshold
        .sort((a, b) => b.weight - a.weight);

    if (sortedEvents.length === 0) return { instrumentHints: {} };

    const numActiveNotes = Math.max(1, Math.min(sortedEvents.length, Math.floor(density * 6) + 1));
    let activeEvents = sortedEvents.slice(0, numActiveNotes);
    activeEvents.sort((a, b) => a.midi - b.midi); 
    
    let remainingEvents = [...activeEvents];

    const bassEvent = remainingEvents.shift();
    if (bassEvent) {
        const bassMidi = (bassEvent.midi % 12) + KEY_ROOT_MIDI - 12;
        score.bass!.push({ midi: Math.max(BASS_MIDI_MIN, Math.min(bassMidi, BASS_MIDI_MAX)), time: 0, duration: 3.8, velocity: 0.8 });
    }

    const accompCount = Math.min(remainingEvents.length, Math.floor(density * 2) + 1);
    if (accompCount > 0) {
        const accompEvents = remainingEvents.splice(0, accompCount);
        let timeOffset = 0.15;
        accompEvents.forEach(event => {
            if (event.midi < 72) { // Keep accompaniment in mid-range
                score.accompaniment!.push({ midi: event.midi, time: timeOffset, duration: 2.8 + Math.random(), velocity: 0.5 + event.weight * 0.3 });
                timeOffset += 0.25 + Math.random() * 0.4;
            } else { // if too high, push to melody instead
                remainingEvents.push(event);
            }
        });
    }

    if (remainingEvents.length > 0) {
        const melodyEvents = remainingEvents.sort((a,b) => b.weight - a.weight);
        let melodyTime = Math.random() * 0.6;
        const timeStep = 4.0 / melodyEvents.length;
        melodyEvents.forEach(event => {
            if (event.midi > 55) { // Ensure melody is in a higher register
                score.melody!.push({ midi: event.midi, time: melodyTime, duration: 1.8 + Math.random() * 1.5, velocity: 0.6 + event.weight * 0.4 });
                melodyTime += timeStep + (Math.random() - 0.5) * 0.2;
            }
        });
    }

    // --- DYNAMIC INSTRUMENT HINTS ---
    let bassHint: BassInstrument = 'ambientDrone';
    if(score.bass && score.bass.length > 0) {
        if (density < 0.3) bassHint = 'ambientDrone';
        else if (density < 0.6) bassHint = 'glideBass';
        else bassHint = 'resonantGliss';
    }

    let melodyHint: MelodyInstrument = 'theremin';
    if(score.melody && score.melody.length > 0) {
        const avgMelodyMidi = score.melody.reduce((sum, n) => sum + n.midi, 0) / score.melody.length;
        if(avgMelodyMidi > 72) melodyHint = 'E-Bells_melody';
        else if (score.melody.length > 2) melodyHint = 'synth';
        else melodyHint = 'theremin';
    }
    
    let accompHint: AccompanimentInstrument = 'mellotron';
    if (score.accompaniment && score.accompaniment.length > 1) {
        const interval = Math.abs(score.accompaniment[0].midi - score.accompaniment[1].midi);
        if (interval > 7) accompHint = 'organ';
        else if (density > 0.5) accompHint = 'piano';
        else accompHint = 'mellotron';
    } else if (score.accompaniment && score.accompaniment.length === 1) {
        accompHint = 'G-Drops';
    }

    score.instrumentHints = {
        bass: bassHint,
        melody: melodyHint,
        accompaniment: accompHint
    };

    return score;
  }
}
