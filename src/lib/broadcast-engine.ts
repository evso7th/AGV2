/**
 * #ЗАЧЕМ: Реализация "Вещательного Бункера". 
 * #ЧТО: Этот класс превращает MediaStream в бесконечный WebM-поток для системного плеера.
 * #КАК: Использует MediaRecorder для захвата и MediaSource API для бесшовной склейки чанков.
 * #СВЯЗИ: Управляется из AudioEngineContext.
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

    constructor(audioContext: AudioContext, stream: MediaStream) {
        this.audioContext = audioContext;
        this.stream = stream;
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        // 1. Инициализация MediaSource
        this.mediaSource = new MediaSource();
        this.audioElement = new Audio();
        this.audioElement.src = URL.createObjectURL(this.mediaSource);
        
        // Настройка плеера для минимальной задержки, насколько это возможно для стрима
        this.audioElement.autoplay = true;
        this.audioElement.preload = 'auto';

        this.mediaSource.addEventListener('sourceopen', () => {
            if (!this.mediaSource) return;
            // Используем тот же кодек, что и в записи
            this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/webm;codecs=opus');
            
            this.sourceBuffer.addEventListener('updateend', () => {
                this.processQueue();
            });
        });

        // 2. Инициализация MediaRecorder
        // Чанки по 1 секунде обеспечивают баланс между задержкой и стабильностью
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0 && this.sourceBuffer) {
                const buffer = await e.data.arrayBuffer();
                this.queue.push(buffer);
                this.processQueue();
            }
        };

        this.mediaRecorder.start(1000); // Генерируем чанки каждую секунду
        
        try {
            await this.audioElement.play();
            console.log('%c[Broadcast] Radio Stream Started', 'color: #4ade80; font-weight: bold;');
        } catch (err) {
            console.error('[Broadcast] Autoplay failed, waiting for user interaction', err);
        }
    }

    private processQueue() {
        if (!this.sourceBuffer || this.sourceBuffer.updating || this.queue.length === 0) return;
        
        try {
            const chunk = this.queue.shift();
            if (chunk) {
                this.sourceBuffer.appendBuffer(chunk);
            }
        } catch (e) {
            console.error('[Broadcast] Error appending buffer:', e);
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
        console.log('%c[Broadcast] Radio Stream Stopped', 'color: #f87171; font-weight: bold;');
    }

    public isActive() {
        return this.isRunning;
    }
}
