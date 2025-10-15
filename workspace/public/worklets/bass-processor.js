// public/worklets/bass-processor.js

// Функция для преобразования MIDI-ноты в частоту.
function midiToFreq(midi) {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options.processorOptions.sampleRate || 44100;
    this.activeNotes = new Map(); // Карта для отслеживания активных нот по их ID
    
    this.port.onmessage = (event) => {
        const messages = event.data;
        // Проверяем, является ли сообщение массивом команд
        if (Array.isArray(messages)) {
            messages.forEach(message => this.handleMessage(message));
        } else {
            this.handleMessage(messages); // Обрабатываем одиночное сообщение для обратной совместимости
        }
    };
  }

  handleMessage(message) {
    const { type, when, noteId } = message;
    
    if (type === 'noteOn') {
      const { frequency, velocity, params } = message;
      this.activeNotes.set(noteId, {
        frequency,
        velocity: velocity ?? 0.7,
        attack: params?.attack ?? 0.02,
        decay: params?.decay ?? 0.2, // Не используется в текущей огибающей, но может пригодиться
        release: params?.release ?? 0.5,
        cutoff: params?.cutoff ?? 800,
        resonance: params?.resonance ?? 0.5,
        distortion: params?.distortion ?? 0.1,
        portamento: params?.portamento ?? 0.0,
        startTime: when,
        phase: 0,
        gain: 0,
        envState: 'attack',
        filterState: { y1: 0, y2: 0, y3: 0, y4: 0, oldx: 0, oldy: 0 }
      });
    } else if (type === 'noteOff') {
        const note = this.activeNotes.get(noteId);
        if (note && note.envState !== 'release') {
            note.envState = 'release';
            note.releaseStartTime = when;
        }
    } else if (type === 'clear') {
        this.activeNotes.clear();
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    
    for (let i = 0; i < channel.length; i++) {
        const now = currentTime + i / this.sampleRate;
        let sample = 0;

        for (const [noteId, note] of this.activeNotes.entries()) {
            // --- Envelope ---
            if (note.envState === 'attack') {
                const attackTime = now - note.startTime;
                note.gain = Math.min(note.velocity, (attackTime / note.attack) * note.velocity);
                if (note.gain >= note.velocity) {
                    note.envState = 'sustain';
                }
            } else if (note.envState === 'release') {
                const releaseTime = now - note.releaseStartTime;
                note.gain = note.velocity * (1 - Math.min(1, releaseTime / note.release));
                if (note.gain <= 0) {
                    this.activeNotes.delete(noteId);
                    continue;
                }
            }

            // --- Oscillator ---
            const pulse = (note.phase < Math.PI) ? 1 : -1;
            const sub = Math.sin(note.phase * 0.5);
            let oscSample = pulse * 0.6 + sub * 0.4;
            
            // --- Filter (A simple but effective one) ---
            const g = Math.tan(Math.PI * note.cutoff / this.sampleRate);
            const r = 1 / note.resonance;
            const h = 1 / (1 + r * g + g * g);
            let band = (oscSample - note.filterState.y2 - r * note.filterState.y1) * h;
            let low = g * band + note.filterState.y1;
            note.filterState.y1 = g * band + low;
            note.filterState.y2 = g * note.filterState.y1 + note.filterState.y2;
            let filteredSample = note.filterState.y2;
            
            // --- Distortion (Soft Clip) ---
            const drive = note.distortion;
            if (drive > 0.01) {
              const k = 2 * drive / (1 - drive);
              filteredSample = (1 + k) * filteredSample / (1 + k * Math.abs(filteredSample));
            }
            
            sample += filteredSample * note.gain;
            
            note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
            if (note.phase > 2 * Math.PI) note.phase -= 2 * Math.PI;
        }

        // Clip the final sample to avoid distortion
        channel[i] = Math.max(-1, Math.min(1, sample * 0.5));
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
