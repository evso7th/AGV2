
/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, ScoreName, Mood, Genre, InstrumentPart } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';

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
        useMelodyV2: false, // Default to V1 engine
        introBars: 12, // Default intro length
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; // 4 beats per bar
    },

    initializeEngine(settings: WorkerSettings, force: boolean = false) {
        // #ЗАЧЕМ: Этот метод инициализирует или переинициализирует музыкальный движок.
        // #ЧТО: Он создает новый экземпляр FractalMusicEngine и асинхронно ждет его полной инициализации.
        // #ИСПРАВЛЕНО (ПЛАН 1274): Логика стала проще. Создаем, затем инициализируем.
        console.log(`%c[Worker] Initializing new engine with SEED: ${settings.seed}`, 'color: #FFD700; font-weight:bold;');
        
        const newEngine = new FractalMusicEngine({
            ...settings,
            seed: settings.seed,
            introBars: settings.introBars,
        });

        newEngine.initialize(true); // `true` для форсированной инициализации
        
        fractalMusicEngine = newEngine;
        this.barCount = 0;
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        let attempts = 0;
        const maxAttempts = 10;
        const attemptInterval = 100; // ms

        const tryStart = () => {
            if (fractalMusicEngine) {
                console.log(`%c[Worker.start] Engine ready after ${attempts} attempts. Starting loop.`, 'color: #32CD32;');
                const loop = () => {
                    if (!this.isRunning) return;
                    this.tick();
                    this.loopId = setTimeout(loop, this.barDuration * 1000);
                };
                loop();
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`[Worker.start] Engine not ready, attempt ${attempts}. Retrying in ${attemptInterval}ms...`);
                    setTimeout(tryStart, attemptInterval);
                } else {
                    console.error('[Worker.start] Engine failed to initialize after multiple attempts. Playback aborted.');
                    this.isRunning = false;
                }
            }
        };

        tryStart();
    },

    stop() {
        this.isRunning = false;
        if (this.loopId) {
            clearTimeout(this.loopId);
            this.loopId = null;
        }
    },
    
    reset() {
        // #ИСПРАВЛЕНО (ПЛАН 1270): Логика генерации уникального "семени" перенесена сюда.
        // #ЗАЧЕМ: Этот метод теперь является ЕДИНСТВЕННЫМ источником нового "семени" для каждой сюиты.
        // #ЧТО: Он генерирует новый seed, обновляет глобальные настройки и немедленно пересоздает движок с ним.
        // #СВЯЗИ: Вызывается по команде 'reset' из UI (при первом Play и при Regenerate).
        const wasRunning = this.isRunning;
        if (wasRunning) {
            this.stop();
        }
        
        const newSeed = Date.now();
        console.log(`%c[Worker.reset] Generating NEW SEED: ${newSeed}`, 'color: cyan; font-weight:bold;');
        this.settings.seed = newSeed; // Обновляем seed в настройках

        this.initializeEngine(this.settings, true); // Пересоздаем движок с новым seed
        
        if (wasRunning) {
            this.start();
        }
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       console.log('[Worker.updateSettings] Received raw settings:', JSON.parse(JSON.stringify(newSettings)));
       const needsRestart = this.isRunning && (newSettings.bpm !== undefined && newSettings.bpm !== this.settings.bpm);
       // #ИСПРАВЛЕНО (ПЛАН 1485): Добавлена проверка смены жанра или настроения.
       const genreOrMoodChanged = (newSettings.genre && newSettings.genre !== this.settings.genre) || (newSettings.mood && newSettings.mood !== this.settings.mood);
       
       if (genreOrMoodChanged) {
           console.log(`[Worker] Genre or Mood changed. Triggering full reset.`);
           this.settings = { ...this.settings, ...newSettings }; // Обновляем настройки ПЕРЕД сбросом
           this.reset();
           return;
       }
       
       if (needsRestart) this.stop();
       
       this.settings = {
            ...this.settings,
            ...newSettings,
            drumSettings: newSettings.drumSettings ? { ...this.settings.drumSettings, ...newSettings.drumSettings } : this.settings.drumSettings,
            instrumentSettings: newSettings.instrumentSettings ? { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings } : this.settings.instrumentSettings,
            textureSettings: newSettings.textureSettings ? { ...this.settings.textureSettings, ...newSettings.textureSettings } : this.settings.textureSettings,
        };

        if (!fractalMusicEngine) {
            console.log("[Worker] First settings update. Initializing engine...");
            this.initializeEngine(this.settings, true);
        } else {
            fractalMusicEngine.updateConfig(this.settings);
        }
       
       if (needsRestart) this.start();
       console.log('[Worker.updateSettings] Final computed settings:', JSON.parse(JSON.stringify(this.settings)));
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        // FIX FOR PLAN 1483: Initialize with a safe default to prevent crashes if generation fails.
        let finalPayload: { events: FractalEvent[], instrumentHints: InstrumentHints } = { events: [], instrumentHints: {} };

        try {
            // #ЗАЧЕМ: УДАЛЕНА вся логика `generateIntroSequence`
            // #ЧТО: Теперь основной движок управляет музыкой с первого такта.
            finalPayload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } catch (e) {
            console.error('[Worker.tick] CRITICAL ERROR during event generation:', e);
            // finalPayload remains the safe empty default.
        }

        const counts = { drums: 0, bass: 0, melody: 0, accompaniment: 0, harmony: 0, sfx: 0, sparkles: 0 };
        for (const event of finalPayload.events) {
            if (event.type === 'bass') counts.bass++;
            else if (event.type === 'melody') counts.melody++;
            else if (event.type === 'accompaniment') counts.accompaniment++;
            else if (event.type === 'harmony') counts.harmony++;
            else if (event.type === 'sfx') counts.sfx++;
            else if (event.type === 'sparkle') counts.sparkles++;
            else if ((event.type as string).startsWith('drum_') || (event.type as string).startsWith('perc-')) {
                counts.drums++;
            }
        }
        const logString = `[Worker @ Bar ${this.barCount}] Events: ${finalPayload.events.length} | Drums: ${counts.drums}, Bass: ${counts.bass}, Melody: ${counts.melody}, Accomp: ${counts.accompaniment}, Harmony: ${counts.harmony}, SFX: ${counts.sfx}, Sparkles: ${counts.sparkles}`;
        console.log(logString);


        const mainScoreEvents: FractalEvent[] = [];
        const sfxEvents: FractalEvent[] = [];
        const sparkleEvents: FractalEvent[] = [];
        const harmonyEvents: FractalEvent[] = [];
        
        for (const event of finalPayload.events) {
            if (event.type === 'sfx') {
                sfxEvents.push(event);
            } else if (event.type === 'sparkle') {
                sparkleEvents.push(event);
            } else if (event.type === 'harmony') {
                harmonyEvents.push(event);
            } else {
                mainScoreEvents.push(event);
            }
        }

        const payloadForMainThread = {
            events: mainScoreEvents,
            instrumentHints: finalPayload.instrumentHints,
            barDuration: this.barDuration,
            barCount: this.barCount,
        };

        console.log('[Worker] Payload being sent to main thread: ', JSON.parse(JSON.stringify(payloadForMainThread)));

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: payloadForMainThread
        });
        
        if (sfxEvents.length > 0) {
            sfxEvents.forEach(event => {
                self.postMessage({ type: 'sfx', payload: event });
            });
        }
        
        if (sparkleEvents.length > 0) {
            sparkleEvents.forEach(event => {
                self.postMessage({ type: 'sparkle', payload: event });
            });
        }

        if (harmonyEvents.length > 0) {
             const harmonyPayload = {
                 events: harmonyEvents,
                 instrumentHints: finalPayload.instrumentHints,
                 barDuration: this.barDuration,
                 barCount: this.barCount
             };
             console.log('[Worker] Harmony payload being sent to main thread: ', JSON.parse(JSON.stringify(harmonyPayload)));
             self.postMessage({ type: 'HARMONY_SCORE_READY', payload: harmonyPayload });
        }

        this.barCount++;
        if (fractalMusicEngine && this.barCount >= fractalMusicEngine.navigator.totalBars + 4) {
             console.log(`%c[Worker] End of suite detected. Posting 'SUITE_ENDED' command.`, 'color: red; font-weight: bold;');
             self.postMessage({ command: 'SUITE_ENDED' });
        }
    }
};

// --- MessageBus (The "Kafka" entry point) ---
self.onmessage = (event: MessageEvent) => {
    if (!event.data || !event.data.command) {
        return;
    }
    
    const { command, data } = event.data;

    try {
        switch (command) {
            case 'init':
                Scheduler.settings = { ...Scheduler.settings, ...data };
                console.log('[Worker] Received "init". Settings stored. Waiting for full update.');
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
