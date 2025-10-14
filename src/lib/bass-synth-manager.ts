// src/lib/bass-synth-manager.ts
import type { FractalEvent } from '@/types/fractal';

/**
 * BassSynthManager — "Исполнитель"
 * Его единственная задача: получить событие FractalEvent и точно воспроизвести его
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
   * Воспроизводит одно событие баса.
   * Все параметры синтеза уже содержатся в событии.
   */
  public play(event: FractalEvent) {
    if (!this.isInitialized || !this.worklet) {
      console.warn('[BassSynthManager] Not ready, skipping event');
      return;
    }

    // Защита от некорректного времени
    if (!isFinite(event.time)) {
      console.warn('[BassSynthManager] Non-finite time in event:', event);
      return;
    }

    const noteOnTime = this.ctx.currentTime + event.time;
    if (!isFinite(noteOnTime)) return;

    if (!event.params) {
      console.warn('[BassSynthManager] Event is missing synth params:', event);
      return;
    }

    // Извлечение параметров ИЗ СОБЫТИЯ (не генерация!)
    const { cutoff, resonance, distortion, portamento } = event.params;

    // Установка параметров через AudioParam (sample-accurate)
    this.setParam('cutoff', cutoff, noteOnTime);
    this.setParam('resonance', resonance, noteOnTime);
    this.setParam('distortion', distortion, noteOnTime);
    this.setParam('portamento', portamento, noteOnTime);

    // Расчёт частоты
    const freq = 440 * Math.pow(2, (event.note - 69) / 12);
    if (!isFinite(freq)) return;

    // Отправка ноты в ворклет
    this.worklet.port.postMessage({
      type: 'noteOn',
      frequency: freq,
      velocity: this.getVelocity(event.dynamics),
      time: noteOnTime
    });
  }

  // Вспомогательные методы

  private setParam(name: string, value: number, time: number) {
    const param = this.worklet?.parameters.get(name);
    if (param && isFinite(value)) {
      param.setValueAtTime(value, time);
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
