

/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, Score, Note, DrumsScore, ScoreName, InstrumentSettings, DrumSettings, InstrumentType } from '@/types/music';
import { FractalMusicEngine } from './fractal-music-engine';
import { MelancholicMinorK } from './resonance-matrices';
import type { Seed, ResonanceMatrix, EngineConfig } from '@/types/fractal';
import * as Tone from 'tone';


// --- Musical Constants ---
const KEY_ROOT_MIDI = 40; // E2
const SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]; // E Natural Minor
const E_MINOR_SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10]; // Duplicating for createNewSeed
const CHORD_PROGRESSION_DEGREES = [0, 3, 5, 2]; // Em, G, Am, F#dim - but we'll stick to scale intervals

const BASS_MIDI_MIN = 32; // G#1
const BASS_MIDI_MAX = 50; // D3

const PADS_BY_STYLE: Record<ScoreName, string | null> = {
    dreamtales: 'livecircle.mp3',
    evolve: 'Tibetan bowls.mp3',
    omega: 'things.mp3',
    journey: 'pure_energy.mp3',
    multeity: 'uneverse.mp3',
    neuro_f_matrix: 'uneverse.mp3', 
};

const SPARKLE_SAMPLES = [
    '/assets/music/droplets/merimbo.ogg',
    '/assets/music/droplets/icepad.ogg',
    '/assets/music/droplets/vibes_a.ogg',
    '/assets/music/droplets/sweepingbells.ogg',
    '/assets/music/droplets/belldom.ogg',
    '/assets/music/droplets/dreams.mp3',
    '/assets/music/droplets/end.mp3',
    '/assets/music/droplets/ocean.mp3',
];

const PERCUSSION_SOUNDS: Record<string, number> = {
    'kick': 60, 'snare': 62, 'hat': 64, 'crash': 67, 'tom1': 69, 'tom2': 71, 'tom3': 72, 'ride': 65
};


// --- "Sparkle" (In-krap-le-ni-ye) Logic ---
let lastSparkleTime = -Infinity;

function shouldAddSparkle(currentTime: number, density: number): boolean {
    const timeSinceLast = currentTime - lastSparkleTime;
    const minTime = 30; // Reduced time for more frequent sparkles
    const maxTime = 90;

    if (timeSinceLast < minTime) return false;
    if (density > 0.6) return false; // Only when less dense

    const chance = ((timeSinceLast - minTime) / (maxTime - minTime)) * (1 - density);
    return Math.random() < chance;
}

// --- Note Generation Helpers ---
const getNoteFromDegree = (degree: number, scale: number[], root: number, octave: number) => {
    const scaleLength = scale.length;
    const noteInScale = scale[((degree % scaleLength) + scaleLength) % scaleLength];
    const octaveOffset = Math.floor(degree / scaleLength);
    return root + (octave + octaveOffset) * 12 + noteInScale;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));


