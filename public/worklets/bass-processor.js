
/**
 * "Пароходная труба" - простейший AudioWorklet-синтезатор.
 * Его единственная задача - проигрывать синусоиду в указанное время.
 * Никаких фильтров, эффектов и сложных техник. Максимально тупой и надежный.
 */
class SimpleSynthProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Каждая нота (по частоте) имеет свой собственный осциллятор и огибающую.
        this.notes = new Map(); // Map<frequency, { phase: number, gain: number, state: 'attack'|'decay'|'sustain'|'release' }>
        
        this.port.onmessage = (event) => {
            const { type, frequency, when, velocity } = event.data;
            const now = currentTime;

            if (type === 'noteOn') {
                if (when <= now) {
                    this.startNote(frequency, velocity);
                } else {
                    setTimeout(() => this.startNote(frequency, velocity), (when - now) * 1000);
                }
            } else if (type === 'noteOff') {
                 if (when <= now) {
                    this.stopNote(frequency);
                } else {
                    setTimeout(() => this.stopNote(frequency), (when - now) * 1000);
                }
            } else if (type === 'clear') {
                this.notes.clear();
            }
        };
    }

    startNote(frequency, velocity) {
        console.log(`[Worklet] NOTE ON: freq=${frequency.toFixed(2)}, velocity=${velocity}`);
        this.notes.set(frequency, {
            phase: 0,
            gain: 0,
            targetGain: velocity,
            state: 'attack',
            releaseTime: 0.2 // Короткий релиз
        });
    }

    stopNote(frequency) {
        const note = this.notes.get(frequency);
        if (note) {
            console.log(`[Worklet] NOTE OFF: freq=${frequency.toFixed(2)}`);
            note.state = 'release';
            note.targetGain = 0;
        }
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;
        
        // Если нет активных нот, просто заполняем тишиной и выходим
        if (this.notes.size === 0) {
            return true;
        }

        for (let i = 0; i < frameCount; i++) {
            let sample = 0;

            for (const [freq, note] of this.notes.entries()) {
                // Простое ADSR управление громкостью
                if (note.state === 'attack') {
                    note.gain += 1 / (0.01 * sampleRate); // 10ms attack
                    if (note.gain >= note.targetGain) {
                        note.gain = note.targetGain;
                        note.state = 'sustain';
                    }
                } else if (note.state === 'release') {
                    note.gain -= 1 / (note.releaseTime * sampleRate);
                    if (note.gain <= 0) {
                        this.notes.delete(freq);
                        continue; // Нота закончила звучать, переходим к следующей
                    }
                }

                // Простой синусоидальный осциллятор
                sample += Math.sin(note.phase) * note.gain;
                note.phase += (freq * 2 * Math.PI) / sampleRate;
                if (note.phase >= 2 * Math.PI) {
                    note.phase -= 2 * Math.PI;
                }
            }
            
            // Защита от клиппинга
            const limitedSample = Math.max(-1, Math.min(1, sample)) * 0.5; // Уменьшаем громкость

            for (let channel = 0; channel < channelCount; channel++) {
                output[channel][i] = limitedSample;
            }
        }
        
        return true; // Продолжаем обработку
    }
}

registerProcessor('bass-processor', SimpleSynthProcessor);
