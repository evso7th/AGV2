

/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, Score, Note, DrumsScore, ScoreName, InstrumentSettings, DrumSettings, InstrumentType, BassTechnique, Mood } from '@/types/music';
import { FractalMusicEngine } from './fractal-music-engine';
import type { Seed, ResonanceMatrix, EngineConfig, FractalEvent } from '@/types/fractal';
import * as Tone from 'tone';


// --- Musical Constants ---
const KEY_ROOT_MIDI = 40; // E2
const SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]; // E Natural Minor
const E_MINOR_SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10]; 
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

// --- "Sparkle" (In-krap-le-ni-ye) Logic ---
let lastSparkleTime = -Infinity;

function shouldAddSparkle(currentTime: number, density: number): boolean {
    const timeSinceLast = currentTime - lastSparkleTime;
    const minTime = 30; 
    const maxTime = 90;

    if (timeSinceLast < minTime) return false;
    if (density > 0.6) return false; 

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
        const barDuration = Scheduler.barDuration;
        const beatDuration = barDuration / 4;
        let notes: Note[] = [];
        
        const riffPattern = [40, 40, 43, 43]; // E2, E2, G2, G2
        notes.push({ midi: clamp(riffPattern[barIndex % 4], BASS_MIDI_MIN, BASS_MIDI_MAX), time: 0, duration: Math.min(beatDuration * 2, barDuration * 0.95), velocity: 0.7 });

        if (density > 0.4) {
            notes.push({ midi: clamp(riffPattern[barIndex % 4] + 12, BASS_MIDI_MIN, BASS_MIDI_MAX), time: beatDuration * 2, duration: Math.min(beatDuration, barDuration * 0.95), velocity: 0.5 });
        }
        if (density > 0.7) {
            const arpNotes = [40, 43, 47]; // E2, G2, B2
            for(let i=0; i<3; i++) {
                notes.push({ midi: clamp(arpNotes[i], BASS_MIDI_MIN, BASS_MIDI_MAX), time: beatDuration * 3 + i * (beatDuration/3), duration: Math.min(beatDuration/3, barDuration * 0.95), velocity: 0.6});
            }
        }
       
        return notes;
    },

    generateMelody(barIndex: number, density: number): Note[] {
        const notes: Note[] = [];
        if (Math.random() > density) return notes; 

        const notesInBar = density > 0.6 ? 8 : 4;
        const step = Scheduler.barDuration / notesInBar;
        let lastMidi = 60 + SCALE_INTERVALS[barIndex % SCALE_INTERVALS.length];

        for (let i = 0; i < notesInBar; i++) {
            if (Math.random() < density * 1.2) { 
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
        // This is now legacy, NFM handles its own drum generation
        return [];
    }
}

// --- FRACTAL ENGINE ---
let fractalMusicEngine: FractalMusicEngine | undefined;

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
        mood: 'melancholic' as Mood,
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; // 4 beats per bar
    },

    initializeEngine() {
        console.log('[Worker] Initializing NFM Engine with mood:', this.settings.mood);
        const engineConfig: EngineConfig = {
            bpm: this.settings.bpm,
            density: this.settings.density,
            lambda: 1.0 - (this.settings.density * 0.5 + 0.3),
            organic: this.settings.density,
            drumSettings: this.settings.drumSettings,
            mood: this.settings.mood,
            genre: 'ambient',
        };
        fractalMusicEngine = new FractalMusicEngine(engineConfig);
        this.barCount = 0;
        lastSparkleTime = -Infinity;
        lastPadStyle = null; // Reset on engine re-creation
    },

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        if (this.settings.score === 'neuro_f_matrix' && !fractalMusicEngine) {
            this.initializeEngine();
        }

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
    
    reset() {
        if (this.isRunning) {
            this.stop();
        }
        this.initializeEngine();
        if (this.settings.bpm > 0) { // Only restart if there was a beat before
            this.start();
        }
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       const needsRestart = this.isRunning && (newSettings.bpm !== undefined && newSettings.bpm !== this.settings.bpm);
       const scoreChanged = newSettings.score && newSettings.score !== this.settings.score;
       const moodChanged = newSettings.mood && newSettings.mood !== this.settings.mood;
       
       if (needsRestart) this.stop();
       
       this.settings = {
           ...this.settings,
           ...newSettings,
           drumSettings: { ...this.settings.drumSettings, ...newSettings.drumSettings },
           instrumentSettings: { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings },
           textureSettings: { ...this.settings.textureSettings, ...newSettings.textureSettings },
       };

       if (scoreChanged || moodChanged) {
           this.initializeEngine();
       }

       if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig({
               bpm: this.settings.bpm,
               density: this.settings.density,
               organic: this.settings.density,
               drumSettings: this.settings.drumSettings,
               lambda: 1.0 - (this.settings.density * 0.5 + 0.3),
               mood: this.settings.mood,
               genre: 'ambient'
           });
       }
       
       if (needsRestart) this.start();
    },

    tick() {
        if (!this.isRunning) return;
        
        const density = this.settings.density;
        let score: Score = { bass: [], melody: [], accompaniment: [], drums: [] };
        
        if (this.settings.score === 'neuro_f_matrix') {
            if (!fractalMusicEngine) {
                 this.initializeEngine(); // Failsafe
            }
            const fractalEvents = fractalMusicEngine!.evolve(this.barDuration);

            score.bass = fractalEvents.filter(e => e.type === 'bass');
            score.drums = fractalEvents.filter(e => e.type.startsWith('drum_'));
            
        } else {
             // Legacy composers remain for other styles
             score.bass = Composer.generateBass(this.barCount, density);
             score.melody = Composer.generateMelody(this.barCount, density);
             score.accompaniment = Composer.generateAccompaniment(this.barCount, density);
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

// --- MessageBus (The "Kafka" entry point) ---
self.onmessage = async (event: MessageEvent) => {
    if (!event.data || !event.data.command) return;
    const { command, data } = event.data;

    try {
        switch (command) {
            case 'start':
                Scheduler.start();
                break;
                
            case 'stop':
                Scheduler.stop();
                break;

            case 'reset':
                Scheduler.reset();
                break;

            case 'update_settings':
                Scheduler.updateSettings(data);
                break;
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: e instanceof Error ? e.message : String(e) });
    }
};
