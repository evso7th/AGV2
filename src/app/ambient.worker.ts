

/**
 * @file AuraGroove Music Worker (Architecture: "The Dynamic Composer")
 *
 * This worker acts as a real-time composer, generating music bar by bar based on settings from the UI.
 * Its goal is to create a continuously evolving piece of music where complexity is controlled by a 'density' parameter.
 * It is completely passive and only composes the next bar when commanded via a 'tick'.
 */
import type { WorkerSettings, ScoreName, Mood, Genre, IntroRules } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import { generateIntroSequence } from '@/lib/music-theory';
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
        introBars: 7, // Default intro length
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; // 4 beats per bar
    },

    async initializeEngine(settings: WorkerSettings, force: boolean = false) {
        // #ЗАЧЕМ: Этот метод инициализирует или переинициализирует музыкальный движок.
        // #ЧТО: Он создает новый экземпляр FractalMusicEngine и асинхронно ждет его полной инициализации (включая загрузку блюпринта).
        // #СВЯЗИ: Вызывается из updateSettings и reset. `force` используется для принудительной пересоздания.
        if (fractalMusicEngine && !force) return;

        const newSeed = Date.now();
        console.log(`%c[Worker] Initializing new engine with NEW SEED: ${newSeed}`, 'color: #FFD700; font-weight:bold;');
        
        // #ИСПРАВЛЕНО (ПЛАН 719): Явно передаем `introBars` в конструктор, чтобы
        //                     BlueprintNavigator был создан с правильной длительностью интро.
        const newEngine = new FractalMusicEngine({
            ...settings,
            seed: newSeed,
            introBars: settings.introBars,
        });

        // Ожидаем, пока движок загрузит блюпринт и будет готов к работе.
        await (newEngine as any).initialize(true); // force=true для перезагрузки блюпринта
        
        fractalMusicEngine = newEngine;
        this.barCount = 0;
    },

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        if (!fractalMusicEngine) {
            this.initializeEngine(this.settings, true);
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
    
    async reset() {
        // #ЗАЧЕМ: "Горячая" перезагрузка движка без остановки цикла воспроизведения.
        // #ЧТО: Останавливает текущий таймер, принудительно пересоздает движок с новым seed,
        //      и если музыка играла, немедленно запускает цикл `start()` заново.
        // #СВЯЗИ: Вызывается по команде 'reset' из UI или автоматически по 'SUITE_ENDED'.
        const wasRunning = this.isRunning;
        if (wasRunning) {
            this.stop();
        }
        await this.initializeEngine(this.settings, true);
        if (wasRunning) {
            this.start();
        }
    },

    async updateSettings(newSettings: Partial<WorkerSettings>) {
       const needsRestart = this.isRunning && (newSettings.bpm !== undefined && newSettings.bpm !== this.settings.bpm);
       const scoreChanged = newSettings.score && newSettings.score !== this.settings.score;
       const moodChanged = newSettings.mood && newSettings.mood !== this.settings.mood;
       const genreChanged = newSettings.genre && newSettings.genre !== this.settings.genre;
       const seedChanged = newSettings.seed !== undefined && newSettings.seed !== this.settings.seed;
       const introBarsChanged = newSettings.introBars !== undefined && newSettings.introBars !== this.settings.introBars;
       const wasNotInitialized = !fractalMusicEngine;
       
       if (needsRestart) this.stop();
       
       this.settings = {
            ...this.settings,
            ...newSettings,
            drumSettings: newSettings.drumSettings ? { ...this.settings.drumSettings, ...newSettings.drumSettings } : this.settings.drumSettings,
            instrumentSettings: newSettings.instrumentSettings ? { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings } : this.settings.instrumentSettings,
            textureSettings: newSettings.textureSettings ? { ...this.settings.textureSettings, ...newSettings.textureSettings } : this.settings.textureSettings,
        };

       // #ИСПРАВЛЕНО (ПЛАН 719): Изменение `introBars` теперь корректно вызывает переинициализацию движка.
       if (wasNotInitialized || scoreChanged || moodChanged || genreChanged || seedChanged || introBarsChanged) {
           await this.initializeEngine(this.settings, true);
       } else if (fractalMusicEngine) {
           await fractalMusicEngine.updateConfig(this.settings);
       }
       
       if (needsRestart) this.start();
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        // --- ЛОГИКА ДЕКОРАТОРА (ПЛАН 716/718) ---
        
        // ШАГ 1: Основной движок ВСЕГДА работает в фоне.
        const mainEnginePayload = fractalMusicEngine.evolve(this.barDuration, this.barCount);

        let finalPayload: { events: FractalEvent[], instrumentHints: InstrumentHints };

        // #ИСПРАВЛЕНО (ПЛАН 719): Добавлен лог для проверки значений перед условием.
        console.log(`[Worker.tick @ Bar ${this.barCount}] Checking intro condition: barCount (${this.barCount}) < introBars (${this.settings.introBars}) -> ${this.barCount < this.settings.introBars}`);

        // ШАГ 2: Проверяем, находимся ли мы в периоде интро.
        if (this.barCount < this.settings.introBars) {
            const introPart = fractalMusicEngine.navigator?.blueprint.structure.parts.find(p => p.id.startsWith('INTRO'));
            
            if (introPart?.introRules) {
                // ШАГ 3А: Если да, подменяем партитуру на сгенерированную "прологом".
                console.log(`%c[Worker.tick @ Bar ${this.barCount}] Using INTRO GENERATOR.`, 'color: #FF69B4; font-weight: bold;');
                finalPayload = generateIntroSequence(
                    this.barCount,
                    this.settings.introBars,
                    introPart.introRules,
                    fractalMusicEngine.getGhostHarmony(),
                    this.settings,
                    fractalMusicEngine.random,
                    fractalMusicEngine.introInstrumentMap // Передаем карту выбранных инструментов
                );
            } else {
                // Если правил интро нет, просто играем то, что сгенерировал основной движок.
                finalPayload = mainEnginePayload;
            }
        } else {
            // ШАГ 3Б: Интро закончилось, используем основную партитуру.
            finalPayload = mainEnginePayload;
        }

        const scorePayload = finalPayload; // Используем итоговую партитуру
        
        const bassCount = scorePayload.events.filter(e => e.type === 'bass').length;
        const melodyCount = scorePayload.events.filter(e => e.type === 'melody').length;
        const accompanimentCount = scorePayload.events.filter(e => e.type === 'accompaniment').length;
        const harmonyCount = scorePayload.events.filter(e => e.type === 'harmony').length;
        const drumsCount = scorePayload.events.filter(e => (e.type as string).startsWith('drum_') || (e.type as string).startsWith('perc-')).length;
        const sfxCount = scorePayload.events.filter(e => e.type === 'sfx').length;
        const sparklesCount = scorePayload.events.filter(e => e.type === 'sparkle').length;

        const hintsString = JSON.stringify(scorePayload.instrumentHints || {});

        console.log(
            `[Worker.tick @ Bar ${this.barCount}] Dispatching: Total=${scorePayload.events.length}, Bass=${bassCount}, Melody=${melodyCount}, Accomp=${accompanimentCount}, Drums=${drumsCount}, Harmony=${harmonyCount}, Sparkles=${sparklesCount}, SFX=${sfxCount}, Hints: ${hintsString}`
        );
        
        const mainScoreEvents: FractalEvent[] = [];
        const sfxEvents: FractalEvent[] = [];
        const sparkleEvents: FractalEvent[] = [];
        const harmonyEvents: FractalEvent[] = [];
        
        for (const event of scorePayload.events) {
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

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: mainScoreEvents,
                instrumentHints: scorePayload.instrumentHints,
                barDuration: this.barDuration,
                barCount: this.barCount,
            }
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
                 instrumentHints: scorePayload.instrumentHints,
                 barDuration: this.barDuration
             };
             self.postMessage({ type: 'HARMONY_SCORE_READY', payload: harmonyPayload });
        }

        this.barCount++;
        // #ЗАЧЕМ: Этот блок отправляет команду на перезапуск сюиты.
        // #ЧТО: Когда `barCount` превышает общую длину сюиты (включая 4 такта "променада"),
        //      он отправляет в основной поток команду `SUITE_ENDED`.
        // #СВЯЗИ: Основной поток (`audio-engine-context.tsx`) должен слушать эту команду
        //         и вызывать `resetWorker()`, чтобы начать новую сюиту.
        if (fractalMusicEngine && this.barCount >= fractalMusicEngine.navigator.totalBars + 4) {
             console.log(`%c[Worker] End of suite detected. Posting 'SUITE_ENDED' command.`, 'color: red; font-weight: bold;');
             self.postMessage({ command: 'SUITE_ENDED' });
        }
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
                await Scheduler.updateSettings(data);
                await Scheduler.initializeEngine(data, true);
                break;
            
            case 'start':
                Scheduler.start();
                break;
                
            case 'stop':
                Scheduler.stop();
                break;

            case 'reset':
                await Scheduler.reset();
                break;

            case 'update_settings':
                await Scheduler.updateSettings(data);
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

    


    
