
/**
 * #ЗАЧЕМ: Реализация "Вещательного Бункера" V2.
 * #ЧТО: 1. Внедрен "Буфер Разгона" (chunksAppended) для устранения треска.
 *       2. Повышен битрейт до 192kbps для кристального звука.
 *       3. Плеер запускается только после накопления 2-х чанков данных.
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
        this.audioElement.autoplay = false; // Ждем буферизации
        this.audioElement.preload = 'auto';

        this.mediaSource.addEventListener('sourceopen', () => {
            if (!this.mediaSource) return;
            // #ЗАЧЕМ: Стабилизация кодека. 
            this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/webm;codecs=opus');
            
            this.sourceBuffer.addEventListener('updateend', () => {
                this.processQueue();
            });
        });

        // 2. Инициализация MediaRecorder
        // #ЗАЧЕМ: Баланс между задержкой и стабильностью.
        // #ЧТО: Повышен битрейт до 192кбит/с (План №365).
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 192000
        });

        this.mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0 && this.sourceBuffer) {
                const buffer = await e.data.arrayBuffer();
                this.queue.push(buffer);
                this.processQueue();
            }
        };

        this.mediaRecorder.start(1000); // Чанки по 1 секунде
        console.log('%c[Broadcast] Radio Stream Initializing (Buffering...)', 'color: #fbbf24; font-weight: bold;');
    }

    private async processQueue() {
        if (!this.sourceBuffer || this.sourceBuffer.updating || this.queue.length === 0) return;
        
        try {
            const chunk = this.queue.shift();
            if (chunk) {
                this.sourceBuffer.appendBuffer(chunk);
                this.chunksAppended++;

                // #ЗАЧЕМ: Устранение ритмического треска.
                // #ЧТО: Плеер стартует только когда в буфере есть запас в 2 секунды.
                if (this.chunksAppended === 2 && this.audioElement) {
                    try {
                        await this.audioElement.play();
                        console.log('%c[Broadcast] Radio Stream Playing (Stable)', 'color: #4ade80; font-weight: bold;');
                    } catch (e) {
                        console.warn('[Broadcast] Play inhibited by browser policy, awaiting interaction.');
                    }
                }
            }
        } catch (e) {
            console.error('[Broadcast] Buffer append error:', e);
        }
    }

    public stop() {
        this.isRunning = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = "";
            this.audioElement.load();
            this.audioElement = null;
        }

        if (this.mediaSource && this.mediaSource.readyState === 'open') {
            this.mediaSource.endOfStream();
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
