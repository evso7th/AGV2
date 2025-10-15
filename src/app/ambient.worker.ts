
import { FractalMusicEngine } from '../lib/fractal-music-engine';
import type { FractalEvent, Mood, Genre } from '@/types/fractal';
import type { WorkerSettings } from '@/types/music';


let engine: FractalMusicEngine | null = null;
let loopId: any = null;
let isRunning = false;

function initializeEngine(settings: WorkerSettings) {
    console.log('[Worker] Initializing engine with seed:', settings.seed);
    engine = new FractalMusicEngine({
        mood: settings.mood,
        genre: 'ambient',
        tempo: settings.bpm,
        density: settings.density,
        lambda: 1.0 - (settings.density * 0.5 + 0.3),
        organic: settings.density,
        drumSettings: settings.drumSettings,
        seed: settings.seed ?? Date.now(),
    });
}

function getBarDuration(tempo: number): number {
    const t = Number(tempo);
    if (isNaN(t) || t <= 0) return 2.0; 
    return 4 * (60 / t);
}


function tick() {
    if (!engine || !isRunning) return;
    
    try {
        const barDuration = getBarDuration(engine.tempo);
        const score = engine.evolve(barDuration);
        
        self.postMessage({
            type: 'SCORE_READY',
            events: score,
            barDuration: barDuration,
        });

    } catch (e) {
        console.error('[Worker] Error in tick:', e);
        self.postMessage({ type: 'error', error: e instanceof Error ? e.message : String(e) });
    }
}

self.onmessage = (e: MessageEvent) => {
  if (!e.data || !e.data.command) return;

  const { command, data } = e.data;

  switch (command) {
    case 'init':
      initializeEngine(data);
      break;

    case 'start':
      if (!engine) {
        console.warn('[Worker] Engine not initialized, cannot start. Initializing now.');
        initializeEngine(data);
      }
      if (!isRunning) {
        isRunning = true;
        tick(); // First tick is immediate
        loopId = setInterval(tick, getBarDuration(engine.tempo) * 1000);
      }
      break;

    case 'stop':
      if (isRunning) {
        isRunning = false;
        if (loopId) {
          clearInterval(loopId);
          loopId = null;
        }
      }
      break;

    case 'reset':
      if (isRunning) {
        clearInterval(loopId);
      }
      // Re-initialize with a new seed to ensure variation
      initializeEngine({ ...data, seed: Date.now() });
      if(isRunning) {
          tick();
          loopId = setInterval(tick, getBarDuration(engine.tempo) * 1000);
      }
      break;

    case 'update_settings':
      if (!engine) {
        initializeEngine(data);
        break;
      }
      
      const needsRestart = data.bpm !== engine.config.bpm;
      const needsReInit = data.mood !== engine.config.mood || data.score !== engine.config.genre;

      if(needsReInit) {
          if (isRunning) {
            clearInterval(loopId);
            loopId = null;
          }
          initializeEngine({ ...data, seed: Date.now() });
          if(isRunning){
            tick();
            loopId = setInterval(tick, getBarDuration(engine.tempo) * 1000);
          }
      } else {
        engine.updateConfig({
            tempo: data.bpm,
            density: data.density,
            lambda: 1.0 - (data.density * 0.5 + 0.3),
            organic: data.density,
            drumSettings: data.drumSettings,
        });
        if (needsRestart && isRunning) {
            clearInterval(loopId);
            loopId = setInterval(tick, getBarDuration(engine.tempo) * 1000);
        }
      }
      break;

    default:
      console.warn(`[Worker] Unknown command: ${command}`);
  }
};
