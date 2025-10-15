
/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, Score, ScoreName, InstrumentSettings, DrumSettings, Mood } from '@/types/music';
import { FractalMusicEngine } from './fractal-music-engine';
import type { FractalEvent } from '@/types/fractal';

// --- Constants ---
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

    initializeEngine(settings: WorkerSettings) {
        fractalMusicEngine = new FractalMusicEngine({
            tempo: settings.bpm,
            density: settings.density,
            lambda: 1.0 - (settings.density * 0.5 + 0.3),
            organic: settings.density,
            drumSettings: settings.drumSettings,
            mood: settings.mood,
            genre: 'ambient',
        });
        this.barCount = 0;
        lastSparkleTime = -Infinity;
        lastPadStyle = null; // Reset on engine re-creation
    },

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        if (!fractalMusicEngine) {
            this.initializeEngine(this.settings);
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
        this.initializeEngine(this.settings);
        if (this.settings.bpm > 0) {
            this.start();
        }
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       const needsRestart = this.isRunning && (newSettings.bpm !== undefined && newSettings.bpm !== this.settings.bpm);
       const scoreChanged = newSettings.score && newSettings.score !== this.settings.score;
       const moodChanged = newSettings.mood && newSettings.mood !== this.settings.mood;
       const wasNotInitialized = !fractalMusicEngine;
       
       if (needsRestart) this.stop();
       
       this.settings = {
           ...this.settings,
           ...newSettings,
           drumSettings: { ...this.settings.drumSettings, ...newSettings.drumSettings },
           instrumentSettings: { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings },
           textureSettings: { ...this.settings.textureSettings, ...newSettings.textureSettings },
       };

       if (wasNotInitialized || scoreChanged || moodChanged) {
           this.initializeEngine(this.settings);
       } else if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig({
               tempo: this.settings.bpm,
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
        if (!this.isRunning || !fractalMusicEngine) return;
        
        const density = this.settings.density;
        let events: FractalEvent[] = [];

        if (this.settings.score === 'neuro_f_matrix') {
            events = fractalMusicEngine.evolve(this.barDuration);
        } 
        
        console.log(`[Worker] Tick ${this.barCount}. Generated ${events.length} events.`);
        
        self.postMessage({ type: 'SCORE_READY', events: events, barDuration: this.barDuration });

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
    if (!event.data || !event.data.command) {
        return;
    }
    
    const { command, data } = event.data;

    try {
        switch (command) {
            case 'init':
                Scheduler.updateSettings(data);
                Scheduler.initializeEngine(data);
                break;
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
            default:
                 // No-op for unknown commands
                 break;
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: e instanceof Error ? e.message : String(e) });
    }
};
