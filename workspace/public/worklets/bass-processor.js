// public/worklets/bass-processor.js

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.sampleRate = options.processorOptions.sampleRate;
    this.activeNotes = new Map();

    this.port.onmessage = (event) => {
      const messages = event.data;
      if (!Array.isArray(messages)) return;
      messages.forEach(message => this.handleMessage(message));
    };
    console.log('[BassProcessor] Worklet created and ready.');
  }

  handleMessage(message) {
    const { type, when, noteId } = message;

    if (type === 'noteOn') {
      const { frequency, velocity, params } = message;
      this.activeNotes.set(noteId, {
        state: 'scheduled',
        startTime: when,
        endTime: Infinity,
        phase: 0,
        gain: 0,
        targetGain: velocity,
        frequency: frequency,
        // Сохраняем индивидуальные параметры для каждой ноты
        params: params || { cutoff: 500, resonance: 0.5, distortion: 0.1 }, 
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
  
  applyFilter(input, cutoff, resonance, state) {
    // Простой, но эффективный one-pole low-pass filter
    const g = Math.tan(Math.PI * cutoff / this.sampleRate);
    const r = 1 / resonance;
    const h = 1 / (1 + r * g + g * g);

    let band = (input - state.y2 - r * state.y1) * h;
    let low = g * band + state.y1;
    state.y1 = g * band + low;
    state.y2 = g * state.y1 + state.y2;
    
    // Возвращаем low-pass выход
    return state.y2;
  }

  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    // Формула для мягкого клиппинга, предотвращающая жесткие искажения
    const output = (1 + k) * input / (1 + k * Math.abs(input));
    // Дополнительное ослабление, чтобы компенсировать увеличение громкости
    return output / (1 + drive * 0.5); 
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    for (let i = 0; i < output[0].length; i++) {
      const now = currentTime + i / this.sampleRate;
      let sample = 0;

      for (const [noteId, note] of this.activeNotes.entries()) {
        // Проверка времени начала/окончания ноты
        if (note.state === 'scheduled' && now >= note.startTime) {
          note.state = 'attack';
        }
        
        if (note.state !== 'decay' && now >= note.endTime) {
            note.state = 'decay';
            note.targetGain = 0; 
        }

        if (note.state === 'attack' || note.state === 'sustain' || note.state === 'decay') {
            // --- Огибающая (Envelope) ---
            if (note.state === 'attack') {
                note.gain += 1 / (0.01 * this.sampleRate); // Быстрая атака (10ms)
                if (note.gain >= note.targetGain) {
                    note.gain = note.targetGain;
                    note.state = 'sustain';
                }
            } else if (note.state === 'decay') {
                note.gain -= 1 / (0.3 * this.sampleRate); // Быстрое затухание (300ms)
                if (note.gain <= 0) {
                    this.activeNotes.delete(noteId);
                    continue; 
                }
            }
            
            // --- Осциллятор ---
            note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
            if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

            const osc1 = (note.phase < Math.PI) ? 1 : -1; // Pulse wave
            const osc2 = Math.sin(note.phase * 0.5);     // Sine wave (sub-osc)

            // --- Фильтр и Дисторшн (с использованием индивидуальных `params`) ---
            const filtered = this.applyFilter(osc1 + osc2 * 0.7, note.params.cutoff, note.params.resonance, note.filterState);
            const distorted = this.softClip(filtered, note.params.distortion);

            sample += distorted * note.gain;
        }
      }
      
      // Записываем сэмпл в оба канала для стерео
      output[0][i] = sample * 0.3; // Снижаем общую громкость
      output[1][i] = sample * 0.3;
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
