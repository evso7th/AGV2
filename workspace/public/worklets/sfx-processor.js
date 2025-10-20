// public/worklets/sfx-processor.js

/**
 * Многослойный субтрактивный синтезатор для SFX, работающий в AudioWorklet.
 * Архитектура "Исполнитель".
 * - Поддерживает до 3 осцилляторов на ноту.
 * - Имеет общий фильтр и дисторшн для всех слоев ноты.
 * - Управляется через postMessage, принимая массивы команд noteOn/noteOff.
 */
class SfxProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.sampleRate = options.processorOptions.sampleRate;
    this.activeNotes = new Map();
    this.port.onmessage = (event) => {
      const messages = Array.isArray(event.data) ? event.data : [event.data];
      messages.forEach(message => this.handleMessage(message));
    };
    console.log('[SFXProcessor] Multi-oscillator worklet created and ready.');
  }

  handleMessage(message) {
    const { type, when, noteId, params } = message;

    if (type === 'noteOn') {
      const { frequency, velocity, oscillators, distortion } = params;
      this.activeNotes.set(noteId, {
        state: 'scheduled',
        startTime: when,
        endTime: Infinity,
        phase: [0, 0, 0], // Фаза для каждого из 3-х осцилляторов
        gain: 0,
        targetGain: velocity,
        frequency: frequency,
        params: params,
        oscillators: oscillators || [{ type: 'sine', detune: 0 }],
        distortion: distortion || 0,
        filterState: { y1: 0, y2: 0, oldx: 0, oldy: 0 },
      });
    } else if (type === 'noteOff') {
      const note = this.activeNotes.get(noteId);
      if (note) {
        note.endTime = when;
      }
    } else if (type === 'clear') {
      this.activeNotes.clear();
    }
  }
  
  // Low-pass filter (one-pole)
  applyFilter(input, cutoff, resonance, state) {
    const g = Math.tan(Math.PI * cutoff / this.sampleRate);
    const r = 1 / (resonance || 1); // Ensure resonance is not zero
    const h = 1 / (1 + r * g + g * g);
    let band = (input - state.y2 - r * state.y1) * h;
    let low = g * band + state.y1;
    state.y1 = g * band + low;
    state.y2 = g * state.y1 + state.y2;
    return state.y2;
  }
  
  // Soft-clipping distortion
  softClip(input, drive) {
      if (drive <= 0.01) return input;
      const k = 2 * drive / (1 - Math.min(drive, 0.99));
      return (1 + k) * input / (1 + k * Math.abs(input));
  }

  generateOscillator(type, phase) {
      switch (type) {
          case 'sine': return Math.sin(phase);
          case 'triangle': return 1 - 4 * Math.abs((phase / (2 * Math.PI)) - 0.5);
          case 'square': return phase < Math.PI ? 1 : -1;
          case 'sawtooth': return 1 - (phase / Math.PI);
          default: return Math.sin(phase);
      }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const leftChannel = output[0];
    const rightChannel = output.length > 1 ? output[1] : leftChannel;

    for (let i = 0; i < leftChannel.length; i++) {
      const now = currentTime + i / this.sampleRate;
      let mixedSample = 0;

      for (const [noteId, note] of this.activeNotes.entries()) {
        if (note.state === 'scheduled' && now >= note.startTime) {
          note.state = 'attack';
        }
        
        if (note.state !== 'decay' && now >= note.endTime) {
          note.state = 'decay';
          note.targetGain = 0;
        }

        if (note.state === 'attack' || note.state === 'sustain' || note.state === 'decay') {
            const attackTime = note.params.attack || 0.01;
            const releaseTime = note.params.release || 0.3;

            if (note.state === 'attack') {
                note.gain += 1 / (attackTime * this.sampleRate);
                if (note.gain >= note.targetGain) {
                    note.gain = note.targetGain;
                    note.state = 'sustain';
                }
            } else if (note.state === 'decay') {
                note.gain -= 1 / (releaseTime * this.sampleRate);
                if (note.gain <= 0) {
                    this.activeNotes.delete(noteId);
                    continue;
                }
            }
            
            let oscSample = 0;
            // --- Multi-oscillator synthesis ---
            for(let j = 0; j < note.oscillators.length; j++) {
                const osc = note.oscillators[j];
                const detunedFreq = note.frequency * Math.pow(2, (osc.detune || 0) / 1200);

                note.phase[j] += (detunedFreq * 2 * Math.PI) / this.sampleRate;
                if (note.phase[j] >= 2 * Math.PI) note.phase[j] -= 2 * Math.PI;

                oscSample += this.generateOscillator(osc.type, note.phase[j]);
            }
            oscSample /= note.oscillators.length; // Normalize

            // --- Filtering and Distortion ---
            const filtered = this.applyFilter(oscSample, note.params.cutoff, note.params.resonance, note.filterState);
            const distorted = this.softClip(filtered, note.distortion);

            mixedSample += distorted * note.gain;
        }
      }
      
      const finalSample = mixedSample * 0.3;
      leftChannel[i] = finalSample;
      if (rightChannel) {
        rightChannel[i] = finalSample;
      }
    }
    return true;
  }
}

registerProcessor('sfx-processor', SfxProcessor);