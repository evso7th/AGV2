/**
 * @file AuraGroove Music Worker (Architecture: "The Chain of Suites")
 *
 * This worker implements a Suite State Machine: 
 * PROMENADE -> MAIN -> BRIDGE -> MAIN -> ...
 * 
 * #ЗАЧЕМ: Реализация "Цепной Сюиты" (План №234). 
 * #ЧТО: Воркер теперь знает тип текущей пьесы и автоматически подгружает БП моста.
 * #ИННОВАЦИЯ: AI Arbitrator следит за гармоническим резонансом и пополняет генофонд.
 */
import type { WorkerSettings, ScoreName, Mood, Genre, InstrumentPart } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import type { FractalEvent, InstrumentHints, NavigationInfo } from '@/types/fractal';
import { getBridgeBlueprint, getBlueprint } from '@/lib/blueprints';

let fractalMusicEngine: FractalMusicEngine | undefined;

const Scheduler = {
    loopId: null as any,
    isRunning: false,
    barCount: 0,
    suiteType: 'PROMENADE' as 'MAIN' | 'BRIDGE' | 'PROMENADE',
    
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
        useMelodyV2: false, 
        introBars: 12, 
        ancestor: null as any 
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; 
    },

    initializeEngine(settings: WorkerSettings, force: boolean = false) {
        // #ЗАЧЕМ: Выбор Блюпринта на основе состояния Chain State Machine.
        let blueprint;
        if (this.suiteType === 'BRIDGE' || this.suiteType === 'PROMENADE') {
            blueprint = getBridgeBlueprint(settings.mood);
            console.log(`%c[Chain] Loading BRIDGE Blueprint: ${blueprint.id}`, 'color: #00BFFF; font-weight:bold;');
        } else {
            blueprint = getBlueprint(settings.genre, settings.mood);
            console.log(`%c[Chain] Loading MAIN Blueprint: ${blueprint.id}`, 'color: #FFD700; font-weight:bold;');
        }

        const newEngine = new FractalMusicEngine({
            ...settings,
            seed: settings.seed || Date.now(),
            introBars: settings.introBars,
            ancestor: settings.ancestor 
        }, blueprint);

        newEngine.initialize(true); 
        fractalMusicEngine = newEngine;
        
        // #ЗАЧЕМ: Синхронизация темпа. ДНК сюиты определяет BPM, воркер должен принять его.
        this.settings.bpm = fractalMusicEngine.config.tempo;
        
        this.barCount = 0;
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.suiteType = 'PROMENADE'; // Начинаем всегда с пролога
        this.initializeEngine(this.settings, true);

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
        this.suiteType = 'PROMENADE'; 
        this.initializeEngine(this.settings, true); 
        if (wasRunning) this.start();
    },

    updateSettings(newSettings: Partial<WorkerSettings>) {
       const genreOrMoodChanged = (newSettings.genre && newSettings.genre !== this.settings.genre) || (newSettings.mood && newSettings.mood !== this.settings.mood);
       
       this.settings = {
            ...this.settings,
            ...newSettings,
            drumSettings: newSettings.drumSettings ? { ...this.settings.drumSettings, ...newSettings.drumSettings } : this.settings.drumSettings,
            instrumentSettings: newSettings.instrumentSettings ? { ...this.settings.instrumentSettings, ...newSettings.instrumentSettings } : this.settings.instrumentSettings,
            textureSettings: newSettings.textureSettings ? { ...this.settings.textureSettings, ...newSettings.textureSettings } : this.settings.textureSettings,
        };

       if (genreOrMoodChanged) {
           this.reset();
       } else if (fractalMusicEngine) {
           fractalMusicEngine.updateConfig(this.settings);
       }
    },

    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        let finalPayload: { events: FractalEvent[], instrumentHints: InstrumentHints, beautyScore: number, navInfo?: NavigationInfo } = { 
            events: [], 
            instrumentHints: {}, 
            beautyScore: 0.5 
        };

        try {
            finalPayload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } catch (e) {
            console.error('[Worker.tick] CRITICAL ERROR:', e);
        }

        // #ЗАЧЕМ: AI Arbitrator — автоматический отбор лучших образцов.
        // #ОБНОВЛЕНО (ПЛАН №257): Порог снижен с 0.88 до 0.85 для повышения динамики обучения.
        if (finalPayload.beautyScore > 0.85 && this.barCount > 8) {
            console.log(`%c[Chain] AI ARBITRATOR: High Resonance Detected (${finalPayload.beautyScore.toFixed(3)}). Signaling UI for backup.`, 'color: #ff00ff');
            self.postMessage({ 
                type: 'HIGH_RESONANCE_DETECTED', 
                payload: { beautyScore: finalPayload.beautyScore, seed: this.settings.seed } 
            });
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
        
        const sectionName = finalPayload.navInfo?.currentPart.name || 'Unknown';
        // #ЗАЧЕМ: Отображение текущего BPM в логах.
        console.log(`[Bar ${this.barCount}] [${this.suiteType}] [${sectionName}] BPM:${this.settings.bpm} Res:${finalPayload.beautyScore.toFixed(2)} D:${counts.drums}, B:${counts.bass}, M:${counts.melody}`);

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: finalPayload.events.filter(e => e.type !== 'sfx' && e.type !== 'sparkle' && e.type !== 'harmony'),
                instrumentHints: finalPayload.instrumentHints,
                barDuration: this.barDuration,
                barCount: this.barCount,
                // #ЗАЧЕМ: Передача актуального BPM в UI.
                actualBpm: this.settings.bpm
            }
        });
        
        finalPayload.events.forEach(e => {
            if (e.type === 'sfx') self.postMessage({ type: 'sfx', payload: e });
            if (e.type === 'sparkle') self.postMessage({ type: 'sparkle', payload: e });
        });

        if (finalPayload.events.some(e => e.type === 'harmony')) {
             self.postMessage({ 
                 type: 'HARMONY_SCORE_READY', 
                 payload: {
                     events: finalPayload.events.filter(e => e.type === 'harmony'),
                     instrumentHints: finalPayload.instrumentHints,
                     barDuration: this.barDuration,
                     barCount: this.barCount
                 } 
             });
        }

        this.barCount++;

        // Chain Logic
        if (fractalMusicEngine && this.barCount >= fractalMusicEngine.navigator!.totalBars) {
             console.log(`%c[Chain] Suite ${this.suiteType} ended. Transitioning...`, 'color: #4ade80; font-weight: bold;');
             
             if (this.suiteType === 'BRIDGE' || this.suiteType === 'PROMENADE') {
                 this.suiteType = 'MAIN';
             } else {
                 this.suiteType = 'BRIDGE';
                 this.settings.seed = Date.now(); 
             }
             
             this.initializeEngine(this.settings, true);
        }
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
            case 'external_impulse': if (fractalMusicEngine) fractalMusicEngine.generateExternalImpulse(); break;
        }
    } catch (e) {
        self.postMessage({ type: 'error', error: String(e) });
    }
};
