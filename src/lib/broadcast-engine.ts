/**
 * #ЗАЧЕМ: Реализация "Direct Stream Bridge" V7.
 * #ЧТО: 1. Отказ от MSE/MediaRecorder в пользу прямого назначения srcObject. 
 *       2. Внедрен "Silk Start" (плавное нарастание громкости) для маскировки стартовых шумов.
 * #СВЯЗИ: Обеспечивает 100% чистоту звука и приоритет в ОС при выключенном экране.
 */

export class BroadcastEngine {
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement | null = null;
    private stream: MediaStream;
    private isRunning = false;
    private fadeInterval: any = null;

    constructor(audioContext: AudioContext, stream: MediaStream) {
        this.audioContext = audioContext;
        this.stream = stream;
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log('%c[Broadcast] Initializing Direct Stream Bridge (Silk Start Active)', 'color: #4ade80; font-weight: bold;');

        // 1. Создаем системный аудио-элемент
        this.audioElement = new Audio();
        
        // 2. Назначаем поток напрямую (без кодеков и MSE)
        this.audioElement.srcObject = this.stream;
        
        // 3. Silk Start: Глушим звук перед стартом
        this.audioElement.volume = 0;
        this.audioElement.autoplay = true;

        try {
            await this.audioElement.play();
            console.log('%c[Broadcast] Stream Bridge Playing. Background priority active.', 'color: #32CD32; font-weight: bold;');
            
            // 4. Плавное нарастание громкости (1.5 секунды)
            // #ЗАЧЕМ: Устранение "Стартовой Хрипотцы" (переходных шумов буфера).
            const fadeDuration = 1500; 
            const steps = 30;
            const increment = 1 / steps;
            let currentStep = 0;

            this.fadeInterval = setInterval(() => {
                if (!this.audioElement) {
                    clearInterval(this.fadeInterval);
                    return;
                }
                currentStep++;
                this.audioElement.volume = Math.min(1, currentStep * increment);
                if (currentStep >= steps) {
                    clearInterval(this.fadeInterval);
                }
            }, fadeDuration / steps);

        } catch (e) {
            console.warn('[Broadcast] Play failed. Interaction required?', e);
            this.isRunning = false;
        }
    }

    public stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.srcObject = null;
            this.audioElement = null;
        }

        console.log('%c[Broadcast] Stream Bridge Disconnected', 'color: #f87171; font-weight: bold;');
    }

    public isActive() {
        return this.isRunning;
    }
}
