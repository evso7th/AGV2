/**
 * #ЗАЧЕМ: Реализация "Direct Stream Bridge" V7.5 — "Hard Activation Protocol".
 * #ЧТО: 1. Установка начальной громкости 0.01 для предотвращения игнорирования медиа-сессии.
 *       2. Удаление логики плавного нарастания (Fade-in) по запросу пользователя.
 */

export class BroadcastEngine {
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement | null = null;
    private stream: MediaStream;
    private isRunning = false;

    constructor(audioContext: AudioContext, stream: MediaStream) {
        this.audioContext = audioContext;
        this.stream = stream;
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log('%c[Broadcast] Initializing Direct Stream Bridge (Hard Link Active)', 'color: #4ade80; font-weight: bold;');

        // 1. Создаем системный аудио-элемент
        this.audioElement = new Audio();
        this.audioElement.srcObject = this.stream;
        
        // #ЗАЧЕМ: Принудительное монтирование в DOM для iOS.
        this.audioElement.style.display = 'none';
        this.audioElement.id = 'ag-broadcast-bridge';
        document.body.appendChild(this.audioElement);
        
        // #ЗАЧЕМ: ПЛАН №202.2. Устанавливаем 0.01 ПЕРЕД стартом, чтобы браузер считал поток активным.
        this.audioElement.volume = 0.01; 
        this.audioElement.autoplay = true;

        try {
            await this.audioElement.play();
            
            // #ЗАЧЕМ: Мгновенный переход на полную громкость (Fade-in удален по ТЗ).
            this.audioElement.volume = 1.0;
            
            console.log('%c[Broadcast] Stream Bridge Connected. Ready for background playback.', 'color: #32CD32; font-weight: bold;');
        } catch (e) {
            console.warn('[Broadcast] Play failed. Interaction required?', e);
            this.stop();
        }
    }

    public stop() {
        if (!this.isRunning) return;
        this.isRunning = false;

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
