
/**
 * @file AuraGroove Music Worker (Architecture: "The Kinetic Pulse")
 * #ОБНОВЛЕНО (ПЛАН №846): Внедрена детерминированная ротация доноров для Свободной игры.
 */
import type { WorkerSettings, Mood, Genre, InstrumentPart } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import type { FractalEvent, InstrumentHints, NavigationInfo } from '@/types/fractal';
import { getBlueprint } from '@/lib/blueprints';

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
     * #ЗАЧЕМ: Выбор активного якоря (ПЛАН №846).
     * #ЧТО: Внедрена ротация для автоматического пула. Теперь треки не повторяются, пока не пройдет весь круг.
     */
    pickActiveAnchor(): { id: string | null, nativeRoot: number | null } {
        if (!this.settings.useHeritage) return { id: null, nativeRoot: null }; 

        const manualFilter = this.settings.selectedCompositionIds || [];
        let pickedId: string | null = null;

        if (manualFilter.length > 0) {
            // Ротация по ручному списку
            pickedId = manualFilter[this.filterRotationIndex % manualFilter.length];
        } else if (this.cloudAxiomPool.length > 0) {
            const uiGenre = this.settings.genre;
            const uiMood = this.settings.mood;

            // Фильтруем по жанру и настроению
            const matchingAxioms = this.cloudAxiomPool.filter(ax => {
                const genres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const moods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                return genres.includes(uiGenre) && moods.includes(uiMood);
            });

            if (matchingAxioms.length > 0) {
                const uniqueIds = Array.from(new Set(matchingAxioms.map(ax => ax.compositionId)));
                // ПЛАН №846: Используем циклическую ротацию вместо чистого рандома
                pickedId = uniqueIds[this.filterRotationIndex % uniqueIds.length];
            }
        }

        if (pickedId) {
            const anchorAxiom = this.cloudAxiomPool.find(ax => 
                ax.compositionId && 
                ax.compositionId.toLowerCase().replace(/[^a-z0-9]/g, '') === pickedId?.toLowerCase().replace(/[^a-z0-9]/g, '') && 
                ax.nativeKey
            );
            if (anchorAxiom) {
                const noteMap: Record<string, number> = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };
                const rootName = anchorAxiom.nativeKey.match(/^[A-G][#b]?/)?.[0] || 'C';
                return { id: pickedId, nativeRoot: 48 + (noteMap[rootName] || 0) }; 
            }
            return { id: pickedId, nativeRoot: null };
        }

        return { id: null, nativeRoot: null };
    },

    initializeEngine(settings: WorkerSettings) {
        const blueprint = getBlueprint(settings.genre, settings.mood);
        const seed = settings.seed || generateTrueSeed();
        
        const anchorInfo = this.pickActiveAnchor();

        const finalSettings = {
            ...settings,
            seed: seed,
            activeAnchorId: anchorInfo.id, 
            activeAnchorRoot: anchorInfo.nativeRoot, 
            sessionLickHistory: this.sessionLickHistory,
            cloudAxioms: this.cloudAxiomPool 
        };

        fractalMusicEngine = new FractalMusicEngine(finalSettings, blueprint);
        fractalMusicEngine.initialize(force_reset_lottery = true);
        
        const inheritedBpm = fractalMusicEngine.config.tempo;
        if (inheritedBpm !== this.settings.bpm) {
            this.settings.bpm = inheritedBpm;
            self.postMessage({ type: 'BPM_SYNC', payload: inheritedBpm });
        }
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
        const wasRunning = this.isRunning;
        if (wasRunning) this.stop();
        this.initializeEngine(this.settings);
        if (wasRunning) this.start();
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       const seedChanged = newSettings.seed !== undefined && newSettings.seed !== this.settings.seed;
       const useHeritageChanged = newSettings.useHeritage !== undefined && newSettings.useHeritage !== this.settings.useHeritage;
       const genreOrMoodChanged = (newSettings.genre && newSettings.genre !== this.settings.genre) || (newSettings.mood && newSettings.mood !== this.settings.mood);
       const filterChanged = newSettings.selectedCompositionIds !== undefined && JSON.stringify(newSettings.selectedCompositionIds) !== JSON.stringify(this.settings.selectedCompositionIds);
       
       this.settings = { ...this.settings, ...newSettings };
       
       if (seedChanged || genreOrMoodChanged || filterChanged || useHeritageChanged) {
           this.sessionLickHistory = []; 
           this.filterRotationIndex = 0; 
           this.barCount = 0; 
           this.initializeEngine(this.settings);
       } else if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig(this.settings);
       }
    },

    updateCloudAxioms(axioms: any[]) {
        const hadAxioms = this.cloudAxiomPool.length > 0;
        this.cloudAxiomPool = axioms || [];
        const hasAxioms = this.cloudAxiomPool.length > 0;
        
        if (this.barCount === 0 && !hadAxioms && hasAxioms) {
            this.initializeEngine(this.settings);
        } else if (fractalMusicEngine) {
            fractalMusicEngine.updateConfig({ cloudAxioms: axioms } as any);
        }
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        // ПЛАН №846: Смена донора при достижении лимита тактов
        if (this.barCount >= (fractalMusicEngine.navigator?.totalBars || 144)) {
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
            console.error('[Worker] Evolution Error:', e);
            return;
        }

        if (payload.newBpm && payload.newBpm !== this.settings.bpm) {
            this.settings.bpm = payload.newBpm;
            self.postMessage({ type: 'BPM_SYNC', payload: payload.newBpm });
        }

        if (payload.lickId && !payload.lickId.includes('Generative')) {
            if (!this.sessionLickHistory.includes(payload.lickId)) {
                this.sessionLickHistory.push(payload.lickId);
                if (this.sessionLickHistory.length > 50) this.sessionLickHistory.shift();
            }
        }

        const h = payload.instrumentHints || {};
        const sectionName = payload.navInfo?.currentPart.name || 'Unknown';
        const axioms = payload.activeAxioms || {};
        const narration = payload.narrative || 'Developing story...';
        const ensembleStr = `BASS: ${h.bass || 'none'} | MEL: ${h.melody || 'none'} | ACC: ${h.accompaniment || 'none'} | HAR: ${h.harmony || 'none'} | PNO: ${h.pianoAccompaniment || 'none'}`;
        const syncStatus = axioms.ensemble ? `[Ensemble: ${axioms.ensemble}]` : '';
        const dynastyStr = payload.dynasty ? `[Dynasty: ${payload.dynasty.toUpperCase()}]` : '';
        const mutType = payload.mutationType || 'none';
        const mutationStr = mutType !== 'none' ? `%c[Mutation: ${mutType.toUpperCase()}]` : `[Mutation: none]`;
        const mutColor = mutType !== 'none' ? 'color: #FFD700; font-weight: bold;' : 'color: #888;';
        
        const melStr = axioms.melody === 'Generative' ? 'Generative (No DNA)' : (axioms.melody || 'Breath');
        const cognitiveStr = `Axioms: [MEL: ${melStr}] [BASS: ${axioms.bass || 'none'}] [ACC: ${axioms.accompaniment || 'none'}] [HAR: ${axioms.harmony || 'none'}] [PNO: ${axioms.piano || 'none'}]`;

        console.log(
            `%c${getTimestamp()} [Bar ${this.barCount}] [${sectionName}] T:${payload.tension.toFixed(2)} ${syncStatus} ${dynastyStr} ${mutationStr} ` +
            `%c${ensembleStr}\n` +
            `%c  ↳ ${cognitiveStr}\n` +
            `%c  ↳ Narrative: ${narration}`,
            'color: #888;', 
            mutColor,
            'color: #4ade80; font-weight: bold;',
            'color: #DA70D6;',
            'color: #ADD8E6; font-style: italic;'
        );

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: payload.events,
                instrumentHints: h,
                barDuration: (60 / this.settings.bpm) * 4,
                barCount: this.barCount,
                actualBpm: this.settings.bpm,
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
