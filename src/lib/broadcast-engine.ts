/**
 * #ЗАЧЕМ: Реализация "Direct Stream Bridge" V7.2 — "Stutter-Free Protocol".
 * #ЧТО: ПЛАН №12000 — 1. Добавлена микро-задержка перед play() для стабилизации буфера.
 *       2. Оптимизирован Silk Start для устранения щелчков.
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
        this.audioElement.srcObject = this.stream;
        
        // #ЗАЧЕМ: Принудительное монтирование в DOM для iOS.
        this.audioElement.style.display = 'none';
        this.audioElement.id = 'ag-broadcast-bridge';
        document.body.appendChild(this.audioElement);
        
        // 3. Подготовка буфера
        this.audioElement.volume = 0;
        this.audioElement.autoplay = true;

        // #ЗАЧЕМ: ПЛАН №12000. Микро-задержка перед стартом дает браузеру время
        // проинициализировать медиа-конвейер и наполнить первичный буфер.
        await new Promise(resolve => setTimeout(resolve, 150));

        try {
            await this.audioElement.play();
            console.log('%c[Broadcast] Stream Bridge Playing. Background priority active.', 'color: #32CD32; font-weight: bold;');
            
            const fadeDuration = 2500; // Чуть длиннее фейд для абсолютной мягкости
            const steps = 50;
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
            this.stop();
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
            if (this.audioElement.parentNode) {
                this.audioElement.parentNode.removeChild(this.audioElement);
            }
            this.audioElement = null;
        }

        console.log('%c[Broadcast] Stream Bridge Disconnected', 'color: #f87171; font-weight: bold;');
    }

    public isActive() {
        return this.isRunning;
    }
}
