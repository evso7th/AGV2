// public/worklets/bass-processor.js

/**
 * Преобразует MIDI-ноту в частоту.
 * @param {number} midi - MIDI-нота.
 * @returns {number} Частота в Гц.
 */
function midiToFreq(midi) {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

class BassProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super();
    this.sampleRate = options.processorOptions.sampleRate || 44100;
    
    // Каждая активная нота хранится по своему noteId
    // { phase, gain, state, params, noteOffTime }
    this.activeNotes = new Map();

    this.port.onmessage = (event) => {
        const messages = event.data;
        if (!Array.isArray(messages)) {
            // Поддержка одиночных сообщений для отладки
            this.handleMessage(messages);
        } else {
            messages.forEach(message => this.handleMessage(message));
        }
    };
  }
  
  handleMessage(message) {
    const { type, when, noteId, velocity, params } = message;

    if (type === 'noteOn') {
        this.activeNotes.set(noteId, {
            phase: 0,
            gain: 0, // Начинаем с 0 для атаки
            targetGain: velocity,
            state: 'attack',
            params: params || { cutoff: 500, resonance: 0.5, distortion: 0.1, portamento: 0 },
            startTime: when,
            noteOffTime: Infinity, // Пока не знаем когда закончится
        });
    } else if (type === 'noteOff') {
        const note = this.activeNotes.get(noteId);
        if (note && note.state !== 'release') {
            note.state = 'release';
            note.noteOffTime = when; // Запоминаем время начала затухания
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
            if (now < note.startTime) continue; // Нота еще не началась
            
            // --- Огибающая (Envelope) ---
            const attackTime = 0.01; 
            const releaseTime = note.params.portamento > 0 ? 0.5 : 0.2; // Более длинный релиз для легато

            if (note.state === 'attack') {
                const elapsed = now - note.startTime;
                note.gain = Math.min(note.targetGain, note.targetGain * (elapsed / attackTime));
                if (elapsed >= attackTime) {
                    note.state = 'sustain';
                }
            } else if (note.state === 'sustain' && now >= note.noteOffTime) {
                 note.state = 'release';
                 note.releaseStartTime = note.noteOffTime;
                 note.releaseStartGain = note.gain;
            }

            if (note.state === 'release') {
                 const elapsed = now - note.releaseStartTime;
                 note.gain = note.releaseStartGain * (1 - Math.min(1, elapsed / releaseTime));
                 if (note.gain <= 0) {
                     this.activeNotes.delete(noteId);
                     continue; // Переходим к следующей ноте
                 }
            }

            if (note.gain > 0) {
                const freq = midiToFreq(noteId);
                
                // --- Осциллятор (Oscillator) ---
                const osc = Math.sin(note.phase); // Простой синус
                note.phase += (freq * 2 * Math.PI) / this.sampleRate;
                if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

                // В этом простом примере не используем фильтр и дисторшн для стабильности
                sample += osc * note.gain;
            }
        }
        
        // Простое клиппирование, чтобы избежать искажений
        channel[i] = Math.max(-1, Math.min(1, sample * 0.5));
    }

    return true; // Важно возвращать true, чтобы процессор продолжал работать
  }
}

registerProcessor('bass-processor', BassProcessor);
