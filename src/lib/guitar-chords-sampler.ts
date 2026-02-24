import type { Note as NoteEvent } from "@/types/music";
import { ACOUSTIC_GUITAR_CHORD_SAMPLES } from "./samples";

const CHORD_SAMPLE_MAP = ACOUSTIC_GUITAR_CHORD_SAMPLES;

/**
 * #ЗАЧЕМ: Сэмплер аккордов с улучшенным маппингом и внешним управлением громкостью.
 * #ЧТО: 1. Повышен гейн преампа (0.9 -> 1.2).
 *       2. Реализован метод setVolume для работы слайдеров.
 *       3. Сделан "Умный матчинг" аккордов (Em7 -> Em -> E).
 */
export class GuitarChordsSampler {
    private audioContext: AudioContext;
    private samples: Map<string, AudioBuffer> = new Map();
    public output: GainNode;
    public isInitialized: boolean = false;
    private isLoading: boolean = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.output = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        // #ЗАЧЕМ: Повышение мощности гитары в миксе.
        this.preamp.gain.value = 1.2;
        this.preamp.connect(this.output);
        
        this.output.connect(destination);
    }

    async init() {
        if (this.isInitialized || this.isLoading) return;
        this.isLoading = true;
        console.log(`[GuitarChordsSampler] Initializing... Loading ${Object.keys(CHORD_SAMPLE_MAP).length} samples.`);

        const samplePromises: Promise<void>[] = [];
        for (const chordName in CHORD_SAMPLE_MAP) {
            const url = CHORD_SAMPLE_MAP[chordName as keyof typeof CHORD_SAMPLE_MAP];
            samplePromises.push(this.loadSample(chordName, url));
        }

        await Promise.all(samplePromises);
        this.isInitialized = true;
        this.isLoading = false;
        console.log(`[GuitarChordsSampler] ${this.samples.size} samples loaded. Ready.`);
    }

    private async loadSample(chordName: string, url: string) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.samples.set(chordName, audioBuffer);
        } catch (e) {
            console.error(`[GuitarChordsSampler] Failed to load sample: ${chordName} from ${url}`, e);
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        notes.forEach(note => {
            const barCount = (note.params as any)?.barCount ?? 'N/A';
            const chordName = this.findBestChordMatch(note.chordName || '');
            
            if (!chordName) {
                console.warn(`[GuitarChordsSampler] Bar: ${barCount} - Failed to match: "${note.chordName}"`);
                return;
            }

            const buffer = this.samples.get(chordName);
            if (buffer) {
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                const noteGain = this.audioContext.createGain();
                noteGain.gain.value = note.velocity ?? 0.7;
                
                source.connect(noteGain);
                noteGain.connect(this.preamp);
                
                const playTime = startTime + note.time;
                source.start(playTime);

                source.onended = () => {
                    try { noteGain.disconnect(); } catch(e) {}
                };
            }
        });
    }

    /**
     * #ЗАЧЕМ: Умный поиск сэмплов для предотвращения тишины.
     * #ЧТО: Пытается найти точный матч, затем упрощенный (Am7 -> Am), затем только корень (Am -> A).
     */
    private findBestChordMatch(requestedChord: string): string | null {
        if (!requestedChord) return null;
        const target = requestedChord.trim();
        
        // 1. Прямой матч
        if (this.samples.has(target)) return target;

        // 2. Упрощение расширений (Am7 -> Am)
        let simplified = target.replace(/(m?)(maj|dim|aug|sus|add)?\d+$/, '$1');
        if (this.samples.has(simplified)) return simplified;

        // 3. Переход в мажор (Am -> A) - как крайняя мера
        if (simplified.endsWith('m')) {
            const major = simplified.slice(0, -1);
            if (this.samples.has(major)) return major;
        }

        // 4. Только корень (C#m -> Db -> C)
        const root = target.match(/^[A-G][#b]?/)?.[0];
        if (root && this.samples.has(root)) return root;

        return null;
    }

    public setVolume(volume: number) {
        // #ЗАЧЕМ: Связь со слайдером UI.
        this.output.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.02);
    }

    public stopAll() {}

    public dispose() {
        this.preamp.disconnect();
        this.output.disconnect();
    }
}