// --- Main Composition Engines ---
const Composer = {
    generateBass(barIndex: number, density: number): Note[] {
        const beatDuration = Scheduler.barDuration / 4;
        let notes: Note[] = [];
        
        const riffPattern = [40, 40, 43, 43]; // E2, E2, G2, G2
        notes.push({ midi: clamp(riffPattern[barIndex % 4], BASS_MIDI_MIN, BASS_MIDI_MAX), time: 0, duration: beatDuration * 2, velocity: 0.7 });

        if (density > 0.4) {
            notes.push({ midi: clamp(riffPattern[barIndex % 4] + 12, BASS_MIDI_MIN, BASS_MIDI_MAX), time: beatDuration * 2, duration: beatDuration, velocity: 0.5 });
        }
        if (density > 0.7) {
            const arpNotes = [40, 43, 47]; // E2, G2, B2
            for(let i=0; i<3; i++) {
                notes.push({ midi: clamp(arpNotes[i], BASS_MIDI_MIN, BASS_MIDI_MAX), time: beatDuration * 3 + i * (beatDuration/3), duration: beatDuration/3, velocity: 0.6});
            }
        }
       
        return notes;
    },

    generateMelody(barIndex: number, density: number): Note[] {
        const notes: Note[] = [];
        if (Math.random() > density) return notes; // Melody plays based on density

        const notesInBar = density > 0.6 ? 8 : 4;
        const step = Scheduler.barDuration / notesInBar;
        let lastMidi = 60 + SCALE_INTERVALS[barIndex % SCALE_INTERVALS.length];

        for (let i = 0; i < notesInBar; i++) {
            if (Math.random() < density * 1.2) { // Chance to play a note
                const direction = Math.random() < 0.5 ? 1 : -1;
                const scaleIndex = (lastMidi - KEY_ROOT_MIDI + direction + SCALE_INTERVALS.length) % SCALE_INTERVALS.length;
                const nextMidi = KEY_ROOT_MIDI + 24 + SCALE_INTERVALS[scaleIndex];
                
                if (nextMidi < 79) {
                    lastMidi = nextMidi;
                }
                notes.push({ midi: lastMidi, time: i * step, duration: step * (1 + Math.random()), velocity: 0.5 * density });
            }
        }
        return notes;
    },
    
    generateAccompaniment(barIndex: number, density: number): Note[] {
        const notes: Note[] = [];
        const progression = [0, 3, 5, 2];
        const rootDegree = progression[Math.floor(barIndex / 2) % progression.length];
        
        // Convert degrees to MIDI notes for the chord
        const chordDegrees = [rootDegree, rootDegree + 2, rootDegree + 4];
        const chordMidiNotes = chordDegrees.map(degree => getNoteFromDegree(degree, SCALE_INTERVALS, KEY_ROOT_MIDI, 2));

        if (barIndex % 2 === 0) {
            notes.push({ midi: chordMidiNotes[0], time: 0, duration: Scheduler.barDuration, velocity: 0.6 + Math.random() * 0.2 });
            notes.push({ midi: chordMidiNotes[1], time: 0.1, duration: Scheduler.barDuration, velocity: 0.5 + Math.random() * 0.2 });
            notes.push({ midi: chordMidiNotes[2], time: 0.2, duration: Scheduler.barDuration, velocity: 0.4 + Math.random() * 0.2 });
        }
        return notes;
    },

    generateDrums(barIndex: number, density: number): DrumsScore {
        const { drumSettings } = Scheduler.settings;
        if (!drumSettings.enabled) return [];
    
        const step = Scheduler.barDuration / 16;
        const drums: DrumsScore = [];
        const pattern = drumSettings.pattern;
        const kickVolume = drumSettings.kickVolume ?? 1.0;
    
        switch (pattern) {
            case 'ambient_beat':
                drums.push({ note: 'kick', time: 0, velocity: 0.8 * kickVolume, midi: PERCUSSION_SOUNDS['kick'] });
                if (density > 0.3) {
                    for (let i = 0; i < 16; i++) {
                        if (i % 4 === 2 && Math.random() < density * 0.7) drums.push({ note: 'hat', time: i * step, velocity: 0.4 * density, midi: PERCUSSION_SOUNDS['hat'] });
                    }
                }
                if (density > 0.6 && barIndex % 2 === 0) {
                    drums.push({ note: 'snare', time: 4 * step, velocity: 0.6, midi: PERCUSSION_SOUNDS['snare'] });
                    drums.push({ note: 'snare', time: 12 * step, velocity: 0.6, midi: PERCUSSION_SOUNDS['snare'] });
                }
                break;
            case 'composer':
                // Kick on 1 and 3, with probability based on density
                if (Math.random() < density) drums.push({ note: 'kick', time: 0, velocity: 0.9 * kickVolume, midi: PERCUSSION_SOUNDS['kick'] });
                if (Math.random() < density * 0.8) drums.push({ note: 'kick', time: 8 * step, velocity: 0.8 * kickVolume, midi: PERCUSSION_SOUNDS['kick'] });

                // Snare on 2 and 4
                if (Math.random() < density) drums.push({ note: 'snare', time: 4 * step, velocity: 0.7, midi: PERCUSSION_SOUNDS['snare'] });
                if (Math.random() < density * 0.6) drums.push({ note: 'snare', time: 12 * step, velocity: 0.6, midi: PERCUSSION_SOUNDS['snare'] });
                
                // Hi-hats or Ride
                const cymbal = density < 0.4 ? 'ride' : 'hat';
                for (let i = 0; i < 16; i++) {
                    const isCrashTime = barIndex % 4 === 0 && i === 0;
                    if (isCrashTime) continue; // Don't play hi-hat if a crash is playing
                    
                    if (i % 2 === 0 && Math.random() < density * 0.9) { // 8th notes
                         drums.push({ note: cymbal, time: i * step, velocity: (0.3 + (Math.random() * 0.3)) * density, midi: PERCUSSION_SOUNDS[cymbal] });
                    }
                }

                // Crash on the first beat of every 4th bar
                if (barIndex % 4 === 0 && Math.random() < density) {
                    drums.push({ note: 'crash', time: 0, velocity: 0.7 * density, midi: PERCUSSION_SOUNDS['crash'] });
                }

                // Fill at the end of every 8th bar
                if (barIndex % 8 === 7 && density > 0.6) {
                    const fillStartTime = 14 * step;
                    drums.push({ note: 'tom1', time: fillStartTime, duration: 0.1, velocity: 0.7, midi: PERCUSSION_SOUNDS['tom1'] });
                    drums.push({ note: 'tom2', time: fillStartTime + step, duration: 0.1, velocity: 0.75, midi: PERCUSSION_SOUNDS['tom2'] });
                }
                break;
            case 'none':
            default:
                break;
        }
    
        return drums;
    }
}

// --- FRACTAL ENGINE ---
const availableMatrices: Record<string, ResonanceMatrix> = {
    'melancholic_minor': MelancholicMinorK,
};

