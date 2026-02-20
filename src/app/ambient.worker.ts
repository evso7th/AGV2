/**
 * @file AuraGroove Music Worker (Architecture: "The Narrative Journey")
 * #ОБНОВЛЕНО (ПЛАН №530): Когнитивная прозрачность. Детальное логирование состава оркестра.
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

const Scheduler = {
    loopId: null as any,
    isRunning: false,
    barCount: 0,
    suiteType: 'MAIN' as 'MAIN' | 'BRIDGE' | 'PROMENADE',
    
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
        sessionLickHistory: []
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; 
    },

    initializeEngine(settings: WorkerSettings) {
        const blueprint = getBlueprint(settings.genre, settings.mood);
        console.log(`%c${getTimestamp()} [Engine] Sowing Suite DNA: ${blueprint.name}`, 'color: #FFD700; font-weight:bold;');

        fractalMusicEngine = new FractalMusicEngine({
            ...settings,
            seed: settings.seed || Date.now(),
            introBars: settings.introBars
        }, blueprint);

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
        this.settings.seed = Date.now();
        this.initializeEngine(this.settings);
        if (wasRunning) this.start();
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       const genreOrMoodChanged = (newSettings.genre && newSettings.genre !== this.settings.genre) || (newSettings.mood && newSettings.mood !== this.settings.mood);
       this.settings = { ...this.settings, ...newSettings };
       if (genreOrMoodChanged) this.reset();
       else if (fractalMusicEngine) fractalMusicEngine.updateConfig(this.settings);
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        if (this.barCount >= fractalMusicEngine.navigator!.totalBars) {
             console.log(`%c${getTimestamp()} [Chain] Cycle Complete. Regenerating...`, 'color: #4ade80; font-weight: bold;');
             this.settings.seed = Date.now(); 
             this.initializeEngine(this.settings);
        }

        let payload: any;
        try {
            payload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } catch (e) {
            console.error('[Worker] Evolution Error:', e);
            return;
        }

        const h = payload.instrumentHints || {};
        const sectionName = payload.navInfo?.currentPart.name || 'Unknown';
        
        // #ЗАЧЕМ: Narrative Logging. 
        // #ЧТО: Вывод текущего лика и мутации для контроля 4-х тактового цикла.
        const ensembleStr = `BASS: ${h.bass || 'none'} | MEL: ${h.melody || 'none'} | ACC: ${h.accompaniment || 'none'}`;
        const cognitiveStr = `Lick: ${payload.lickId || 'none'} | Mut: ${payload.mutationType || 'none'}`;

        console.log(
            `%c${getTimestamp()} [Bar ${this.barCount}] [${sectionName}] T:${payload.tension.toFixed(2)} ` +
            `%c${ensembleStr} | %c${cognitiveStr}`,
            'color: #888;', 
            'color: #4ade80; font-weight: bold;',
            'color: #DA70D6;'
        );

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: payload.events,
                instrumentHints: h,
                barDuration: this.barDuration,
                barCount: this.barCount,
                actualBpm: this.settings.bpm
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
            case 'init': Scheduler.settings = { ...Scheduler.settings, ...data }; break;
            case 'start': Scheduler.start(); break;
            case 'stop': Scheduler.stop(); break;
            case 'reset': Scheduler.reset(); break;
            case 'update_settings': Scheduler.updateSettings(data); break;
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: String(e) });
    }
};
