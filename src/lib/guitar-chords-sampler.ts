import type { Note as NoteEvent } from "@/types/music";
import { ACOUSTIC_GUITAR_CHORD_SAMPLES } from "./samples";

const CHORD_SAMPLE_MAP = ACOUSTIC_GUITAR_CHORD_SAMPLES;

/**
 * #ЗАЧЕМ: Сэмплер аккордов V4.5 — "Surgical Sample Protocol".
 * #ЧТО: ПЛАН №1261 — Ограничение длительности воспроизведения 5 секундами с мягким фейдом.
 */
export class GuitarChordsSampler {
    private audioContext: AudioContext;
    private samples: Map<string, AudioBuffer[]> = new Map();
    private loadedUrls: Set<string> = new Set();
    public output: GainNode;
    public isInitialized: boolean = false;
    private isFullyInitialized: boolean = false;
    private isLoading: boolean = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.output = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.2;
        this.preamp.connect(this.output);
        
        this.output.connect(destination);
    }

    public setPreampGain(gain: number) {
        if (isFinite(gain)) {
            this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.02);
        }
    }

    /**
     * #ЗАЧЕМ: Поэтапная инициализация.
     * #ЧТО: Теперь корректно разрешает дозагрузку после минимального старта.
     */
    async init(minimal = false) {
        if (this.isFullyInitialized) return;
        if (minimal && this.isInitialized) return;
        
        this.isLoading = true;
        
        const coreChords = ['C', 'Cm', 'G', 'D', 'Dm', 'A', 'Am', 'E', 'Em', 'F', 'Bm'];
        
        const loadTasks: Promise<void>[] = [];
        for (const chordName in CHORD_SAMPLE_MAP) {
            if (minimal && !coreChords.includes(chordName)) continue;
            
            const urls = CHORD_SAMPLE_MAP[chordName];
            const targetUrls = minimal ? [urls[0]] : urls;
            
            loadTasks.push(this.loadChordBuffers(chordName, targetUrls));
        }

        await Promise.all(loadTasks);
        this.isInitialized = true;
        if (!minimal) this.isFullyInitialized = true;
        this.isLoading = false;
    }

    private async loadChordBuffers(chordName: string, urls: string[]) {
        if (!this.samples.has(chordName)) {
            this.samples.set(chordName, []);
        }
        const bufferList = this.samples.get(chordName)!;
        
        for (const url of urls) {
            if (this.loadedUrls.has(url)) continue;
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                bufferList.push(audioBuffer);
                this.loadedUrls.add(url);
            } catch (e) {
                console.warn(`[GuitarChordsSampler] Failed to load: ${url}`);
            }
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        // #ЗАЧЕМ: ПЛАН №1261. Хирургическая отсечка длинных сэмплов.
        const MAX_DUR = 5.0;
        const FADE_START = 4.2;

        notes.forEach(note => {
            const matchedName = this.findBestChordMatch(note.chordName || '');
            if (!matchedName) return;

            const buffers = this.samples.get(matchedName);
            if (buffers && buffers.length > 0) {
                const buffer = buffers[Math.floor(Math.random() * buffers.length)];
                
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                const noteGain = this.audioContext.createGain();
                const playTime = startTime + note.time;
                const velocity = note.velocity ?? 0.7;

                source.connect(noteGain);
                noteGain.connect(this.preamp);
                
                noteGain.gain.setValueAtTime(0, playTime);
                noteGain.gain.linearRampToValueAtTime(velocity, playTime + 0.02);
                
                // Мягкое затухание в конце 5-секундного окна
                noteGain.gain.setTargetAtTime(0.0001, playTime + FADE_START, 0.25);

                source.start(playTime, 0, MAX_DUR);

                source.onended = () => {
                    try { noteGain.disconnect(); } catch(e) {}
                };
            }
        });
    }

    private findBestChordMatch(requestedChord: string): string | null {
        if (!requestedChord) return null;
        const target = requestedChord.trim();
        
        if (this.samples.has(target)) return target;

        let simplified = target.replace(/(m?)(maj|dim|aug|sus|add|dim)?\d+$/, '$1');
        if (this.samples.has(simplified)) return simplified;

        if (target.includes('m') && !simplified.endsWith('m')) {
            const minorBase = simplified + 'm';
            if (this.samples.has(minorBase)) return minorBase;
        }

        const root = target.match(/^[A-G][#b]?/)?.[0];
        if (root && this.samples.has(root)) return root;

        return null;
    }

    public setVolume(volume: number) {
        const now = this.audioContext.currentTime;
        this.output.gain.setTargetAtTime(volume, now, 0.02);
    }

    public stopAll() {}

    public dispose() {
        this.preamp.disconnect();
        this.output.disconnect();
    }
}
