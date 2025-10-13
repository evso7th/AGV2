// public/worklets/bass-processor.js
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 400, minValue: 50, maxValue: 2000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.05, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0, minValue: 0, maxValue: 0.1 }
    ];
  }

  constructor() {
    super();
    this.sampleRate = 44100;
    this.activeNotes = new Map(); // { frequency: { phase1, phase2, gain1, gain2, targetFreq, startTime } }
    this.lastFreq = 0;
    this.portamentoTime = 0;
    this.portamentoTarget = 0;
    this.portamentoStartFreq = 0;
    this.portamentoStartTime = 0;

    this.port.onmessage = (event) => {
        const messages = event.data;
        if (!Array.isArray(messages)) return;

        messages.forEach(message => this.handleMessage(message));
    };
  }

  handleMessage(message) {
    const { type, frequency, velocity, when, noteId } = message;

    if (type === 'noteOn') {
      if (this.activeNotes.size > 0 && this.portamentoTime > 0) {
        this.portamentoTarget = frequency;
        this.portamentoStartFreq = this.lastFreq; // Use the last frequency as the start
        this.portamentoStartTime = when;
      } else {
        this.portamentoStartFreq = frequency;
        this.portamentoTarget = frequency;
        this.lastFreq = frequency;
      }

      this.activeNotes.set(noteId, {
        phase1: 0,
        phase2: 0,
        gain: velocity,
        state: 'attack',
        startTime: when,
        filterState: { y1: 0, y2: 0, y3: 0, y4: 0, oldx: 0, oldy: 0 }
      });
    } else if (type === 'noteOff') {
        const note = this.activeNotes.get(noteId);
        if (note) {
            note.state = 'decay';
        }
    } else if (type === 'setTechnique') {
        // This is a placeholder for future implementation
    } else if (type === 'clear') {
        this.activeNotes.clear();
    }
  }


  // Генератор белого шума для дисторшна
  noise() {
    return Math.random() * 2 - 1;
  }

  // Фильтр низких частот (упрощённый state-variable)
  lowpassFilter(input, cutoff, resonance, state) {
    const g = Math.tan(Math.PI * cutoff / this.sampleRate);
    const r = 1 / resonance;
    const h = 1 / (1 + r * g + g * g);

    let band = (input - state.y2 - r * state.y1) * h;
    let low = g * band + state.y1;
    state.y1 = g * band + low; // y1_new
    state.y2 = g * state.y1 + state.y2; // y2_new
    
    return state.y2;
  }


  // Дисторшн (soft clip)
  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const cutoffParam = parameters.cutoff;
    const resonanceParam = parameters.resonance;
    const distortionParam = parameters.distortion;
    const portamentoParam = parameters.portamento;

    this.portamentoTime = portamentoParam[0];

    // Генерация звука
    for (let channel = 0; channel < output.length; channel++) {
      const channelData = output[channel];
      for (let i = 0; i < channelData.length; i++) {
        let sample = 0;
        const now = currentTime + i / this.sampleRate;

        // Все активные ноты
        for (const [noteId, note] of this.activeNotes.entries()) {
          
          let currentFreq = noteIdToFreq(noteId); // Base frequency

          if (this.portamentoTime > 0 && note.startTime === this.portamentoStartTime) {
              const t = Math.min((now - this.portamentoStartTime) / this.portamentoTime, 1);
              currentFreq = this.portamentoStartFreq * (1 - t) + this.portamentoTarget * t;
              this.lastFreq = currentFreq;
          }

          // Основной слой (pulse)
          const pulse = (note.phase1 % (2 * Math.PI)) < Math.PI ? 1 : -1;
          // Суб-слой (sine на октаву ниже)
          const sub = Math.sin(note.phase2 * 0.5);

          // Применение фильтра
          const filtered = this.lowpassFilter(pulse + sub * 0.7, cutoffParam[0], resonanceParam[0], note.filterState);

          // Дисторшн
          const distorted = this.softClip(filtered, distortionParam[0]);

          sample += distorted * note.gain;
          note.phase1 += (currentFreq * 2 * Math.PI) / this.sampleRate;
          note.phase2 += (currentFreq * 2 * Math.PI) / this.sampleRate;
        }

        channelData[i] = sample * 0.3; // общий уровень
      }
    }

    // Управление затуханием нот
    for (const [noteId, note] of this.activeNotes) {
      if (note.state === 'decay') {
        note.gain *= 0.999;
        if (note.gain < 0.0001) {
          this.activeNotes.delete(noteId);
        }
      }
    }

    return true;
  }
}

function noteIdToFreq(noteId) {
    return 440 * Math.pow(2, (noteId - 69) / 12);
}

registerProcessor('bass-processor', BassProcessor);
