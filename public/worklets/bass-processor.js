// public/worklets/bass-processor.js

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.sampleRate = options.processorOptions.sampleRate || 44100;
    
    this.activeNotes = new Map(); // key: noteId, value: noteState

    this.port.onmessage = (event) => {
      const messages = event.data;
      if (Array.isArray(messages)) {
        messages.forEach(message => this.handleMessage(message));
      }
    };
    console.log('[BassProcessor] Worklet создан и готов к приему команд.');
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
        // Сохраняем параметры синтеза для этой конкретной ноты
        params: params || { cutoff: 500, resonance: 0.5, distortion: 0.1 },
        // Уникальное состояние фильтра для каждой ноты
        filterState: { y1: 0, y2: 0, oldx: 0, oldy: 0 },
      });
      //console.log(`[Worklet] Запланирован noteOn: id=${noteId}, time=${when.toFixed(3)}`);

    } else if (type === 'noteOff') {
       const note = this.activeNotes.get(noteId);
       if (note) {
         note.endTime = when;
        // console.log(`[Worklet] Запланирован noteOff: id=${noteId}, time=${when.toFixed(3)}`);
       }
    } else if (type === 'clear') {
        this.activeNotes.clear();
       // console.log('[Worklet] Все ноты очищены.');
    }
  }
  
  applyFilter(input, cutoff, resonance, state) {
    const g = Math.tan(Math.PI * cutoff / this.sampleRate);
    const r = 1 / resonance;
    const h = 1 / (1 + r * g + g * g);

    let band = (input - state.y2 - r * state.y1) * h;
    let low = g * band + state.y1;
    state.y1 = g * band + low; // y1 (band-pass)
    state.y2 = g * state.y1 + state.y2; // y2 (low-pass)
    
    return state.y2;
  }

  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  process(inputs, outputs, parameters) {
    const outputChannel = outputs[0][0];

    for (let i = 0; i < outputChannel.length; i++) {
      const now = currentTime + i / this.sampleRate;
      let sample = 0;

      for (const [noteId, note] of this.activeNotes.entries()) {
        // Проверяем, не пора ли начать играть ноту
        if (note.state === 'scheduled' && now >= note.startTime) {
          note.state = 'attack';
           //console.log(`[Worklet] Play: id=${noteId} at ${now.toFixed(3)}`);
        }
        
        // Проверяем, не пора ли отпустить ноту
        if (note.state !== 'decay' && now >= note.endTime) {
            note.state = 'decay';
            note.targetGain = 0; // Цель - затухание до нуля
           // console.log(`[Worklet] Decay: id=${noteId} at ${now.toFixed(3)}`);
        }

        if (note.state === 'attack' || note.state === 'sustain' || note.state === 'decay') {
            // --- Огибающая (Envelope) ---
            if (note.state === 'attack') {
                note.gain += 1 / (0.01 * this.sampleRate); // Быстрая атака
                if (note.gain >= note.targetGain) {
                    note.gain = note.targetGain;
                    note.state = 'sustain';
                }
            } else if (note.state === 'decay') {
                note.gain -= 1 / (0.3 * this.sampleRate); // Быстрое затухание
                if (note.gain <= 0) {
                    this.activeNotes.delete(noteId); // Удаляем ноту после затухания
                   // console.log(`[Worklet] Deleted: id=${noteId}`);
                    continue; // Переходим к следующей ноте
                }
            }
            
            // --- Осциллятор ---
            note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
            if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

            const osc1 = (note.phase < Math.PI) ? 1 : -1; // Pulse wave
            const osc2 = Math.sin(note.phase * 0.5); // Sine wave (sub-osc)

            // --- Фильтр и Дисторшн (используем параметры ноты) ---
            const filtered = this.applyFilter(osc1 + osc2 * 0.7, note.params.cutoff, note.params.resonance, note.filterState);
            const distorted = this.softClip(filtered, note.params.distortion);

            sample += distorted * note.gain;
        }
      }
      
      // Записываем сэмпл в канал, избегая клиппинга
      outputChannel[i] = Math.max(-1, Math.min(1, sample * 0.4));
    }

    return true; // Keep the processor alive
  }
}

registerProcessor('bass-processor', BassProcessor);