function createNewSeed(baseConfig: Partial<EngineConfig>): Seed {
    const randomMidiNote = 40 + E_MINOR_SCALE_DEGREES[Math.floor(Math.random() * E_MINOR_SCALE_DEGREES.length)] + (Math.floor(Math.random() * 3)) * 12;
    const initialEvent = `piano_${randomMidiNote}`;
    
    return {
        initialState: { [initialEvent]: 1.0 },
        resonanceMatrixId: 'melancholic_minor',
        config: {
            lambda: baseConfig.lambda || 0.5,
            bpm: baseConfig.bpm || 75,
            density: baseConfig.density || 0.5,
            organic: baseConfig.organic || 0.5,
            drumSettings: baseConfig.drumSettings || { pattern: 'none', volume: 0.5, kickVolume: 1.0, enabled: false }
        },
    };
}

let fractalMusicEngine: FractalMusicEngine;


// --- Scheduler (The Conductor) ---
let lastPadStyle: ScoreName | null = null;

const Scheduler = {
    loopId: null as any,
    isRunning: false,
    barCount: 0,
    
    settings: {
        bpm: 75,
        score: 'neuro_f_matrix', 
        drumSettings: { pattern: 'composer', enabled: true, volume: 0.5, kickVolume: 1.0 } as DrumSettings,
        instrumentSettings: { 
            bass: { name: "glideBass", volume: 0.7, technique: 'portamento' },
            melody: { name: "acousticGuitarSolo", volume: 0.8 },
            accompaniment: { name: "guitarChords", volume: 0.7 },
        } as InstrumentSettings,
        textureSettings: {
            sparkles: { enabled: true },
            pads: { enabled: true }
        },
        density: 0.5,
        composerControlsInstruments: true,
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; // 4 beats per bar
    },

    initializeEngine() {
        const seed = createNewSeed({
            bpm: this.settings.bpm,
            density: this.settings.density,
            lambda: 0.5, 
            organic: 0.5,
            drumSettings: this.settings.drumSettings
        });
        fractalMusicEngine = new FractalMusicEngine(seed, availableMatrices);
        this.barCount = 0;
        lastSparkleTime = -Infinity;
        lastPadStyle = null; // Reset on engine re-creation
    },

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        const loop = () => {
            if (!this.isRunning) return;
            this.tick();
            this.loopId = setTimeout(loop, this.barDuration * 1000);
        };
        
        loop();
    },

    stop() {
        this.isRunning = false;
        if (this.loopId) {
            clearTimeout(this.loopId);
            this.loopId = null;
        }
    },
    
    updateSettings(newSettings: Partial<WorkerSettings>) {
       const needsRestart = this.isRunning && (newSettings.bpm !== undefined && newSettings.bpm !== this.settings.bpm);
       if (needsRestart) this.stop();
       
       this.settings = {
           ...this.settings,
           ...newSettings,
           drumSettings: { ...this.settings.drumSettings, ...newSettings.drumSettings },
           instrumentSettings: { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings },
           textureSettings: { ...this.settings.textureSettings, ...newSettings.textureSettings },
       };
       if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig({
               bpm: this.settings.bpm,
               density: this.settings.density,
               organic: this.settings.density,
               drumSettings: this.settings.drumSettings,
               lambda: 1.0 - (this.settings.density * 0.5 + 0.3)
           });
       }
       
       if (needsRestart) this.start();
    },

    tick() {
        if (!this.isRunning) return;
        
        const density = this.settings.density;
        let score: Score = {};
        
        if (this.settings.score === 'neuro_f_matrix') {
            if (!fractalMusicEngine) this.initializeEngine();
            fractalMusicEngine.tick();
            score = fractalMusicEngine.generateScore();
        } else {
             score.bass = Composer.generateBass(this.barCount, density);
             score.melody = Composer.generateMelody(this.barCount, density);
             score.accompaniment = Composer.generateAccompaniment(this.barCount, density);
             score.drums = Composer.generateDrums(this.barCount, density);
        }
        
        self.postMessage({ type: 'score', score, time: this.barDuration });

        const currentTime = this.barCount * this.barDuration;
        
        if (this.settings.textureSettings.sparkles.enabled) {
            if (shouldAddSparkle(currentTime, density)) {
                 self.postMessage({ type: 'sparkle', time: 0 });
                 lastSparkleTime = currentTime;
            }
        }
        
        if (this.settings.textureSettings.pads.enabled) {
            const currentStyle = this.settings.score;
            if (currentStyle !== lastPadStyle) {
                 const padName = PADS_BY_STYLE[currentStyle];
                 if (padName) {
                    const delay = this.barCount === 0 ? 1 : 0;
                    self.postMessage({ type: 'pad', padName: padName, time: delay });
                 }
                lastPadStyle = currentStyle;
            }
        }

        this.barCount++;
    }
};

// --- MessageBus (The entry point) ---
self.onmessage = async (event: MessageEvent) => {
    if (!event.data || !event.data.command) return;
    const { command, data } = event.data;

    try {
        switch (command) {
            case 'start':
                if (!fractalMusicEngine && Scheduler.settings.score === 'neuro_f_matrix') {
                    Scheduler.initializeEngine();
                }
                Scheduler.start();
                break;
                
            case 'stop':
                Scheduler.stop();
                break;

            case 'reset':
                Scheduler.stop();
                Scheduler.initializeEngine();
                break;

            case 'update_settings':
                Scheduler.updateSettings(data);
                break;
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: e instanceof Error ? e.message : String(e) });
    }
};

