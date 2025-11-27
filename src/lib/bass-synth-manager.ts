// src/lib/bass-synth-manager.ts
import type { FractalEvent, BassInstrument } from '@/types/fractal';
import type { BassTechnique } from '@/types/music';
import { PRESETS, PresetOptions } from './presets';

function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

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
  private activePresetParams: PresetOptions | null = PRESETS['classic-bass'];

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  async init() {
    if (this.isInitialized) return;
    try {
      await this.ctx.audioWorklet.addModule('/worklets/bass-processor.js');
      this.worklet = new AudioWorkletNode(this.ctx, 'bass-processor', {
         processorOptions: { sampleRate: this.ctx.sampleRate }
      });
      this.worklet.connect(this.destination);
      this.isInitialized = true;
      console.log('[BassSynthManager] Initialized');
    } catch (e) {
      console.error('[BassSynthManager] Failed to init:', e);
    }
  }

  /**
   * Воспроизводит массив событий баса.
   * Время в событиях - ОТНОСИТЕЛЬНОЕ (доли такта).
   * barStartTime - АБСОЛЮТНОЕ время начала текущего такта.
   */
  public play(events: FractalEvent[], barStartTime: number, tempo: number) {
    if (!this.isInitialized || !this.worklet) {
      console.warn('[BassSynthManager] Not ready, skipping events');
      return;
    }
    
    const beatDuration = 60 / tempo;
    const messages: any[] = [];

    for (const event of events) {
      if (event.type !== 'bass') continue;

      const frequency = midiToFreq(event.note);
      if (!isFinite(frequency)) {
          console.error(`[BassMan] Invalid frequency for MIDI note ${event.note}`);
          continue;
      }
      
      const noteOnTime = barStartTime + (event.time * beatDuration);
      const noteOffTime = noteOnTime + (event.duration * beatDuration);

      if (!isFinite(noteOnTime) || !isFinite(noteOffTime)) {
          console.warn('[BassSynthManager] Non-finite time in event:', event);
          continue;
      }
      
      const noteId = `${noteOnTime.toFixed(4)}-${event.note}`;
      
      messages.push({
          type: 'noteOn',
          frequency,
          velocity: event.weight,
          when: noteOnTime,
          noteId: noteId,
          // Use event-specific params if available, otherwise fall back to the active preset.
          params: event.params || this.activePresetParams
      });

      messages.push({
          type: 'noteOff',
          noteId: noteId,
          when: noteOffTime
      });
    }

    if(messages.length > 0) {
        this.worklet.port.postMessage(messages);
    }
  }
  
  public setVolume(volume: number) {
      if (this.destination instanceof GainNode) {
          this.destination.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.01);
      }
  }
  
  public allNotesOff() {
      if (!this.worklet) return;
      this.worklet.port.postMessage([{ type: 'clear' }]);
  }

  public setPreset(instrumentName: BassInstrument) {
      const preset = PRESETS[instrumentName];
      if (preset) {
        this.activePresetParams = preset;
        console.log(`[BassSynthManager] Preset set to: ${instrumentName}`);
      } else {
        console.warn(`[BassSynthManager] Preset not found: ${instrumentName}`);
      }
  }

  public setTechnique(technique: BassTechnique) {
    // No-op в этой версии, так как параметры приходят с событием
  }
  
  public stop() {
    this.allNotesOff();
  }
}
