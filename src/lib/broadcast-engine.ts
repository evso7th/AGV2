/**
 * #ЗАЧЕМ: Реализация "Direct Stream Bridge" V6.
 * #ЧТО: Отказ от MSE/MediaRecorder в пользу прямого назначения srcObject. 
 *       Это устраняет треск (вызванный кодированием) и сохраняет фоновый приоритет ОС.
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

        console.log('%c[Broadcast] Initializing Direct Stream Bridge (Clean Mode)', 'color: #4ade80; font-weight: bold;');

        // 1. Создаем системный аудио-элемент
        this.audioElement = new Audio();
        
        // 2. Назначаем поток напрямую (без кодеков и MSE)
        // #ЗАЧЕМ: Устранение "Шовного Треска". Прямой поток не требует переупаковки.
        this.audioElement.srcObject = this.stream;
        
        // 3. Настройка для мобильных ОС
        this.audioElement.autoplay = true;
        this.audioElement.muted = false; // Должно быть включено по клику

        try {
            await this.audioElement.play();
            console.log('%c[Broadcast] Stream Bridge Playing. Background priority active.', 'color: #32CD32; font-weight: bold;');
        } catch (e) {
            console.warn('[Broadcast] Play failed. Interaction required?', e);
            this.isRunning = false;
        }
    }

    public stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        
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
