
/**
 * @file AuraGroove Music Worker V5.2 — "Strict Heritage Uniqueness".
 * #ЗАЧЕМ: Гарантия уникальности треков при ротации маршрута.
 * #ЧТО: ПЛАН №1630 — Увеличен буфер истории до 100 треков, внедрен строгий фильтр кандидатов.
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

const Scheduler = {
    loopId: null as any,
    isRunning: false,
    barCount: 0,
    sessionLickHistory: [] as string[],
    cloudAxiomPool: [] as any[], 
    filterRotationIndex: 0, 
    playedTrackHistory: [] as string[], 
    
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
     * #ЗАЧЕМ: Строгий выбор уникального Якоря.
     * #ЧТО: ПЛАН №1630. Исключение повторов треков-доноров.
     */
    pickActiveAnchor(): { id: string | null, nativeRoot: number | null } {
        if (!this.settings.useHeritage) return { id: null, nativeRoot: null }; 

        const manualFilter = this.settings.selectedCompositionIds || [];
        let pickedId: string | null = null;

        // Режим 1: Ручной выбор (DNA Locked)
        if (manualFilter.length > 0) {
            const idx = this.filterRotationIndex % manualFilter.length;
            pickedId = manualFilter[idx];
        } 
        // Режим 2: Автоматический выбор (Infinite DNA Random with strict uniqueness)
        else if (this.cloudAxiomPool.length > 0) {
            const uiGenre = this.settings.genre;
            const uiMood = this.settings.mood;
            
            const commonMoodFilter = ['epic', 'joyful', 'enthusiastic'].includes(uiMood) ? 'light' : 
                                   (['melancholic', 'dark', 'anxious', 'gloomy'].includes(uiMood) ? 'dark' : 'neutral');

            const matchingAxioms = this.cloudAxiomPool.filter(ax => {
                const genres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const moods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                const commons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                
                return genres.includes(uiGenre) && (moods.includes(uiMood) || commons.includes(commonMoodFilter));
            });

            if (matchingAxioms.length > 0) {
                const uniqueIds = Array.from(new Set(matchingAxioms.map(ax => ax.compositionId)));
                
                // #ЗАЧЕМ: Исключаем проигранные треки (Буфер увеличен до 100 для 5-цикловой гарантии).
                const freshCandidates = uniqueIds.filter(id => !this.playedTrackHistory.includes(id));
                
                const pool = freshCandidates.length > 0 ? freshCandidates : uniqueIds;
                
                // Если пул был пуст и мы сбросили фильтр — очищаем старую историю для этой категории
                if (freshCandidates.length === 0) {
                    this.playedTrackHistory = this.playedTrackHistory.filter(id => !uniqueIds.includes(id));
                }

                pickedId = pool[Math.floor(Math.random() * pool.length)];
            }
        }

        if (pickedId) {
            if (!this.playedTrackHistory.includes(pickedId)) {
                this.playedTrackHistory.push(pickedId);
                // #ЗАЧЕМ: Лимит 100 треков обеспечивает уникальность на протяжении как минимум 5 циклов маршрута.
                if (this.playedTrackHistory.length > 100) this.playedTrackHistory.shift();
                self.postMessage({ type: 'HISTORY_UPDATE', payload: this.playedTrackHistory });
            }

            const anchorAxiom = this.cloudAxiomPool.find(ax => 
                ax.compositionId && normalizeStr(ax.compositionId) === normalizeStr(pickedId!) && ax.nativeKey
            );
            
            if (anchorAxiom) {
                return { id: pickedId, nativeRoot: keyToMidiRoot(anchorAxiom.nativeKey) }; 
            }
            return { id: pickedId, nativeRoot: null };
        }

        return { id: null, nativeRoot: null };
    },

    initializeEngine(settings: WorkerSettings) {
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
            cloudAxioms: this.cloudAxiomPool,
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
        } else {
            const isUsingHeritage = this.settings.useHeritage;
            const engineIsAlgorithmic = !fractalMusicEngine.config.activeAnchorId;
            const heritageDataAvailable = this.cloudAxiomPool.length > 0;
            
            if (isUsingHeritage && engineIsAlgorithmic && heritageDataAvailable) {
                this.initializeEngine(this.settings);
            }
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
        const wasRunning = this.isRunning;
        if (wasRunning) this.stop();
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
        this.cloudAxiomPool = axioms || [];
        if (this.barCount === 0 && !fractalMusicEngine && this.cloudAxiomPool.length > 0) {
            this.initializeEngine(this.settings);
        } else if (fractalMusicEngine) {
            fractalMusicEngine.updateConfig({ cloudAxioms: axioms } as any);
        }
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        // BPM Morphing Logic
        if (this.targetBpm !== null) {
            this.settings.bpm += this.bpmStep;
            if (Math.abs(this.settings.bpm - this.targetBpm) < 0.5) {
                this.settings.bpm = this.targetBpm;
                this.targetBpm = null;
            }
            self.postMessage({ type: 'BPM_SYNC', payload: Math.round(this.settings.bpm) });
        }

        // --- INFINITE DNA ROTATION ---
        // Если сюита закончилась, переключаемся на следующий трек
        const totalBars = fractalMusicEngine.navigator?.totalBars || 144;
        if (this.barCount >= totalBars) {
             this.filterRotationIndex++;
             this.sessionLickHistory = []; 
             // #ЗАЧЕМ: ПЛАН №1630. Новый сид гарантирует свежую рандомизацию при выборе следующего трека.
             this.settings.seed = generateTrueSeed(); 
             this.initializeEngine(this.settings);
             this.barCount = 0;
        }

        let payload: any;
        try {
            payload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } catch (e) {
            console.error('[Worker] Evolution Error:', e);
            return;
        }

        if (payload.newBpm && payload.newBpm !== this.settings.bpm && !this.targetBpm) {
            this.settings.bpm = payload.newBpm;
            self.postMessage({ type: 'BPM_SYNC', payload: payload.newBpm });
        }

        const h = payload.instrumentHints || {};
        const sectionName = payload.navInfo?.currentPart.name || 'Unknown';
        const axioms = payload.activeAxioms || {};
        const trackName = payload.trackName || 'Generative';
        
        const melStr = axioms.melody === 'Generative' ? 'Generative' : (axioms.melody || 'Breath');
        const cognitiveStr = `Axioms: [MEL: ${melStr}] [BASS: ${axioms.bass || 'none'}] [DRUM: ${axioms.drums || 'none'}] [HAR: ${axioms.harmony || 'none'}] [PNO: ${axioms.piano || 'none'}]`;
        const ensembleStr = `Timbres: [MEL: ${h.melody || 'none'}] [BASS: ${h.bass || 'none'}] [ACC: ${h.accompaniment || 'none'}] [HAR: ${h.harmony || 'none'}] [PNO: ${h.pianoAccompaniment || 'none'}]`;

        console.log(
            `%c${getTimestamp()} [Bar ${this.barCount}] [${sectionName}] [DNA: ${trackName}] T:${payload.tension.toFixed(2)} B:${payload.beautyScore.toFixed(2)} ` +
            `%c${cognitiveStr}\n` +
            `%c  ↳ Narrative: ${payload.narrative || 'Flowing...'} | %c${ensembleStr}`,
            'color: #888;', 
            'color: #4ade80; font-weight: bold;',
            'color: #ADD8E6; font-style: italic;',
            'color: #DA70D6; font-size: 10px; font-weight: bold;'
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
