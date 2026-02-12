/**
 * #ЗАЧЕМ: Реализация "Вещательного Бункера" V4 — "Smooth Pruning Edition".
 * #ЧТО: 1. Возврат к интервалу 1000мс для снижения нагрузки на CPU (устранение треска).
 *       2. Внедрена система "Уборки Буфера" (Buffer Pruning) для предотвращения паузы на 29-й секунде.
 *       3. Плеер стартует после накопления 3-х чанков (3 секунды стабильности).
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
        
        this.audioElement.autoplay = false; 
        this.audioElement.preload = 'auto';

        this.mediaSource.addEventListener('sourceopen', () => {
            if (!this.mediaSource) return;
            try {
                this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/webm;codecs=opus');
                
                this.sourceBuffer.addEventListener('updateend', () => {
                    this.pruneBuffer(); // Очистка старых данных
                    this.processQueue();
                });
            } catch (e) {
                console.error('[Broadcast] SourceBuffer creation failed:', e);
            }
        });

        // 2. Инициализация MediaRecorder
        // #ЗАЧЕМ: Снижение нагрузки на процессор. 
        // #ЧТО: Возврат к чанкам по 1000мс. Это уменьшает количество прерываний для упаковки.
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

        this.mediaRecorder.start(1000); // Пополнение буфера каждую 1 сек
        console.log('%c[Broadcast] Radio Stream Initializing (Stable 1s Chunks)', 'color: #fbbf24; font-weight: bold;');
    }

    /**
     * #ЗАЧЕМ: Устранение паузы на 29-й секунде.
     * #ЧТО: Удаляет из буфера данные, которые уже были проиграны (старше 10 секунд).
     *       Это предотвращает переполнение памяти и "заикание" Garbage Collector-а.
     */
    private pruneBuffer() {
        if (!this.sourceBuffer || this.sourceBuffer.updating || !this.audioElement) return;
        
        const currentTime = this.audioElement.currentTime;
        if (currentTime > 15) { // Начинаем чистку после 15 секунд игры
            try {
                // Оставляем в буфере только последние 5 секунд до текущего момента
                // и всё, что запланировано в будущем.
                const removeEnd = currentTime - 10;
                if (this.sourceBuffer.buffered.length > 0 && this.sourceBuffer.buffered.start(0) < removeEnd) {
                    this.sourceBuffer.remove(0, removeEnd);
                }
            } catch (e) {
                // Игнорируем ошибки чистки
            }
        }
    }

    private async processQueue() {
        if (!this.sourceBuffer || this.sourceBuffer.updating || this.queue.length === 0) return;
        
        try {
            const chunk = this.queue.shift();
            if (chunk) {
                this.sourceBuffer.appendBuffer(chunk);
                this.chunksAppended++;

                // Старт плеера после накопления запаса в 3 секунды
                if (this.chunksAppended === 3 && this.audioElement) {
                    try {
                        await this.audioElement.play();
                        console.log('%c[Broadcast] Radio Stream Playing (Pre-roll Done)', 'color: #4ade80; font-weight: bold;');
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
