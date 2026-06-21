import type { Note as NoteEvent } from "@/types/music";
import { TELECASTER_CHORD_SAMPLES } from "./assets/telecaster-chord-samples";

/**
 * #ЗАЧЕМ: Сэмплер Telecaster Chords V2.4 — "Surgical Sample Protocol".
 * #ЧТО: ПЛАН №1261 — Ограничение длительности воспроизведения 5 секундами.
 */
export class TelecasterChordsSampler {
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
        this.preamp.gain.value = 0.9; 
        this.preamp.connect(this.output);
        
        this.output.connect(destination);
    }

    async init() {
        if (this.isInitialized || this.isLoading) return;
        this.isLoading = true;
        console.log(`[TelecasterSampler] Initializing...`);

        const samplePromises: Promise<void>[] = [];
        for (const chordName in TELECASTER_CHORD_SAMPLES) {
            const url = TELECASTER_CHORD_SAMPLES[chordName as keyof typeof TELECASTER_CHORD_SAMPLES];
            samplePromises.push(this.loadSample(chordName, url));
        }

        await Promise.all(samplePromises);
        this.isInitialized = true;
        this.isLoading = false;
        console.log(`[TelecasterSampler] ${this.samples.size} samples loaded. Ready.`);
    }

    private async loadSample(chordName: string, url: string) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.samples.set(chordName, audioBuffer);
        } catch (e) {
            console.error(`[TelecasterSampler] Failed to load sample: ${chordName} from ${url}`, e);
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        // #ЗАЧЕМ: ПЛАН №1261. Хирургическая отсечка длинных сэмплов.
        const MAX_DUR = 5.0;
        const FADE_START = 4.2;

        notes.forEach(note => {
            const chordName = this.findBestChordMatch(note.chordName || '');
            
            if (!chordName) {
                return;
            }

            const buffer = this.samples.get(chordName);
            if (buffer) {
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
        if (this.samples.has(requestedChord)) {
            return requestedChord;
        }

        const root = requestedChord.replace(/m$/, '');
        if (this.samples.has(root)) {
            return root;
        }

        return null;
    }


    public setVolume(volume: number) {
        this.output.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    public stopAll() {
        // Since sources are short-lived, we don't need to track them to stop them.
    }

    public dispose() {
        this.preamp.disconnect();
        this.output.disconnect();
    }
}
