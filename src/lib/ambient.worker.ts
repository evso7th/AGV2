

/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, ScoreName, Mood, Genre } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';

// --- Effect Logic ---
let lastSparkleTime = -Infinity;
let lastSfxTime = -Infinity;

function shouldAddSparkle(currentTime: number, density: number, genre: Genre): boolean {
    const timeSinceLast = currentTime - lastSparkleTime;
    
    // For ambient, make sparkles more frequent
    const isAmbient = genre === 'ambient';
    const minTime = isAmbient ? 7.5 : 30;
    const maxTime = isAmbient ? 22.5 : 90;

    if (timeSinceLast < minTime) return false;
    if (density > 0.6 && !isAmbient) return false; 

    const chance = ((timeSinceLast - minTime) / (maxTime - minTime)) * (1 - density);
    return Math.random() < chance;
}


function shouldAddSfx(currentTime: number, density: number, mood: Mood, genre: Genre): { should: boolean, phrase: FractalEvent[] } {
    const timeSinceLast = currentTime - lastSfxTime;
    const minTime = 15;
    const maxTime = 50;
    
    if (timeSinceLast < minTime) return { should: false, phrase: [] };
    if (density > 0.75) return { should: false, phrase: [] };

    let chance = ((timeSinceLast - minTime) / (maxTime - minTime)) * (0.95 - density);

    if (mood === 'dark' || mood === 'anxious' || genre === 'rock' || genre === 'progressive') chance *= 1.6;
    if (mood === 'calm' || mood === 'dreamy') chance *= 0.4;
    
    if (Math.random() < chance) {
        console.log(`[SFX] Firing complex SFX event for mood: ${mood}, genre: ${genre}`);
        const phrase: FractalEvent[] = [];
        // This is a placeholder for a more complex SFX generation logic
        // For now, let's keep it empty to avoid introducing new variables.
        return { should: true, phrase };
    }

    return { should: false, phrase: [] };
}


// --- FRACTAL ENGINE ---
let fractalMusicEngine: FractalMusicEngine | undefined;

// --- Scheduler (The Conductor) ---
const Scheduler = {
    loopId: null as any,
    isRunning: false,
    barCount: 0,
    
    settings: {
        bpm: 75,
        score: 'neuro_f_matrix', 
        genre: 'ambient' as Genre,
        drumSettings: { pattern: 'composer', enabled: true, kickVolume: 1.0 },
        instrumentSettings: { 
            bass: { name: "glideBass", volume: 0.7, technique: 'portamento' },
            melody: { name: "acousticGuitarSolo", volume: 0.8 },
            accompaniment: { name: "guitarChords", volume: 0.7 },
            harmony: { name: "piano", volume: 0.6 }
        },
        textureSettings: {
            sparkles: { enabled: true, volume: 0.7 },
            sfx: { enabled: true, volume: 0.5 },
        },
        density: 0.5,
        composerControlsInstruments: true,
        mood: 'melancholic' as Mood,
        lfoEnabled: true,
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
            genre: settings.genre,
            seed: settings.seed ?? Date.now(),
            lfoEnabled: settings.lfoEnabled,
        });
        this.barCount = 0;
        lastSparkleTime = -Infinity;
        lastSfxTime = -Infinity;
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
       const genreChanged = newSettings.genre && newSettings.genre !== this.settings.genre;
       const wasNotInitialized = !fractalMusicEngine;
       
       if (needsRestart) this.stop();
       
       // Defensive update
        this.settings = {
            ...this.settings,
            ...newSettings,
            drumSettings: newSettings.drumSettings ? { ...this.settings.drumSettings, ...newSettings.drumSettings } : this.settings.drumSettings,
            instrumentSettings: newSettings.instrumentSettings ? { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings } : this.settings.instrumentSettings,
            textureSettings: newSettings.textureSettings ? { ...this.settings.textureSettings, ...newSettings.textureSettings } : this.settings.textureSettings,
        };


       if (wasNotInitialized || scoreChanged || moodChanged || genreChanged) {
           this.initializeEngine(this.settings);
       } else if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig({
               tempo: this.settings.bpm,
               density: this.settings.density,
               organic: this.settings.density,
               drumSettings: this.settings.drumSettings,
               lambda: 1.0 - (this.settings.density * 0.5 + 0.3),
               mood: this.settings.mood,
               genre: this.settings.genre,
               lfoEnabled: this.settings.lfoEnabled,
           });
       }
       
       if (needsRestart) this.start();
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;
        
        const density = this.settings.density;
        const genre = this.settings.genre;
        const mood = this.settings.mood;

        let scorePayload: { events: FractalEvent[]; instrumentHints: InstrumentHints } = { events: [], instrumentHints: {} };

        if (this.settings.score === 'neuro_f_matrix') {
             // Pass barCount to evolve to make decisions based on it.
             scorePayload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } 
        
        const currentTime = this.barCount * this.barDuration;
        
        if (this.barCount >= 4 && this.settings.textureSettings.sparkles.enabled) {
            if (shouldAddSparkle(currentTime, density, genre)) {
                 self.postMessage({ type: 'sparkle', payload: { time: 0, genre: genre, mood: this.settings.mood } });
                 lastSparkleTime = currentTime;
            }
        }
        
        if (this.barCount >= 2 && this.settings.textureSettings.sfx.enabled) {
            const { should, phrase } = shouldAddSfx(currentTime, density, mood, genre);
            if (should) {
                // Send the entire phrase to be scheduled
                scorePayload.events.push(...phrase);
                lastSfxTime = currentTime;
            }
        }
        
        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: scorePayload.events,
                instrumentHints: scorePayload.instrumentHints,
                barDuration: this.barDuration,
                mood: this.settings.mood,
                genre: this.settings.genre,
            }
        });

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
                
            case 'external_impulse':
                if (fractalMusicEngine) {
                    fractalMusicEngine.generateExternalImpulse();
                }
                break;

            default:
                 // No-op for unknown commands
                 break;
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: e instanceof Error ? e.message : String(e) });
    }
};
