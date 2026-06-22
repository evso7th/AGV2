
/**
 * #ЗАЧЕМ: Реализация "Direct Stream Bridge" V7.2 — "Media Session Stability Fix".
 * #ЧТО: 1. Установка начальной громкости 0.01 для предотвращения игнорирования медиа-сессии.
 */

export class BroadcastEngine {
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement | null = null;
    private stream: MediaStream;
    private isRunning = false;
    private fadeInterval: any = null;
    private cleanupAbortController: AbortController | null = null;

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
        
        // #ЗАЧЕМ: ПЛАН №202.2. Не используем 0, так как браузер может счесть поток неактивным.
        this.audioElement.volume = 0.01; 
        this.audioElement.autoplay = true;

        try {
            await this.audioElement.play();
            console.log('%c[Broadcast] Stream Bridge Playing. Background priority active.', 'color: #32CD32; font-weight: bold;');

            const fadeDuration = 1500;
            const steps = 30;
            const targetVolume = 1.0;
            const increment = (targetVolume - 0.01) / steps;
            let currentStep = 0;

            if (this.cleanupAbortController) {
                this.cleanupAbortController.abort();
            }
            this.cleanupAbortController = new AbortController();
            const signal = this.cleanupAbortController.signal;

            const intervalId = setInterval(() => {
                if (signal.aborted || !this.audioElement) {
                    clearInterval(intervalId);
                    return;
                }
                currentStep++;
                this.audioElement.volume = Math.min(targetVolume, 0.01 + currentStep * increment);
                if (currentStep >= steps) {
                    clearInterval(intervalId);
                }
            }, fadeDuration / steps);

            this.fadeInterval = intervalId;
            signal.addEventListener('abort', () => clearInterval(intervalId));

        } catch (e) {
            console.warn('[Broadcast] Play failed. Interaction required?', e);
            this.stop();
        }
    }

    public stop() {
        if (!this.isRunning) return;
        this.isRunning = false;

        if (this.cleanupAbortController) {
            this.cleanupAbortController.abort();
            this.cleanupAbortController = null;
        }

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
