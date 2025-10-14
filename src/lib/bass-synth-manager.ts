// src/lib/bass-synth-manager.ts
import type { FractalEvent } from '@/types/fractal';

/**
 * BassSynthManager — "Исполнитель"
 * Его единственная задача: получить МАССИВ событий FractalEvent и точно воспроизвести их
 * в заданное время с заданными параметрами синтеза.
 */
export class BassSynthManager {
  private ctx: AudioContext;
  private worklet: AudioWorkletNode | null = null;
  private destination: AudioNode;
  private isInitialized = false;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  async init() {
    if (this.isInitialized) return;
    try {
      await this.ctx.audioWorklet.addModule('/worklets/bass-processor.js');
      this.worklet = new AudioWorkletNode(this.ctx, 'bass-processor');
      this.worklet.connect(this.destination);
      this.isInitialized = true;
      console.log('[BassSynthManager] Initialized');
    } catch (e) {
      console.error('[BassSynthManager] Failed to init:', e);
    }
  }

  /**
   * Воспроизводит массив событий баса.
   * Время в событиях - АБСОЛЮТНОЕ.
   */
  public play(events: FractalEvent[]) {
    if (!this.isInitialized || !this.worklet) {
      console.warn('[BassSynthManager] Not ready, skipping events');
      return;
    }

    for (const event of events) {
      if (event.type !== 'bass') continue;

      // Защита от некорректного времени
      const noteOnTime = event.time;
      if (!isFinite(noteOnTime)) {
        console.warn('[BassSynthManager] Non-finite time in event:', event);
        continue;
      }

      if (!event.params) {
        console.warn('[BassSynthManager] Event is missing synth params:', event);
        continue;
      }

      // Извлечение параметров ИЗ СОБЫТИЯ
      const { cutoff, resonance, distortion, portamento } = event.params;

      // Установка параметров через AudioParam (sample-accurate)
      this.setParam('cutoff', cutoff, noteOnTime);
      this.setParam('resonance', resonance, noteOnTime);
      this.setParam('distortion', distortion, noteOnTime);
      this.setParam('portamento', portamento, noteOnTime);

      // Расчёт частоты
      const freq = 440 * Math.pow(2, (event.note - 69) / 12);
      if (!isFinite(freq)) continue;

      // Отправка ноты в ворклет
      this.worklet.port.postMessage({
        type: 'noteOn',
        frequency: freq,
        velocity: this.getVelocity(event.dynamics),
        time: noteOnTime
      });

      // Планирование noteOff
      const noteOffTime = noteOnTime + event.duration;
      this.worklet.port.postMessage({
        type: 'noteOff',
        time: noteOffTime
      });
    }
  }

  public allNotesOff() {
      if (!this.worklet) return;
      this.worklet.port.postMessage({ type: 'allNotesOff' });
  }

  private setParam(name: string, value: number, time: number) {
    const param = this.worklet?.parameters.get(name);
    if (param && isFinite(value)) {
      param.setTargetAtTime(value, time, 0.01); // Плавное изменение
    }
  }

  private getVelocity(dynamics: string): number {
    switch (dynamics) {
      case 'p': return 0.3;
      case 'mf': return 0.6;
      default: return 0.9; // 'f'
    }
  }
}
