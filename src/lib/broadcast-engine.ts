
/**
 * #ЗАЧЕМ: Реализация "Direct Stream Bridge" V8.0 — "Priority Keeper & Media Session".
 * #ЧТО: 1. Внедрен невидимый аудио-якорь (тишина) для предотвращения засыпания процессора.
 *       2. Интеграция с Media Session API для управления с экрана блокировки.
 */

export class BroadcastEngine {
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement | null = null;
    private silenceAnchor: HTMLAudioElement | null = null;
    private stream: MediaStream;
    private isRunning = false;
    private fadeInterval: any = null;

    // Callbacks for Media Session control
    public onPlayRequest?: () => void;
    public onPauseRequest?: () => void;

    // 1-second silent WAV file (Base64)
    private readonly SILENCE_URI = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

    constructor(audioContext: AudioContext, stream: MediaStream) {
        this.audioContext = audioContext;
        this.stream = stream;
    }

    /**
     * #ЗАЧЕМ: Обновление системных метаданных на экране блокировки.
     */
    public updateMetadata(genre: string, mood: string) {
        if ('mediaSession' in navigator) {
            const displayGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
            const displayMood = mood.charAt(0).toUpperCase() + mood.slice(1);

            navigator.mediaSession.metadata = new MediaMetadata({
                title: `${displayGenre} / ${displayMood}`,
                artist: 'AuraGroove',
                album: 'Pure Digital Neuro Music',
                artwork: [
                    { src: '/assets/icon8.jpeg', sizes: '512x512', type: 'image/jpeg' }
                ]
            });
        }
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log('%c[Broadcast] Initializing Stream Bridge with Priority Keeper...', 'color: #4ade80; font-weight: bold;');

        // 1. Создаем системный аудио-элемент для основного стрима
        this.audioElement = new Audio();
        this.audioElement.srcObject = this.stream;
        this.audioElement.style.display = 'none';
        this.audioElement.id = 'ag-broadcast-bridge';
        document.body.appendChild(this.audioElement);
        this.audioElement.volume = 0;
        this.audioElement.autoplay = true;

        // 2. Priority Keeper: Зацикленная тишина через обычный тег <audio>
        // Это говорит iOS/Android: "Я играю настоящий аудиофайл, не спи!"
        this.silenceAnchor = new Audio(this.SILENCE_URI);
        this.silenceAnchor.loop = true;
        this.silenceAnchor.style.display = 'none';
        document.body.appendChild(this.silenceAnchor);

        try {
            await this.audioElement.play();
            await this.silenceAnchor.play();
            
            // 3. Media Session Setup
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
                navigator.mediaSession.setActionHandler('play', () => {
                    if (this.onPlayRequest) this.onPlayRequest();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    if (this.onPauseRequest) this.onPauseRequest();
                });
            }

            // Silk Start: Плавное нарастание громкости основного потока
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
                if (currentStep >= steps) clearInterval(this.fadeInterval);
            }, fadeDuration / steps);

        } catch (e) {
            console.warn('[Broadcast] Play failed. Interaction required.', e);
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
            if (this.audioElement.parentNode) this.audioElement.parentNode.removeChild(this.audioElement);
            this.audioElement = null;
        }

        if (this.silenceAnchor) {
            this.silenceAnchor.pause();
            if (this.silenceAnchor.parentNode) this.silenceAnchor.parentNode.removeChild(this.silenceAnchor);
            this.silenceAnchor = null;
        }

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }

        console.log('%c[Broadcast] Stream Bridge Disconnected', 'color: #f87171; font-weight: bold;');
    }

    public isActive() {
        return this.isRunning;
    }
}
