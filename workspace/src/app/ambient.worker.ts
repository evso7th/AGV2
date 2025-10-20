
/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, ScoreName, Mood, Genre } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import { SFX_GRAMMAR } from '@/lib/music-theory';
import type { FractalEvent, MelodyInstrument, BassInstrument, BassSynthParams } from '@/types/fractal';

// --- Effect Logic ---
let lastSparkleTime = -Infinity;
let lastSfxTime = -Infinity;

function shouldAddSparkle(currentTime: number, density: number, genre: Genre): boolean {
    const timeSinceLast = currentTime - lastSparkleTime;
    const baseMinTime = 30; 
    const baseMaxTime = 90;

    // For ambient, make sparkles more frequent
    const isAmbient = genre === 'ambient';
    const minTime = isAmbient ? 15 : baseMinTime;
    const maxTime = isAmbient ? 45 : baseMaxTime;

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

    // Увеличиваем шанс для более "индустриальных" или "темных" стилей
    if (mood === 'dark' || mood === 'anxious' || genre === 'rock' || genre === 'progressive') chance *= 1.6;
    if (mood === 'calm' || mood === 'dreamy') chance *= 0.4;
    
    if (Math.random() < chance) {
        console.log(`[SFX] Firing complex SFX event for mood: ${mood}, genre: ${genre}`);
        const phrase: FractalEvent[] = [];
        const numNotes = 2 + Math.floor(Math.random() * 4); // 2 to 5 notes
        const phraseDuration = 2 + Math.random() * 4; // 2 to 6 seconds total
        let phraseTime = 0;

        // --- Выбор "рецепта" на основе контекста ---
        let textureChoice: keyof typeof SFX_GRAMMAR.textures = 'ambient';
        if (mood === 'dark' || mood === 'anxious') textureChoice = 'industrial';
        if (genre === 'trance' || genre === 'house') textureChoice = 'electronic';
        
        let freqChoice: keyof typeof SFX_GRAMMAR.freqRanges = 'mid';
        const freqRoll = Math.random();
        if (freqRoll < 0.33) freqChoice = 'low';
        else if (freqRoll < 0.66) freqChoice = 'wide-sweep-up';
        else freqChoice = 'wide-sweep-down';

        let envelopeChoice: keyof typeof SFX_GRAMMAR.envelopes = 'swell';
        const envRoll = Math.random();
        if (envRoll < 0.5) envelopeChoice = 'percussive';
        
        for (let i = 0; i < numNotes; i++) {
            const oscType = SFX_GRAMMAR.textures[textureChoice][Math.floor(Math.random() * SFX_GRAMMAR.textures[textureChoice].length)];
            const envelope = SFX_GRAMMAR.envelopes[envelopeChoice];

            const noteDuration = (phraseDuration / numNotes) * (0.7 + Math.random() * 0.6);

            let startFreq, endFreq;
            const freqRange = SFX_GRAMMAR.freqRanges[freqChoice];

            if ('minStart' in freqRange) { // Sweep
                 startFreq = freqRange.minStart + Math.random() * (freqRange.maxStart - freqRange.minStart);
                 endFreq = freqRange.minEnd + Math.random() * (freqRange.maxEnd - freqRange.minEnd);
            } else { // Static or slow-moving
                 startFreq = freqRange.min + Math.random() * (freqRange.max - freqRange.min);
                 endFreq = startFreq + (Math.random() * 100 - 50); // Slight drift
            }
            
            const params: Partial<BassSynthParams> & { oscType: any, startFreq: number, endFreq: number, pan: number, chorus: boolean, lfoFreq?: number } = {
                duration: noteDuration,
                attack: envelope.attack.min + Math.random() * (envelope.attack.max - envelope.attack.min),
                decay: envelope.decay.min + Math.random() * (envelope.decay.max - envelope.decay.min),
                sustainLevel: envelope.sustain,
                release: envelope.release.min + Math.random() * (envelope.release.max - envelope.release.min),
                oscType: oscType,
                startFreq,
                endFreq,
                pan: Math.random() * 2 - 1,
                chorus: Math.random() > 0.5,
                lfoFreq: Math.random() * 8, // For future use in sfx-processor
            };

            phrase.push({
                type: 'sfx',
                note: 60, // Placeholder
                duration: noteDuration,
                time: phraseTime,
                weight: 0.4 + Math.random() * 0.3,
                technique: 'hit',
                dynamics: 'f',
                phrasing: 'legato',
                params: params as any
            });
            
            // Overlap notes for a richer texture
            phraseTime += noteDuration * (0.2 + Math.random() * 0.5);
        }

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
        drumSettings: { pattern: 'composer', enabled: true, volume: 0.5, kickVolume: 1.0 },
        instrumentSettings: { 
            bass: { name: "glideBass", volume: 0.7, technique: 'portamento' },
            melody: { name: "acousticGuitarSolo", volume: 0.8 },
            accompaniment: { name: "guitarChords", volume: 0.7 },
        },
        textureSettings: {
            sparkles: { enabled: true, volume: 0.7 },
            sfx: { enabled: true, volume: 0.5 },
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
            genre: settings.genre,
            seed: settings.seed ?? Date.now(),
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
           });
       }
       
       if (needsRestart) this.start();
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;
        
        const density = this.settings.density;
        const genre = this.settings.genre;
        const mood = this.settings.mood;

        let scorePayload: { events: FractalEvent[]; instrumentHints: { accompaniment?: MelodyInstrument, bass?: BassInstrument } } = { events: [], instrumentHints: {} };

        if (this.settings.score === 'neuro_f_matrix') {
             scorePayload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } 
        
        const currentTime = this.barCount * this.barDuration;
        
        if (this.barCount >= 4 && this.settings.textureSettings.sparkles.enabled) {
            if (shouldAddSparkle(currentTime, density, genre)) {
                 const sparkleGenre = genre === 'ambient' ? 'trance' : genre;
                 self.postMessage({ type: 'sparkle', time: 0, genre: sparkleGenre, mood: this.settings.mood });
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
        
        console.log(`[Worker] Tick ${this.barCount}. Generated ${scorePayload.events?.length ?? 'undefined'} events.`);
        
        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: scorePayload.events,
                instrumentHints: scorePayload.instrumentHints,
                barDuration: this.barDuration
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

    