

/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, Score, Note, DrumsScore, ScoreName, InstrumentSettings } from '@/types/music';
import { FractalMusicEngine } from './fractal-music-engine';
import { MelancholicMinorK } from './resonance-matrices';
import type { Seed, ResonanceMatrix } from '@/types/fractal';
import * as Tone from 'tone';


// --- Musical Constants ---
const KEY_ROOT_MIDI = 40; // E2
const SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]; // E Natural Minor
const CHORD_PROGRESSION_DEGREES = [0, 3, 5, 2]; // Em, G, Am, F#dim - but we'll stick to scale intervals

const BASS_MIDI_MIN = 32; // G#1
const BASS_MIDI_MAX = 50; // D3

const PADS_BY_STYLE: Record<ScoreName, string | null> = {
    dreamtales: 'livecircle.mp3',
    evolve: 'Tibetan bowls.mp3',
    omega: 'things.mp3',
    journey: 'pure_energy.mp3',
    multeity: 'uneverse.mp3',
    fractal: 'uneverse.mp3', // Default pad for fractal style
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

const PERCUSSION_SOUNDS = [
    'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 
    'G#2', 'A2', 'A#2', 'B2', 'C3', 'C#3', 'D3' 
];

const DRUM_FILL_PATTERNS: DrumsScore[] = [
    // Fill 1: Simple tom roll
    [
        { note: 'A4', time: 0, velocity: 0.7 },
        { note: 'A4', time: 0.25, velocity: 0.75 },
        { note: 'G4', time: 0.5, velocity: 0.8 },
        { note: 'G4', time: 0.75, velocity: 0.85 },
    ],
    // Fill 2: Snare build-up
    [
        { note: 'D4', time: 0, velocity: 0.5 },
        { note: 'D4', time: 0.125, velocity: 0.6 },
        { note: 'D4', time: 0.25, velocity: 0.7 },
        { note: 'D4', time: 0.375, velocity: 0.8 },
        { note: 'D4', time: 0.5, velocity: 0.9 },
        { note: 'D4', time: 0.625, velocity: 1.0 },
        { note: 'D4', time: 0.75, velocity: 1.0 },
        { note: 'G4', time: 0.875, velocity: 0.9 },
    ],
    // Fill 3: Syncopated kick/snare
    [
        { note: 'C4', time: 0, velocity: 0.9 },
        { note: 'C4', time: 0.375, velocity: 0.7 },
        { note: 'D4', time: 0.5, velocity: 0.8 },
        { note: 'A4', time: 0.75, velocity: 0.6 },
        { note: 'G4', time: 0.875, velocity: 0.7 },
    ]
];


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

const MulteityComposer = {
    generateBass(barIndex: number, density: number): Note[] {
        const notes: Note[] = [];
        const beatDuration = Scheduler.barDuration / 4;
        const step = beatDuration / 4; // 16th notes
        const rootMidi = KEY_ROOT_MIDI;
        const progression = [0, 3, 5, 2];
        const chordRootDegree = progression[Math.floor(barIndex / 2) % progression.length];

        for (let i = 0; i < 16; i++) {
            if (Math.random() < density * 0.8) {
                const octave = (i % 8 < 4) ? 0 : 1; // E2 to E3 range
                const degree = chordRootDegree + (i % 4);
                let midi = getNoteFromDegree(degree, SCALE_INTERVALS, rootMidi, octave);
                midi = clamp(midi, BASS_MIDI_MIN, BASS_MIDI_MAX);
                notes.push({ midi, time: i * step, duration: step, velocity: 0.6 + Math.random() * 0.2 });
            }
        }
        return notes;
    },
    generateAccompaniment(barIndex: number, density: number): Note[] | undefined {
        const notes: Note[] = [];
        const beatDuration = Scheduler.barDuration / 4;
        const step = beatDuration / 4; // 16th notes
        const rootMidi = KEY_ROOT_MIDI;
        const progression = [0, 3, 5, 2];
        const chordRootDegree = progression[Math.floor(barIndex / 2) % progression.length];
        
        const pattern = [0, 2, 4, 2]; // Arpeggio pattern over chord tones
        for (let i = 0; i < 16; i++) {
             if (Math.random() < density * 0.9) {
                const octave = 2; // E4 to E5 range
                const degree = chordRootDegree + pattern[i % pattern.length];
                const midi = getNoteFromDegree(degree, SCALE_INTERVALS, rootMidi, octave);
                 if (midi > 40 && midi < 80) { // Keep notes in a reasonable range
                    notes.push({ midi, time: i * step, duration: step * 1.5, velocity: 0.4 + Math.random() * 0.2 });
                 }
            }
        }
        return notes;
    },
    generateMelody(barIndex: number, density: number): Note[] {
        const notes: Note[] = [];
        if (Math.random() > density * 0.8) return notes;

        const rootMidi = KEY_ROOT_MIDI;
        const numNotes = Math.floor(density * 12) + 4;
        const step = Scheduler.barDuration / numNotes;
        let lastDegree = (barIndex * 3) % SCALE_INTERVALS.length + 14; // Start higher

        for (let i = 0; i < numNotes; i++) {
             const useChromatic = Math.random() < (density * 0.1);
             const interval = useChromatic ? (Math.random() < 0.5 ? 1 : -1) : (Math.floor(Math.random() * 3) - 1) * 2;
             lastDegree += interval;
             
             const octave = Math.random() < 0.3 ? 3 : 2; 
             const midi = getNoteFromDegree(lastDegree, SCALE_INTERVALS, rootMidi, octave);
             if (midi > 52 && midi < 88) { // Keep melody in a reasonable range
                notes.push({ midi, time: i * step, duration: step * (1.5 + Math.random()), velocity: 0.5 + density * 0.3 });
             }
        }
        return notes;
    }
}


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
        if (!Scheduler.settings.drumSettings.enabled) return [];
        
        const step = Scheduler.barDuration / 16;
        const drums: DrumsScore = [];
        
        // Basic kick and snare
        if (Scheduler.settings.drumSettings.pattern === 'composer') {
            for (let i = 0; i < 16; i++) {
                if (i % 8 === 0) drums.push({ note: 'C4', time: i * step, velocity: 0.8, midi: 60 }); // Kick
                if (i % 8 === 4) drums.push({ note: 'D4', time: i * step, velocity: 0.6, midi: 62 }); // Snare
            }

            // Add hi-hats based on density
            if (density > 0.3) {
                 for (let i = 0; i < 16; i++) {
                     if (i % 4 === 2 && Math.random() < density) drums.push({ note: 'E4', time: i * step, velocity: 0.4 * density, midi: 64 });
                }
            }
             // Add crash cymbal based on density
            if (density > 0.8 && barIndex % 4 === 0) {
                drums.push({ note: 'G4', time: 0, velocity: 0.7 * density, midi: 67 });
            }
        }

        // Add percussive one-shots
        if (density > 0.2) {
            for (let i = 0; i < 16; i++) {
                // Add on off-beats
                if (i % 4 !== 0 && Math.random() < (density * 0.15)) {
                    const randomPerc = PERCUSSION_SOUNDS[Math.floor(Math.random() * PERCUSSION_SOUNDS.length)];
                    drums.push({ note: randomPerc, time: i * step, velocity: Math.random() * 0.3 + 0.2, midi: new Tone.Frequency(randomPerc).toMidi() });
                }
            }
        }
        
        return drums;
    }
}

