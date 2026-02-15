/**
 * @file AuraGroove Music Worker (Architecture: "The Chain of Suites")
 * #ОБНОВЛЕНО (ПЛАН №430): Дефолтный бас изменен на bass_jazz_warm для исключения glideBass.
 */
import type { WorkerSettings, ScoreName, Mood, Genre, InstrumentPart } from '@/types/music';
import { FractalMusicEngine } from '@/lib/fractal-music-engine';
import type { FractalEvent, InstrumentHints, NavigationInfo } from '@/types/fractal';
import { getBridgeBlueprint, getBlueprint } from '@/lib/blueprints';

let fractalMusicEngine: FractalMusicEngine | undefined;

const getTimestamp = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `[${d}:${h}:${m}]`;
};

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
            // #ЗАЧЕМ: Исключение glideBass из стартовых настроек.
            bass: { name: "bass_jazz_warm", volume: 0.7, technique: 'portamento' },
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
        introBars: 12, 
        sessionLickHistory: [],
        ancestor: null as any 
    } as WorkerSettings,

    get barDuration() { 
        return (60 / this.settings.bpm) * 4; 
    },

    initializeEngine(settings: WorkerSettings, force: boolean = false) {
        let blueprint;
        if (this.suiteType === 'BRIDGE' || this.suiteType === 'PROMENADE') {
            blueprint = getBridgeBlueprint(settings.mood);
            console.log(`%c${getTimestamp()} [Chain] Loading BRIDGE Blueprint: ${blueprint.id}`, 'color: #00BFFF; font-weight:bold;');
        } else {
            blueprint = getBlueprint(settings.genre, settings.mood);
            console.log(`%c${getTimestamp()} [Chain] Loading MAIN Blueprint: ${blueprint.id}`, 'color: #FFD700; font-weight:bold;');
        }

        const newEngine = new FractalMusicEngine({
            ...settings,
            seed: settings.seed || Date.now(),
            introBars: settings.introBars,
            ancestor: settings.ancestor,
            sessionLickHistory: this.settings.sessionLickHistory 
        }, blueprint);

        newEngine.initialize(true); 
        fractalMusicEngine = newEngine;
        
        if (newEngine.suiteDNA?.seedLickId) {
            this.settings.sessionLickHistory = [
                ...(this.settings.sessionLickHistory || []),
                newEngine.suiteDNA.seedLickId
            ].slice(-10); 

            self.postMessage({ type: 'LICK_BORN', lickId: newEngine.suiteDNA.seedLickId });
        }

        this.settings.bpm = fractalMusicEngine.config.tempo;
        this.barCount = 0;
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.suiteType = 'PROMENADE'; 
        this.initializeEngine(this.settings, true);

        const loop = () => {
            if (!this.isRunning) return;
            
            const barStartTime = performance.now();
            try {
                this.tick();
            } catch (e) {
                console.error('%c[Chronos] Tick execution failed!', 'color: #ef4444; font-weight: bold;', e);
            }
            
            const executionTime = performance.now() - barStartTime;
            const targetDuration = this.barDuration * 1000;
            
            if (executionTime > 100) {
                console.warn(`%c${getTimestamp()} [Chronos] Heavy Tick! Computed in ${executionTime.toFixed(2)}ms`, 'color: #ef4444;');
            }

            const nextDelay = Math.max(0, targetDuration - executionTime);
            this.loopId = setTimeout(loop, nextDelay);
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

        if (this.barCount >= fractalMusicEngine.navigator!.totalBars) {
             console.log(`%c${getTimestamp()} [Chain] Suite ${this.suiteType} ended. Transitioning...`, 'color: #4ade80; font-weight: bold;');
             
             if (this.suiteType === 'BRIDGE' || this.suiteType === 'PROMENADE') {
                 this.suiteType = 'MAIN';
             } else {
                 this.suiteType = 'BRIDGE';
                 this.settings.seed = Date.now(); 
             }
             
             this.initializeEngine(this.settings, true);
        }

        let finalPayload: { events: FractalEvent[], instrumentHints: InstrumentHints, beautyScore: number, tension: number, navInfo?: NavigationInfo } = { 
            events: [], 
            instrumentHints: {}, 
            beautyScore: 0.5,
            tension: 0.5
        };

        try {
            finalPayload = fractalMusicEngine.evolve(this.barDuration, this.barCount);
        } catch (e) {
            console.error('[Worker.tick] Generation error:', e);
        }

        if (finalPayload.beautyScore > 0.90 && this.barCount > 8) {
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
        const bassPreset = finalPayload.instrumentHints?.bass || 'none';
        console.log(
            `%c${getTimestamp()} [Bar ${this.barCount}] [${this.suiteType}] [${sectionName}] T:${finalPayload.tension.toFixed(2)} BPM:${this.settings.bpm} Res:${finalPayload.beautyScore.toFixed(2)} D:${counts.drums}, B:${counts.bass}, M:${counts.melody} | %cBASS: ${bassPreset}`,
            'color: #888;', 
            'color: #4ade80; font-weight: bold;' 
        );

        self.postMessage({ 
            type: 'SCORE_READY', 
            payload: {
                events: finalPayload.events.filter(e => e.type !== 'sfx' && e.type !== 'sparkle' && e.type !== 'harmony'),
                instrumentHints: finalPayload.instrumentHints,
                barDuration: this.barDuration,
                barCount: this.barCount,
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