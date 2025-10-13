
import type { BassInstrument, BassTechnique } from "@/types/music";
import type { FractalEvent } from '@/types/fractal';

// Утилита для конвертации MIDI в частоту, чтобы избежать зависимости от Tone.js
function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

/**
 * Простейший менеджер басового синтезатора ("Пароходная труба").
 * Задача: принять партитуру и тупо передать команды "noteOn" и "noteOff" в ворклет.
 * Никаких пресетов, техник, сложных таймеров.
 */
export class BassSynthManager {
    private audioContext: AudioContext;
    private workletNode: AudioWorkletNode | null = null;
    private outputNode: GainNode;
    public isInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        this.outputNode.connect(destination);
    }

    async init() {
        if (this.isInitialized) return;
        try {
            // Убедимся, что загружается правильный ворклет
            await this.audioContext.audioWorklet.addModule('/worklets/bass-processor.js');
            this.workletNode = new AudioWorkletNode(this.audioContext, 'bass-processor');
            this.workletNode.connect(this.outputNode);
            this.isInitialized = true;
            console.log('[BassSynthManager] "Пароходная труба" инициализирована.');
        } catch (e) {
            console.error('[BassSynthManager] Ошибка инициализации ворклета:', e);
        }
    }

    public setVolume(volume: number) {
        if(this.outputNode.gain){
            this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    /**
     * Принимает массив нот и время начала такта, планирует их воспроизведение.
     */
    public play(events: FractalEvent[], barStartTime: number) {
        if (!this.workletNode || !this.isInitialized || events.length === 0) {
            return;
        }

        // Сразу планируем все ноты из партитуры
        events.forEach(event => {
            const frequency = midiToFreq(event.note);
            if (!isFinite(frequency)) {
                console.error(`[BassMan] Неверная частота для MIDI ноты ${event.note}`);
                return;
            }

            const absoluteOnTime = barStartTime + event.time;
            const absoluteOffTime = absoluteOnTime + event.duration;
            
            // Отправляем команды в ворклет с абсолютным временем
            this.workletNode!.port.postMessage({
                type: 'noteOn',
                frequency: frequency,
                when: absoluteOnTime,
                velocity: event.dynamics === 'p' ? 0.2 : event.dynamics === 'mf' ? 0.4 : 0.7,
                noteId: event.note // ID для отслеживания ноты
            });

            this.workletNode!.port.postMessage({
                type: 'noteOff',
                noteId: event.note,
                when: absoluteOffTime
            });
        });
    }

    // --- Пустые методы для совместимости с API ---
    public setPreset(instrumentName: BassInstrument) {
        // Заглушка. Ничего не делаем.
    }

    public setTechnique(technique: BassTechnique) {
        // Заглушка. Ничего не делаем.
    }

    public allNotesOff() {
        this.stop();
    }

    public stop() {
        if (this.workletNode) {
            // Отправляем команду немедленной очистки всех нот
            this.workletNode.port.postMessage({ type: 'clear' });
            console.log('[BassMan] Отправлена команда "clear" в ворклет.');
        }
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
    }
}
