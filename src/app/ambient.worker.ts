
import { FractalMusicEngine } from '../lib/fractal-music-engine';
import type { FractalEvent, Mood, Genre } from '@/types/fractal';

let engine: FractalMusicEngine | null = null;
let timeOffset = 0;
let isRunning = false;
let animationFrameId: number | null = null;

function getBarDuration(tempo: number): number {
  const t = Number(tempo);
  if (isNaN(t) || t <= 0) {
    console.warn(`[Worker] Invalid tempo: ${t}. Defaulting to 2.0s/bar (120 BPM).`);
    return 2.0; 
  }
  return 4 * (60 / t);
}

function convertScoreToEvents(score: FractalEvent[], offset: number): FractalEvent[] {
  return score
    .map(event => {
      if (!isFinite(event.time) || !isFinite(offset)) return null;
      return {
        ...event,
        time: event.time + offset
      };
    })
    .filter((event): event is FractalEvent => event !== null && isFinite(event.time));
}

function initializeEngine(settings: {
  mood: Mood;
  genre: Genre;
  tempo: number;
  seed?: number;
}) {
  const tempo = Math.max(20, Math.min(300, Number(settings.tempo) || 120));

  engine = new FractalMusicEngine({
    mood: settings.mood,
    genre: settings.genre,
    tempo,
    seed: settings.seed
  });

  timeOffset = 0;
  isRunning = false;
}

function tick() {
  if (!engine) return;

  try {
    const score = engine.evolve();
    const events = convertScoreToEvents(score, timeOffset);

    self.postMessage({
      type: 'SCORE_READY',
      events
    });

    const barDuration = getBarDuration(engine.tempo);
    timeOffset += barDuration;

  } catch (e) {
    console.error('[Worker] Error in tick:', e);
  }

  if (isRunning) {
    animationFrameId = self.setTimeout(tick, 10);
  }
}

self.onmessage = (e: MessageEvent) => {
  if (!e.data || !e.data.command) return;

  switch (e.data.command) {
    case 'init':
      initializeEngine(e.data.data);
      break;

    case 'start':
      if (!engine) {
        console.warn('[Worker] Engine not initialized, cannot start');
        return;
      }
      if (!isRunning) {
        isRunning = true;
        tick();
      }
      break;

    case 'stop':
      isRunning = false;
      if (animationFrameId) {
        self.clearTimeout(animationFrameId);
        animationFrameId = null;
      }
      break;

    case 'update_settings':
      if (isRunning) {
        console.warn('[Worker] Cannot update settings while running');
        return;
      }
      initializeEngine(e.data.data);
      break;

    default:
      console.warn(`[Worker] Unknown command: ${e.data.command}`);
  }
};
