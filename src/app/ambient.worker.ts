
import { FractalMusicEngine } from '../lib/fractal-music-engine';
import type { FractalEvent, Mood, Genre } from '@/types/fractal';

let engine: FractalMusicEngine | null = null;
let timeOffset = 0;
let isRunning = false;
let animationFrameId: number | null = null;

// Вспомогательная функция для безопасного вычисления длительности такта
function getBarDuration(tempo: number): number {
  const t = Number(tempo);
  if (isNaN(t) || t <= 0) return 2.0; // 120 BPM = 2 сек/такт
  return 4 * (60 / t);
}

// Преобразование событий движка в формат сэмплера/синтезатора
function convertScoreToEvents(score: FractalEvent[], offset: number): FractalEvent[] {
  return score
    .map(event => {
      if (!isFinite(event.time) || !isFinite(offset)) return null;
      return {
        ...event,
        time: event.time + offset // time уже в долях такта → абсолютное время
      };
    })
    .filter((event): event is FractalEvent => event !== null && isFinite(event.time));
}

// Инициализация движка
function initializeEngine(settings: {
  mood: Mood;
  genre: Genre;
  tempo: number;
  seed?: number;
}) {
  // Валидация и преобразование темпа
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

// Основной цикл генерации
function tick() {
  if (!engine) return;

  try {
    const score = engine.evolve();
    // @ts-ignore - Воркер не знает про `self.postMessage`, это нормально
    const events = convertScoreToEvents(score, timeOffset);

    // Отправка событий в основной поток
    self.postMessage({
      type: 'SCORE_READY',
      events
    });

    // Обновление времени — динамически
    const barDuration = getBarDuration((engine as any).config.tempo);
    timeOffset += barDuration;
  } catch (e) {
    console.error('[Worker] Error in tick:', e);
  }

  if (isRunning) {
    // @ts-ignore
    animationFrameId = self.setTimeout(tick, 10); // ~100 FPS
  }
}

// Обработчик сообщений из основного потока
self.onmessage = (e) => {
  if (!e.data) return;

  switch (e.data.command) {
    case 'init':
      initializeEngine(e.data.data);
      break;

    case 'start':
      if (!engine) {
        console.warn('[Worker] Engine not initialized, cannot start');
        return;
      }
      isRunning = true;
      tick();
      break;

    case 'stop':
      isRunning = false;
      if (animationFrameId) {
        // @ts-ignore
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
      if (e.data.command) {
        console.warn('[Worker] Unknown command:', e.data.command);
      }
  }
};
