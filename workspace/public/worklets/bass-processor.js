// public/worklets/bass-processor.js

/**
 * Преобразует MIDI номер в частоту.
 * @param {number} midi - MIDI номер ноты.
 * @returns {number} Частота в Герцах.
 */
function midiToFreq(midi) {
    return Math.pow(2, (midi - 69) / 12) * 440;
}


class BassProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.sampleRate = options?.processorOptions?.sampleRate || 44100;
        
        // Map для хранения нот, которые должны звучать в данный момент.
        // Ключ - noteId, значение - состояние ноты (фаза, громкость, параметры).
        this.activeNotes = new Map();
        
        // Очередь команд, запланированных на будущее.
        this.commandQueue = [];

        this.port.onmessage = (event) => {
            const messages = event.data;
            if (Array.isArray(messages)) {
                // Добавляем все команды из пакета в очередь
                this.commandQueue.push(...messages);
                // Сортируем очередь по времени, чтобы обрабатывать события в хронологическом порядке.
                this.commandQueue.sort((a, b) => a.when - b.when);
            }
        };

        console.log('[BassProcessor] Ворклет создан и готов к приему команд.');
    }

    // Фильтр низких частот (простая модель)
    applyFilter(input, cutoff, state) {
        const coeff = 1 - Math.exp(-2 * Math.PI * cutoff / this.sampleRate);
        state.y1 = state.y1 + coeff * (input - state.y1);
        return state.y1;
    }

    // Дисторшн (soft clip)
    softClip(input, drive) {
        if (drive <= 0.01) return input;
        const k = 2 * drive / (1 - drive);
        return (1 + k) * input / (1 + k * Math.abs(input));
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];
        const blockEndTime = currentTime + 128 / this.sampleRate;

        // 1. Обработка очереди команд
        while (this.commandQueue.length > 0 && this.commandQueue[0].when <= blockEndTime) {
            const command = this.commandQueue.shift();
            const { type, noteId, when, frequency, velocity, params } = command;
            const timeInBlock = Math.max(0, when - currentTime);
            const sampleIndex = Math.floor(timeInBlock * this.sampleRate);

            if (type === 'noteOn') {
                console.log(`[BassProcessor] Команда NOTE ON для noteId: ${noteId} в ${when.toFixed(4)}`);
                this.activeNotes.set(noteId, {
                    phase: 0,
                    gain: 0, // Начинаем с 0
                    targetGain: velocity,
                    noteId: noteId,
                    state: 'attack',
                    params: params,
                    filterState: { y1: 0 }
                });
            } else if (type === 'noteOff') {
                 console.log(`[BassProcessor] Команда NOTE OFF для noteId: ${noteId} в ${when.toFixed(4)}`);
                const note = this.activeNotes.get(noteId);
                if (note) {
                    note.state = 'release';
                    note.targetGain = 0;
                }
            } else if (type === 'clear') {
                console.log('[BassProcessor] Команда CLEAR');
                this.activeNotes.clear();
            }
        }
        
        // 2. Генерация аудио
        for (let i = 0; i < channel.length; i++) {
            let sample = 0;

            for (const [noteId, note] of this.activeNotes.entries()) {
                // Envelope
                if (note.state === 'attack') {
                    note.gain += 1 / (0.01 * this.sampleRate); // Быстрая атака
                    if (note.gain >= note.targetGain) {
                        note.gain = note.targetGain;
                        note.state = 'sustain';
                    }
                } else if (note.state === 'release') {
                    note.gain -= 1 / (0.3 * this.sampleRate); // Быстрый релиз
                    if (note.gain <= 0) {
                        this.activeNotes.delete(noteId);
                        continue;
                    }
                }

                // Oscillator
                note.phase += (midiToFreq(note.noteId) * 2 * Math.PI) / this.sampleRate;
                if (note.phase > 2 * Math.PI) note.phase -= 2 * Math.PI;
                const oscSample = Math.sin(note.phase); // Простой синус

                // Filter & Distortion
                const cutoff = note.params?.cutoff || 800;
                const filteredSample = this.applyFilter(oscSample, cutoff, note.filterState);
                const drive = note.params?.distortion || 0.1;
                const distortedSample = this.softClip(filteredSample, drive);

                sample += distortedSample * note.gain;
            }

            channel[i] = sample * 0.5; // Общая громкость
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
