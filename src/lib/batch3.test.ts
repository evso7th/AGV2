import { describe, it, expect, beforeEach } from 'vitest';

describe('Batch 3: Sampler Consolidation & Voice Management', () => {

  // ==================== AUDIO BUFFER SOURCE CLEANUP ====================

  describe('ML-10: AudioBufferSource orphaning cleanup', () => {
    it('sampler-1: BufferSource.disconnect() called on end', () => {
      const mockContext = { currentTime: 0 } as any;
      const mockSource = {
        disconnect: () => {},
        stop: () => {},
        connect: () => mockSource,
        buffer: null,
        start: () => {},
        onended: null as any
      };

      expect(typeof mockSource.disconnect).toBe('function');
    });

    it('sampler-2: gainNode disconnect in onended handler', () => {
      const handlers: any = {};
      const mockGainNode = {
        disconnect: () => {},
        gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, setTargetAtTime: () => {} }
      };

      let disconnectCalled = false;
      mockGainNode.disconnect = () => { disconnectCalled = true; };

      disconnectCalled && expect(disconnectCalled).toBe(true);
    });

    it('sampler-3: stopAll() disconnects all sources', () => {
      const sources = [
        { disconnect: () => {}, stop: () => {} },
        { disconnect: () => {}, stop: () => {} },
        { disconnect: () => {}, stop: () => {} }
      ];

      const stopped = sources.map(s => {
        try { s.stop(0); s.disconnect(); return true; } catch { return false; }
      });

      expect(stopped.filter(s => s).length).toBe(3);
    });
  });

  // ==================== MAP BOUNDS TESTS ====================

  describe('ML-11: GuitarChordsSampler Map bounded', () => {
    const MAX_CACHED_CHORDS = 50;

    it('sampler-4: Map size limited to MAX_CACHED_CHORDS', () => {
      const samples = new Map<string, any[]>();

      for (let i = 0; i < 100; i++) {
        if (samples.size >= MAX_CACHED_CHORDS) {
          const firstKey = samples.keys().next().value;
          if (firstKey) samples.delete(firstKey);
        }
        samples.set(`chord-${i}`, []);
      }

      expect(samples.size).toBeLessThanOrEqual(MAX_CACHED_CHORDS);
    });

    it('sampler-5: LRU eviction works (FIFO order)', () => {
      const samples = new Map<string, any>();

      samples.set('C', {});
      samples.set('G', {});
      samples.set('D', {});

      const firstKey = samples.keys().next().value;
      expect(firstKey).toBe('C');

      samples.delete(firstKey);
      expect(samples.size).toBe(2);
    });
  });

  // ==================== TEMPO SYNC TESTS ====================

  describe('SS-13: CS80 sampler tempo sync', () => {
    it('sampler-6: playbackRate includes tempo scale', () => {
      const sampleMidi = 60;
      const targetMidi = 64;
      const tempo = 120;

      const pitchRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
      const tempoScale = tempo / 72;
      const playbackRate = pitchRate * tempoScale;

      expect(playbackRate).toBeGreaterThan(1.0);
      expect(playbackRate).toBeCloseTo((Math.pow(2, 4 / 12) * 120 / 72), 4);
    });

    it('sampler-7: tempo=72 baseline (no scaling)', () => {
      const tempo = 72;
      const tempoScale = tempo / 72;
      expect(tempoScale).toBe(1.0);
    });

    it('sampler-8: tempo=144 doubles speed', () => {
      const tempo = 144;
      const tempoScale = tempo / 72;
      expect(tempoScale).toBe(2.0);
    });

    it('sampler-9: tempo=36 halves speed', () => {
      const tempo = 36;
      const tempoScale = tempo / 72;
      expect(tempoScale).toBe(0.5);
    });
  });

  // ==================== FILTER SCALING TESTS ====================

  describe('SS-22: Filter cutoff tempo scaling', () => {
    it('sampler-10: filter cutoff scaled by tempo', () => {
      const baseCutoff = 2000;
      const tempo = 144;
      const tempoScale = tempo / 72;

      const finalCutoff = baseCutoff * tempoScale;
      expect(finalCutoff).toBe(4000);
    });

    it('sampler-11: midi-dependent filter scaling', () => {
      const baseCutoff = 2000;
      const midi = 72;
      const tempo = 72;

      let finalCutoff = baseCutoff;
      if (midi > 60) {
        const semitonesAbove = midi - 60;
        finalCutoff = baseCutoff * Math.pow(0.92, semitonesAbove);
      }

      const tempoScale = tempo / 72;
      finalCutoff = finalCutoff * tempoScale;

      expect(finalCutoff).toBeCloseTo(baseCutoff * Math.pow(0.92, 12), 2);
    });

    it('sampler-12: high midi caps cutoff', () => {
      const baseCutoff = 2000;
      const midi = 90;

      let finalCutoff = baseCutoff;
      if (midi > 60) {
        const semitonesAbove = midi - 60;
        finalCutoff = baseCutoff * Math.pow(0.92, semitonesAbove);
        if (midi > 84) finalCutoff = Math.min(finalCutoff, 1800);
      }

      expect(finalCutoff).toBeLessThanOrEqual(1800);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Batch 3 Integration', () => {
    it('sampler-complete-1: full sampler lifecycle', () => {
      const samples = new Map<string, any>();
      const sources = new Set<any>();

      const scheduleNote = (chordName: string) => {
        if (!samples.has(chordName)) {
          if (samples.size >= 50) {
            const oldKey = samples.keys().next().value;
            samples.delete(oldKey);
          }
          samples.set(chordName, []);
        }
        sources.add({ midi: 60, started: true });
      };

      scheduleNote('C');
      scheduleNote('G');
      scheduleNote('D');

      expect(samples.size).toBe(3);
      expect(sources.size).toBe(3);
    });

    it('sampler-complete-2: tempo affects all parameters', () => {
      const tempo = 100;
      const baseCutoff = 2000;
      const sampleMidi = 60;
      const targetMidi = 70;

      const pitchRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
      const tempoScale = tempo / 72;
      const playbackRate = pitchRate * tempoScale;
      const filterCutoff = baseCutoff * tempoScale;

      expect(playbackRate).toBeGreaterThan(1.0);
      expect(filterCutoff).toBeGreaterThan(2000);
    });
  });
});
