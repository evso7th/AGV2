
import type { EngineState, EngineConfig, ResonanceMatrix, Seed, EventID } from '@/types/fractal';
import type { Score, Note, BassInstrument, MelodyInstrument, AccompanimentInstrument, DrumSettings } from '@/types/music';

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
  public config: EngineConfig;
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
    
    // Check if drum pattern is 'composer'
    if (this.config.drumSettings?.pattern === 'composer' && this.config.drumSettings?.enabled) {
      const beatsPerBar = 4;
      const sixteenthsPerBar = 16;
      const step = this.tickCount % sixteenthsPerBar;

      // Kick on 1 and 3
      if (step === 0 || step === 8) {
          if (Math.random() < 0.9 * impulseStrength) impulse.set('drum_kick', impulseStrength);
      }
      // Snare on 2 and 4
      if (step === 4 || step === 12) {
          if (Math.random() < 0.7 * impulseStrength) impulse.set('drum_snare', 0.8 * impulseStrength);
      }
      // Hi-hats
      if (Math.random() < 0.6 * impulseStrength) {
          impulse.set('drum_hat', 0.5 * impulseStrength);
      }
    }
    
    // Chance to excite a random melodic note
    if (Math.random() < impulseStrength * 0.2) {
        const melodicEvents = this.availableEvents.filter(e => !e.startsWith('drum_'));
        const eventToExcite = melodicEvents[Math.floor(Math.random() * melodicEvents.length)];
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
    
    const power = 1.5;
    let poweredSum = 0;
    for (const weight of state.values()) {
        poweredSum += Math.pow(weight, power);
    }

    if (poweredSum > 0) {
        for (const [event, weight] of state.entries()) {
            state.set(event, Math.pow(weight, power) / poweredSum);
        }
    }
  }

  public tick() {
    this.tickCount++;
    const nextState: EngineState = new Map();
    const impulse = this.generateImpulse();
    const lambda = 1.0 - (this.config.organic * 0.5 + 0.3); 

    for (const event of this.availableEvents) {
        const currentWeight = this.state.get(event) || 0;
        nextState.set(event, (1 - lambda) * currentWeight);
    }

    const eventsWithWeight = [...this.state.entries()].filter(([, weight]) => weight > 0.0001);
    
    for (const [event_j] of nextState.entries()) {
        let resonanceSum = 0;
        for (const [event_i, weight_i] of eventsWithWeight) {
             resonanceSum += this.K(event_i, event_j) * weight_i * this.config.organic * 0.1;
        }

        if (impulse.has(event_j)) {
            resonanceSum += impulse.get(event_j)!;
        }
        
        nextState.set(event_j, (nextState.get(event_j) || 0) + resonanceSum);
    }
    
    this.normalizeState(nextState);
    this.state = nextState;
  }

  public generateScore(): Score {
    const score: Score = { melody: [], accompaniment: [], bass: [], drums: [] };
    const density = this.config.density;

    const sortedEvents = [...this.state.entries()]
        .map(([id, weight]) => {
            const [type, value] = id.split('_');
            return { id, weight, type, value, midi: parseInt(value, 10) };
        })
        .filter(event => event.weight > 0.001)
        .sort((a, b) => b.weight - a.weight);

    // --- BASS ---
    const bassCandidates = sortedEvents.filter(e => e.type !== 'drum' && e.midi < 55);
    let rootBassNote = KEY_ROOT_MIDI; // Fallback to E2
    if (bassCandidates.length > 0) {
        rootBassNote = bassCandidates[0].midi % 12 + (KEY_ROOT_MIDI - (KEY_ROOT_MIDI % 12)); // Find root note in the correct octave
    }
    
    const bassNotesPerBar = Math.floor(density * 8) + 1; // From 1 to 9 notes
    const step = 4 / bassNotesPerBar; // Duration of each step in a 4-beat bar
    const arpPattern = [0, 7, 3, 5, 2, 5, 0, 7]; // More interesting pattern

    for (let i = 0; i < bassNotesPerBar; i++) {
        const degree = arpPattern[i % arpPattern.length];
        const noteMidi = rootBassNote + degree;
        const midi = Math.max(BASS_MIDI_MIN, Math.min(noteMidi, BASS_MIDI_MAX));
        
        score.bass!.push({
            midi,
            time: i * step * (60 / this.config.bpm), // convert beat to time
            duration: step * (60 / this.config.bpm) * (0.8 + Math.random() * 0.4),
            velocity: 0.6 + Math.random() * 0.3,
        });
    }

    // --- DRUMS (from fractal state) ---
    if (this.config.drumSettings?.pattern === 'composer') {
        const drumEvents = sortedEvents.filter(e => e.type === 'drum' && e.weight > 0.05);
        let time = 0;
        for (const event of drumEvents) {
            score.drums!.push({ note: event.value, time: time, velocity: event.weight * 5, midi: 0 });
            time += (1 / (density * 2 + 1));
            if (time >= 4 * (60 / this.config.bpm)) break;
        }
    }
    
    // --- ACCOMPANIMENT & MELODY ---
    const midHighEvents = sortedEvents.filter(e => e.type !== 'drum' && e.midi >= 55);
    
    let melodyNotesCount = Math.floor(density * 5) + 1;
    let melodyTime = Math.random() * 0.5;
    for(let i = 0; i < melodyNotesCount && midHighEvents.length > i; i++) {
        const event = midHighEvents[i];
        const midi = event.midi;
        const duration = 0.5 + Math.random() * 1.5;
        score.melody!.push({ midi, time: melodyTime, duration, velocity: 0.6 + Math.random() * 0.2 });
        melodyTime += (duration * 0.5) + (Math.random() * 0.5);
    }
    
    let accompNotesCount = Math.floor(density * 3);
    let accompEvents = midHighEvents.slice(melodyNotesCount, melodyNotesCount + accompNotesCount);
    let timeOffset = 0.2;
    accompEvents.forEach(event => {
        score.accompaniment!.push({ midi: event.midi, time: timeOffset, duration: 3.0 + Math.random(), velocity: 0.4 + event.weight * 0.4 });
        timeOffset += 1.0 + Math.random();
    });


    // --- DYNAMIC INSTRUMENT HINTS ---
    let bassHint: BassInstrument = 'ambientDrone';
    if(score.bass && score.bass.length > 0) {
        if (score.bass.length > 3) bassHint = 'classicBass';
        else if (density < 0.4) bassHint = 'ambientDrone';
        else bassHint = 'glideBass';
    }

    let melodyHint: MelodyInstrument = 'flute';
    if (score.melody && score.melody.length > 0) {
        const avgDuration = score.melody.reduce((sum, n) => sum + n.duration, 0) / score.melody.length;
        const avgMidi = score.melody.reduce((sum, n) => sum + n.midi, 0) / score.melody.length;
        
        if (avgMidi > 78) melodyHint = Math.random() < 0.5 ? 'piano' : 'acousticGuitarSolo';
        else if (avgDuration < 1.0) melodyHint = 'acousticGuitarSolo';
        else if (avgDuration > 2.5) melodyHint = 'organ';
        else melodyHint = (Math.random() < 0.5) ? 'flute' : 'mellotron';
    }
    
    let accompHint: AccompanimentInstrument = 'mellotron';
    if (score.accompaniment && score.accompaniment.length > 0) {
        if (score.accompaniment.length <= 2) {
             accompHint = 'violin';
        } else if (score.accompaniment.length >= 3) {
            accompHint = 'guitarChords';
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
