/**
 * #ЗАЧЕМ: Реализация "Вещательного Бункера" V3.
 * #ЧТО: 1. Внедрен "Буфер Разгона" (chunksAppended) повышенной плотности.
 *       2. Уменьшен размер чанка до 500мс для более частого пополнения буфера.
 *       3. Плеер запускается только после накопления 4-х чанков (2 секунды стабильности).
 */

export class BroadcastEngine {
    private audioContext: AudioContext;
    private mediaRecorder: MediaRecorder | null = null;
    private mediaSource: MediaSource | null = null;
    private sourceBuffer: SourceBuffer | null = null;
    private audioElement: HTMLAudioElement | null = null;
    private stream: MediaStream;
    private isRunning = false;
    private queue: ArrayBuffer[] = [];
    private chunksAppended = 0;

    constructor(audioContext: AudioContext, stream: MediaStream) {
        this.audioContext = audioContext;
        this.stream = stream;
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.chunksAppended = 0;

        // 1. Инициализация MediaSource
        this.mediaSource = new MediaSource();
        this.audioElement = new Audio();
        this.audioElement.src = URL.createObjectURL(this.mediaSource);
        
        // Настройка плеера для стабильности
        this.audioElement.autoplay = false; 
        this.audioElement.preload = 'auto';

        this.mediaSource.addEventListener('sourceopen', () => {
            if (!this.mediaSource) return;
            try {
                // #ЗАЧЕМ: Стабилизация кодека. 
                this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/webm;codecs=opus');
                
                this.sourceBuffer.addEventListener('updateend', () => {
                    this.processQueue();
                });
            } catch (e) {
                console.error('[Broadcast] SourceBuffer creation failed:', e);
            }
        });

        // 2. Инициализация MediaRecorder
        // #ЗАЧЕМ: Повышение дискретности потока. 
        // #ЧТО: Чанки по 500мс вместо 1000мс.
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 192000
        });

        this.mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0 && this.isRunning) {
                const buffer = await e.data.arrayBuffer();
                this.queue.push(buffer);
                this.processQueue();
            }
        };

        this.mediaRecorder.start(500); // Пополнение буфера каждые 0.5 сек
        console.log('%c[Broadcast] Radio Stream Initializing (High-Density Buffering...)', 'color: #fbbf24; font-weight: bold;');
    }

    private async processQueue() {
        if (!this.sourceBuffer || this.sourceBuffer.updating || this.queue.length === 0) return;
        
        try {
            const chunk = this.queue.shift();
            if (chunk) {
                this.sourceBuffer.appendBuffer(chunk);
                this.chunksAppended++;

                // #ЗАЧЕМ: Устранение эффекта "заезженной пластинки".
                // #ЧТО: Плеер стартует после накопления 4-х чанков (стабильный запас 2с).
                if (this.chunksAppended === 4 && this.audioElement) {
                    try {
                        await this.audioElement.play();
                        console.log('%c[Broadcast] Radio Stream Playing (Ultra-Stable)', 'color: #4ade80; font-weight: bold;');
                    } catch (e) {
                        console.warn('[Broadcast] Play deferred by browser policy.');
                    }
                }
            }
        } catch (e) {
            console.warn('[Broadcast] Buffer sync skip:', e);
        }
    }

    public stop() {
        this.isRunning = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try { this.mediaRecorder.stop(); } catch(e) {}
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = "";
            this.audioElement.load();
            this.audioElement = null;
        }

        if (this.mediaSource && this.mediaSource.readyState === 'open') {
            try {
                this.mediaSource.endOfStream();
            } catch (e) {}
        }

        this.mediaRecorder = null;
        this.mediaSource = null;
        this.sourceBuffer = null;
        this.queue = [];
        this.chunksAppended = 0;
        console.log('%c[Broadcast] Radio Stream Stopped', 'color: #f87171; font-weight: bold;');
    }

    public isActive() {
        return this.isRunning;
    }
}
