
/**
 * @file AuraGroove Music Worker V5.5 — "Heritage Recovery".
 * #ЗАЧЕМ: Исправление связи с ДНК в устойчивой версии А.
 */
import type { WorkerSettings, Mood, Genre, InstrumentPart } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import { getBlueprint } from '@/lib/blueprints';
import { normalizeStr, keyToMidiRoot } from '@/lib/music-theory';

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
    expectedNextTick: 0,
    
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
        selectedCompositionIds: [],
        seed: generateTrueSeed()
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; 
    },

    pickActiveAnchor(): { id: string | null, nativeRoot: number | null } {
        if (!this.settings.useHeritage) return { id: null, nativeRoot: null }; 

        const manualFilter = this.settings.selectedCompositionIds || [];
        let pickedId: string | null = null;

        if (manualFilter.length > 0) {
            const idx = this.filterRotationIndex % manualFilter.length;
            pickedId = manualFilter[idx];
        } 
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
                const freshCandidates = uniqueIds.filter(id => !this.playedTrackHistory.includes(id));
                const pool = freshCandidates.length > 0 ? freshCandidates : uniqueIds;
                
                if (freshCandidates.length === 0) {
                    this.playedTrackHistory = []; // Reset if exhausted
                }

                pickedId = pool[Math.floor(Math.random() * pool.length)];
            }
        }

        if (pickedId) {
            if (!this.playedTrackHistory.includes(pickedId)) {
                this.playedTrackHistory.push(pickedId);
                if (this.playedTrackHistory.length > 100) this.playedTrackHistory.shift();
                self.postMessage({ type: 'HISTORY_UPDATE', payload: this.playedTrackHistory });
            }

            const target = normalizeStr(pickedId);
            const anchorAxiom = this.cloudAxiomPool.find(ax => 
                ax.compositionId && normalizeStr(ax.compositionId) === target && ax.nativeKey
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
        
        const inheritedBpm = fractalMusicEngine.config.tempo;
        if (inheritedBpm && inheritedBpm !== this.settings.bpm) {
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
           this.sessionLickHistory = []; 
           this.barCount = 0; 
           this.initializeEngine(this.settings);
       } else if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig(this.settings);
       }
    },

    updateCloudAxioms(axioms: any[]) {
        this.cloudAxiomPool = axioms || [];
        if (fractalMusicEngine) {
            fractalMusicEngine.updateConfig({ cloudAxioms: axioms } as any);
        } else if (this.cloudAxiomPool.length > 0) {
            this.initializeEngine(this.settings);
        }
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

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
            console.error('[Worker] Evolution Error:', e);
            return;
        }

        if (payload.newBpm && payload.newBpm !== this.settings.bpm) {
            this.settings.bpm = payload.newBpm;
            self.postMessage({ type: 'BPM_SYNC', payload: payload.newBpm });
        }

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: payload.events,
                instrumentHints: payload.instrumentHints,
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
