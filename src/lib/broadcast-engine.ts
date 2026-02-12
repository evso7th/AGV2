/**
 * #ЗАЧЕМ: Реализация "Вещательного Бункера" V5 — "Ultra Stability Edition".
 * #ЧТО: 1. Увеличение размера чанка до 2000мс для минимизации "швов" и нагрузки на CPU.
 *       2. Увеличение пре-ролла до 3-х чанков (6 секунд безопасности).
 *       3. Автоматическая очистка буфера (Pruning) для предотвращения накопления мусора.
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
                    this.pruneBuffer(); 
                    this.processQueue();
                });
            } catch (e) {
                console.error('[Broadcast] SourceBuffer creation failed:', e);
            }
        });

        // 2. Инициализация MediaRecorder
        // #ЗАЧЕМ: Радикальное снижение нагрузки на процессор. 
        // #ЧТО: Чанки по 2000мс. Это делает поток максимально похожим на "Запись".
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

        this.mediaRecorder.start(2000); // 2-секундные фрагменты
        console.log('%c[Broadcast] Radio Stream Initializing (Ultra Stable 2s Chunks)', 'color: #fbbf24; font-weight: bold;');
    }

    /**
     * #ЗАЧЕМ: Устранение пауз при длительном прослушивании.
     */
    private pruneBuffer() {
        if (!this.sourceBuffer || this.sourceBuffer.updating || !this.audioElement) return;
        
        const currentTime = this.audioElement.currentTime;
        if (currentTime > 20) { 
            try {
                const removeEnd = currentTime - 10;
                if (this.sourceBuffer.buffered.length > 0 && this.sourceBuffer.buffered.start(0) < removeEnd) {
                    this.sourceBuffer.remove(0, removeEnd);
                }
            } catch (e) {}
        }
    }

    private async processQueue() {
        if (!this.sourceBuffer || this.sourceBuffer.updating || this.queue.length === 0) return;
        
        try {
            const chunk = this.queue.shift();
            if (chunk) {
                this.sourceBuffer.appendBuffer(chunk);
                this.chunksAppended++;

                // #ЗАЧЕМ: Железная стабильность (6 секунд запаса).
                // #ЧТО: Старт после 3-х чанков по 2 секунды.
                if (this.chunksAppended === 3 && this.audioElement) {
                    try {
                        await this.audioElement.play();
                        console.log('%c[Broadcast] Radio Stream Playing (6s Safety Buffer Active)', 'color: #4ade80; font-weight: bold;');
                    } catch (e) {
                        console.warn('[Broadcast] Play deferred.');
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
