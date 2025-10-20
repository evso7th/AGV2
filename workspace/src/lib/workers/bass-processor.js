
// public/worklets/bass-processor.js

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.sampleRate = options.processorOptions.sampleRate;
    
    // Карта для хранения активных нот. Ключ - ID ноты.
    // Значение - объект с параметрами ноты.
    this.activeNotes = new Map();

    this.port.onmessage = (event) => {
        // Теперь мы можем получать массив сообщений, но для надежности обработаем и одиночные
        const messages = Array.isArray(event.data) ? event.data : [event.data];
        messages.forEach(message => this.handleMessage(message));
    };
    console.log('[BassProcessor] Worklet created and ready.');
  }

  handleMessage(message) {
    const { type, when, noteId } = message;

    if (type === 'noteOn') {
      const { frequency, velocity, params } = message;
      // Добавляем ноту в карту активных. Она еще не звучит, просто "запланирована".
      this.activeNotes.set(noteId, {
        state: 'scheduled',
        startTime: when,
        endTime: Infinity, // Пока не знаем, когда закончится
        phase: 0,
        gain: 0,
        targetGain: velocity,
        frequency: frequency,
        params: params || { cutoff: 500, resonance: 0.5, distortion: 0.1 }, // Параметры по-умолчанию
        filterState: { y1: 0, y2: 0, oldx: 0, oldy: 0 },
      });
      // console.log(`[Worklet] Scheduled noteOn: id=${noteId}, time=${when.toFixed(3)}`);

    } else if (type === 'noteOff') {
       const note = this.activeNotes.get(noteId);
       if (note) {
         // Устанавливаем время окончания. Нота перейдет в 'decay' в цикле process.
         note.endTime = when;
         // console.log(`[Worklet] Scheduled noteOff: id=${noteId}, time=${when.toFixed(3)}`);
       }
    } else if (type === 'clear') {
        this.activeNotes.clear();
        console.log('[Worklet] All notes cleared.');
    }
  }
  
  applyFilter(input, cutoff, resonance, state) {
    const g = Math.tan(Math.PI * cutoff / this.sampleRate);
    const r = 1 / resonance;
    const h = 1 / (1 + r * g + g * g);

    let band = (input - state.y2 - r * state.y1) * h;
    let low = g * band + state.y1;
    state.y1 = g * band + low;
    state.y2 = g * state.y1 + state.y2;
    
    return state.y2;
  }

  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    for (let i = 0; i < output[0].length; i++) {
      const now = currentTime + i / this.sampleRate;
      let sample = 0;

      for (const [noteId, note] of this.activeNotes.entries()) {
        // Проверяем, не пора ли начать играть ноту
        if (note.state === 'scheduled' && now >= note.startTime) {
          note.state = 'attack';
          // console.log(`[Worklet] Playing note: id=${noteId} at time ${now.toFixed(3)}`);
        }
        
        // Проверяем, не пора ли отпустить ноту
        if (note.state !== 'decay' && now >= note.endTime) {
            note.state = 'decay';
            note.targetGain = 0; // Цель - затухание до нуля
            // console.log(`[Worklet] Decaying note: id=${noteId} at time ${now.toFixed(3)}`);
        }

        if (note.state === 'attack' || note.state === 'sustain' || note.state === 'decay') {
            // --- Огибающая (Envelope) ---
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
                    this.activeNotes.delete(noteId); // Удаляем ноту после затухания
                    continue; // Переходим к следующей ноте
                }
            }
            
            // --- Осциллятор ---
            note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
            if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

            const osc1 = (note.phase < Math.PI) ? 1 : -1; // Pulse wave
            const osc2 = Math.sin(note.phase * 0.5); // Sine wave (sub-osc)

            // --- Фильтр и Дисторшн ---
            const filtered = this.applyFilter(osc1 + osc2 * 0.7, note.params.cutoff, note.params.resonance, note.filterState);
            const distorted = this.softClip(filtered, note.params.distortion);

            sample += distorted * note.gain;
        }
      }
      
      // Записываем сэмпл в оба канала для стерео
      output[0][i] = sample * 0.3; // Снижаем общую громкость, чтобы избежать клиппинга
      if (output[1]) {
        output[1][i] = sample * 0.3;
      }
    }

    return true; // Keep the processor alive
  }
}

registerProcessor('bass-processor', BassProcessor);