// --- FRACTAL ENGINE ---
const availableMatrices: Record<string, ResonanceMatrix> = {
    'melancholic_minor': MelancholicMinorK,
};

const defaultSeed: Seed = {
    initialState: { 'piano_60': 1 },
    resonanceMatrixId: 'melancholic_minor',
    config: {
        lambda: 0.5,
        bpm: 75,
        density: 0.5,
        organic: 0.5,
    },
};

let fractalMusicEngine = new FractalMusicEngine(defaultSeed, availableMatrices);


// --- Scheduler (The Conductor) ---
let lastPadStyle: ScoreName | null = null;

const Scheduler = {
    loopId: null as any,
    isRunning: false,
    barCount: 0,
    lfo1Phase: 0,
    lfo2Phase: 0,
    
    settings: {
        bpm: 75,
        score: 'dreamtales', 
        drumSettings: { pattern: 'none', enabled: false },
        instrumentSettings: { 
            bass: { name: "glideBass", volume: 0.5, technique: 'arpeggio' },
            melody: { name: "synth", volume: 0.5 },
            accompaniment: { name: "synth", volume: 0.5 },
        } as InstrumentSettings, // Cast here to satisfy the new property
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

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.barCount = 0;
        lastSparkleTime = -Infinity;
        lastPadStyle = null; // Reset on start
        
        const loop = () => {
            if (!this.isRunning) return;
            this.tick();
            // Use setTimeout for the loop, allows for dynamic bar duration based on BPM
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
       const isPlaying = this.isRunning;
       if (isPlaying) this.stop();
       
       // Deep merge for nested settings
       this.settings = {
           ...this.settings,
           ...newSettings,
           drumSettings: { ...this.settings.drumSettings, ...newSettings.drumSettings },
           instrumentSettings: { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings },
           textureSettings: { ...this.settings.textureSettings, ...newSettings.textureSettings },
       };

       // Update fractal engine config if it's part of the new settings
       const newConfig = {
           ...fractalMusicEngine.getConfig(),
           ...newSettings
       };
       fractalMusicEngine.updateConfig(newConfig);

       
       if (isPlaying) this.start();
    },

    tick() {
        if (!this.isRunning) return;
        
        // LFO Modulation for Fractal style
        if (this.settings.score === 'fractal') {
            this.lfo1Phase += 0.05;
            this.lfo2Phase += 0.03;
            const newLambda = 0.5 + 0.3 * Math.sin(this.lfo1Phase);
            const newDensity = 0.5 + 0.2 * Math.sin(this.lfo2Phase);
            fractalMusicEngine.updateConfig({ lambda: newLambda, density: newDensity });
        }


        const density = this.settings.density;
        let score: Score = {};
        
        if (this.settings.score === 'fractal') {
            fractalMusicEngine.tick();
            score = fractalMusicEngine.generateScore();
        } else if (this.settings.score === 'multeity') {
             score.bass = MulteityComposer.generateBass(this.barCount, density);
             score.melody = MulteityComposer.generateMelody(this.barCount, density);
             score.accompaniment = MulteityComposer.generateAccompaniment(this.barCount, density);
        } else {
             score.bass = Composer.generateBass(this.barCount, density);
             score.melody = Composer.generateMelody(this.barCount, density);
             score.accompaniment = Composer.generateAccompaniment(this.barCount, density);
        }

        // --- COMPATIBILITY LAYER & UNIFICATION ---
        const { instrumentSettings } = this.settings;

        score.drums = Composer.generateDrums(this.barCount, density);
        
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
                Scheduler.start();
                break;
                
            case 'stop':
                Scheduler.stop();
                break;

            case 'update_settings':
                Scheduler.updateSettings(data);
                break;
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: e instanceof Error ? e.message : String(e) });
    }
};

