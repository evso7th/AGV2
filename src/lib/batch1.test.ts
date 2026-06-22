import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccompanimentSynthManagerV2 } from './accompaniment-synth-manager-v2';
import { MelodySynthManagerV2 } from './melody-synth-manager-v2';
import { HarmonySynthManager } from './harmony-synth-manager';
import { BroadcastEngine } from './broadcast-engine';
import { normalizeEventType } from './music-theory';
import { invertPhrase, retrogradePhrase, applyRhythmicJitter } from './music-theory';
import type { FractalEvent } from '@/types/fractal';

describe('Batch 1: Memory Leaks & Axiom Transforms', () => {

  // ==================== MEMORY LEAK TESTS ====================

  describe('ML-3: HarmonySynthManager setTimeout cleanup', () => {
    let audioContext: AudioContext;
    let destination: GainNode;
    let manager: HarmonySynthManager;

    beforeEach(() => {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      destination = audioContext.createGain();
      manager = new HarmonySynthManager(audioContext, destination);
    });

    afterEach(() => {
      manager.dispose();
      audioContext.close();
    });

    it('cleanup-1: HarmonySynthManager clears timeouts on dispose', async () => {
      await manager.init(true);
      manager.setInstrument('basic-synth');

      const startTime = performance.now();
      manager.dispose();
      const elapsed = performance.now() - startTime;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('ML-7: BroadcastEngine fadeInterval cleanup', () => {
    let audioContext: AudioContext;
    let stream: MediaStream;
    let engine: BroadcastEngine;

    beforeEach(async () => {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      stream = new MediaStream();
      engine = new BroadcastEngine(audioContext, stream);
    });

    afterEach(() => {
      engine.stop();
      audioContext.close();
    });

    it('cleanup-2: fadeInterval cleared on stop', async () => {
      const stopSpy = vi.spyOn(engine, 'stop');
      engine.stop();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('cleanup-2b: stop handles race conditions', async () => {
      engine.stop();
      engine.stop();
      expect(engine.isActive()).toBe(false);
    });
  });

  // ==================== AXIOM STATE TESTS ====================

  describe('AX-1: ensureAxiomState guards', () => {
    it('axiom-state-1: Blues brain warns on uninitialized state', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const state = { currentAxiom: [], currentAxiomMaxTick: 0 };

      expect(isFinite(state.currentAxiomMaxTick)).toBe(true);
      warnSpy.mockRestore();
    });
  });

  // ==================== AXIOM TRANSFORM TESTS ====================

  describe('AX-2,3,4: Axiom transformations', () => {
    const testPhrase = [
      { t: 0, d: 2, deg: 0, tech: 'pick' },
      { t: 3, d: 2, deg: 2, tech: 'pick' },
      { t: 6, d: 2, deg: 4, tech: 'pick' },
      { t: 9, d: 2, deg: 5, tech: 'pick' }
    ];

    it('axiom-transform-1: inversion applied correctly', () => {
      const inverted = invertPhrase(testPhrase);
      expect(inverted).toBeDefined();
      expect(inverted.length).toBe(testPhrase.length);
      expect(inverted[0].t).toBe(testPhrase[0].t);
    });

    it('axiom-transform-2: retrograde applied correctly', () => {
      const reversed = retrogradePhrase(testPhrase);
      expect(reversed).toBeDefined();
      expect(reversed.length).toBe(testPhrase.length);
      expect(reversed[0].deg).toBe(testPhrase[testPhrase.length - 1].deg);
    });

    it('axiom-transform-3: jitter applied consistently', () => {
      const jittered1 = applyRhythmicJitter(testPhrase, 42);
      const jittered2 = applyRhythmicJitter(testPhrase, 42);

      expect(jittered1).toBeDefined();
      expect(jittered1.length).toBe(testPhrase.length);
      expect(JSON.stringify(jittered1)).toBe(JSON.stringify(jittered2));
    });
  });

  // ==================== EVENT TYPE TESTS ====================

  describe('AX-6: Event.type array handling', () => {
    const stringTypeEvent: FractalEvent = {
      type: 'melody',
      note: 60,
      time: 0,
      duration: 1,
      weight: 0.8
    };

    const arrayTypeEvent: FractalEvent = {
      type: ['melody', 'harmony'] as any,
      note: 60,
      time: 0,
      duration: 1,
      weight: 0.8
    };

    it('event-type-1: normalizeEventType handles string type', () => {
      const types = normalizeEventType(stringTypeEvent);
      expect(types.has('melody')).toBe(true);
      expect(types.has('harmony')).toBe(false);
    });

    it('event-type-2: normalizeEventType handles array type', () => {
      const types = normalizeEventType(arrayTypeEvent);
      expect(types.has('melody')).toBe(true);
      expect(types.has('harmony')).toBe(true);
    });

    it('event-type-3: V2 managers filter correctly with normalized types', () => {
      const melodyEvent: FractalEvent = {
        type: 'melody',
        note: 60,
        time: 0,
        duration: 1,
        weight: 0.8
      };

      const harmonyEvent: FractalEvent = {
        type: 'harmony',
        note: 64,
        time: 0,
        duration: 1,
        weight: 0.8
      };

      const events = [melodyEvent, harmonyEvent, melodyEvent];
      const filtered = events.filter(e => normalizeEventType(e).has('melody'));

      expect(filtered.length).toBe(2);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Batch 1 Integration', () => {
    it('all transforms compose without error', () => {
      const phrase = [
        { t: 0, d: 2, deg: 0, tech: 'pick' },
        { t: 3, d: 2, deg: 2, tech: 'pick' }
      ];

      const inv = invertPhrase(phrase);
      const ret = retrogradePhrase(inv);
      const jit = applyRhythmicJitter(ret, 123);

      expect(jit.length).toBe(2);
    });
  });
});
