// public/worklets/bass-processor.js

/**
 * Преобразование MIDI-ноты в частоту (Гц).
 * @param {number} midi - MIDI-нота (e.g., 69 for A4)
 * @returns {number} Frequency in Hz.
 */
function midiToFreq(midi) {
  return Math.pow(2, (midi - 69) / 12) * 440;
}

/**
 * BassProcessor - это AudioWorklet-процессор, отвечающий за синтез басового звука.
 * Он работает в отдельном, высокоприоритетном аудиопотоке для минимизации задержек и артефактов.
 *
 * Архитектура:
 * - Управляется сообщениями: Вся логика (включение/выключение нот, смена параметров)
 *   инициируется сообщениями из основного потока.
 * - Управление по Note ID: Каждая нота имеет уникальный ID, что позволяет точно
 *   контролировать её жизненный цикл (атака, затухание) и предотвращает "зависшие" ноты.
 * - Простой субтрактивный синтез: Два осциллятора (pulse, sine) и фильтр нижних частот (LPF)
 *   для создания классического басового тембра.
 * - ADSR-огибающая: Каждая нота имеет свою собственную огибающую для управления громкостью.
 */
class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options?.processorOptions?.sampleRate || 44100;
    
    // Map для хранения состояния каждой активной ноты { noteId => noteState }
    this.activeNotes = new Map();
    
    this.port.onmessage = (event) => {
        const messages = event.data;
        if (!Array.isArray(messages)) {
            this.handleMessage(messages);
        } else {
            messages.forEach(message => this.handleMessage(message));
        }
    };
  }

  handleMessage(message) {
    const { type, noteId, when, ...params } = message;
    const timeInSamples = (when - currentTime) * this.sampleRate;

    switch (type) {
      case 'noteOn': {
        this.activeNotes.set(noteId, {
          frequency: params.frequency,
          velocity: params.velocity,
          attack: params.params?.attack || 0.01,
          release: params.params?.release || 0.3,
          cutoff: params.params?.cutoff || 800,
          resonance: params.params?.resonance || 0.5,
          distortion: params.params?.distortion || 0.1,
          phase1: 0,
          phase2: 0,
          gain: 0,
          state: 'attack',
          // Состояние фильтра для каждой ноты, чтобы избежать конфликтов
          filterState: { y1: 0, y2: 0, oldx: 0, oldy: 0 }
        });
        break;
      }
      case 'noteOff': {
        const note = this.activeNotes.get(noteId);
        if (note) {
          note.state = 'release';
          // Устанавливаем время затухания, если оно пришло в сообщении noteOff
          if (params.release) {
            note.release = params.release;
          }
        }
        break;
      }
      case 'clear': {
        this.activeNotes.forEach(note => note.state = 'release');
        break;
      }
    }
  }

  // Фильтр нижних частот (простая реализация)
  applyLowPassFilter(input, cutoff, resonance, state) {
    const g = Math.tan(Math.PI * cutoff / this.sampleRate);
    const r = 1 / (resonance + 0.001); // avoid division by zero
    const h = 1 / (1 + r * g + g * g);

    let band = (input - state.y2 - r * state.y1) * h;
    if (isNaN(band)) band = 0; // Защита от NaN

    let low = g * band + state.y1;
    state.y1 = g * band + low; 
    state.y2 = g * state.y1 + state.y2;
    
    return state.y2;
  }

  // Дисторшн (soft clipping)
  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    for (let i = 0; i < output[0].length; i++) {
      let sample = 0;

      for (const [noteId, note] of this.activeNotes.entries()) {
          // --- Огибающая (ADSR) ---
          if (note.state === 'attack') {
              note.gain += 1.0 / (note.attack * this.sampleRate);
              if (note.gain >= note.velocity) {
                  note.gain = note.velocity;
                  note.state = 'sustain';
              }
          } else if (note.state === 'release') {
              note.gain -= 1.0 / (note.release * this.sampleRate);
              if (note.gain <= 0) {
                  this.activeNotes.delete(noteId);
                  continue; 
              }
          }
          
          // --- Осцилляторы ---
          const freq = note.frequency;
          // Основной слой (pulse-like)
          const osc1 = Math.sign(Math.sin(note.phase1));
          // Суб-слой (sine на октаву ниже)
          const osc2 = Math.sin(note.phase2 * 0.5);

          note.phase1 += (freq * 2 * Math.PI) / this.sampleRate;
          if (note.phase1 > 2 * Math.PI) note.phase1 -= 2 * Math.PI;
          
          note.phase2 += (freq * 2 * Math.PI) / this.sampleRate;
          if (note.phase2 > 2 * Math.PI) note.phase2 -= 2 * Math.PI;

          let mixedSignal = osc1 * 0.6 + osc2 * 0.4;
          
          // --- Фильтр и дисторшн ---
          let filtered = this.applyLowPassFilter(mixedSignal, note.cutoff, note.resonance, note.filterState);
          let distorted = this.softClip(filtered, note.distortion);

          sample += distorted * note.gain;
      }
      
      // Запись в каналы
      for (let channel = 0; channel < output.length; channel++) {
        // Ограничиваем сигнал, чтобы избежать клиппинга
        output[channel][i] = Math.max(-1, Math.min(1, sample * 0.5));
      }
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
