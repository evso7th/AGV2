// public/worklets/bass-processor.js
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    // Параметры больше не управляются извне — всё в событии
    return [];
  }

  constructor() {
    super();
    this.sampleRate = 44100;
    this.activeNotes = new Map(); // { frequency: noteState }
  }

  // Генератор белого шума
  noise() {
    return Math.random() * 2 - 1;
  }

  // Фильтр низких частот
  lowpassFilter(input, cutoff, resonance, state) {
    const g = Math.tan(Math.PI * cutoff / this.sampleRate);
    const r = 1 / resonance;
    const y1 = state.y1;
    const y2 = state.y2;
    const x = input;
    const y = x - r * y1 - y2;
    const y1_new = g * y + y1;
    const y2_new = g * y1_new + y2;
    state.y1 = y1_new;
    state.y2 = y2_new;
    return y2_new;
  }

  // Дисторшн (soft clip)
  softClip(input, drive) {
    if (drive <= 0) return input;
    const k = 2 * drive;
    return (input * (1 + k)) / (1 + k * Math.abs(input));
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    // Генерация звука
    for (let channel = 0; channel < output.length; channel++) {
      const channelData = output[channel];
      for (let i = 0; i < channelData.length; i++) {
        let sample = 0;
        for (const [freq, note] of this.activeNotes) {
          // Основной слой
          const pulse = (note.phase1 % (2 * Math.PI)) < Math.PI ? 1 : -1;
          // Суб-слой (октава ниже)
          const sub = Math.sin(note.phase2 * 0.5);
          // Применение фильтра и дисторшна
          const filtered = this.lowpassFilter(
            pulse + sub * 0.7,
            note.cutoff,
            note.resonance,
            note.filterState
          );
          const distorted = this.softClip(filtered, note.distortion);
          sample += distorted * note.gain;
          note.phase1 += (freq * 2 * Math.PI) / this.sampleRate;
          note.phase2 += (freq * 2 * Math.PI) / this.sampleRate;
        }
        channelData[i] = sample * 0.3;
      }
    }

    // Управление затуханием
    for (const [freq, note] of this.activeNotes) {
      if (note.state === 'decay') {
        note.gain *= 0.995;
        if (note.gain < 0.001) {
          this.activeNotes.delete(freq);
        }
      }
    }

    return true;
  }

  onmessage(event) {
    if (event.data.type === 'noteOn') {
      const { frequency, velocity, params } = event.data;

      // Извлечение параметров ИЗ СОБЫТИЯ
      const {
        cutoff = 400,
        resonance = 0.7,
        distortion = 0.02,
        portamento = 0.0
      } = params;

      // Создание состояния ноты
      this.activeNotes.set(frequency, {
        phase1: 0,
        phase2: 0,
        gain: velocity,
        cutoff,
        resonance,
        distortion,
        portamento,
        state: 'attack',
        filterState: { y1: 0, y2: 0 }
      });
    } else if (event.data.type === 'noteOff') {
      for (const note of this.activeNotes.values()) {
        note.state = 'decay';
      }
    }
  }
}

registerProcessor('bass-processor', BassProcessor);
