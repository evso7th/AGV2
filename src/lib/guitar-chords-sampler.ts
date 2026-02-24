import type { Note as NoteEvent } from "@/types/music";
import { ACOUSTIC_GUITAR_CHORD_SAMPLES } from "./samples";

const CHORD_SAMPLE_MAP = ACOUSTIC_GUITAR_CHORD_SAMPLES;

/**
 * #ЗАЧЕМ: Сэмплер аккордов с улучшенным маппингом и внешним управлением громкостью.
 * #ЧТО: 1. Полноценная поддержка 100+ аккордов из Family C, B, Bb, A, Ab, D, E, F, G.
 *       2. Усиленный "Smart Match" — находит замену по родственникам (m7 -> m -> root).
 *       3. Детальный лог в консоль для контроля Harmony Audit.
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
        console.log(`%c[GuitarChordsSampler] Initializing Ultimate Repository... Loading ${Object.keys(CHORD_SAMPLE_MAP).length} samples.`, 'color: #DA70D6; font-weight: bold;');

        const samplePromises: Promise<void>[] = [];
        for (const chordName in CHORD_SAMPLE_MAP) {
            const url = CHORD_SAMPLE_MAP[chordName as keyof typeof CHORD_SAMPLE_MAP];
            samplePromises.push(this.loadSample(chordName, url));
        }

        await Promise.all(samplePromises);
        this.isInitialized = true;
        this.isLoading = false;
        console.log(`%c[GuitarChordsSampler] ${this.samples.size} assets successfully loaded into the Hypercube.`, 'color: #32CD32; font-weight: bold;');
    }

    private async loadSample(chordName: string, url: string) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.samples.set(chordName, audioBuffer);
        } catch (e) {
            console.warn(`[GuitarChordsSampler] Failed to load asset: ${chordName} (url: ${url})`);
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        notes.forEach(note => {
            const barCount = (note.params as any)?.barCount ?? 'N/A';
            const chordName = this.findBestChordMatch(note.chordName || '');
            
            if (!chordName) {
                console.warn(`[HarmonyAudit] Bar: ${barCount} - FAILED to match: "${note.chordName}"`);
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

                // --- Harmony Audit Trail ---
                if (Math.random() < 0.05) { // Log 5% of requests to avoid spam
                    console.log(`%c[HarmonyAudit] Bar: ${barCount} | Request: "${note.chordName}" -> Matched: "${chordName}"`, 'color: #ADD8E6;');
                }

                source.onended = () => {
                    try { noteGain.disconnect(); } catch(e) {}
                };
            }
        });
    }

    /**
     * #ЗАЧЕМ: Продвинутый поиск сэмплов (Smart Match Engine).
     * #ЧТО: 1. Точный матч. 
     *       2. Упрощение (m7 -> m). 
     *       3. "Ouch" или "Alt" версии.
     *       4. Провал в мажорный корень.
     */
    private findBestChordMatch(requestedChord: string): string | null {
        if (!requestedChord) return null;
        const target = requestedChord.trim();
        
        // 1. Прямой матч
        if (this.samples.has(target)) return target;

        // 2. Упрощение расширений (Am7 -> Am, Amaj7 -> A)
        let simplified = target.replace(/(m?)(maj|dim|aug|sus|add|dim)?\d+$/, '$1');
        if (this.samples.has(simplified)) return simplified;

        // 3. Провал в минор если не нашли расширение (Abm7 -> Abm)
        if (target.includes('m') && !simplified.endsWith('m')) {
            const minorBase = simplified + 'm';
            if (this.samples.has(minorBase)) return minorBase;
        }

        // 4. Только корень (C#m -> C)
        const root = target.match(/^[A-G][#b]?/)?.[0];
        if (root && this.samples.has(root)) return root;

        return null;
    }

    public setVolume(volume: number) {
        // #ЗАЧЕМ: Прямая связь с микшером UI.
        const now = this.audioContext.currentTime;
        this.output.gain.setTargetAtTime(volume, now, 0.02);
    }

    public stopAll() {}

    public dispose() {
        this.preamp.disconnect();
        this.output.disconnect();
    }
}
