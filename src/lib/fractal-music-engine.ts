
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

const PERCUSSION_SOUNDS: Record<string, number> = {
    'kick': 60, 'snare': 62, 'hat': 64, 'crash': 67, 'tom1': 69, 'tom2': 71, 'tom3': 72, 'ride': 65
};


// --- Fractal Music Engine ---
export class FractalMusicEngine {
  private state: EngineState;
  public config: EngineConfig;
  private K: ResonanceMatrix;
  private availableEvents: EventID[] = [];
  private tickCount: number = 0;
  private melodyState = { lastDegree: 14, direction: 1 }; // State for melody generation
  private barCount: number = 0;


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

      const drumSamples = ['kick', 'snare', 'hat', 'crash', 'tom1', 'tom2', 'tom3', 'ride'];
      for (const drum of drumSamples) {
          this.availableEvents.push(`drum_${drum}`);
      }

      this.availableEvents = [...new Set(this.availableEvents)];
  }

  public updateConfig(newConfig: Partial<EngineConfig>) {
    this.config = { ...this.config, ...newConfig, drumSettings: {...this.config.drumSettings, ...newConfig.drumSettings} };
  }
  
  public getConfig(): EngineConfig {
    return this.config;
  }

  private generateImpulse(): Map<EventID, number> {
    const impulse = new Map<EventID, number>();
    // Impulses are now primarily driven by the drum pattern logic in generateScore
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
    this.barCount++;
  }

    private generateDrums(): Note[] {
        const { density, bpm, drumSettings } = this.config;
        if (!drumSettings?.enabled || drumSettings.pattern !== 'composer') {
            return [];
        }

        const barDuration = (60 / bpm) * 4;
        const sixteenthStep = barDuration / 16;
        const drumScore: Note[] = [];

        // --- Logic from drumtech.txt ---
        const beatsPerBar = 4;
        
        // Crash on the 1st beat of every 4th bar
        if (this.barCount % 4 === 0 && Math.random() < density * 0.8) {
            drumScore.push({ midi: PERCUSSION_SOUNDS['crash'], time: 0, duration: 0.5, velocity: 0.8 * density });
        }

        for (let i = 0; i < 16; i++) {
            const time = i * sixteenthStep;
            
            // Kick on 1 and 3 (beats 0 and 8 in 16ths)
            if (i === 0 || i === 8) {
                if (Math.random() < 0.9 * density) {
                    drumScore.push({ midi: PERCUSSION_SOUNDS['kick'], time: time, duration: 0.1, velocity: 0.95 });
                }
            }

            // Snare on 2 and 4 (beats 4 and 12 in 16ths)
            if (i === 4 || i === 12) {
                if (Math.random() < 0.85 * density) {
                    drumScore.push({ midi: PERCUSSION_SOUNDS['snare'], time: time, duration: 0.1, velocity: 0.8 * density });
                }
            }

            // Hi-hats on 8th notes
            if (i % 2 === 0) { // every 8th note
                if (Math.random() < 0.8 * density) {
                    // Don't play hi-hat if a crash is playing
                    const isCrashPlaying = this.barCount % 4 === 0 && i === 0;
                    if (!isCrashPlaying) {
                       const cymbal = density < 0.4 ? 'ride' : 'hat';
                       drumScore.push({ midi: PERCUSSION_SOUNDS[cymbal], time: time, duration: 0.1, velocity: (0.4 + Math.random() * 0.2) * density });
                    }
                }
            }
        }
        
        // Fill at the end of every 8th bar
        if (this.barCount % 8 === 7 && density > 0.6) {
            const fillStartTime = 14 * sixteenthStep; // Start fill on the last half beat
            drumScore.push({ midi: PERCUSSION_SOUNDS['tom1'], time: fillStartTime, duration: 0.1, velocity: 0.7 });
            drumScore.push({ midi: PERCUSSION_SOUNDS['tom2'], time: fillStartTime + sixteenthStep, duration: 0.1, velocity: 0.75 });
        }

        // Map abstract note names to midi for the drum machine
        return drumScore.map(n => ({...n, note: Object.keys(PERCUSSION_SOUNDS).find(key => PERCUSSION_SOUNDS[key] === n.midi) || 'kick' }));
    }


  public generateScore(): Score {
    const score: Score = { melody: [], accompaniment: [], bass: [], drums: [] };
    const density = this.config.density;
    const barDuration = (60 / this.config.bpm) * 4;

    const sortedEvents = [...this.state.entries()]
        .map(([id, weight]) => {
            const [type, value] = id.split('_');
            const midi = parseInt(value, 10);
            return { id, weight, type, value, midi: isNaN(midi) ? -1 : midi };
        })
        .filter(event => event.weight > 0.001 && event.midi !== -1)
        .sort((a, b) => b.weight - a.weight);

    // --- BASS ---
    const bassRootCandidates = sortedEvents.filter(e => e.midi >= BASS_MIDI_MIN && e.midi <= BASS_MIDI_MAX);
    
    let rootBassNote = KEY_ROOT_MIDI; // Fallback to E2
    if (bassRootCandidates.length > 0) {
        // Find the root of the most active bass note
        rootBassNote = bassRootCandidates[0].midi % 12 + (KEY_ROOT_MIDI % 12);
    }

    const bassNotesPerBar = Math.floor(density * 4) + 1; // 1 to 5 notes
    const step = barDuration / (bassNotesPerBar * 2); // 8th note steps
    const arpPattern = [0, 7, 3, 5, 2, 5, 0, 7]; 
    
    for (let i = 0; i < bassNotesPerBar * 2; i++) {
        if (Math.random() < density) {
            const degree = arpPattern[i % arpPattern.length];
            const noteMidi = rootBassNote + SCALE_DEGREES[degree % SCALE_DEGREES.length];
            const midi = Math.max(BASS_MIDI_MIN, Math.min(noteMidi, BASS_MIDI_MAX));
            
            score.bass!.push({
                midi,
                time: i * step,
                duration: step * (1 + Math.random()),
                velocity: 0.6 + Math.random() * 0.3,
            });
        }
    }


    // --- DRUMS ---
    score.drums = this.generateDrums();
    
    // --- ACCOMPANIMENT & MELODY ---
    const midHighEvents = sortedEvents.filter(e => e.midi >= 55 && e.midi <= 90);
    
    let melodyNotesCount = Math.floor(density * 5) + 1;
    let melodyTime = Math.random() * 0.5 * barDuration;
    for(let i = 0; i < melodyNotesCount && midHighEvents.length > i; i++) {
        const event = midHighEvents[i];
        const midi = event.midi;
        const duration = (0.5 + Math.random() * 1.5) * (barDuration / 4);
        score.melody!.push({ midi, time: melodyTime, duration, velocity: 0.6 + Math.random() * 0.2 });
        melodyTime += (duration * 0.5) + (Math.random() * 0.5 * barDuration / 4);
    }
    
    let accompNotesCount = Math.floor(density * 3);
    let accompEvents = midHighEvents.slice(melodyNotesCount, melodyNotesCount + accompNotesCount);
    let timeOffset = 0.2 * barDuration;
    accompEvents.forEach(event => {
        score.accompaniment!.push({ midi: event.midi, time: timeOffset, duration: (3.0 + Math.random()) * (barDuration / 4), velocity: 0.4 + event.weight * 0.4 });
        timeOffset += (1.0 + Math.random()) * (barDuration / 4);
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

    