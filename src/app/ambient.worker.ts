
/**
 * @fileOverview AuraGroove Music Worker V5.8 — "True Random Heritage Protocol".
 * #ЗАЧЕМ: Реализация алгоритма Shuffle Bag для исключения предсказуемости выбора треков.
 * #ЧТО: ПЛАН №3300 — Очередь треков перемешивается и не повторяется до полного исчерпания пула.
 */
import type { WorkerSettings, Mood, Genre, InstrumentPart } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import type { FractalEvent, InstrumentHints, NavigationInfo } from '@/types/fractal';
import { getBlueprint } from '@/lib/blueprints';
import { normalizeStr } from '@/lib/music-theory';

let fractalMusicEngine: FractalMusicEngine | undefined;

const getTimestamp = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `[${h}:${m}:${s}]`;
};

function generateTrueSeed(): number {
    const array = new Uint32Array(1);
    self.crypto.getRandomValues(array);
    return array[0];
}

/**
 * #ЗАЧЕМ: Универсальный инструмент перемешивания массива.
 */
function shuffleArray<T>(array: T[]): T[] {
    const next = [...array];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}

const Scheduler = {
    loopId: null as any,
    isRunning: false,
    barCount: 0,
    sessionLickHistory: [] as string[],
    cloudAxioms: [] as any[], 
    filterRotationIndex: 0, 
    playedTrackHistory: [] as string[], 
    expectedNextTick: 0,
    
    // --- SHUFFLE BAG STATE ---
    // #ЗАЧЕМ: Хранение "мешка" доступных треков для предотвращения повторов.
    activeShuffleBag: [] as string[],
    currentFilterHash: "",

    // Morphing State
    targetBpm: null as number | null,
    bpmStep: 0,

    settings: {
        bpm: 75,
        score: 'neuro_f_matrix', 
        genre: 'ambient' as Genre,
        drumSettings: { pattern: 'composer', enabled: true, kickVolume: 1.0, volume: 0.5 },
        instrumentSettings: { 
            bass: { name: "bass_jazz_warm", volume: 0.5, technique: 'walking' },
            melody: { name: "blackAcoustic", volume: 0.5 },
            accompaniment: { name: "organ_soft_jazz", volume: 0.5 },
            harmony: { name: "violin", volume: 0.5 },
            pianoAccompaniment: { name: "piano", volume: 0.5 }
        },
        textureSettings: {
            sparkles: { enabled: true, volume: 0.5 },
            sfx: { enabled: true, volume: 0.5 },
        },
        density: 0.5,
        composerControlsInstruments: true,
        useHeritage: true, 
        mood: 'melancholic' as Mood,
        introBars: 8, 
        sessionLickHistory: [],
        selectedCompositionIds: [],
        seed: generateTrueSeed()
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; 
    },

    /**
     * #ЗАЧЕМ: Умный выбор Активного Якоря (Anchor) с логикой Shuffle Bag.
     * #ЧТО: Если "мешок" пуст или фильтры изменились — создаем новую перемешанную очередь.
     */
    pickActiveAnchor(): { id: string | null, nativeRoot: number | null } {
        if (!this.settings.useHeritage) return { id: null, nativeRoot: null }; 

        const manualFilter = this.settings.selectedCompositionIds || [];
        let pickedId: string | null = null;

        // 1. Ручной режим: просто ротация по списку пользователя
        if (manualFilter.length > 0) {
            const idx = this.filterRotationIndex % manualFilter.length;
            pickedId = manualFilter[idx];
        } 
        // 2. Автоматический режим: Shuffle Bag логика
        else if (this.cloudAxioms.length > 0) {
            const uiGenre = this.settings.genre;
            const uiMood = this.settings.mood;
            const newHash = `${uiGenre}_${uiMood}`;

            // Сброс мешка при смене фильтров
            if (this.currentFilterHash !== newHash) {
                this.activeShuffleBag = [];
                this.currentFilterHash = newHash;
            }

            if (this.activeShuffleBag.length === 0) {
                const commonMoodFilter = ['epic', 'joyful', 'enthusiastic'].includes(uiMood) ? 'light' : 
                                       (['melancholic', 'dark', 'anxious', 'gloomy'].includes(uiMood) ? 'dark' : 'neutral');

                const matchingAxioms = this.cloudAxioms.filter(ax => {
                    if (ax.ignored === true) return false;
                    const genres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                    const moods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                    const commons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                    return genres.includes(uiGenre) && (moods.includes(uiMood) || commons.includes(commonMoodFilter));
                });

                const uniqueIds = Array.from(new Set(matchingAxioms.map(ax => ax.compositionId)));
                
                if (uniqueIds.length > 0) {
                    // Перемешиваем весь доступный пул
                    this.activeShuffleBag = shuffleArray(uniqueIds);
                }
            }

            if (this.activeShuffleBag.length > 0) {
                // "Вынимаем" трек из мешка
                pickedId = this.activeShuffleBag.shift()!;
            }
        }

        if (pickedId) {
            // Обновляем историю для UI и внутреннего контроля
            if (!this.playedTrackHistory.includes(pickedId)) {
                this.playedTrackHistory.push(pickedId);
                if (this.playedTrackHistory.length > 100) this.playedTrackHistory.shift();
                self.postMessage({ type: 'HISTORY_UPDATE', payload: this.playedTrackHistory });
            }

            const anchorAxiom = this.cloudAxioms.find(ax => 
                ax.compositionId && normalizeStr(ax.compositionId) === normalizeStr(pickedId!) && ax.nativeKey
            );
            
            return { id: pickedId, nativeRoot: anchorAxiom ? keyToMidiRoot(anchorAxiom.nativeKey) : null };
        }

        return { id: null, nativeRoot: null };
    },

    initializeEngine(settings: WorkerSettings) {
        this.barCount = 0;
        
        const blueprint = getBlueprint(settings.genre, settings.mood);
        const seed = settings.seed || generateTrueSeed();
        
        const anchorInfo = this.pickActiveAnchor();
        const isImprovising = (settings.selectedCompositionIds || []).length === 0;

        const finalSettings = {
            ...settings,
            seed: seed,
            activeAnchorId: anchorInfo.id, 
            activeAnchorRoot: anchorInfo.nativeRoot, 
            sessionLickHistory: this.sessionLickHistory,
            cloudAxioms: this.cloudAxioms,
            isImprovising: isImprovising
        };

        fractalMusicEngine = new FractalMusicEngine(finalSettings, blueprint);
        fractalMusicEngine.initialize(true); 
        
        if (settings.targetBpm) {
            this.targetBpm = settings.targetBpm;
            this.bpmStep = (this.targetBpm - this.settings.bpm) / 4; 
        } else {
            const inheritedBpm = fractalMusicEngine.config.tempo;
            if (inheritedBpm && inheritedBpm !== this.settings.bpm) {
                this.settings.bpm = inheritedBpm;
                self.postMessage({ type: 'BPM_SYNC', payload: inheritedBpm });
            }
        }
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        if (!fractalMusicEngine) {
            this.initializeEngine(this.settings);
        }

        this.expectedNextTick = performance.now();
        const loop = () => {
            if (!this.isRunning) return;
            
            this.tick();
            
            const durationMs = this.barDuration * 1000;
            this.expectedNextTick += durationMs;
            
            const drift = performance.now() - (this.expectedNextTick - durationMs);
            const nextInterval = Math.max(0, durationMs - drift);
            
            this.loopId = setTimeout(loop, nextInterval);
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
        const wasRunning = this.isRunning;
        if (wasRunning) this.stop();
        this.sessionLickHistory = [];
        this.playedTrackHistory = [];
        this.activeShuffleBag = []; // Сброс мешка при полном ресете
        this.initializeEngine(this.settings);
        if (wasRunning) this.start();
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       const seedChanged = newSettings.seed !== undefined && newSettings.seed !== this.settings.seed;
       const filterChanged = newSettings.selectedCompositionIds !== undefined && JSON.stringify(newSettings.selectedCompositionIds) !== JSON.stringify(this.settings.selectedCompositionIds);
       const genreOrMoodChanged = (newSettings.genre && newSettings.genre !== this.settings.genre) || (newSettings.mood && newSettings.mood !== this.settings.mood);
       const useHeritageChanged = newSettings.useHeritage !== undefined && newSettings.useHeritage !== this.settings.useHeritage;
       
       this.settings = { ...this.settings, ...newSettings };
       
       if (seedChanged || genreOrMoodChanged || filterChanged || useHeritageChanged) {
           if (filterChanged || genreOrMoodChanged) {
               this.filterRotationIndex = 0;
           } else if (seedChanged) {
               this.filterRotationIndex++;
           }

           this.sessionLickHistory = []; 
           this.barCount = 0; 
           this.initializeEngine(this.settings);
       } else if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig(this.settings);
       }
    },

    updateCloudAxioms(axioms: any[]) {
        this.cloudAxioms = axioms || [];
        if (this.barCount === 0 && !fractalMusicEngine && this.cloudAxioms.length > 0) {
            this.initializeEngine(this.settings);
        } else if (fractalMusicEngine) {
            fractalMusicEngine.updateConfig({ cloudAxioms: axioms } as any);
        }
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        if (this.targetBpm !== null) {
            this.settings.bpm += this.bpmStep;
            if (Math.abs(this.settings.bpm - this.targetBpm) < 0.5) {
                this.settings.bpm = this.targetBpm;
                this.targetBpm = null;
            }
            self.postMessage({ type: 'BPM_SYNC', payload: Math.round(this.settings.bpm) });
        }

        const totalBars = fractalMusicEngine.navigator?.totalBars || 144;
        if (this.barCount >= totalBars) {
             this.filterRotationIndex++;
             this.sessionLickHistory = []; 
             this.settings.seed = generateTrueSeed(); 
             this.initializeEngine(this.settings);
             this.barCount = 0;
        }

        let payload: any;
        try {
            payload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } catch (e) {
            return;
        }

        if (payload.newBpm && payload.newBpm !== this.settings.bpm && !this.targetBpm) {
            this.settings.bpm = payload.newBpm;
            self.postMessage({ type: 'BPM_SYNC', payload: payload.newBpm });
        }

        const mutType = payload.mutationType || 'none';
        const mutationLabel = mutType !== 'none' ? ` [MUT: ${mutType.toUpperCase()}]` : '';
        const mutationStyle = mutType !== 'none' 
            ? 'color: #ff00ff; font-weight: bold; background: #222; padding: 0 4px; border-radius: 2px;' 
            : 'color: #888;';

        const h = payload.instrumentHints || {};
        const ax = payload.activeAxioms || {};
        const genreMood = `${this.settings.genre.toUpperCase()}/${this.settings.mood.toUpperCase()}`;
        const track = payload.trackName || 'Algorithm';
        const section = payload.navInfo?.currentPart.name || 'Unknown';
        
        const cognitiveStr = `AX: MEL:${ax.melody || '-'} BAS:${ax.bass || '-'} ACC:${ax.accompaniment || '-'} HAR:${ax.harmony || '-'} RHO:${ax.piano || '-'} DRU:${ax.drums || '-'}`;
        const ensembleStr = `TIM: MEL:${h.melody || '-'} BAS:${h.bass || '-'} ACC:${h.accompaniment || '-'} HAR:${h.harmony || '-'} RHO:${h.pianoAccompaniment || '-'} DRU:${h.drums || 'kit'}`;

        console.log(
            `%c${getTimestamp()} Bar ${this.barCount}%c${mutationLabel}%c | ${section} | ${track} | ${genreMood} | T:${payload.tension.toFixed(2)} B:${payload.beautyScore.toFixed(2)} | %c${cognitiveStr} | %c${ensembleStr} | %c${payload.narrative || 'Flowing...'}`,
            'color: #888;', 
            mutationStyle,
            'color: #888;',
            'color: #4ade80; font-weight: bold;',
            'color: #DA70D6; font-size: 10px;',
            'color: #ADD8E6; font-style: italic;'
        );

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: payload.events,
                instrumentHints: h,
                barDuration: (60 / this.settings.bpm) * 4,
                barCount: this.barCount,
                totalBars: totalBars,
                actualBpm: Math.round(this.settings.bpm),
                genre: this.settings.genre,
                mood: this.settings.mood,
                lickId: payload.lickId,
                beautyScore: payload.beautyScore,
                seed: this.settings.seed
            }
        });

        this.barCount++;
    }
};

self.onmessage = (event: MessageEvent) => {
    if (!event.data || !event.data.command) return;
    const { command, data } = event.data;
    try {
        switch (command) {
            case 'init': 
                Scheduler.settings = { ...Scheduler.settings, ...data }; 
                if (data.sessionLickHistory) Scheduler.sessionLickHistory = data.sessionLickHistory;
                if (data.playedTrackHistory) Scheduler.playedTrackHistory = data.playedTrackHistory;
                break;
            case 'start': Scheduler.start(); break;
            case 'stop': Scheduler.stop(); break;
            case 'reset': Scheduler.reset(); break;
            case 'update_settings': Scheduler.updateSettings(data); break;
            case 'update_cloud_axioms': Scheduler.updateCloudAxioms(data); break; 
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: String(e) });
    }
};

function keyToMidiRoot(key: string | null | undefined): number | null {
    if (!key) return null;
    const noteMap: Record<string, number> = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };
    const rootName = key.match(/^[A-G][#b]?/)?.[0] || 'C';
    return 48 + (noteMap[rootName] || 0);
}
