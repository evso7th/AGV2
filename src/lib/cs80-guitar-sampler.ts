import type { Note } from "@/types/music";

/**
 * #ЗАЧЕМ: Сэмплер Yamaha CS-80 (Guitar Mode) с интеллектуальным выбором слоев.
 * #ЧТО: 1. Внедрена селекция сэмплов по ДЛИТЕЛЬНОСТИ (План №380).
 *       2. Слой 'long_notes' используется только для по-настоящему длинных нот.
 *       3. Повышена "нормированность" звучания блюзовых пассажей.
 */

const CS80_NOTE_NAMES = ["c", "c", "d", "eb", "e", "f", "f", "g", "g", "a", "bb", "b"];

const getCS80Path = (layer: 1 | 2, midi: number) => {
    const octave = Math.floor(midi / 12) - 1;
    const name = CS80_NOTE_NAMES[midi % 12];
    const layerFolder = layer === 1 ? "norm_notes" : "long_notes";
    return `/assets/acoustic_guitar_samples/CS80/${layerFolder}/cs-80-guitar-${layer}-${midi}-${name}${octave}-vel-127.ogg`;
};

type CS80Layer = {
    norm: AudioBuffer;
    long: AudioBuffer;
};

export class CS80GuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private buffers = new Map<number, CS80Layer>();
    public isInitialized = false;
    private isLoading = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.preamp = this.audioContext.createGain();
        // #ЗАЧЕМ: Нормализация громкости. Сэмплы CS80 исходно очень громкие.
        // #ОБНОВЛЕНО (ПЛАН №441): Громкость снижена в два раза по просьбе пользователя (0.4 -> 0.2).
        this.preamp.gain.value = 0.2; 
        this.preamp.connect(this.destination);
    }

    async init(): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;
        console.log('%c[CS80Sampler] Initializing Blade Runner Spirit...', 'color: #00ced1; font-weight: bold;');

        try {
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Fetch failed: ${url}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };

            const loadPromises: Promise<void>[] = [];
            for (let midi = 36; midi <= 96; midi++) {
                loadPromises.push((async () => {
                    const [norm, long] = await Promise.all([
                        loadSample(getCS80Path(1, midi)),
                        loadSample(getCS80Path(2, midi))
                    ]);
                    this.buffers.set(midi, { norm, long });
                })());
            }

            await Promise.all(loadPromises);
            this.isInitialized = true;
            this.isLoading = false;
            console.log('%c[CS80Sampler] Ready. 122 samples loaded.', 'color: #32CD32; font-weight: bold;');
            return true;
        } catch (error) {
            console.error('[CS80Sampler] Failed to load samples:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * #ЗАЧЕМ: Планирование воспроизведения.
     * #ЧТО: Смена слоя теперь зависит от длительности ноты.
     */
    public schedule(notes: Note[], time: number, forceShort: boolean = false) {
        if (!this.isInitialized) return;

        notes.forEach(note => {
            const layer = this.buffers.get(note.midi);
            if (!layer) {
                this.playClosest(note, time, forceShort);
                return;
            }

            // #ЗАЧЕМ: Экономное использование 'long_notes' (План №380).
            // #ОБНОВЛЕНО (ПЛАН №441): Используем длинный сэмпл только если нота длится 3 сек и более (целая нота).
            //      В остальных случаях предпочитаем 'norm_notes' для четкости атаки.
            const buffer = (forceShort || (note.duration || 0) < 3.0) ? layer.norm : layer.long;
            this.playSample(buffer, note.midi, note.midi, time + note.time, note.velocity || 0.7, note.duration);
        });
    }

    private playClosest(note: Note, time: number, forceShort: boolean = false) {
        const keys = Array.from(this.buffers.keys());
        if (keys.length === 0) return;
        const closestMidi = keys.reduce((prev, curr) => 
            Math.abs(curr - note.midi) < Math.abs(prev - note.midi) ? curr : prev
        );
        const layer = this.buffers.get(closestMidi);
        if (!layer) return;

        // #ОБНОВЛЕНО (ПЛАН №441): Порог 3.0 сек.
        const buffer = (forceShort || (note.duration || 0) < 3.0) ? layer.norm : layer.long;
        this.playSample(buffer, closestMidi, note.midi, time + note.time, note.velocity || 0.7, note.duration);
    }

    private playSample(buffer: AudioBuffer, sampleMidi: number, targetMidi: number, startTime: number, velocity: number, duration?: number) {
        if (!isFinite(startTime) || !isFinite(velocity)) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.audioContext.createGain();
        
        source.connect(gainNode).connect(this.preamp);

        const playbackRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
        source.playbackRate.value = isFinite(playbackRate) ? playbackRate : 1.0;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.01);

        if (duration && isFinite(duration)) {
            gainNode.gain.setTargetAtTime(0, startTime + duration, 0.4);
        }

        source.start(startTime);
        source.onended = () => {
            try { gainNode.disconnect(); } catch(e) {}
        };
    }

    public stopAll() {}
    public dispose() { this.preamp.disconnect(); }
}
