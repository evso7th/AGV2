
/**
 * #ЗАЧЕМ: Реализация "Direct Stream Bridge" V7.7 — "Mobile Resiliency".
 * #ЧТО: 1. Добавлены атрибуты playsinline для iOS.
 *       2. Улучшена логика активации через громкость.
 *       3. Добавлен метод poke() для ре-активации жестом.
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

        console.log('%c[Broadcast] Activating Mobile-Resilient Stream Bridge', 'color: #4ade80; font-weight: bold;');

        // 1. Создаем системный аудио-элемент
        this.audioElement = new Audio();
        this.audioElement.srcObject = this.stream;
        
        // #ЗАЧЕМ: ПЛАН №203. Критично для мобильных браузеров.
        this.audioElement.setAttribute('playsinline', 'true');
        this.audioElement.setAttribute('webkit-playsinline', 'true');
        this.audioElement.style.display = 'none';
        this.audioElement.id = 'ag-broadcast-bridge';
        this.audioElement.preload = 'auto';
        document.body.appendChild(this.audioElement);
        
        // #ЗАЧЕМ: "Зацепка" для Media Session API.
        this.audioElement.volume = 0.01; 
        this.audioElement.autoplay = true;

        try {
            await this.audioElement.play();
            this.audioElement.volume = 1.0;
            console.log('%c[Broadcast] Stream Bridge Connected.', 'color: #32CD32; font-weight: bold;');
        } catch (e) {
            console.warn('[Broadcast] Play deferred (User gesture needed?)', e);
        }
    }

    /**
     * #ЗАЧЕМ: Ре-активация потока через свежий жест пользователя.
     * Используется при нажатии Play, если мост уже был "прогрет".
     */
    public poke() {
        if (this.isRunning && this.audioElement) {
            this.audioElement.play().catch(() => {
                console.warn('[Broadcast] Poke failed - background stall detected.');
            });
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
