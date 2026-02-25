/**
 * @file AuraGroove Music Worker (Architecture: "The Cloud Composer")
 * #ОБНОВЛЕНО (ПЛАН №622): Реализация ротации фильтра и "Случайной Династии" (Вариант Б).
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
    filterRotationIndex: 0, // #ЗАЧЕМ: Управление очередью в Cloud Filter.
    
    settings: {
        bpm: 75,
        score: 'neuro_f_matrix', 
        genre: 'ambient' as Genre,
        drumSettings: { pattern: 'composer', enabled: true, kickVolume: 1.0, volume: 0.5 },
        instrumentSettings: { 
            bass: { name: "bass_jazz_warm", volume: 0.7, technique: 'walking' },
            melody: { name: "blackAcoustic", volume: 0.8 },
            accompaniment: { name: "organ_soft_jazz", volume: 0.7 },
            harmony: { name: "violin", volume: 0.6 },
            pianoAccompaniment: { name: "piano", volume: 0.5 }
        },
        textureSettings: {
            sparkles: { enabled: true, volume: 0.7 },
            sfx: { enabled: true, volume: 0.5 },
        },
        density: 0.5,
        composerControlsInstruments: true,
        mood: 'melancholic' as Mood,
        introBars: 12, 
        sessionLickHistory: [],
        selectedCompositionIds: [] 
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; 
    },

    /**
     * #ЗАЧЕМ: Выбор "Генетического Якоря" для новой сюиты.
     * #ЧТО: Реализует Вариант Б (случайный трек если фильтр пуст) и ротацию (если фильтр полон).
     */
    pickActiveAnchor(): string | null {
        const filter = this.settings.selectedCompositionIds || [];
        
        // 1. Если есть активный фильтр - идем по списку
        if (filter.length > 0) {
            const idx = this.filterRotationIndex % filter.length;
            return filter[idx];
        }

        // 2. Вариант Б: Фильтр пуст - выбираем случайную династию из облака
        if (this.cloudAxiomPool.length > 0) {
            const uniqueIds = Array.from(new Set(this.cloudAxiomPool.map(ax => ax.compositionId)));
            const randIdx = Math.floor(Math.random() * uniqueIds.length);
            return uniqueIds[randIdx];
        }

        return null;
    },

    initializeEngine(settings: WorkerSettings) {
        const blueprint = getBlueprint(settings.genre, settings.mood);
        const seed = settings.seed || generateTrueSeed();
        
        // Определяем якорь ПЕРЕД инициализацией движка
        const activeAnchorId = this.pickActiveAnchor();

        const finalSettings = {
            ...settings,
            seed: seed,
            activeAnchorId, // Передаем Якорь в движок
            sessionLickHistory: this.sessionLickHistory,
            cloudAxioms: this.cloudAxiomPool 
        };

        const anchorLog = activeAnchorId ? ` | Anchor: ${activeAnchorId}` : '';
        console.log(`%c${getTimestamp()} [Engine] Sowing Suite DNA: ${blueprint.name} (Seed: ${seed})${anchorLog}`, 'color: #FFD700; font-weight:bold;');

        fractalMusicEngine = new FractalMusicEngine(finalSettings, blueprint);
        fractalMusicEngine.initialize(true);
        
        this.settings.bpm = fractalMusicEngine.config.tempo;
        this.barCount = 0;
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.initializeEngine(this.settings);

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
        this.settings.seed = generateTrueSeed();
        this.initializeEngine(this.settings);
        if (wasRunning) this.start();
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       const genreOrMoodChanged = (newSettings.genre && newSettings.genre !== this.settings.genre) || (newSettings.mood && newSettings.mood !== this.settings.mood);
       const filterChanged = newSettings.selectedCompositionIds !== undefined && JSON.stringify(newSettings.selectedCompositionIds) !== JSON.stringify(this.settings.selectedCompositionIds);
       
       this.settings = { ...this.settings, ...newSettings };
       if (genreOrMoodChanged || filterChanged) {
           this.sessionLickHistory = []; 
           this.filterRotationIndex = 0; // Сброс ротации при смене фильтра
           this.reset();
       } else if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig(this.settings);
       }
    },

    updateCloudAxioms(axioms: any[]) {
        this.cloudAxiomPool = axioms;
        if (fractalMusicEngine) {
            fractalMusicEngine.updateConfig({ cloudAxioms: axioms } as any);
        }
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        if (this.barCount >= fractalMusicEngine.navigator!.totalBars) {
             console.log(`%c${getTimestamp()} [Chain] Cycle Complete. Rotating Heritage...`, 'color: #4ade80; font-weight: bold;');
             
             // Инкремент ротации для следующей сюиты
             this.filterRotationIndex++;
             
             this.settings.seed = generateTrueSeed(); 
             this.initializeEngine(this.settings);
        }

        let payload: any;
        try {
            payload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } catch (e) {
            console.error('[Worker] Evolution Error:', e);
            return;
        }

        if (payload.lickId) {
            if (!this.sessionLickHistory.includes(payload.lickId)) {
                this.sessionLickHistory.push(payload.lickId);
                if (this.sessionLickHistory.length > 20) this.sessionLickHistory.shift();
            }
        }

        const h = payload.instrumentHints || {};
        const sectionName = payload.navInfo?.currentPart.name || 'Unknown';
        
        const axioms = payload.activeAxioms || {};
        const narration = payload.narrative || 'Developing story...';
        
        const ensembleStr = `BASS: ${h.bass || 'none'} | MEL: ${h.melody || 'none'} | ACC: ${h.accompaniment || 'none'}`;
        
        const melStr = axioms.melodyTrack ? `${axioms.melodyTrack} | ID: ${axioms.melody}` : (axioms.melody || 'none');
        const cognitiveStr = `Axioms: [MEL: ${melStr}] [BASS: ${axioms.bass || 'none'}] [ACC: ${axioms.accompaniment || 'none'}]`;

        console.log(
            `%c${getTimestamp()} [Bar ${this.barCount}] [${sectionName}] T:${payload.tension.toFixed(2)} ` +
            `%c${ensembleStr}\n` +
            `%c  ↳ ${cognitiveStr}\n` +
            `%c  ↳ Narrative: ${narration}`,
            'color: #888;', 
            'color: #4ade80; font-weight: bold;',
            'color: #DA70D6;',
            'color: #ADD8E6; font-style: italic;'
        );

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: payload.events,
                instrumentHints: h,
                barDuration: this.barDuration,
                barCount: this.barCount,
                actualBpm: this.settings.bpm,
                lickId: payload.lickId 
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
